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
  return (
    <div className="mt-8 rounded-2xl bg-indigo-600 p-5 text-white">
      <div className="flex items-center justify-between">
        <p className="text-xl font-bold">Today&apos;s homework</p>
        <p className="font-semibold">🔥 {info?.streak ?? 0} day streak</p>
      </div>
      <p className="mt-1 opacity-90">{info?.done ? "All done today! 🎉" : "10 questions picked just for you."}</p>
      <Link
        href="/homework/"
        className="mt-4 inline-block rounded-full bg-white px-6 py-3 font-semibold text-indigo-700"
      >
        {info?.done ? "View" : "Start"}
      </Link>
    </div>
  );
}
