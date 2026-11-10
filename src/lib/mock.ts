import { generateFor, topicKinds, type Difficulty, type PaperKind } from "./generators";
import { rng } from "./homework";
import type { Question } from "./types";

export type PaperKey = "arithmetic" | "reasoning-1" | "reasoning-2";

export const PAPERS: Record<PaperKey, { title: string; minutes: number; count: number; kind: PaperKind }> = {
  arithmetic: { title: "Arithmetic", minutes: 30, count: 36, kind: "arithmetic" },
  "reasoning-1": { title: "Reasoning 1", minutes: 40, count: 22, kind: "reasoning" },
  "reasoning-2": { title: "Reasoning 2", minutes: 40, count: 22, kind: "reasoning" },
};

export const MIN_TOPICS = 3;

// Approved topics that can produce questions for this kind of paper.
export const topicsForPaper = (liveTopics: string[], key: PaperKey) =>
  liveTopics.filter((t) => topicKinds(t).includes(PAPERS[key].kind));

// A brand-new paper every time: topics are spread evenly, and difficulty climbs
// from easy to hard through the paper, like the real tests.
export function buildPaper(liveTopics: string[], key: PaperKey, seed: string): Question[] {
  const spec = PAPERS[key];
  const topics = topicsForPaper(liveTopics, key);
  if (topics.length === 0) return [];
  const rand = rng(`${key}:${seed}`);
  const order = [...topics];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const out: Question[] = [];
  for (let i = 0; i < spec.count; i++) {
    const d = (i < spec.count / 3 ? 1 : i < (2 * spec.count) / 3 ? 2 : 3) as Difficulty;
    const topic = order[i % order.length];
    out.push(generateFor(topic, `${seed}${i}`, d, spec.kind));
  }
  return out;
}
