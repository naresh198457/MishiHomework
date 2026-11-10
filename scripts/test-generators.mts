// Stress-tests the question generators. Run: node --experimental-strip-types scripts/test-generators.mts
// For many seeds and all difficulties it checks structure, and independently re-computes every answer
// it can parse from the prompt (plain sums, order of operations, fractions, "% of", "x of N").
import { verifyMore } from "./verify-more.mts";
import { generateQuestion, generatorTopics, topicKinds, questionFromId, type Difficulty } from "../src/lib/generators.ts";

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const num = (s: string) => Number(s.replace(/[£,°C]/g, "").replace("−", "-"));
let problems = 0;
const bad = (id: string, prompt: string, msg: string) => {
  if (problems++ < 25) console.error(`FAIL ${id}: ${prompt}  ->  ${msg}`);
};

function rat(t: string): [number, number] | null {
  const m = t.trim().match(/^(?:(\d+) )?(\d+)(?:\/(\d+))?$/);
  if (!m) return null;
  if (m[3] === undefined) return [Number(m[2]), 1];
  const d = Number(m[3]);
  return [Number(m[1] ?? 0) * d + Number(m[2]), d];
}
function simplestText(n: number, d: number) {
  const g = gcd(n, d);
  n /= g; d /= g;
  const w = Math.floor(n / d), r = n % d;
  return r === 0 ? `${w}` : w === 0 ? `${r}/${d}` : `${w} ${r}/${d}`;
}

