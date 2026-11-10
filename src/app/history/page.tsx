"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RequireLogin from "@/components/RequireLogin";
import { supabase } from "@/lib/supabase";
import { topicTitle } from "@/lib/topics";

type Attempt = {
  id: string;
  topic_id: string | null;
  completed_at: string;
  time_seconds: number | null;
  marks_scored: number;
  marks_available: number;
  percent: number;
};

function History() {
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("attempts")
      .select("id, topic_id, completed_at, time_seconds, marks_scored, marks_available, percent")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) setError(true);
        else setAttempts(data as Attempt[]);
      });
  }, []);

  if (!supabase) return <p>History needs login to be set up.</p>;
  if (error) return <p className="text-red-600">Could not load history.</p>;
  if (!attempts) return <p>Loading…</p>;
  if (attempts.length === 0) return <p>No attempts yet. Do a quiz and it will show up here.</p>;

  return (
    <ul className="space-y-3">
      {attempts.map((a) => (
        <li key={a.id} className="flex items-center justify-between rounded-xl border border-black/10 p-4 dark:border-white/15">
          <div>
            <p className="font-semibold">{a.topic_id ? topicTitle(a.topic_id) : "Practice"}</p>
            <p className="text-sm opacity-70">{new Date(a.completed_at).toLocaleString("en-GB")}</p>
          </div>
          <p className="text-lg font-bold">
            {a.marks_scored}/{a.marks_available} <span className="text-sm font-normal opacity-70">({Math.round(a.percent)}%)</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function HistoryPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/" className="text-sm underline">
        ← Back
      </Link>
      <h1 className="mb-6 mt-6 text-3xl font-bold">My history</h1>
      <RequireLogin>
        <History />
      </RequireLogin>
    </main>
  );
}
