import type { Question } from "./types";

export type TopicStat = { answered: number; accuracy: number };

// Small deterministic PRNG so the same user + day always gets the same homework.
function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Weak topics (accuracy < 70%) count 3x, untried topics 2x, the rest 1x.
// At most `maxPerTopic` questions from any one topic so the set stays varied.
export function pickHomework(
  questions: Question[],
  stats: Record<string, TopicStat>,
  seed: string,
  count = 10,
  maxPerTopic = 3,
): Question[] {
  const rand = rng(seed);
  const weight = (q: Question) => {
    const s = stats[q.topic];
    if (!s || s.answered === 0) return 2;
    return s.accuracy < 0.7 ? 3 : 1;
  };
  const pool = [...questions];
  const picked: Question[] = [];
  const perTopic: Record<string, number> = {};
  while (picked.length < count && pool.length > 0) {
    const eligible = pool.filter((q) => (perTopic[q.topic] ?? 0) < maxPerTopic);
    const list = eligible.length > 0 ? eligible : pool; // relax the cap if we run out
    const total = list.reduce((n, q) => n + weight(q), 0);
    let r = rand() * total;
    const choice = list.find((q) => (r -= weight(q)) < 0) ?? list[list.length - 1];
    picked.push(choice);
    perTopic[choice.topic] = (perTopic[choice.topic] ?? 0) + 1;
    pool.splice(pool.indexOf(choice), 1);
  }
  return picked;
}
