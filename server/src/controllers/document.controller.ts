import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

// Create a new document
export async function createDocument(req: AuthRequest, res: Response) {
  try {
    const { title } = req.body;
    const userId = req.userId!;

    const document = await prisma.document.create({
      data: {
        title: title || "Untitled Document",
        content: "",
        ownerId: userId,
      },
    });

    return res.status(201).json(document);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create document" });
  }
}

// List all documents the user owns or collaborates on
export async function listDocuments(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { collaborators: { some: { userId } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
      },
    });

    return res.status(200).json(documents);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch documents" });
  }
}

export async function renameDocument(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;
    const { title } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) return res.status(404).json({ error: "Document not found" });
    if (document.ownerId !== userId) {
      return res.status(403).json({ error: "Only the owner can rename this document" });
    }

    const updated = await prisma.document.update({
      where: { id },
      data: { title: title.trim() },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to rename document" });
  }
}

// Get a single document (must be owner or collaborator)
export async function getDocument(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        collaborators: true,
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const isOwner = document.ownerId === userId;
    const isCollaborator = document.collaborators.some(
      (c: { userId: string }) => c.userId === userId
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.status(200).json(document);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch document" });
  }
}

// Delete a document (only owner can delete)
export async function deleteDocument(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const id = req.params.id as string;

    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (document.ownerId !== userId) {
      return res.status(403).json({ error: "Only the owner can delete this document" });
    }

    await prisma.document.delete({ where: { id } });

    return res.status(200).json({ message: "Document deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete document" });
  }
}

