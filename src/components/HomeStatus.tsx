"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BADGES, levelFor, loadStats, type Stats } from "@/lib/badges";
import { localDate } from "@/lib/dates";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";
import NextBadges from "./NextBadges";

export default function HomeStatus() {
  const { session } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const db = supabase;
    if (!db || !session) return;
    (async () => {
      const [s, hw] = await Promise.all([
        loadStats(db),
        db.from("homework_assignments").select("attempt_id").eq("assigned_date", localDate()).maybeSingle(),
      ]);
      setStats(s);
      setDone(!!hw.data?.attempt_id);
    })();
  }, [session]);

  if (!supabase || !session) return null;
  const streak = stats?.streak ?? 0;
  const lvl = levelFor(stats?.stars ?? 0);
  const badgeCount = stats ? BADGES.filter((b) => b.value(stats) >= b.target).length : 0;
  return (
    <div className="space-y-4">
      <div className="mt-2 overflow-hidden rounded-3xl p-6 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #6a5cf0 0%, #8b5cf6 55%, #ec6bb0 100%)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-extrabold">📚 Today&apos;s homework</p>
            <p className="mt-1 text-lg font-semibold opacity-95">{done ? "All done today. Brilliant work! 🎉" : "10 questions picked just for you."}</p>
          </div>
          <div className="shrink-0 rounded-2xl bg-white/20 px-4 py-2 text-center">
            <p className="text-3xl leading-none">🔥</p>
            <p className="text-lg font-extrabold leading-tight">{streak}</p>
            <p className="text-xs font-semibold">day{streak === 1 ? "" : "s"} in a row</p>
          </div>
        </div>
        <Link href="/homework/" className="mt-5 inline-block rounded-full bg-white px-7 py-3 text-lg font-extrabold text-indigo-700 shadow-[0_4px_0_rgba(0,0,0,0.18)] transition active:translate-y-0.5">
          {done ? "View" : "Let's go! 🚀"}
        </Link>
      </div>

      <Link href="/badges/" className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5">
        <span className="text-5xl" aria-hidden>
          {lvl.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold" style={{ color: "var(--chart-muted)" }}>
            Level {lvl.number}
          </span>
          <span className="block text-xl font-extrabold leading-tight">{lvl.name}</span>
          <span className="mt-1 block h-2.5 overflow-hidden rounded-full bg-[#e3e9f3]">
            <span className="block h-full rounded-full" style={{ width: `${Math.round(lvl.progress * 100)}%`, background: "linear-gradient(90deg,#6a5cf0,#ec6bb0)" }} />
          </span>
          <span className="mt-1 block text-sm font-semibold">
            ⭐ {stats?.stars ?? 0} stars · 🏅 {badgeCount}/{BADGES.length} badges
          </span>
        </span>
      </Link>

      {stats && <NextBadges stats={stats} />}
    </div>
  );
}
