import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

// Only the owner can manage collaborators
async function requireOwner(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) return { ok: false, status: 404, error: "Document not found" };
  if (document.ownerId !== userId) return { ok: false, status: 403, error: "Only the owner can manage sharing" };
  return { ok: true, document };
}

export async function listCollaborators(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const documentId = req.params.id as string;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { collaborators: true },
    });

    if (!document) return res.status(404).json({ error: "Document not found" });

    const isOwner = document.ownerId === userId;
    const isCollaborator = document.collaborators.some((c) => c.userId === userId);
    if (!isOwner && !isCollaborator) return res.status(403).json({ error: "Access denied" });

    const collaborators = await prisma.collaborator.findMany({
      where: { documentId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const owner = await prisma.user.findUnique({
      where: { id: document.ownerId },
      select: { id: true, name: true, email: true },
    });

    return res.status(200).json({ owner, collaborators });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch collaborators" });
  }
}

export async function addCollaborator(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const documentId = req.params.id as string;
    const { email, role } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });
    if (role && !["editor", "viewer"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'editor' or 'viewer'" });
    }

    const check = await requireOwner(documentId, userId);
    if (!check.ok) return res.status(check.status!).json({ error: check.error });

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return res.status(404).json({ error: "No user found with that email" });
    }

    if (targetUser.id === userId) {
      return res.status(400).json({ error: "You already own this document" });
    }

    const collaborator = await prisma.collaborator.upsert({
      where: { documentId_userId: { documentId, userId: targetUser.id } },
      update: { role: role || "editor" },
      create: { documentId, userId: targetUser.id, role: role || "editor" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return res.status(201).json(collaborator);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to add collaborator" });
  }
}

export async function removeCollaborator(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const documentId = req.params.id as string;
    const targetUserId = req.params.userId as string;

    const check = await requireOwner(documentId, userId);
    if (!check.ok) return res.status(check.status!).json({ error: check.error });

    await prisma.collaborator.delete({
      where: { documentId_userId: { documentId, userId: targetUserId } },
    });

    return res.status(200).json({ message: "Collaborator removed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to remove collaborator" });
  }
}