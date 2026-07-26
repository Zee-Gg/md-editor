"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listDocuments, createDocument, deleteDocument } from "../lib/api";
import { Button } from "../components/Button";

interface DocumentSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    listDocuments()
      .then(setDocuments)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleCreate() {
    setCreating(true);
    try {
      const doc = await createDocument("Untitled Document");
      router.push(`/editor/${doc.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this document?")) return;

    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-ink)" }}>
      <div
        className="flex h-14 items-center justify-between border-b px-6"
        style={{ borderColor: "var(--color-line)", backgroundColor: "var(--color-paper)" }}
      >
        <h1
          className="text-sm font-medium"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-chalk)" }}
        >
          Your Documents
        </h1>
        <Button variant="ghost" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </p>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating…" : "+ New Document"}
          </Button>
        </div>

        {loading ? (
          <p style={{ color: "#9CA3AF" }}>Loading…</p>
        ) : documents.length === 0 ? (
          <div
            className="rounded-lg border border-dashed p-10 text-center"
            style={{ borderColor: "var(--color-line)" }}
          >
            <p style={{ color: "#9CA3AF" }}>No documents yet. Create your first one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/editor/${doc.id}`)}
                className="flex cursor-pointer items-center justify-between rounded-md border p-4 transition-colors hover:border-[var(--color-signal)]"
                style={{ borderColor: "var(--color-line)", backgroundColor: "var(--color-paper)" }}
              >
                <div>
                  <p style={{ color: "var(--color-chalk)", fontFamily: "var(--font-display)" }}>
                    {doc.title}
                  </p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    Updated {new Date(doc.updatedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(doc.id, e)}
                  className="text-xs"
                  style={{ color: "var(--color-ember)" }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}