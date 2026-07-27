"use client";

import { useState } from "react";
import { renameDocument } from "../lib/api";

export function EditableTitle({
  documentId,
  title,
  editable,
  onRenamed,
}: {
  documentId: string;
  title: string;
  editable: boolean;
  onRenamed: (newTitle: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);

  async function commit() {
    setEditing(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === title) {
      setValue(title);
      return;
    }
    try {
      await renameDocument(documentId, trimmed);
      onRenamed(trimmed);
    } catch (err) {
      console.error(err);
      setValue(title);
    }
  }

  if (!editable) {
    return (
      <h1
        className="text-sm font-medium tracking-tight"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-chalk)" }}
      >
        {title}
      </h1>
    );
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setValue(title);
            setEditing(false);
          }
        }}
        className="border-b bg-transparent text-sm font-medium tracking-tight outline-none"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--color-chalk)",
          borderColor: "var(--color-signal)",
        }}
      />
    );
  }

  return (
    <h1
      onClick={() => setEditing(true)}
      className="cursor-text text-sm font-medium tracking-tight"
      style={{ fontFamily: "var(--font-display)", color: "var(--color-chalk)" }}
      title="Click to rename"
    >
      {title}
    </h1>
  );
}