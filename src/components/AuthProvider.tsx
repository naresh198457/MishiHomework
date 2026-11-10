"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthState = {
  session: Session | null;
  loading: boolean;
  enabled: boolean; // false = guest mode (Supabase not configured)
  role: "parent" | "student" | null; // from the profiles table; null = no profile row (treated as not a parent)
  name: string | null; // profile display name
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  loading: true,
  enabled: false,
  role: null,
  name: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!supabase);
  const [role, setRole] = useState<AuthState["role"]>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    const db = supabase;
    if (!db || !userId) return;
    let cancelled = false;
    db.from("profiles")
      .select("role, display_name")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setRole(data?.role === "parent" || data?.role === "student" ? data.role : null);
        setName(data?.role === "student" && data.display_name ? data.display_name : null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        enabled: !!supabase,
        role: userId ? role : null,
        name: userId ? name : null,
        signOut: async () => {
          await supabase?.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
