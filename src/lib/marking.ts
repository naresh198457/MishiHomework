import type { Question } from "./types";

// Turn "£1,234.50", "35%", " 43 " into a number; null if not numeric.
function toNumber(raw: string): number | null {
  const s = raw.trim().replace(/[£,%\s]/g, "");
  if (s === "" || !/^-?\d*\.?\d+$/.test(s)) return null;
  return Number(s);
}

export function markNumeric(q: Question, response: string): boolean {
  const got = toNumber(response);
  if (got === null) return false;
  return [q.answer, ...(q.acceptable ?? [])].some((a) => {
    const want = toNumber(a);
    return want !== null && Math.abs(want - got) < 1e-9;
  });
}
