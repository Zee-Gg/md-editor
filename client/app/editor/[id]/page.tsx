"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import * as Y from "yjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createSocket } from "../../lib/socket";
import { TopBar } from "../../components/TopBar";
import { SignalSeam } from "../../components/SignalSeam";

interface PresenceUser {
  userId: string;
  socketId: string;
  name: string;
  color: string;
  cursorPosition?: number;
}

export default function EditorPage() {
  const params = useParams();
  const documentId = params.id as string;

  const [content, setContent] = useState("");
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // TEMP: token comes from localStorage until Module 9 login UI exists
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found — log in first.");
      return;
    }

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("content");
    ydocRef.current = ydoc;
    ytextRef.current = ytext;

    const socket = createSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-document", documentId);
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("error-message", (message: string) => {
  console.error("Server error:", message);
  alert(`Connection error: ${message}`);
});

    socket.on("sync-init", (state: Uint8Array) => {
      Y.applyUpdate(ydoc, new Uint8Array(state));
      setContent(ytext.toString());
    });

    socket.on("sync-update", (update: Uint8Array) => {
      Y.applyUpdate(ydoc, new Uint8Array(update));
      setContent(ytext.toString());
    });

    socket.on("presence-list", (userList: PresenceUser[]) => {
      setUsers(userList);
    });

    socket.on("user-typing", ({ userName }: { userName: string }) => {
      setTypingUser(userName);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
    });

    ydoc.on("update", (update: Uint8Array, origin: unknown) => {
      if (origin === "local") {
        socket.emit("sync-update", update);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [documentId]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const ytext = ytextRef.current;
    const ydoc = ydocRef.current;
    if (!ytext || !ydoc) return;

    ydoc.transact(() => {
      ytext.delete(0, ytext.length);
      ytext.insert(0, newValue);
    }, "local");

    setContent(newValue);
    socketRef.current?.emit("typing-start");
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <TopBar title="Untitled Document" users={users} connected={connected} />

      {typingUser && (
        <div
          className="px-6 py-1 text-xs"
          style={{ color: "var(--color-ember)", fontFamily: "var(--font-mono)" }}
        >
          {typingUser} is typing…
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <textarea
          value={content}
          onChange={handleChange}
          spellCheck={false}
          placeholder="Start writing…"
          className="h-full w-1/2 resize-none p-6 text-sm leading-relaxed outline-none"
          style={{
            backgroundColor: "var(--color-ink)",
            color: "var(--color-chalk)",
            fontFamily: "var(--font-mono)",
          }}
        />

        <SignalSeam cursors={[]} />

        <div
          className="h-full w-1/2 overflow-y-auto p-6 text-sm leading-relaxed"
          style={{ backgroundColor: "var(--color-paper)" }}
        >
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}