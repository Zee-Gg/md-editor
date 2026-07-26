import { ButtonHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const base =
    "rounded-md px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed";

  const style =
    variant === "primary"
      ? { backgroundColor: "var(--color-signal)", color: "var(--color-ink)" }
      : { backgroundColor: "transparent", color: "var(--color-chalk)", border: "1px solid var(--color-line)" };

  return (
    <button
      {...props}
      className={`${base} ${className} hover:opacity-90`}
      style={{ fontFamily: "var(--font-display)", ...style }}
    />
  );
}