"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import * as awarenessProtocol from "y-protocols/awareness";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createSocket } from "../../lib/socket";
import { TopBar } from "../../components/TopBar";
import { CollaborativeEditor } from "../../components/CollaborativeEditor";
import { VersionHistoryPanel} from "../../components/VersionHistoryPanel";

interface PresenceUser {
  userId: string;
  socketId: string;
  name: string;
  color: string;
}

const CURSOR_COLORS = ["#F87171", "#FBBF24", "#34D399", "#60A5FA", "#A78BFA", "#F472B6"];

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  // Created once, lazily — never reassigned via setState, so no cascading-render issue
  const [ydoc] = useState(() => new Y.Doc());
  const [ytext] = useState(() => ydoc.getText("content"));
  const [awareness] = useState(() => new Awareness(ydoc));

  const [content, setContent] = useState("");
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const myColor = CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
    awareness.setLocalStateField("user", { name: "You", color: myColor });

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

    socket.on("awareness-update", (update: Uint8Array) => {
      awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(update), "remote");
    });

    socket.on("presence-list", (userList: PresenceUser[]) => {
      setUsers(userList);
      const me = userList.find((u) => u.socketId === socket.id);
      if (me) awareness.setLocalStateField("user", { name: me.name, color: me.color });
    });

    socket.on("user-typing", ({ userName }: { userName: string }) => {
      setTypingUser(userName);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
    });

    const handleDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin !== "remote") {
        socket.emit("sync-update", update);
      }
      setContent(ytext.toString());
    };
    ydoc.on("update", handleDocUpdate);

    const handleAwarenessUpdate = ({
      added,
      updated,
      removed,
    }: {
      added: number[];
      updated: number[];
      removed: number[];
    }) => {
      const changedClients = added.concat(updated).concat(removed);
      const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients);
      socket.emit("awareness-update", update);
    };
    awareness.on("update", handleAwarenessUpdate);

    return () => {
      ydoc.off("update", handleDocUpdate);
      awareness.off("update", handleAwarenessUpdate);
      awareness.setLocalState(null);
      socket.disconnect();
    };
  }, [documentId, ydoc, ytext, awareness, router]);

  function handleRestore(versionId: string) {
    if (
      !confirm("Restore this version? This will overwrite the current content for everyone.")
    )
      return;
    socketRef.current?.emit("restore-version", versionId);
    setHistoryOpen(false);
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        title="Untitled Document"
        users={users}
        connected={connected}
        onToggleHistory={() => setHistoryOpen((v) => !v)}
      />

      {typingUser && (
        <div
          className="px-6 py-1 text-xs"
          style={{ color: "var(--color-ember)", fontFamily: "var(--font-mono)" }}
        >
          {typingUser} is typing…
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <CollaborativeEditor
          ytext={ytext}
          awareness={awareness}
          onTyping={() => socketRef.current?.emit("typing-start")}
        />

        <div className="w-px shrink-0" style={{ backgroundColor: "var(--color-line)" }} />

        <div
          className="h-full flex-1 overflow-y-auto p-6 text-sm leading-relaxed"
          style={{ backgroundColor: "var(--color-paper)" }}
        >
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>

        <VersionHistoryPanel
          documentId={documentId}
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          onRestore={handleRestore}
        />
      </div>
    </div>
  );
}