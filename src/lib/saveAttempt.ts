import { supabase } from "./supabase";
import type { Question } from "./types";

export type Result = { q: Question; response: string; correct: boolean };

// Saves a finished attempt and its per-question answers. Returns the attempt id, or null on failure.
// In guest mode (no Supabase / not signed in) there is nothing to save and it returns null.
export async function saveAttempt(opts: {
  kind: "topic" | "homework" | "mock";
  mockPaper?: string;
  results: Result[];
  seconds: number;
}): Promise<{ id: string | null; failed: boolean }> {
  if (!supabase) return { id: null, failed: false };
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { id: null, failed: false };
  const { results } = opts;
  const marksAvailable = results.reduce((n, r) => n + r.q.marks, 0);
  const marksScored = results.reduce((n, r) => n + (r.correct ? r.q.marks : 0), 0);
  const { data: attempt, error } = await supabase
    .from("attempts")
    .insert({
      user_id: user.id,
      kind: opts.kind,
      topic_id: opts.kind === "topic" ? results[0].q.topic : null,
      mock_paper: opts.kind === "mock" ? (opts.mockPaper ?? null) : null,
      completed_at: new Date().toISOString(),
      time_seconds: opts.seconds,
      questions_total: results.length,
      marks_available: marksAvailable,
      marks_scored: marksScored,
      percent: marksAvailable ? (100 * marksScored) / marksAvailable : 0,
    })
    .select("id")
    .single();
  if (error || !attempt) return { id: null, failed: true };
  const { error: answersError } = await supabase.from("attempt_answers").insert(
    results.map((r) => ({
      attempt_id: attempt.id,
      user_id: user.id,
      question_id: r.q.id,
      topic_id: r.q.topic,
      difficulty: r.q.difficulty,
      user_answer: r.response,
      marks_awarded: r.correct ? r.q.marks : 0,
      marks_available: r.q.marks,
      is_correct: r.correct,
    })),
  );
  return answersError ? { id: null, failed: true } : { id: attempt.id, failed: false };
}
