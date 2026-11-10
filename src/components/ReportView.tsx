"use client";

import { useEffect, useState } from "react";
import { BADGES, levelFor, loadStats, type AttemptRow, type EarnedRow, type Stats } from "@/lib/badges";
import { localDate } from "@/lib/dates";
import { PAPERS, type PaperKey } from "@/lib/mock";
import { supabase } from "@/lib/supabase";
import { topicTitle } from "@/lib/topics";
import { useAuth } from "./AuthProvider";

type Range = "7" | "30" | "all";
type TopicTotal = { topic: string; questions: number; scored: number; available: number };

const RANGE_LABEL: Record<Range, string> = { "7": "Last 7 days", "30": "Last 30 days", all: "All time" };
const pct = (x: number) => `${Math.round(x * 100)}%`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const minutes = (secs: number) => (secs >= 3600 ? `${Math.floor(secs / 3600)} h ${Math.round((secs % 3600) / 60)} min` : `${Math.round(secs / 60)} min`);

function status(accuracy: number, questions: number) {
  if (questions < 3) return { label: "Too few questions to judge", icon: "…" };
  if (accuracy >= 0.85) return { label: "Strong", icon: "⭐" };
  if (accuracy >= 0.7) return { label: "Good", icon: "👍" };
  return { label: "Needs practice", icon: "📌" };
}

async function fetchTopicTotals(since: string | null): Promise<TopicTotal[] | null> {
  const db = supabase;
  if (!db) return null;
  const totals = new Map<string, TopicTotal>();
  for (let from = 0; from < 30000; from += 1000) {
    let q = db.from("attempt_answers").select("topic_id, marks_awarded, marks_available, attempts!inner(completed_at)").range(from, from + 999);
    if (since) q = q.gte("attempts.completed_at", since);
    const { data, error } = await q;
    if (error) return null;
    for (const r of data ?? []) {
      const t = totals.get(r.topic_id) ?? { topic: r.topic_id, questions: 0, scored: 0, available: 0 };
      t.questions += 1;
      t.scored += r.marks_awarded;
      t.available += r.marks_available;
      totals.set(r.topic_id, t);
    }
    if ((data ?? []).length < 1000) break;
  }
  return [...totals.values()];
}

