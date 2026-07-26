"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "../lib/api";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      localStorage.setItem("token", res.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{ backgroundColor: "var(--color-ink)" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border p-8"
        style={{ borderColor: "var(--color-line)", backgroundColor: "var(--color-paper)" }}
      >
        <h1
          className="mb-1 text-xl font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-chalk)" }}
        >
          Welcome back
        </h1>
        <p className="mb-6 text-sm" style={{ color: "#9CA3AF" }}>
          Log in to continue writing.
        </p>

        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="mt-3 text-sm" style={{ color: "var(--color-ember)" }}>
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="mt-5 w-full">
          {loading ? "Logging in…" : "Log in"}
        </Button>

        <p className="mt-4 text-center text-sm" style={{ color: "#9CA3AF" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--color-signal)" }}>
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}