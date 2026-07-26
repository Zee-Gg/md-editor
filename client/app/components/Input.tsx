import { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-signal)]"
      style={{
        backgroundColor: "var(--color-ink)",
        borderColor: "var(--color-line)",
        color: "var(--color-chalk)",
        fontFamily: "var(--font-body)",
      }}
    />
  );
}