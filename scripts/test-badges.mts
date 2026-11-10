// Checks the badge / level / streak logic. Run: node --experimental-strip-types scripts/test-badges.mts
import { BADGES, computeStats, earnedIds, levelFor, nextUp, type AttemptRow } from "../src/lib/badges.ts";
import { bestStreak, computeStreak } from "../src/lib/streak.ts";

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.error(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
};
const day = (s: string) => new Date(`${s}T10:00:00`).toISOString();
const now = new Date("2026-11-10T12:00:00");

eq("streak 3", computeStreak([day("2026-11-10"), day("2026-11-09"), day("2026-11-08"), day("2026-11-06")], now), 3);
eq("streak alive yesterday", computeStreak([day("2026-11-09")], now), 1);
eq("streak broken", computeStreak([day("2026-11-07")], now), 0);
eq("best streak keeps the longest run", bestStreak([day("2026-10-01"), day("2026-10-02"), day("2026-10-03"), day("2026-10-04"), day("2026-10-20"), day("2026-10-21")]), 4);
eq("best streak same day twice", bestStreak([day("2026-10-01"), day("2026-10-01")]), 1);
eq("best streak empty", bestStreak([]), 0);

eq("level 1", levelFor(0).name, "Maths Cadet");
eq("level boundary", levelFor(50).name, "Number Ninja");
eq("level just below", levelFor(149).name, "Number Ninja");
eq("level top", levelFor(99999).name, "Maths Legend");
eq("level toNext", levelFor(100).toNext, 50);
eq("level top has no next", levelFor(99999).next, null);

const att = (o: Partial<AttemptRow>): AttemptRow => ({ id: Math.random().toString(), kind: "topic", topic_id: "x", mock_paper: null, completed_at: day("2026-11-10"), time_seconds: 200, questions_total: 8, marks_available: 8, marks_scored: 8, percent: 100, ...o });

const none = computeStats([], []);
eq("no badges with no history", earnedIds(none), []);

const one = computeStats([att({})], [{ topic_id: "x", answered: 8, accuracy: 1 }]);
eq("first quiz badges", earnedIds(one).sort(), ["first-steps", "perfect-1", "master-1"].sort());

const quickAtt = computeStats([att({ time_seconds: 60 })], []);
eq("quick badge needs fast+accurate", earnedIds(quickAtt).includes("quick-1"), true);
eq("slow is not quick", earnedIds(computeStats([att({ time_seconds: 120 })], [])).includes("quick-1"), false);
eq("tiny quiz is not perfect", earnedIds(computeStats([att({ questions_total: 2, percent: 100 })], [])).includes("perfect-1"), false);

const mock = computeStats([att({ kind: "mock", questions_total: 36, percent: 85 })], []);
eq("mock badges", earnedIds(mock).filter((b) => b.startsWith("mock")).sort(), ["mock-1", "mock-80"]);
eq("mock does not count as quick", earnedIds(computeStats([att({ kind: "mock", time_seconds: 10 })], [])).includes("quick-1"), false);

const hw = computeStats(Array.from({ length: 7 }, (_, i) => att({ kind: "homework", completed_at: day(`2026-11-0${i + 1}`) })), []);
eq("homework + streak badges", earnedIds(hw).filter((b) => b.startsWith("hw") || b.startsWith("streak")).sort(), ["hw-1", "hw-7", "streak-3", "streak-7"]);

const mastery = computeStats([att({})], Array.from({ length: 5 }, (_, i) => ({ topic_id: `t${i}`, answered: 10, accuracy: 0.85 })).concat([{ topic_id: "weak", answered: 20, accuracy: 0.5 }, { topic_id: "few", answered: 3, accuracy: 1 }]));
eq("mastered topics", mastery.topicsMastered, 5);
eq("tried topics", mastery.topicsTried, 7);
eq("explorer + master", earnedIds(mastery).filter((b) => b.startsWith("topics") || b.startsWith("master")).sort(), ["master-1", "master-5", "topics-5"]);

const nu = nextUp(mastery, 3);
eq("nextUp has 3 locked badges", nu.length, 3);
eq("nextUp never includes earned badges", nu.every((x) => !earnedIds(mastery).includes(x.badge.id)), true);
eq("nextUp is closest first", nu[0].value / nu[0].badge.target >= nu[1].value / nu[1].badge.target, true);
eq("nextUp empty when nothing locked", nextUp({ ...mastery, quizzes: 999, questions: 9999, bestStreak: 99, perfect: 99, homework: 99, mocks: 99, goodMocks: 9, quick: 9, topicsTried: 99, topicsMastered: 99 }, 3), []);

const ids = BADGES.map((b) => b.id);
eq("unique badge ids", new Set(ids).size, ids.length);

console.log(fails ? `${fails} FAILED` : "all badge tests passed");
process.exit(fails ? 1 : 0);
