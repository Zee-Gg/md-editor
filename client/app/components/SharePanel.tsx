"use client";

import { useEffect, useState } from "react";
import { listCollaborators, addCollaborator, removeCollaborator } from "../lib/api";
import { Input } from "./Input";
import { Button } from "./Button";

interface Collaborator {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
}

export function SharePanel({
  documentId,
  open,
  onClose,
}: {
  documentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [owner, setOwner] = useState<{ id: string; name: string; email: string } | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  function refresh() {
    listCollaborators(documentId)
      .then((res) => {
        setOwner(res.owner);
        setCollaborators(res.collaborators);
      })
      .catch((err) => console.error(err));
  }

  useEffect(() => {
    if (!open) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, documentId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await addCollaborator(documentId, email, role);
      setEmail("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(userId: string) {
    try {
      await removeCollaborator(documentId, userId);
      refresh();
    } catch (err) {
      console.error(err);
    }
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/editor/${documentId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-md rounded-lg border p-6"
        style={{ borderColor: "var(--color-line)", backgroundColor: "var(--color-paper)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-chalk)" }}
          >
            Share document
          </h2>
          <button onClick={onClose} style={{ color: "#9CA3AF" }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleInvite} className="mb-4 flex gap-2">
          <Input
            type="email"
            placeholder="Invite by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
            className="rounded-md border px-2 text-sm"
            style={{
              backgroundColor: "var(--color-ink)",
              borderColor: "var(--color-line)",
              color: "var(--color-chalk)",
            }}
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <Button type="submit" disabled={submitting}>
            {submitting ? "…" : "Invite"}
          </Button>
        </form>

        {error && (
          <p className="mb-3 text-sm" style={{ color: "var(--color-ember)" }}>
            {error}
          </p>
        )}

        <div className="mb-4 space-y-2">
          {owner && (
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--color-chalk)" }}>
                {owner.name} <span style={{ color: "#6B7280" }}>({owner.email})</span>
              </span>
              <span style={{ color: "var(--color-signal)" }}>Owner</span>
            </div>
          )}

          {collaborators.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--color-chalk)" }}>
                {c.user.name} <span style={{ color: "#6B7280" }}>({c.user.email})</span>
              </span>
              <div className="flex items-center gap-2">
                <span style={{ color: "#9CA3AF" }}>{c.role}</span>
                <button
                  onClick={() => handleRemove(c.user.id)}
                  style={{ color: "var(--color-ember)" }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleCopyLink}
          className="w-full rounded-md border py-2 text-sm"
          style={{ borderColor: "var(--color-line)", color: "var(--color-chalk)" }}
        >
          {copied ? "Link copied!" : "Copy shareable link"}
        </button>
      </div>
    </div>
  );
}