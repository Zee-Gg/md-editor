"use client";

import Link from "next/link";
import { PresenceAvatars } from "./PresenceAvatars";
import { EditableTitle } from "./EditableTitle";

interface PresenceUser {
  userId: string;
  socketId: string;
  name: string;
  color: string;
}

export function TopBar({
  documentId,
  title,
  users,
  connected,
  editable,
  onToggleHistory,
  onToggleShare,
  onRenamed,
}: {
  documentId: string;
  title: string;
  users: PresenceUser[];
  connected: boolean;
  editable: boolean;
  onToggleHistory?: () => void;
  onToggleShare?: () => void;
  onRenamed: (newTitle: string) => void;
}) {
  return (
    <div
      className="flex h-14 items-center justify-between border-b px-6"
      style={{ borderColor: "var(--color-line)", backgroundColor: "var(--color-paper)" }}
    >
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-xs"
          style={{ color: "#6B7280", fontFamily: "var(--font-display)" }}
        >
          ← Dashboard
        </Link>
        <span
          className={`h-2 w-2 rounded-full ${connected ? "signal-pulse" : ""}`}
          style={{
            backgroundColor: connected ? "var(--color-signal)" : "var(--color-line)",
          }}
        />
        <EditableTitle
          documentId={documentId}
          title={title}
          editable={editable}
          onRenamed={onRenamed}
        />
      </div>

      <div className="flex items-center gap-4">
        <PresenceAvatars users={users} />
        {onToggleShare && (
          <button
            onClick={onToggleShare}
            className="text-xs"
            style={{ color: "var(--color-chalk)", fontFamily: "var(--font-display)" }}
          >
            Share
          </button>
        )}
        {onToggleHistory && (
          <button
            onClick={onToggleHistory}
            className="text-xs"
            style={{ color: "var(--color-signal)", fontFamily: "var(--font-display)" }}
          >
            History
          </button>
        )}
      </div>
    </div>
  );
}