import { Server, Socket } from "socket.io";
import * as Y from "yjs";
import { verifyToken } from "../utils/jwt";
import {
  getYDoc,
  loadDocIntoMemory,
  scheduleSave,
  replaceContent,
  createManualVersion,
} from "./yjs-manager";
import { prisma } from "../lib/prisma";
import {
  addUserToDocument,
  removeUserFromDocument,
  updateCursor,
  getUsersInDocument,
} from "./presence-manager";

interface AuthedSocket extends Socket {
  userId?: string;
  userName?: string;
}

export function registerSocketHandlers(io: Server) {
  // Auth check on every socket connection attempt (token sent from client on connect)
  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    const userId = socket.userId as string;
    console.log(`User ${userId} connected via socket ${socket.id}`);

    let currentDocId: string | null = null;

    socket.on("join-document", async (documentId: string) => {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: { collaborators: true },
      });

      if (!document) {
        socket.emit("error-message", "Document not found");
        return;
      }

      const isOwner = document.ownerId === userId;
      const isCollaborator = document.collaborators.some(
        (c: { userId: string }) => c.userId === userId,
      );

      if (!isOwner && !isCollaborator) {
        socket.emit("error-message", "Access denied");
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      const userName = user?.name || "Unknown";
      socket.userName = userName;

      currentDocId = documentId;
      socket.join(documentId);

      const ydoc = await loadDocIntoMemory(documentId);
      const state = Y.encodeStateAsUpdate(ydoc);
      socket.emit("sync-init", state);

      // Add to presence, tell everyone (including the new user) who's online
      const presenceUser = addUserToDocument(
        documentId,
        socket.id,
        userId,
        userName,
      );
      io.to(documentId).emit("presence-list", getUsersInDocument(documentId));
      socket.to(documentId).emit("user-joined", presenceUser);
    });

    socket.on("sync-update", (update: Uint8Array) => {
      if (!currentDocId) return;

      const ydoc = getYDoc(currentDocId);
      Y.applyUpdate(ydoc, new Uint8Array(update));

      // relay the raw update to everyone else in the room
      socket.to(currentDocId).emit("sync-update", update);

      scheduleSave(currentDocId);
    });

    socket.on("restore-version", async (versionId: string) => {
      if (!currentDocId) return;

      try {
        const version = await prisma.version.findUnique({
          where: { id: versionId },
        });
        if (!version || version.documentId !== currentDocId) {
          socket.emit("error-message", "Version not found");
          return;
        }

        const update = replaceContent(currentDocId, version.content);
        io.to(currentDocId).emit("sync-update", update);
        scheduleSave(currentDocId);
      } catch (error) {
        console.error("Failed to restore version:", error);
        socket.emit("error-message", "Failed to restore version");
      }
    });

    socket.on("save-version-now", async () => {
      if (!currentDocId) return;
      try {
        await createManualVersion(currentDocId);
        socket.emit("version-saved");
      } catch (error) {
        console.error("Failed to save manual version:", error);
      }
    });

    socket.on("awareness-update", (update: Uint8Array) => {
      if (!currentDocId) return;
      socket.to(currentDocId).emit("awareness-update", update);
    });

    // Cursor position broadcast
    socket.on("cursor-move", (position: number) => {
      if (!currentDocId) return;

      updateCursor(currentDocId, socket.id, position);
      socket.to(currentDocId).emit("cursor-update", {
        userId,
        socketId: socket.id,
        position,
      });
    });

    // Typing indicator
    socket.on("typing-start", () => {
      if (!currentDocId) return;
      socket
        .to(currentDocId)
        .emit("user-typing", { userId, userName: socket.userName });
    });

    socket.on("typing-stop", () => {
      if (!currentDocId) return;
      socket.to(currentDocId).emit("user-stopped-typing", { userId });
    });

    socket.on("disconnect", () => {
      if (currentDocId) {
        removeUserFromDocument(currentDocId, socket.id);
        io.to(currentDocId).emit(
          "presence-list",
          getUsersInDocument(currentDocId),
        );
        socket.to(currentDocId).emit("user-left", { userId });
      }
      console.log(`User ${userId} disconnected`);
    });
  });
}
