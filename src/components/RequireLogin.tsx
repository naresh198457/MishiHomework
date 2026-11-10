"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";

// Wrap pages that need a signed-in user. In guest mode (no Supabase) it lets everyone through.
export default function RequireLogin({ children }: { children: React.ReactNode }) {
  const { session, loading, enabled } = useAuth();
  const router = useRouter();
  const blocked = enabled && !loading && !session;

  useEffect(() => {
    if (blocked) router.replace("/login/");
  }, [blocked, router]);

  if (enabled && (loading || !session)) return <p className="p-6">Loading…</p>;
  return <>{children}</>;
}
