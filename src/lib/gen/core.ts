import type { Figure, Question } from "../types.ts";

export type Difficulty = 1 | 2 | 3;
export type PaperKind = "arithmetic" | "reasoning";

export type Rand = { next(): number; int(a: number, b: number): number; pick<T>(items: T[]): T };

export function makeRng(seed: string): Rand {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const next = () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)), pick: (items) => items[Math.floor(next() * items.length)] };
}

export type Draft = {
  paper: PaperKind;
  marks?: number;
  format?: Question["format"];
  options?: string[];
  figure?: Figure;
  prompt: string;
  answer: string | number;
  acceptable?: string[];
  unit?: string;
  explanation: string;
};
export type Gen = (r: Rand, d: Difficulty) => Draft;

export const fmt = (n: number) => n.toLocaleString("en-GB");
export const clean = (x: number) => String(Math.round(x * 1e6) / 1e6);
export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
export const gbp = (cents: number) => `£${(cents / 100).toFixed(2)}`;
export const centsStr = (cents: number) => (cents / 100).toFixed(2);

// ---------- fraction helpers ----------
export function simplest(n: number, d: number) {
  const g = gcd(n, d);
  n /= g;
  d /= g;
  const w = Math.floor(n / d);
  const r = n % d;
  const str = r === 0 ? `${w}` : w === 0 ? `${r}/${d}` : `${w} ${r}/${d}`;
  return { str, improper: r === 0 ? null : `${n}/${d}`, n, d };
}
export const mixedText = (w: number, n: number, d: number) => (w ? `${w} ${n}/${d}` : `${n}/${d}`);
export const fracDraft = (prompt: string, n: number, d: number, explanation: string): Draft => {
  const f = simplest(n, d);
  return {
    paper: "arithmetic",
    format: "fraction",
    prompt,
    answer: f.str,
    acceptable: f.improper && f.improper !== f.str ? [f.improper] : undefined,
    explanation: `${explanation} ${f.str === `${n}/${d}` ? "" : `This simplifies to ${f.str}.`}`.trim(),
  };
};