let checked = 0, verified = 0;
const kinds: Record<string, Set<string>> = {};
for (const topic of generatorTopics()) {
  kinds[topic] = new Set();
  for (let i = 0; i < 400; i++) {
    for (const d of [1, 2, 3] as Difficulty[]) {
      const q = generateQuestion(topic, `t${i}`, d);
      checked++;
      kinds[topic].add(q.paper);
      if (!topicKinds(topic).includes(q.paper)) bad(q.id, q.prompt, `paper ${q.paper} not declared`);
      if (!q.prompt || !q.answer || !q.explanation) bad(q.id, q.prompt, "empty field");
      if (/NaN|undefined|Infinity/.test(q.prompt + q.answer + q.explanation)) bad(q.id, q.prompt, "NaN/undefined in text");
      if (q.format === "numeric" && !Number.isFinite(num(q.answer))) bad(q.id, q.prompt, `non-numeric answer ${q.answer}`);
      if (q.format === "numeric" && !q.unit && num(q.answer) < 0 && topic !== "negative-numbers") bad(q.id, q.prompt, `negative answer ${q.answer}`);
      const dp = topic === "decimals" ? 10000 : topic === "fdp-conversions" ? 1000 : 100;
      if (q.format === "numeric" && Math.abs(num(q.answer) * dp - Math.round(num(q.answer) * dp)) > 1e-6) bad(q.id, q.prompt, `too many decimal places: ${q.answer}`);
      if (q.format === "choice") {
        if (!q.options || !q.options.includes(q.answer)) bad(q.id, q.prompt, "answer not among options");
        if (q.options && new Set(q.options).size !== q.options.length) bad(q.id, q.prompt, "duplicate options");
      }
      if (q.format === "coordinate" || q.format === "plot") {
        const [cx, cy] = q.answer.split(",").map(Number);
        if (!(Math.abs(cx) <= 6 && Math.abs(cy) <= 6)) bad(q.id, q.prompt, `coordinate off the grid: ${q.answer}`);
        if (q.format === "plot" && !(q.figure && q.figure.type === "grid" && q.figure.plot)) bad(q.id, q.prompt, "plot question without a clickable grid");
      }
      if (q.figure?.type === "grid") {
        for (const pt of q.figure.points) if (Math.abs(pt.x) > 6 || Math.abs(pt.y) > 6) bad(q.id, q.prompt, "figure point off the grid");
      }
      const again = questionFromId(q.id);
      if (!again || again.prompt !== q.prompt || again.answer !== q.answer) bad(q.id, q.prompt, "id does not regenerate the same question");

      // ---- independent re-computation
      let want: string | null = null;
      const p = q.prompt;
      let m: RegExpMatchArray | null;
      if ((m = p.match(/^([\d,.]+) ([+−×÷]) ([\d,.]+) =$/))) {
        const a = num(m[1]), b = num(m[3]);
        const v = { "+": a + b, "−": a - b, "×": a * b, "÷": a / b }[m[2] as "+"];
        want = String(Math.round(v * 1e6) / 1e6);
      } else if ((m = p.match(/^(\d+)% of ([\d,]+) =$/))) {
        want = String(Math.round(((Number(m[1]) * num(m[2])) / 100) * 1e6) / 1e6);
      } else if ((m = p.match(/^(\d+)\/(\d+) of (\d+) =$/))) {
        want = String((Number(m[3]) / Number(m[2])) * Number(m[1]));
      } else if (topic === "order-of-operations") {
        const js = p.replace(" =", "").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/(\d+)²/g, "($1**2)");
        want = String(Function(`return (${js})`)());
      } else if (q.format === "fraction" || /\d\/\d/.test(p)) {
        const op = p.match(/^(.+?) ([+−×÷]) (.+?) =$/);
        if (op) {
          const a = rat(op[1]), b = rat(op[3]);
          if (a && b) {
            const [n, dd] = { "+": [a[0] * b[1] + b[0] * a[1], a[1] * b[1]], "−": [a[0] * b[1] - b[0] * a[1], a[1] * b[1]], "×": [a[0] * b[0], a[1] * b[1]], "÷": [a[0] * b[1], a[1] * b[0]] }[op[2] as "+"];
            if (n <= 0) bad(q.id, p, "result not positive");
            want = simplestText(n, dd);
          }
        }
      } else if ((m = p.match(/^What is ([\d,]+) (more|less) than ([\d,]+)\?$/))) {
        want = String(m[2] === "more" ? num(m[3]) + num(m[1]) : num(m[3]) - num(m[1]));
      } else if ((m = p.match(/^Round ([\d,]+) to the nearest ([\d,]+)\.$/))) {
        const n = num(m[1]), to = num(m[2]);
        want = String(Math.floor(n / to + 0.5) * to);
      } else if ((m = p.match(/^What is the value of the digit (\d) in ([\d,]+)\?/))) {
        const digits = m[2].replace(/,/g, "");
        if (digits.split(m[1]).length !== 2) bad(q.id, p, "digit not unique");
        want = String(Number(m[1]) * 10 ** (digits.length - 1 - digits.indexOf(m[1])));
      } else if ((m = p.match(/A rectangle is (\d+) cm long and (\d+) cm wide\. What is its (area|perimeter)/))) {
        want = String(m[3] === "area" ? Number(m[1]) * Number(m[2]) : 2 * (Number(m[1]) + Number(m[2])));
      } else if ((m = p.match(/There are (\d+) children and (\d+) can sit/))) {
        want = String(Math.ceil(Number(m[1]) / Number(m[2])));
      } else if ((m = p.match(/film starts at (\d\d):(\d\d) and ends at (\d\d):(\d\d)/))) {
        want = String(Number(m[3]) * 60 + Number(m[4]) - (Number(m[1]) * 60 + Number(m[2])));
      }
      if (want === null) want = verifyMore(q, topic);
      if (want !== null) {
        verified++;
        if (q.format === "numeric" ? Math.abs(num(want) - num(q.answer)) > 1e-9 : want !== q.answer) bad(q.id, p, `answer ${q.answer}, independent result ${want}`);
      }
    }
  }
}
console.log(`${checked} generated questions checked, ${verified} independently re-computed, ${problems} problem(s)`);

// Variety: how many different prompts per topic across 400 seeds at each difficulty?
for (const topic of generatorTopics()) {
  const s = new Set<string>();
  for (let i = 0; i < 400; i++) for (const d of [1, 2, 3] as Difficulty[]) s.add(generateQuestion(topic, `t${i}`, d).prompt);
  console.log(`${topic.padEnd(24)} ${String(s.size).padStart(4)} distinct prompts   (papers: ${[...kinds[topic]].join("/")})`);
}
process.exit(problems ? 1 : 0);
