interface PresenceUser {
  userId: string;
  socketId: string;
  name: string;
  color: string;
  cursorPosition?: number;
}

// documentId -> Map of socketId -> PresenceUser
const presence = new Map<string, Map<string, PresenceUser>>();

const COLORS = ["#F87171", "#FBBF24", "#34D399", "#60A5FA", "#A78BFA", "#F472B6"];

function pickColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length] as string;
}

export function addUserToDocument(
  documentId: string,
  socketId: string,
  userId: string,
  name: string
): PresenceUser {
  if (!presence.has(documentId)) {
    presence.set(documentId, new Map());
  }

  const user: PresenceUser = {
    userId,
    socketId,
    name,
    color: pickColor(userId),
  };

  presence.get(documentId)!.set(socketId, user);
  return user;
}

export function removeUserFromDocument(documentId: string, socketId: string) {
  const room = presence.get(documentId);
  if (!room) return;

  room.delete(socketId);

  if (room.size === 0) {
    presence.delete(documentId);
  }
}

export function updateCursor(documentId: string, socketId: string, position: number) {
  const room = presence.get(documentId);
  if (!room) return;

  const user = room.get(socketId);
  if (user) {
    user.cursorPosition = position;
  }
}

export function getUsersInDocument(documentId: string): PresenceUser[] {
  const room = presence.get(documentId);
  if (!room) return [];
  return Array.from(room.values());
}