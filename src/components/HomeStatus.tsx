"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { localDate } from "@/lib/dates";
import { computeStreak } from "@/lib/streak";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

export default function HomeStatus() {
  const { session } = useAuth();
  const [info, setInfo] = useState<{ streak: number; done: boolean } | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!db || !session) return;
    (async () => {
      const [{ data: attempts }, { data: hw }] = await Promise.all([
        db
          .from("attempts")
          .select("completed_at")
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(400),
        db.from("homework_assignments").select("attempt_id").eq("assigned_date", localDate()).maybeSingle(),
      ]);
      setInfo({
        streak: computeStreak((attempts ?? []).map((a) => a.completed_at as string)),
        done: !!hw?.attempt_id,
      });
    })();
  }, [session]);

  if (!supabase || !session) return null;
  const streak = info?.streak ?? 0;
  return (
    <div
      className="mt-2 overflow-hidden rounded-3xl p-6 text-white shadow-lg"
      style={{ background: "linear-gradient(135deg, #6a5cf0 0%, #8b5cf6 55%, #ec6bb0 100%)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-extrabold">📚 Today&apos;s homework</p>
          <p className="mt-1 text-lg font-semibold opacity-95">
            {info?.done ? "All done today. Brilliant work! 🎉" : "10 questions picked just for you."}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-white/20 px-4 py-2 text-center">
          <p className="text-3xl leading-none">🔥</p>
          <p className="text-lg font-extrabold leading-tight">{streak}</p>
          <p className="text-xs font-semibold">day{streak === 1 ? "" : "s"} in a row</p>
        </div>
      </div>
      <Link
        href="/homework/"
        className="mt-5 inline-block rounded-full bg-white px-7 py-3 text-lg font-extrabold text-indigo-700 shadow-[0_4px_0_rgba(0,0,0,0.18)] transition active:translate-y-0.5"
      >
        {info?.done ? "View" : "Let's go! 🚀"}
      </Link>
    </div>
  );
}
