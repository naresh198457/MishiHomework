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
  const nums = s.replace(/−/g, "-").match(/-?\d+/g);
  return nums && nums.length === 2 ? `${Number(nums[0])},${Number(nums[1])}` : "";
}

// "1,2;3,4" in any order, spaces or duplicates -> sorted unique "1,2;3,4"
export function normShape(s: string): string {
  const pts = s.split(";").map(normCoordinate).filter(Boolean);
  return [...new Set(pts)].sort((a, b) => {
    const [ax, ay] = a.split(",").map(Number);
    const [bx, by] = b.split(",").map(Number);
    return ax - bx || ay - by;
  }).join(";");
}

// "1,2;3,4" -> [{x:1,y:2},{x:3,y:4}] in the order given (used to draw the shape back)
export function parseShape(s: string): { x: number; y: number }[] {
  return s
    .split(";")
    .map(normCoordinate)
    .filter(Boolean)
    .map((p) => {
      const [x, y] = p.split(",").map(Number);
      return { x, y };
    });
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
    case "draw": {
      const got = normShape(response);
      return got !== "" && got === normShape(q.answer);
    }
    default:
      return markNumeric(q, response);
  }
}
