"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const { session, enabled } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) router.replace("/");
  }, [session, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError("Wrong email or password. Please try again.");
  }

  const field = "w-full rounded-2xl border-2 border-[#c9d4ee] bg-white px-4 py-3 text-lg focus:border-indigo-500 focus:outline-none";

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-6 py-16">
      <p className="text-center text-6xl" aria-hidden>
        🦉
      </p>
      <h1 className="mt-2 text-center text-3xl font-extrabold">Maths Practice</h1>
      <p className="mt-1 text-center font-semibold" style={{ color: "var(--chart-muted)" }}>
        Log in to start playing!
      </p>
      {!enabled ? (
        <p className="mt-6">Login is not set up in this build.</p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input
            type="email"
            required
            autoComplete="username"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
          {error && <p className="text-red-600">{error}</p>}
          <button
            disabled={busy}
            className="btn w-full text-lg"
          >
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>
      )}
    </main>
  );
}
