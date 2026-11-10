// Validates schema and re-computes simple arithmetic prompts. Run: node scripts/validate-questions.mjs
import { readdirSync, readFileSync } from "node:fs";
const dir = "content/questions";
const ids = new Set();
let errors = 0, count = 0;
const bad = (id, msg) => { errors++; console.error(`${id}: ${msg}`); };
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
// parse "3", "3/4" or "2 1/4" into [numerator, denominator]
function rat(t) {
  const m = t.trim().match(/^(?:(\d+) )?(\d+)(?:\/(\d+))?$/);
  if (!m) return null;
  if (m[3] === undefined) return [Number(m[2]), 1];
  const d = Number(m[3]);
  return [Number(m[1] ?? 0) * d + Number(m[2]), d];
}
function checkFraction(q) {
  const of = q.prompt.match(/^(\d+\/\d+) of (\d+) =$/);
  const op = q.prompt.match(/^(.+?) ([+−×÷]) (.+?) =$/);
  let a, b, o;
  if (of) { a = rat(of[1]); b = [Number(of[2]), 1]; o = "×"; }
  else if (op) { a = rat(op[1]); b = rat(op[3]); o = op[2]; }
  else return;
  if (!a || !b) return;
  let [n, d] = { "+": [a[0] * b[1] + b[0] * a[1], a[1] * b[1]], "−": [a[0] * b[1] - b[0] * a[1], a[1] * b[1]],
    "×": [a[0] * b[0], a[1] * b[1]], "÷": [a[0] * b[1], a[1] * b[0]] }[o];
  const g = gcd(n, d); n /= g; d /= g;
  const w = Math.floor(n / d), r = n % d;
  const want = r === 0 ? `${w}` : w === 0 ? `${r}/${d}` : `${w} ${r}/${d}`;
  if (want !== q.answer.trim()) bad(q.id, `${q.prompt} should be ${want}, has ${q.answer}`);
}
const num = (s) => Number(s.replace(/[£,]/g, ""));

for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  for (const q of JSON.parse(readFileSync(`${dir}/${f}`, "utf8"))) {
    count++;
    if (ids.has(q.id)) bad(q.id, "duplicate id");
    ids.add(q.id);
    for (const k of ["id", "topic", "paper", "difficulty", "marks", "format", "prompt", "answer", "explanation", "status"])
      if (q[k] === undefined || q[k] === "") bad(q.id, `missing ${k}`);
    if (q.topic + ".json" !== f) bad(q.id, `topic "${q.topic}" does not match file ${f}`);
    if (!["numeric", "fraction", "choice", "coordinate", "plot"].includes(q.format)) bad(q.id, `unknown format ${q.format}`);
    // Independently re-check "a op b =" prompts
    const m = q.prompt.match(/^([\d,.]+) ([+−×÷]) ([\d,.]+) =$/);
    if (m && q.format === "numeric") {
      const [a, b] = [num(m[1]), num(m[3])];
      const want = { "+": a + b, "−": a - b, "×": a * b, "÷": a / b }[m[2]];
      if (Math.abs(want - num(q.answer)) > 1e-9) bad(q.id, `${q.prompt} should be ${want}, has ${q.answer}`);
    }
    // Independently re-check fraction prompts ("a/b op c/d =", "n/d of N =") using exact rationals
    if (q.format !== "numeric" || /\d\/\d/.test(q.prompt)) checkFraction(q);
  }
}
console.log(`${count} questions checked, ${errors} problem(s)`);
process.exit(errors ? 1 : 0);
