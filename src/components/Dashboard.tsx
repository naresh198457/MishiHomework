"use client";

import { useEffect, useState } from "react";
import { localDate } from "@/lib/dates";
import { computeStreak } from "@/lib/streak";
import { supabase } from "@/lib/supabase";
import { topicTitle } from "@/lib/topics";

type AttemptRow = { completed_at: string; questions_total: number; marks_scored: number; marks_available: number };
type TopicRow = { topic_id: string; answered: number; accuracy: number };
type Data = { attempts: AttemptRow[]; topics: TopicRow[] };

const REVISE_BELOW = 0.7;
const pct = (x: number) => `${Math.round(x * 100)}%`;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm" style={{ color: "var(--chart-muted)" }}>
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}

// Last 14 days, one column per day: questions answered. Single series, so no legend box.
function DailyChart({ attempts }: { attempts: AttemptRow[] }) {
  const days: { date: string; label: string; questions: number }[] = [];
  const byDay = new Map<string, number>();
  for (const a of attempts) {
    const d = localDate(new Date(a.completed_at));
    byDay.set(d, (byDay.get(d) ?? 0) + a.questions_total);
  }
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = localDate(d);
    days.push({ date, label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), questions: byDay.get(date) ?? 0 });
  }
  const max = Math.max(10, ...days.map((d) => d.questions));
  const H = 140;
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height: H }} role="img" aria-label="Questions answered per day, last 14 days">
        {days.map((d) => {
          const h = d.questions === 0 ? 0 : Math.max(4, (d.questions / max) * (H - 18));
          return (
            <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: H }} title={`${d.label}: ${d.questions} questions`}>
              {d.questions > 0 && (
                <span className="mb-0.5 text-[11px]" style={{ color: "var(--chart-muted)" }}>
                  {d.questions}
                </span>
              )}
              <div
                style={{ height: h, background: "var(--chart-1)", maxWidth: 24, width: "100%", borderRadius: "4px 4px 0 0" }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-1.5 border-t pt-1 text-[10px]" style={{ borderColor: "var(--chart-track)", color: "var(--chart-muted)" }}>
        {days.map((d, i) => (
          <span key={d.date} className="flex-1 text-center">
            {i % 3 === 0 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

// One horizontal bar per topic, value at the bar tip, weakest first.
function TopicBars({ topics }: { topics: TopicRow[] }) {
  const sorted = [...topics].sort((a, b) => a.accuracy - b.accuracy);
  return (
    <ul className="space-y-3">
      {sorted.map((t) => (
        <li key={t.topic_id} title={`${topicTitle(t.topic_id)}: ${pct(t.accuracy)} of ${t.answered} questions`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">{topicTitle(t.topic_id)}</span>
            <span style={{ color: "var(--chart-muted)" }}>
              {t.accuracy < REVISE_BELOW ? "⚠ Revise · " : ""}
              {t.answered} Qs
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 flex-1 rounded-full" style={{ background: "var(--chart-track)" }}>
              <div className="h-3 rounded-full" style={{ width: pct(t.accuracy), background: "var(--chart-1)" }} />
            </div>
            <span className="w-12 text-right text-sm font-semibold">{pct(t.accuracy)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const db = supabase;
    if (!db) return;
    (async () => {
      const [a, t] = await Promise.all([
        db
          .from("attempts")
          .select("completed_at, questions_total, marks_scored, marks_available")
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(1000),
        db.from("topic_stats").select("topic_id, answered, accuracy"),
      ]);
      if (a.error || t.error) return setError(true);
      setData({
        attempts: a.data as AttemptRow[],
        topics: (t.data ?? []).map((r) => ({ topic_id: r.topic_id, answered: r.answered, accuracy: Number(r.accuracy ?? 0) })),
      });
    })();
  }, []);

  if (!supabase) return <p>The dashboard needs login to be set up.</p>;
  if (error) return <p className="text-red-600">Could not load the dashboard.</p>;
  if (!data) return <p>Loading…</p>;
  if (data.attempts.length === 0) return <p>No attempts yet. Do a quiz or today&apos;s homework and your progress will appear here.</p>;

  const answered = data.attempts.reduce((n, a) => n + a.questions_total, 0);
  const scored = data.attempts.reduce((n, a) => n + a.marks_scored, 0);
  const available = data.attempts.reduce((n, a) => n + a.marks_available, 0);
  const streak = computeStreak(data.attempts.map((a) => a.completed_at));
  const ranked = [...data.topics].filter((t) => t.answered >= 3).sort((a, b) => b.accuracy - a.accuracy);
  const strongest = ranked.slice(0, 2).filter((t) => t.accuracy >= REVISE_BELOW);
  const revise = [...ranked].reverse().filter((t) => t.accuracy < REVISE_BELOW).slice(0, 3);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Quizzes done" value={String(data.attempts.length)} />
        <Stat label="Questions answered" value={String(answered)} />
        <Stat label="Accuracy" value={available ? pct(scored / available) : "–"} />
        <Stat label="Day streak" value={`🔥 ${streak}`} />
      </div>

      <section>
        <h2 className="text-xl font-bold">Questions per day</h2>
        <p className="mb-3 text-sm" style={{ color: "var(--chart-muted)" }}>
          Last 14 days
        </p>
        <DailyChart attempts={data.attempts} />
      </section>

      <section>
        <h2 className="text-xl font-bold">Accuracy by topic</h2>
        <p className="mb-4 text-sm" style={{ color: "var(--chart-muted)" }}>
          Weakest first. Topics under 70% are marked Revise.
        </p>
        {data.topics.length === 0 ? <p>No topic data yet.</p> : <TopicBars topics={data.topics} />}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="card p-4">
            <p className="font-semibold">💪 Strongest</p>
            <p className="mt-1 text-sm">{strongest.length ? strongest.map((t) => topicTitle(t.topic_id)).join(", ") : "Keep practising to find out."}</p>
          </div>
          <div className="card p-4">
            <p className="font-semibold">⚠ Revise</p>
            <p className="mt-1 text-sm">{revise.length ? revise.map((t) => topicTitle(t.topic_id)).join(", ") : "Nothing below 70%. Great work!"}</p>
          </div>
        </div>
      </section>

      <details className="text-sm">
        <summary className="cursor-pointer font-medium underline">Show data as a table</summary>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr style={{ color: "var(--chart-muted)" }}>
              <th className="py-1">Topic</th>
              <th>Questions</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {[...data.topics].sort((a, b) => a.accuracy - b.accuracy).map((t) => (
              <tr key={t.topic_id} className="border-t" style={{ borderColor: "var(--chart-track)" }}>
                <td className="py-1">{topicTitle(t.topic_id)}</td>
                <td>{t.answered}</td>
                <td>{pct(t.accuracy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
