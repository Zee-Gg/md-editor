import * as Y from "yjs";
import { prisma } from "../lib/prisma";

interface DocEntry {
  ydoc: Y.Doc;
  saveTimeout?: NodeJS.Timeout;
  lastVersionSavedAt: number;
}

const docs = new Map<string, DocEntry>();
const SAVE_DELAY_MS = 3000;
const VERSION_INTERVAL_MS = 2 * 60 * 1000; // snapshot at most every 2 minutes of activity

export function getYDoc(documentId: string): Y.Doc {
  let entry = docs.get(documentId);
  if (!entry) {
    entry = { ydoc: new Y.Doc(), lastVersionSavedAt: 0 };
    docs.set(documentId, entry);
  }
  return entry.ydoc;
}

export async function loadDocIntoMemory(documentId: string): Promise<Y.Doc> {
  const existing = docs.get(documentId);
  if (existing) return existing.ydoc;

  const dbDoc = await prisma.document.findUnique({ where: { id: documentId } });
  const ydoc = new Y.Doc();

  if (dbDoc?.content) {
    const ytext = ydoc.getText("content");
    ytext.insert(0, dbDoc.content);
  }

  docs.set(documentId, { ydoc, lastVersionSavedAt: Date.now() });
  return ydoc;
}

export function scheduleSave(documentId: string) {
  const entry = docs.get(documentId);
  if (!entry) return;

  if (entry.saveTimeout) clearTimeout(entry.saveTimeout);

  entry.saveTimeout = setTimeout(async () => {
    const ytext = entry.ydoc.getText("content");
    const content = ytext.toString();

    try {
      await prisma.document.update({
        where: { id: documentId },
        data: { content },
      });
      console.log(`Saved document ${documentId}`);

      const now = Date.now();
      if (now - entry.lastVersionSavedAt >= VERSION_INTERVAL_MS) {
        await prisma.version.create({
          data: { documentId, content },
        });
        entry.lastVersionSavedAt = now;
        console.log(`Snapshot saved for document ${documentId}`);
      }
    } catch (error) {
      console.error(`Failed to save document ${documentId}:`, error);
    }
  }, SAVE_DELAY_MS);
}

// Manual, on-demand snapshot (e.g. user clicks "Save version")
export async function createManualVersion(documentId: string): Promise<void> {
  const entry = docs.get(documentId);
  if (!entry) return;

  const content = entry.ydoc.getText("content").toString();
  await prisma.version.create({ data: { documentId, content } });
  entry.lastVersionSavedAt = Date.now();
}

// Replace the live doc's content (used for restoring a version) and return
// the Yjs update so it can be broadcast to everyone in the room
export function replaceContent(documentId: string, newContent: string): Uint8Array {
  const entry = docs.get(documentId);
  if (!entry) throw new Error("Document not loaded in memory");

  const ydoc = entry.ydoc;
  const ytext = ydoc.getText("content");

  let capturedUpdate: Uint8Array | null = null;
  const handler = (update: Uint8Array) => {
    capturedUpdate = update;
  };
  ydoc.on("update", handler);

  ydoc.transact(() => {
    ytext.delete(0, ytext.length);
    ytext.insert(0, newContent);
  });

  ydoc.off("update", handler);

  if (!capturedUpdate) throw new Error("Failed to capture update");
  return capturedUpdate;
}

export function removeDocFromMemory(documentId: string) {
  docs.delete(documentId);
}