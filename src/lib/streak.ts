import { localDate } from "./dates";

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
