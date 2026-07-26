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
}: {
  title: string;
  users: PresenceUser[];
  connected: boolean;
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

      <PresenceAvatars users={users} />
    </div>
  );
}