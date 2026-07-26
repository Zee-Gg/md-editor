"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { yCollab } from "y-codemirror.next";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";

export function CollaborativeEditor({
  ytext,
  awareness,
  onTyping,
  readOnly = false,
}: {
  ytext: Y.Text;
  awareness: Awareness;
  onTyping: () => void;
  readOnly?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        markdown(),
        yCollab(ytext, awareness),
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onTyping();
        }),
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "14px",
            backgroundColor: "var(--color-ink)",
            color: "var(--color-chalk)",
          },
          ".cm-content": {
            fontFamily: "var(--font-mono)",
            caretColor: "var(--color-signal)",
          },
          ".cm-gutters": {
            backgroundColor: "var(--color-ink)",
            color: "#5a5f6b",
            border: "none",
          },
          "&.cm-focused": {
            outline: "none",
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    return () => {
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytext, awareness, readOnly]);

  return <div ref={containerRef} className="h-full w-1/2 overflow-y-auto" />;
}