export default function ReportView() {
  const { name } = useAuth();
  const [range, setRange] = useState<Range>("30");
  const [stats, setStats] = useState<Stats | null>(null);
  const [totals, setTotals] = useState<TopicTotal[] | null>(null);
  const [earned, setEarned] = useState<EarnedRow[]>([]);
  const [error, setError] = useState(false);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const db = supabase;
    if (!db) return;
    (async () => {
      const [s, b] = await Promise.all([loadStats(db), db.from("user_badges").select("badge_id, earned_at")]);
      if (!s) return setError(true);
      setStats(s);
      setEarned((b.data ?? []) as EarnedRow[]);
    })();
  }, []);

  useEffect(() => {
    const since = range === "all" ? null : new Date(Date.now() - Number(range) * 86400000).toISOString();
    let cancelled = false;
    fetchTopicTotals(since).then((t) => {
      if (cancelled) return;
      if (t === null) setError(true);
      else setTotals(t);
    });
    return () => {
      cancelled = true;
    };
  }, [range]);

  if (!supabase) return <p>The report needs login to be set up.</p>;
  if (error) return <p className="text-red-600">Could not load the report.</p>;
  if (!stats || !totals) return <p>Loading…</p>;

  const since = range === "all" ? 0 : now - Number(range) * 86400000;
  const attempts: AttemptRow[] = stats.attempts.filter((a) => new Date(a.completed_at).getTime() >= since);
  const questions = attempts.reduce((n, a) => n + a.questions_total, 0);
  const scored = attempts.reduce((n, a) => n + a.marks_scored, 0);
  const available = attempts.reduce((n, a) => n + a.marks_available, 0);
  const seconds = attempts.reduce((n, a) => n + (a.time_seconds ?? 0), 0);
  const activeDays = new Set(attempts.map((a) => localDate(new Date(a.completed_at)))).size;
  const lvl = levelFor(stats.stars);
  const who = name ?? "Your child";

  const rated = totals
    .map((t) => ({ ...t, accuracy: t.available ? t.scored / t.available : 0 }))
    .sort((a, b) => a.accuracy - b.accuracy);
  const focus = rated.filter((t) => t.questions >= 3 && t.accuracy < 0.85).slice(0, 3);
  const strong = [...rated].filter((t) => t.questions >= 3 && t.accuracy >= 0.85).sort((a, b) => b.accuracy - a.accuracy).slice(0, 3);
  const mocks = attempts.filter((a) => a.kind === "mock");
  const recent = attempts.slice(0, 10);
  const badgesInRange = earned.filter((e) => e.earned_at && new Date(e.earned_at).getTime() >= since);

  const tile = "rounded-xl border border-[#c9d4ee] p-3 text-center";
  const th = "border-b-2 border-[#c9d4ee] py-1 pr-3 text-left text-sm";
  const td = "border-b border-[#e3e9f3] py-1 pr-3";

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center gap-3">
        <label className="font-bold" htmlFor="range">
          Show:
        </label>
        <select id="range" value={range} onChange={(e) => setRange(e.target.value as Range)} className="rounded-xl border-2 border-[#c9d4ee] bg-white px-3 py-2">
          {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
            <option key={r} value={r}>
              {RANGE_LABEL[r]}
            </option>
          ))}
        </select>
        <button className="btn" onClick={() => window.print()}>
          🖨️ Print or save as PDF
        </button>
      </div>

      <article className="card space-y-6 p-6 print:p-0">
        <header className="border-b-2 border-[#c9d4ee] pb-3">
          <p className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--chart-muted)" }}>
            KS2 SATs maths practice
          </p>
          <h2 className="text-3xl font-extrabold">Progress report: {who}</h2>
          <p style={{ color: "var(--chart-muted)" }}>
            {RANGE_LABEL[range]} · printed {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </header>

        {attempts.length === 0 ? (
          <p>No practice recorded in this period yet.</p>
        ) : (
          <>
            <p className="text-lg">
              {who} did <b>{attempts.length}</b> practice session{attempts.length === 1 ? "" : "s"} on <b>{activeDays}</b> day{activeDays === 1 ? "" : "s"}, answering <b>{questions}</b> questions with an overall accuracy of{" "}
              <b>{available ? pct(scored / available) : "–"}</b>
              {seconds > 0 ? `, spending about ${minutes(seconds)} practising` : ""}.
            </p>

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ breakInside: "avoid" }}>
              <div className={tile}>
                <p className="text-2xl font-extrabold">{attempts.length}</p>
                <p className="text-sm">Sessions</p>
              </div>
              <div className={tile}>
                <p className="text-2xl font-extrabold">{questions}</p>
                <p className="text-sm">Questions</p>
              </div>
              <div className={tile}>
                <p className="text-2xl font-extrabold">{available ? pct(scored / available) : "–"}</p>
                <p className="text-sm">Accuracy</p>
              </div>
              <div className={tile}>
                <p className="text-2xl font-extrabold">🔥 {stats.streak}</p>
                <p className="text-sm">Day streak now</p>
              </div>
            </section>

            <section style={{ breakInside: "avoid" }}>
              <h3 className="mb-1 text-xl font-extrabold">What to practise next</h3>
              {focus.length === 0 ? (
                <p>Nothing stands out as weak. Keep practising a mix of topics.</p>
              ) : (
                <ol className="list-decimal pl-6">
                  {focus.map((t) => (
                    <li key={t.topic}>
                      <b>{topicTitle(t.topic)}</b> ({pct(t.accuracy)} from {t.questions} questions)
                    </li>
                  ))}
                </ol>
              )}
              {strong.length > 0 && (
                <p className="mt-2">
                  <b>Strongest:</b> {strong.map((t) => `${topicTitle(t.topic)} (${pct(t.accuracy)})`).join(", ")}.
                </p>
              )}
            </section>

            <section>
              <h3 className="mb-1 text-xl font-extrabold">Topics</h3>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={th}>Topic</th>
                    <th className={th}>Questions</th>
                    <th className={th}>Accuracy</th>
                    <th className={th}>How it is going</th>
                  </tr>
                </thead>
                <tbody>
                  {rated.map((t) => {
                    const s = status(t.accuracy, t.questions);
                    return (
                      <tr key={t.topic} style={{ breakInside: "avoid" }}>
                        <td className={td}>{topicTitle(t.topic)}</td>
                        <td className={td}>{t.questions}</td>
                        <td className={td}>{pct(t.accuracy)}</td>
                        <td className={td}>
                          {s.icon} {s.label}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-1 text-xs" style={{ color: "var(--chart-muted)" }}>
                Strong is 85% or more, Good is 70% to 84%, Needs practice is under 70%. Topics are rated once 3 or more questions are answered.
              </p>
            </section>

            {mocks.length > 0 && (
              <section style={{ breakInside: "avoid" }}>
                <h3 className="mb-1 text-xl font-extrabold">Mock SATs papers</h3>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className={th}>Date</th>
                      <th className={th}>Paper</th>
                      <th className={th}>Marks</th>
                      <th className={th}>Score</th>
                      <th className={th}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mocks.map((a) => (
                      <tr key={a.id}>
                        <td className={td}>{fmtDate(a.completed_at)}</td>
                        <td className={td}>{PAPERS[a.mock_paper as PaperKey]?.title ?? a.mock_paper ?? "Mock"}</td>
                        <td className={td}>
                          {a.marks_scored}/{a.marks_available}
                        </td>
                        <td className={td}>{Math.round(Number(a.percent))}%</td>
                        <td className={td}>{a.time_seconds ? minutes(a.time_seconds) : "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            <section style={{ breakInside: "avoid" }}>
              <h3 className="mb-1 text-xl font-extrabold">Recent sessions</h3>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={th}>Date</th>
                    <th className={th}>What</th>
                    <th className={th}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((a) => (
                    <tr key={a.id}>
                      <td className={td}>{fmtDate(a.completed_at)}</td>
                      <td className={td}>
                        {a.kind === "homework" ? "Daily homework" : a.kind === "mock" ? `Mock: ${PAPERS[a.mock_paper as PaperKey]?.title ?? "paper"}` : topicTitle(a.topic_id ?? "")}
                      </td>
                      <td className={td}>
                        {a.marks_scored}/{a.marks_available} ({Math.round(Number(a.percent))}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section style={{ breakInside: "avoid" }}>
              <h3 className="mb-1 text-xl font-extrabold">Rewards</h3>
              <p>
                {lvl.emoji} <b>Level {lvl.number}: {lvl.name}</b> with {stats.stars} stars in total.
              </p>
              {badgesInRange.length > 0 ? (
                <p className="mt-1">
                  Badges earned in this period:{" "}
                  {badgesInRange
                    .map((e) => BADGES.find((b) => b.id === e.badge_id))
                    .filter((b) => !!b)
                    .map((b) => `${b.emoji} ${b.title}`)
                    .join(", ")}
                  .
                </p>
              ) : (
                <p className="mt-1">No new badges in this period.</p>
              )}
            </section>
          </>
        )}
      </article>
    </div>
  );
}
