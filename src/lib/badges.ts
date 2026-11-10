import type { SupabaseClient } from "@supabase/supabase-js";
import { bestStreak, computeStreak } from "./streak.ts";

export type AttemptRow = {
  id: string;
  kind: "topic" | "homework" | "mock";
  topic_id: string | null;
  mock_paper: string | null;
  completed_at: string;
  time_seconds: number | null;
  questions_total: number;
  marks_available: number;
  marks_scored: number;
  percent: number;
};
export type TopicRow = { topic_id: string; answered: number; accuracy: number };

export type Stats = {
  attempts: AttemptRow[];
  topics: TopicRow[];
  quizzes: number;
  questions: number;
  stars: number; // one star per mark scored
  streak: number;
  bestStreak: number;
  perfect: number;
  homework: number;
  mocks: number;
  goodMocks: number;
  quick: number;
  topicsTried: number;
  topicsMastered: number;
};

export const MASTERY_ACCURACY = 0.8;
export const MASTERY_QUESTIONS = 8;

export function computeStats(attempts: AttemptRow[], topics: TopicRow[]): Stats {
  const dates = attempts.map((a) => a.completed_at);
  return {
    attempts,
    topics,
    quizzes: attempts.length,
    questions: attempts.reduce((n, a) => n + a.questions_total, 0),
    stars: attempts.reduce((n, a) => n + (a.marks_scored ?? 0), 0),
    streak: computeStreak(dates),
    bestStreak: bestStreak(dates),
    perfect: attempts.filter((a) => a.questions_total >= 5 && Number(a.percent) >= 100).length,
    homework: attempts.filter((a) => a.kind === "homework").length,
    mocks: attempts.filter((a) => a.kind === "mock").length,
    goodMocks: attempts.filter((a) => a.kind === "mock" && Number(a.percent) >= 80).length,
    quick: attempts.filter((a) => a.kind !== "mock" && a.questions_total >= 8 && Number(a.percent) >= 80 && (a.time_seconds ?? 9999) <= 90).length,
    topicsTried: topics.length,
    topicsMastered: topics.filter((t) => t.answered >= MASTERY_QUESTIONS && t.accuracy >= MASTERY_ACCURACY).length,
  };
}

export type BadgeGroup = "Getting started" | "Streaks" | "Practice" | "Challenges" | "Skills";

export type Badge = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  group: BadgeGroup;
  target: number;
  value: (s: Stats) => number;
};

export const BADGES: Badge[] = [
  { id: "first-steps", emoji: "🌱", title: "First Steps", desc: "Finish your first quiz", group: "Getting started", target: 1, value: (s) => s.quizzes },
  { id: "quiz-10", emoji: "📘", title: "Quiz Fan", desc: "Finish 10 quizzes", group: "Getting started", target: 10, value: (s) => s.quizzes },
  { id: "quiz-50", emoji: "🎓", title: "Quiz Champion", desc: "Finish 50 quizzes", group: "Getting started", target: 50, value: (s) => s.quizzes },

  { id: "streak-3", emoji: "🔥", title: "On Fire", desc: "Practise 3 days in a row", group: "Streaks", target: 3, value: (s) => s.bestStreak },
  { id: "streak-7", emoji: "☄️", title: "Week Warrior", desc: "Practise 7 days in a row", group: "Streaks", target: 7, value: (s) => s.bestStreak },
  { id: "streak-14", emoji: "🚀", title: "Unstoppable", desc: "Practise 14 days in a row", group: "Streaks", target: 14, value: (s) => s.bestStreak },
  { id: "streak-30", emoji: "👑", title: "Maths Royalty", desc: "Practise 30 days in a row", group: "Streaks", target: 30, value: (s) => s.bestStreak },

  { id: "q-100", emoji: "🧮", title: "100 Questions", desc: "Answer 100 questions", group: "Practice", target: 100, value: (s) => s.questions },
  { id: "q-500", emoji: "⚡", title: "500 Questions", desc: "Answer 500 questions", group: "Practice", target: 500, value: (s) => s.questions },
  { id: "q-1000", emoji: "🌠", title: "1,000 Questions", desc: "Answer 1,000 questions", group: "Practice", target: 1000, value: (s) => s.questions },
  { id: "hw-1", emoji: "📚", title: "Homework Hero", desc: "Finish a daily homework", group: "Practice", target: 1, value: (s) => s.homework },
  { id: "hw-7", emoji: "🦸", title: "Homework Habit", desc: "Finish 7 daily homeworks", group: "Practice", target: 7, value: (s) => s.homework },
  { id: "hw-20", emoji: "🏅", title: "Homework Legend", desc: "Finish 20 daily homeworks", group: "Practice", target: 20, value: (s) => s.homework },

  { id: "perfect-1", emoji: "🎯", title: "Bullseye", desc: "Score 100% on a quiz", group: "Challenges", target: 1, value: (s) => s.perfect },
  { id: "perfect-5", emoji: "🏆", title: "Perfect Five", desc: "Score 100% on 5 quizzes", group: "Challenges", target: 5, value: (s) => s.perfect },
  { id: "quick-1", emoji: "💨", title: "Quick Thinker", desc: "Score 80%+ on an 8-question quiz in 90 seconds", group: "Challenges", target: 1, value: (s) => s.quick },
  { id: "mock-1", emoji: "⏱️", title: "Test Taker", desc: "Finish a mock SATs paper", group: "Challenges", target: 1, value: (s) => s.mocks },
  { id: "mock-5", emoji: "🏁", title: "Mock Master", desc: "Finish 5 mock SATs papers", group: "Challenges", target: 5, value: (s) => s.mocks },
  { id: "mock-80", emoji: "🥇", title: "Mock Star", desc: "Score 80%+ on a mock paper", group: "Challenges", target: 1, value: (s) => s.goodMocks },

  { id: "topics-5", emoji: "🧭", title: "Explorer", desc: "Try 5 different topics", group: "Skills", target: 5, value: (s) => s.topicsTried },
  { id: "topics-15", emoji: "🌍", title: "Globe Trotter", desc: "Try 15 different topics", group: "Skills", target: 15, value: (s) => s.topicsTried },
  { id: "topics-25", emoji: "🗺️", title: "Maths Map Master", desc: "Try 25 different topics", group: "Skills", target: 25, value: (s) => s.topicsTried },
  { id: "master-1", emoji: "🧠", title: "Topic Master", desc: `Get ${MASTERY_ACCURACY * 100}%+ on a topic (8+ questions)`, group: "Skills", target: 1, value: (s) => s.topicsMastered },
  { id: "master-5", emoji: "🎖️", title: "Super Brain", desc: "Master 5 topics", group: "Skills", target: 5, value: (s) => s.topicsMastered },
  { id: "master-10", emoji: "💎", title: "Maths Diamond", desc: "Master 10 topics", group: "Skills", target: 10, value: (s) => s.topicsMastered },
];

