import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

async function checkAccess(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { collaborators: true },
  });

  if (!document) return { allowed: false, document: null };

  const isOwner = document.ownerId === userId;
  const isCollaborator = document.collaborators.some((c) => c.userId === userId);

  return { allowed: isOwner || isCollaborator, document };
}

export async function listVersions(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const documentId = req.params.id as string;

    const { allowed } = await checkAccess(documentId, userId);
    if (!allowed) return res.status(403).json({ error: "Access denied" });

    const versions = await prisma.version.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, content: true },
    });

    // send a short preview instead of full content to keep the list light
    const summarized = versions.map((v) => ({
      id: v.id,
      createdAt: v.createdAt,
      preview: v.content.slice(0, 80),
      length: v.content.length,
    }));

    return res.status(200).json(summarized);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch versions" });
  }
}

export async function getVersion(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const documentId = req.params.id as string;
    const versionId = req.params.versionId as string;

    const { allowed } = await checkAccess(documentId, userId);
    if (!allowed) return res.status(403).json({ error: "Access denied" });

    const version = await prisma.version.findUnique({ where: { id: versionId } });

    if (!version || version.documentId !== documentId) {
      return res.status(404).json({ error: "Version not found" });
    }

    return res.status(200).json(version);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch version" });
  }
}