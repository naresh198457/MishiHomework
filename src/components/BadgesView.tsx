"use client";

import { useEffect, useState } from "react";
import { BADGE_GROUPS, BADGES, levelFor, loadStats, syncBadges, type EarnedRow, type Stats } from "@/lib/badges";
import { supabase } from "@/lib/supabase";
import NextBadges from "./NextBadges";

const DAY = 86400000;

export default function BadgesView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<EarnedRow[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const db = supabase;
    if (!db) return;
    (async () => {
      const { data } = await db.auth.getUser();
      const s = await loadStats(db);
      if (!s || !data.user) return setError(true);
      setStats(s);
      const result = await syncBadges(db, data.user.id, s);
      setRows(result.rows);
    })();
  }, []);

  if (!supabase) return <p>Badges need login to be set up.</p>;
  if (error) return <p className="text-red-600">Could not load your badges.</p>;
  if (!stats) return <p>Loading…</p>;

  const earnedAt = new Map(rows.map((r) => [r.badge_id, r.earned_at]));
  const total = BADGES.filter((b) => b.value(stats) >= b.target).length;
  const lvl = levelFor(stats.stars);

  return (
    <div className="space-y-8">
      <div className="card p-6 text-center">
        <p className="text-6xl" aria-hidden>
          {lvl.emoji}
        </p>
        <p className="mt-1 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--chart-muted)" }}>
          Level {lvl.number}
        </p>
        <h2 className="text-3xl font-extrabold">{lvl.name}</h2>
        <p className="mt-1 text-lg font-bold">⭐ {stats.stars} stars</p>
        <div className="mx-auto mt-3 h-4 max-w-sm overflow-hidden rounded-full bg-[#e3e9f3]" role="progressbar" aria-valuenow={Math.round(lvl.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full" style={{ width: `${Math.round(lvl.progress * 100)}%`, background: "linear-gradient(90deg,#6a5cf0,#ec6bb0)" }} />
        </div>
        <p className="mt-2 text-sm font-semibold" style={{ color: "var(--chart-muted)" }}>
          {lvl.next ? `${lvl.toNext} more stars to become a ${lvl.next.name} ${lvl.next.emoji}` : "You reached the top level. Legend!"}
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--chart-muted)" }}>
          You earn 1 star for every mark you score.
        </p>
      </div>

      <section className="card p-5">
        <h2 className="text-xl font-extrabold">How do I earn badges?</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Every time you finish a quiz, homework or mock paper, the app checks your badges.</li>
          <li>Each badge below says exactly what to do. The bar shows how close you are.</li>
          <li>Practise a little every day to build a streak 🔥, and try new topics 🧭.</li>
          <li>When you earn one, a celebration pops up after your quiz!</li>
        </ul>
      </section>

      <NextBadges stats={stats} count={3} showLink={false} />

      <p className="text-xl font-extrabold">
        🏅 {total} of {BADGES.length} badges collected
      </p>

      {BADGE_GROUPS.map((g) => (
        <section key={g}>
          <h3 className="mb-3 text-lg font-extrabold">{g}</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BADGES.filter((b) => b.group === g).map((b) => {
              const value = b.value(stats);
              const got = value >= b.target;
              const when = earnedAt.get(b.id);
              const isNew = got && when && Date.now() - new Date(when).getTime() < 2 * DAY;
              return (
                <li key={b.id} className="card relative p-4 text-center" style={got ? { background: "linear-gradient(180deg,#fffdf2,#fff)" } : { opacity: 0.85 }}>
                  {isNew && <span className="absolute right-2 top-2 rounded-full bg-pink-500 px-2 py-0.5 text-xs font-extrabold text-white">NEW</span>}
                  <p className={`text-5xl ${got ? "" : "grayscale"}`} style={got ? undefined : { filter: "grayscale(1)", opacity: 0.45 }} aria-hidden>
                    {b.emoji}
                  </p>
                  <p className="mt-1 font-extrabold leading-tight">{b.title}</p>
                  <p className="text-xs" style={{ color: "var(--chart-muted)" }}>
                    {got ? b.desc : `How to earn: ${b.desc}`}
                  </p>
                  {got ? (
                    <p className="mt-2 text-xs font-bold text-green-700">✔ Earned{when ? ` ${new Date(when).toLocaleDateString("en-GB")}` : ""}</p>
                  ) : (
                    <div className="mt-2">
                      <div className="h-2 overflow-hidden rounded-full bg-[#e3e9f3]">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (value / b.target) * 100)}%`, background: "var(--series-1)" }} />
                      </div>
                      <p className="mt-1 text-xs font-bold">
                        {Math.min(value, b.target)} / {b.target}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