export const BADGE_GROUPS: BadgeGroup[] = ["Getting started", "Streaks", "Practice", "Challenges", "Skills"];

export const earnedIds = (s: Stats) => BADGES.filter((b) => b.value(s) >= b.target).map((b) => b.id);

// ---------- levels (one star per mark scored) ----------
export const LEVELS = [
  { min: 0, name: "Maths Cadet", emoji: "🐣" },
  { min: 50, name: "Number Ninja", emoji: "🥷" },
  { min: 150, name: "Fraction Fighter", emoji: "🤺" },
  { min: 300, name: "Puzzle Pro", emoji: "🧩" },
  { min: 500, name: "Equation Explorer", emoji: "🧭" },
  { min: 800, name: "Maths Wizard", emoji: "🧙" },
  { min: 1200, name: "Maths Hero", emoji: "🦸" },
  { min: 2000, name: "Maths Legend", emoji: "👑" },
];

export function levelFor(stars: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && stars >= LEVELS[i + 1].min) i++;
  const next = LEVELS[i + 1] ?? null;
  const span = next ? next.min - LEVELS[i].min : 1;
  return {
    number: i + 1,
    ...LEVELS[i],
    next,
    toNext: next ? next.min - stars : 0,
    progress: next ? (stars - LEVELS[i].min) / span : 1,
  };
}

// ---------- loading ----------
export async function loadStats(db: SupabaseClient): Promise<Stats | null> {
  const [a, t] = await Promise.all([
    db
      .from("attempts")
      .select("id, kind, topic_id, mock_paper, completed_at, time_seconds, questions_total, marks_available, marks_scored, percent")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1000),
    db.from("topic_stats").select("topic_id, answered, accuracy"),
  ]);
  if (a.error || t.error) return null;
  return computeStats(
    a.data as AttemptRow[],
    (t.data ?? []).map((r) => ({ topic_id: r.topic_id, answered: Number(r.answered), accuracy: Number(r.accuracy ?? 0) })),
  );
}

export type EarnedRow = { badge_id: string; earned_at: string };

// Remembers newly earned badges. `fresh` = ids to celebrate right now. Works (without memory) even if the table is missing.
export async function syncBadges(db: SupabaseClient, userId: string, stats: Stats): Promise<{ rows: EarnedRow[]; fresh: string[] }> {
  const earned = earnedIds(stats);
  const { data: have, error } = await db.from("user_badges").select("badge_id, earned_at");
  if (error) return { rows: earned.map((badge_id) => ({ badge_id, earned_at: "" })), fresh: [] };
  const haveIds = new Set((have ?? []).map((r) => r.badge_id as string));
  const missing = earned.filter((id) => !haveIds.has(id));
  if (missing.length > 0) {
    await db.from("user_badges").upsert(
      missing.map((badge_id) => ({ user_id: userId, badge_id })),
      { onConflict: "user_id,badge_id", ignoreDuplicates: true },
    );
  }
  // First ever sync for a child who already has history: quietly back-fill instead of celebrating everything.
  const silent = (have ?? []).length === 0 && stats.quizzes > 2;
  const now = new Date().toISOString();
  return {
    rows: [...((have ?? []) as EarnedRow[]), ...missing.map((badge_id) => ({ badge_id, earned_at: now }))],
    fresh: silent ? [] : missing,
  };
}

// The locked badges a child is closest to earning, so they always know what to aim for.
export function nextUp(stats: Stats, count = 3): { badge: Badge; value: number }[] {
  return BADGES.map((badge) => ({ badge, value: Math.min(badge.value(stats), badge.target) }))
    .filter((x) => x.value < x.badge.target)
    .sort((a, b) => b.value / b.badge.target - a.value / a.badge.target || a.badge.target - b.badge.target)
    .slice(0, count);
}
