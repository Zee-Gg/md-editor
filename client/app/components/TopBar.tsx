"use client";

import { PresenceAvatars } from "./PresenceAvatars";

interface PresenceUser {
  userId: string;
  socketId: string;
  name: string;
  color: string;
}

export function TopBar({
  title,
  users,
  connected,
  onToggleHistory,
}: {
  title: string;
  users: PresenceUser[];
  connected: boolean;
  onToggleHistory?: () => void;
}) {
  return (
    <div
      className="flex h-14 items-center justify-between border-b px-6"
      style={{ borderColor: "var(--color-line)", backgroundColor: "var(--color-paper)" }}
    >
      <div className="flex items-center gap-3">
        <span
          className={`h-2 w-2 rounded-full ${connected ? "signal-pulse" : ""}`}
          style={{
            backgroundColor: connected ? "var(--color-signal)" : "var(--color-line)",
          }}
        />
        <h1
          className="text-sm font-medium tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-chalk)" }}
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <PresenceAvatars users={users} />
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