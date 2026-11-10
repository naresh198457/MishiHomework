"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { localDate } from "@/lib/dates";
import { generateQuestion, hasGenerator, questionFromId, type Difficulty } from "@/lib/generators";
import { pickHomework, type TopicStat } from "@/lib/homework";
import { supabase } from "@/lib/supabase";
import type { Question } from "@/lib/types";
import Quiz from "./Quiz";
import RequireLogin from "./RequireLogin";

type State =
  | { phase: "loading" }
  | { phase: "error" }
  | { phase: "done" }
  | { phase: "todo"; assignmentId: string; picked: Question[] };

function Homework({ questions }: { questions: Question[] }) {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    const db = supabase;
    if (!db) return;
    (async () => {
      const { data: userData } = await db.auth.getUser();
      const user = userData.user;
      if (!user) return setState({ phase: "error" });
      const today = localDate();
      const byId = new Map(questions.map((q) => [q.id, q]));

      const load = () =>
        db
          .from("homework_assignments")
          .select("id, question_ids, attempt_id")
          .eq("user_id", user.id)
          .eq("assigned_date", today)
          .maybeSingle();

      let { data: existing } = await load();
      if (!existing) {
        const { data: rows } = await db.from("topic_stats").select("topic_id, answered, accuracy");
        const stats: Record<string, TopicStat> = {};
        for (const r of rows ?? []) stats[r.topic_id] = { answered: r.answered, accuracy: Number(r.accuracy ?? 0) };
        // Fresh daily pool: 6 newly generated questions per generator topic (same for the whole day),
        // plus fixed bank questions for any topic without a generator.
        const day = `${user.id.slice(0, 8)}${today.replace(/-/g, "")}`;
        const topics = [...new Set(questions.map((q) => q.topic))];
        const pool: Question[] = topics.flatMap((t) =>
          hasGenerator(t)
            ? Array.from({ length: 6 }, (_, i) => generateQuestion(t, `${day}${i}`, ((i % 3) + 1) as Difficulty))
            : questions.filter((q) => q.topic === t),
        );
        const ids = pickHomework(pool, stats, `${user.id}:${today}`).map((q) => q.id);
        const { error } = await db
          .from("homework_assignments")
          .insert({ user_id: user.id, assigned_date: today, question_ids: ids });
        // On a race (unique violation) we simply re-read the winner's row.
        if (error && error.code !== "23505") return setState({ phase: "error" });
        ({ data: existing } = await load());
      }
      if (!existing) return setState({ phase: "error" });
      if (existing.attempt_id) return setState({ phase: "done" });
      const picked = (existing.question_ids as string[]).map((id) => byId.get(id) ?? questionFromId(id)).filter((q): q is Question => !!q);
      setState({ phase: "todo", assignmentId: existing.id, picked });
    })();
  }, [questions]);

  if (!supabase) return <p>Homework needs login to be set up.</p>;
  if (state.phase === "loading") return <p>Loading…</p>;
  if (state.phase === "error") return <p className="text-red-600">Could not load today&apos;s homework.</p>;
  if (state.phase === "done")
    return (
      <div className="space-y-4">
        <p className="text-2xl font-bold">Homework done for today! 🎉</p>
        <p className="opacity-70">Come back tomorrow for a new set.</p>
        <Link href="/history/" className="underline">
          See my history
        </Link>
      </div>
    );

  const { assignmentId, picked } = state;
  return (
    <Quiz
      title="Homework"
      kind="homework"
      questions={picked}
      onSaved={(attemptId) => {
        void supabase?.from("homework_assignments").update({ attempt_id: attemptId }).eq("id", assignmentId);
      }}
    />
  );
}

export default function HomeworkClient({ questions }: { questions: Question[] }) {
  return (
    <RequireLogin>
      <Homework questions={questions} />
    </RequireLogin>
  );
}
