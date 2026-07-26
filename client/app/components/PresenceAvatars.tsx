"use client";

interface PresenceUser {
  userId: string;
  socketId: string;
  name: string;
  color: string;
}

export function PresenceAvatars({ users }: { users: PresenceUser[] }) {
  return (
    <div className="flex items-center -space-x-2">
      {users.map((user) => (
        <div
          key={user.socketId}
          title={user.name}
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold"
          style={{
            backgroundColor: user.color,
            borderColor: "var(--color-ink)",
            color: "var(--color-ink)",
            fontFamily: "var(--font-display)",
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  );
}