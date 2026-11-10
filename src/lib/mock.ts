import { rng } from "./homework";
import type { Question } from "./types";

export type PaperKey = "arithmetic" | "reasoning-1" | "reasoning-2";

export const PAPERS: Record<PaperKey, { title: string; minutes: number; count: number; kind: "arithmetic" | "reasoning" }> = {
  arithmetic: { title: "Arithmetic", minutes: 30, count: 36, kind: "arithmetic" },
  "reasoning-1": { title: "Reasoning 1", minutes: 40, count: 22, kind: "reasoning" },
  "reasoning-2": { title: "Reasoning 2", minutes: 40, count: 22, kind: "reasoning" },
};

function shuffle<T>(items: T[], seed: string): T[] {
  const rand = rng(seed);
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deterministic paper: the same approved bank always gives the same paper.
// Reasoning 1 and 2 are drawn from one shuffle so they never share a question.
// Questions are ordered easiest first, like the real papers.
export function buildPaper(all: Question[], key: PaperKey): Question[] {
  const spec = PAPERS[key];
  const pool = shuffle(
    all.filter((q) => q.paper === spec.kind),
    spec.kind,
  );
  const start = key === "reasoning-2" ? PAPERS["reasoning-1"].count : 0;
  return pool.slice(start, start + spec.count).sort((a, b) => a.difficulty - b.difficulty);
}
