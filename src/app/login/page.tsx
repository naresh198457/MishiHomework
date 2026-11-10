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

  const field = "w-full rounded-lg border border-black/20 bg-transparent px-4 py-3 text-lg dark:border-white/30";

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-6 py-16">
      <h1 className="text-3xl font-bold">Maths Practice</h1>
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
            className="w-full rounded-full bg-indigo-600 px-6 py-3 text-lg font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>
      )}
    </main>
  );
}
