import { Server, Socket } from "socket.io";
import * as Y from "yjs";
import { verifyToken } from "../utils/jwt";
import { getYDoc, loadDocIntoMemory, scheduleSave } from "./yjs-manager";
import { prisma } from "../lib/prisma";

interface AuthedSocket extends Socket {
  userId?: string;
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
        (c: { userId: string }) => c.userId === userId
      );

      if (!isOwner && !isCollaborator) {
        socket.emit("error-message", "Access denied");
        return;
      }

      currentDocId = documentId;
      socket.join(documentId);

      const ydoc = await loadDocIntoMemory(documentId);
      const state = Y.encodeStateAsUpdate(ydoc);

      socket.emit("sync-init", state);
      socket.to(documentId).emit("user-joined", { userId });
    });

    socket.on("sync-update", (update: Uint8Array) => {
      if (!currentDocId) return;

      const ydoc = getYDoc(currentDocId);
      Y.applyUpdate(ydoc, new Uint8Array(update));

      // relay the raw update to everyone else in the room
      socket.to(currentDocId).emit("sync-update", update);

      scheduleSave(currentDocId);
    });

    socket.on("disconnect", () => {
      if (currentDocId) {
        socket.to(currentDocId).emit("user-left", { userId });
      }
      console.log(`User ${userId} disconnected`);
    });
  });
}