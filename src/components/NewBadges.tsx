"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BADGES, loadStats, syncBadges, type Stats } from "@/lib/badges";
import { supabase } from "@/lib/supabase";
import NextBadges from "./NextBadges";

// Shown on the results screen once the attempt is saved: celebrates any badge earned by this attempt.
export default function NewBadges() {
  const [fresh, setFresh] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!db) return;
    let cancelled = false;
    (async () => {
      const { data } = await db.auth.getUser();
      if (!data.user) return;
      const stats = await loadStats(db);
      if (!stats || cancelled) return;
      const result = await syncBadges(db, data.user.id, stats);
      if (cancelled) return;
      setStats(stats);
      setFresh(result.fresh);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;
  const badges = fresh
    .map((id) => BADGES.find((b) => b.id === id))
    .filter((b) => !!b);
  return (
    <div className="space-y-3">
      {badges.length > 0 && (
        <div
          className="rounded-3xl p-5 text-center"
          style={{
            background: "linear-gradient(135deg,#fff3c4,#ffe0f0)",
            boxShadow: "0 4px 0 #f3d98a",
          }}
          role="status"
        >
          <p className="text-xl font-extrabold">
            🎉{" "}
            {badges.length === 1
              ? "You earned a new badge!"
              : `You earned ${badges.length} new badges!`}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-4">
            {badges.map((b) => (
              <div key={b.id} className="w-32">
                <p className="text-5xl" aria-hidden>
                  {b.emoji}
                </p>
                <p className="font-extrabold leading-tight">{b.title}</p>
                <p className="text-xs">{b.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/badges/" className="btn-ghost mt-4 !py-1.5 text-sm">
            See all my badges
          </Link>
        </div>
      )}
      <NextBadges
        stats={stats}
        count={2}
        title="🎯 Keep going! Earn these next"
      />
    </div>
  );
}
