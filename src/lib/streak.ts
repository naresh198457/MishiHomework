import { localDate } from "./dates.ts";

// Consecutive days with at least one completed attempt, ending today.
// If nothing is done yet today the streak is still alive (counted from yesterday).
export function computeStreak(completedAt: string[], now: Date = new Date()): number {
  const days = new Set(completedAt.map((iso) => localDate(new Date(iso))));
  const cursor = new Date(now);
  if (!days.has(localDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// The longest run of consecutive days ever (used for streak badges, which must never be lost).
export function bestStreak(completedAt: string[]): number {
  const days = [...new Set(completedAt.map((iso) => localDate(new Date(iso))))].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of days) {
    const cur = new Date(`${d}T12:00:00`);
    if (prev && Math.round((cur.getTime() - prev.getTime()) / 86400000) === 1) run++;
    else run = 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return best;
}
