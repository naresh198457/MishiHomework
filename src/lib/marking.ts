import type { Question } from "./types";

// Turn "£1,234.50", "35%", " 43 " into a number; null if not numeric.
function toNumber(raw: string): number | null {
  const s = raw.trim().replace(/[£,%\s]/g, "").replace("−", "-");
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

const normFraction = (s: string) => s.trim().replace(/\s+/g, " ").replace(/\s*\/\s*/g, "/");

// Fractions must be in simplest form: compare text with answer / acceptable forms.
export function markFraction(q: Question, response: string): boolean {
  const got = normFraction(response);
  return [q.answer, ...(q.acceptable ?? [])].some((a) => normFraction(a) === got);
}

// "(3, -2)", "3,−2" and "3 -2" all become "3,-2".
export function normCoordinate(s: string): string {
  const nums = s.replace("−", "-").match(/-?\d+/g);
  return nums && nums.length === 2 ? `${Number(nums[0])},${Number(nums[1])}` : "";
}

export function mark(q: Question, response: string): boolean {
  switch (q.format) {
    case "fraction":
      return markFraction(q, response);
    case "choice":
      return response.trim() === q.answer;
    case "coordinate":
    case "plot": {
      const got = normCoordinate(response);
      return got !== "" && got === normCoordinate(q.answer);
    }
    default:
      return markNumeric(q, response);
  }
}
