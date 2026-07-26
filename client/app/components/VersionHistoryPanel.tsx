"use client";

import { useEffect, useState } from "react";
import { listVersions } from "../lib/api";

interface VersionSummary {
  id: string;
  createdAt: string;
  preview: string;
  length: number;
}

export function VersionHistoryPanel({
  documentId,
  open,
  onClose,
  onRestore,
}: {
  documentId: string;
  open: boolean;
  onClose: () => void;
  onRestore: (versionId: string) => void;
}) {
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-open loading pattern
    setLoading(true);
    listVersions(documentId)
      .then(setVersions)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [open, documentId]);
  if (!open) return null;

  return (
    <div
      className="flex h-full w-72 shrink-0 flex-col border-l"
      style={{
        borderColor: "var(--color-line)",
        backgroundColor: "var(--color-paper)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--color-line)" }}
      >
        <h2
          className="text-sm font-medium"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-chalk)",
          }}
        >
          Version History
        </h2>
        <button
          onClick={onClose}
          style={{ color: "#9CA3AF" }}
          className="text-sm"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            Loading…
          </p>
        ) : versions.length === 0 ? (
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            No saved versions yet. Versions are captured automatically as you
            edit.
          </p>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.id}
                className="rounded-md border p-3"
                style={{ borderColor: "var(--color-line)" }}
              >
                <p
                  className="text-xs"
                  style={{
                    color: "var(--color-signal)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {new Date(v.createdAt).toLocaleString()}
                </p>
                <p
                  className="mt-1 truncate text-xs"
                  style={{ color: "#9CA3AF", fontFamily: "var(--font-mono)" }}
                >
                  {v.preview || "(empty)"}
                  {v.length > 80 ? "…" : ""}
                </p>
                <button
                  onClick={() => onRestore(v.id)}
                  className="mt-2 text-xs"
                  style={{ color: "var(--color-ember)" }}
                >
                  Restore this version
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
