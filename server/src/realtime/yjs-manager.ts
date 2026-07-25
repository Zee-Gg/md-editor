import * as Y from "yjs";
import { prisma } from "../lib/prisma";

interface DocEntry {
  ydoc: Y.Doc;
  saveTimeout?: NodeJS.Timeout;
}

const docs = new Map<string, DocEntry>();
const SAVE_DELAY_MS = 3000;

// Get an already-loaded doc, or create a fresh empty one (sync, no DB hit)
export function getYDoc(documentId: string): Y.Doc {
  let entry = docs.get(documentId);
  if (!entry) {
    entry = { ydoc: new Y.Doc() };
    docs.set(documentId, entry);
  }
  return entry.ydoc;
}

// Load a doc from Postgres into memory the first time someone joins it
export async function loadDocIntoMemory(documentId: string): Promise<Y.Doc> {
  const existing = docs.get(documentId);
  if (existing) return existing.ydoc;

  const dbDoc = await prisma.document.findUnique({ where: { id: documentId } });
  const ydoc = new Y.Doc();

  if (dbDoc?.content) {
    const ytext = ydoc.getText("content");
    ytext.insert(0, dbDoc.content);
  }

  docs.set(documentId, { ydoc });
  return ydoc;
}

// Debounced save — resets the timer on every call, only writes after quiet period
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
    } catch (error) {
      console.error(`Failed to save document ${documentId}:`, error);
    }
  }, SAVE_DELAY_MS);
}

export function removeDocFromMemory(documentId: string) {
  docs.delete(documentId);
}