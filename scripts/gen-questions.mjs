// Generates draft question files with answers COMPUTED (not hand-typed).
// Run: node scripts/gen-questions.mjs   (then review the drafts, then validate)
import { writeFileSync } from "node:fs";

const fmt = (n) => n.toLocaleString("en-GB");
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const mk = (prefix, topic, list) =>
  list.map((q, i) => ({
    id: `${prefix}-${String(i + 1).padStart(3, "0")}`,
    topic,
    paper: q.paper ?? "arithmetic",
    difficulty: q.d,
    marks: q.marks ?? 1,
    format: q.format ?? "numeric",
    prompt: q.prompt,
    answer: String(q.answer),
    ...(q.acceptable ? { acceptable: q.acceptable } : {}),
    ...(q.unit ? { unit: q.unit } : {}),
    explanation: q.explanation,
    source: "original",
    status: "approved",
  }));

// ---- Place value & rounding
const roundTo = (n, to) => Math.round(n / to) * to;
const pv = [
  { d: 1, prompt: "What is 2,000 more than 45,367?", answer: 45367 + 2000, explanation: "Add 2 to the thousands digit: 45,367 + 2,000 = 47,367." },
  { d: 1, prompt: "What is 10,000 less than 83,540?", answer: 83540 - 10000, explanation: "Take 1 from the ten-thousands digit: 83,540 − 10,000 = 73,540." },
  { d: 1, prompt: "Round 4,862 to the nearest 10.", answer: roundTo(4862, 10), explanation: "The units digit is 2, so round down to 4,860." },
  { d: 2, prompt: "Round 38,476 to the nearest 100.", answer: roundTo(38476, 100), explanation: "The tens digit is 7, so round up: 38,500." },
  { d: 2, prompt: "Round 567,892 to the nearest 1,000.", answer: roundTo(567892, 1000), explanation: "The hundreds digit is 8, so round up: 568,000." },
  { d: 2, prompt: "What is the value of the digit 7 in 3,764,210? (Write the number)", answer: 700000, explanation: "The 7 is in the hundred-thousands column, so its value is 700,000." },
  { d: 3, prompt: "What is 100,000 more than 2,450,300?", answer: 2450300 + 100000, explanation: "Add 1 to the hundred-thousands digit: 2,550,300." },
  { d: 3, prompt: "Round 1,949,999 to the nearest 10,000.", answer: roundTo(1949999, 10000), explanation: "The thousands digit is 9, so round up: 1,950,000." },
];

// ---- Addition & subtraction
const as = [
  { d: 1, prompt: `${fmt(4528)} + ${fmt(3267)} =`, answer: 4528 + 3267 },
  { d: 1, prompt: `${fmt(7403)} − ${fmt(2158)} =`, answer: 7403 - 2158 },
  { d: 2, prompt: `${fmt(35684)} + ${fmt(27519)} =`, answer: 35684 + 27519 },
  { d: 2, prompt: `${fmt(90000)} − ${fmt(46372)} =`, answer: 90000 - 46372 },
  { d: 2, prompt: `${fmt(634287)} + ${fmt(158964)} =`, answer: 634287 + 158964 },
  { d: 3, prompt: `${fmt(1203845)} − ${fmt(657291)} =`, answer: 1203845 - 657291 },
  { d: 2, prompt: "3.45 + 2.78 =", answer: (345 + 278) / 100 },
  { d: 3, prompt: "12.5 − 4.86 =", answer: (1250 - 486) / 100 },
].map((q) => ({ ...q, explanation: `Use column method, lining up place values. The answer is ${fmt(q.answer)}.` }));

// ---- Multiplication
const mul = [
  { d: 1, prompt: "7 × 8 =", answer: 56 },
  { d: 1, prompt: "12 × 9 =", answer: 108 },
  { d: 1, prompt: `${fmt(345)} × 10 =`, answer: 3450 },
  { d: 2, prompt: `${fmt(62)} × 100 =`, answer: 6200 },
  { d: 2, prompt: `${fmt(4736)} × 6 =`, answer: 4736 * 6 },
  { d: 2, prompt: `${fmt(8359)} × 7 =`, answer: 8359 * 7 },
  { d: 3, prompt: "0.7 × 100 =", answer: 70 },
  { d: 3, prompt: `${fmt(5000)} × 0 =`, answer: 0 },
].map((q) => ({ ...q, explanation: `${q.prompt.replace(" =", "")} = ${fmt(q.answer)}.` }));

// ---- Division
const div = [
  { d: 1, prompt: "72 ÷ 8 =", answer: 9 },
  { d: 1, prompt: "144 ÷ 12 =", answer: 12 },
  { d: 1, prompt: `${fmt(4500)} ÷ 10 =`, answer: 450 },
  { d: 2, prompt: `${fmt(3640)} ÷ 4 =`, answer: 3640 / 4 },
  { d: 2, prompt: `${fmt(5184)} ÷ 6 =`, answer: 5184 / 6 },
  { d: 2, prompt: `${fmt(7945)} ÷ 5 =`, answer: 7945 / 5 },
  { d: 3, prompt: `${fmt(9072)} ÷ 8 =`, answer: 9072 / 8 },
  { d: 3, prompt: "52 ÷ 8 =", answer: 6.5, explanation: "8 × 6 = 48, remainder 4, and 4 ÷ 8 = 0.5, so the answer is 6.5." },
].map((q) => ({ ...q, explanation: q.explanation ?? `${q.prompt.replace(" =", "")} = ${fmt(q.answer)}. Check: ${fmt(q.answer)} × ${q.prompt.split(" ÷ ")[1].replace(" =", "")} gives back the number you started with.` }));

// ---- Long multiplication (2 marks)
const lm = [
  [234, 12], [456, 23], [738, 34], [1_205, 15], [3_426, 27], [4_581, 36], [2_749, 48], [6_312, 53],
].map(([a, b], i) => ({
  d: i < 3 ? 2 : 3, marks: 2, prompt: `${fmt(a)} × ${b} =`, answer: a * b,
  explanation: `Long multiplication: ${fmt(a)} × ${Math.floor(b / 10) * 10} = ${fmt(a * Math.floor(b / 10) * 10)} and ${fmt(a)} × ${b % 10} = ${fmt(a * (b % 10))}. Add them: ${fmt(a * b)}.`,
}));

// ---- Long division (2 marks, exact answers)
const ld = [
  [12, 25], [15, 34], [13, 46], [24, 56], [18, 72], [27, 63], [32, 145], [45, 128],
].map(([b, q], i) => ({
  d: i < 3 ? 2 : 3, marks: 2, prompt: `${fmt(b * q)} ÷ ${b} =`, answer: q,
  explanation: `Long division: ${fmt(b * q)} ÷ ${b} = ${q}. Check: ${q} × ${b} = ${fmt(b * q)}.`,
}));

// ---- Fractions add/subtract (answers computed, simplest mixed number)
function frac(n, d) {
  const g = gcd(n, d); n /= g; d /= g;
  const w = Math.floor(n / d), r = n % d;
  const str = r === 0 ? `${w}` : w === 0 ? `${r}/${d}` : `${w} ${r}/${d}`;
  return { str, improper: r === 0 ? null : `${n}/${d}` };
}
const mixed = (w, n, d) => (w ? `${w} ${n}/${d}` : `${n}/${d}`);
const fr = [
  { a: [0, 1, 4], b: [0, 1, 2], op: "+", d: 1 },
  { a: [0, 3, 5], b: [0, 1, 10], op: "+", d: 1 },
  { a: [0, 2, 3], b: [0, 1, 6], op: "+", d: 2 },
  { a: [0, 5, 6], b: [0, 1, 3], op: "−", d: 2 },
  { a: [2, 3, 5], b: [1, 3, 5], op: "+", d: 2 },
  { a: [3, 1, 4], b: [1, 5, 8], op: "+", d: 3 },
  { a: [4, 1, 2], b: [2, 3, 4], op: "−", d: 3 },
  { a: [5, 2, 3], b: [2, 5, 6], op: "−", d: 3 },
].map(({ a, b, op, d }) => {
  const [aw, an, ad] = a, [bw, bn, bd] = b;
  const D = (ad * bd) / gcd(ad, bd);
  const A = (aw * ad + an) * (D / ad), B = (bw * bd + bn) * (D / bd);
  const res = op === "+" ? A + B : A - B;
  const f = frac(res, D);
  return {
    d, format: "fraction", prompt: `${mixed(...a)} ${op} ${mixed(...b)} =`, answer: f.str,
    acceptable: f.improper && f.improper !== f.str ? [f.improper] : undefined,
    explanation: `Use a common denominator of ${D}: ${A}/${D} ${op} ${B}/${D} = ${res}/${D}, which simplifies to ${f.str}.`,
  };
});

// ---- Fractions multiply / divide (answers computed from the operands)
const simp = (n, d) => { const g = gcd(n, d); return [n / g, d / g]; };
const fmul = [
  { a: [0, 1, 2], b: [0, 1, 4], d: 1 },
  { a: [0, 2, 3], b: [0, 3, 5], d: 2 },
  { a: [0, 1, 3], b: 6, d: 1 },
  { a: [0, 3, 8], b: 4, d: 2 },
  { of: [3, 4], amount: 24, d: 2 },
  { of: [2, 5], amount: 35, d: 2 },
  { a: [2, 1, 4], b: 3, d: 3 },
  { a: [0, 3, 4], b: [0, 4, 9], d: 3 },
].map((q) => {
  if (q.of) {
    const [n, d] = q.of;
    return { d: q.d, format: "numeric", prompt: `${n}/${d} of ${q.amount} =`, answer: (q.amount / d) * n,
      explanation: `Find 1/${d} first: ${q.amount} ÷ ${d} = ${q.amount / d}. Then multiply by ${n}: ${q.amount / d} × ${n} = ${(q.amount / d) * n}.` };
  }
  const [aw, an, ad] = q.a;
  const top = aw * ad + an; // improper numerator of a
  const [bn, bd] = Array.isArray(q.b) ? [q.b[1], q.b[2]] : [q.b, 1];
  const [rn, rd] = simp(top * bn, ad * bd);
  const f = frac(rn, rd);
  const bText = Array.isArray(q.b) ? mixed(...q.b) : String(q.b);
  const stepA = aw ? `Change ${mixed(...q.a)} to ${top}/${ad}. ` : "";
  return { d: q.d, format: "fraction", prompt: `${mixed(...q.a)} × ${bText} =`, answer: f.str,
    acceptable: f.improper && f.improper !== f.str ? [f.improper] : undefined,
    explanation: `${stepA}Multiply the numerators (${top} × ${bn} = ${top * bn}) and the denominators (${ad} × ${bd} = ${ad * bd}): ${top * bn}/${ad * bd}, which simplifies to ${f.str}.` };
});
const fdiv = [
  [1, 2, 2, 1], [3, 4, 3, 1], [2, 3, 4, 2], [4, 5, 2, 2], [5, 6, 5, 2], [3, 5, 6, 3], [1, 4, 3, 3], [7, 8, 2, 3],
].map(([n, d, k, diff]) => {
  const [rn, rd] = simp(n, d * k);
  const f = frac(rn, rd);
  return { d: diff, format: "fraction", prompt: `${n}/${d} ÷ ${k} =`, answer: f.str,
    explanation: `Dividing by ${k} makes each part ${k} times smaller, so multiply the denominator by ${k}: ${n}/${d * k}${rn !== n || rd !== d * k ? `, which simplifies to ${f.str}` : ""}.` };
});

const files = {
  "place-value": mk("pv", "place-value", pv),
  "add-subtract": mk("as", "add-subtract", as),
  multiplication: mk("mul", "multiplication", mul),
  division: mk("div", "division", div),
  "long-multiplication": mk("lm", "long-multiplication", lm),
  "long-division": mk("ld", "long-division", ld),
  "fractions-add-subtract": mk("fas", "fractions-add-subtract", fr),
  "fractions-multiply": mk("fmu", "fractions-multiply", fmul),
  "fractions-divide": mk("fdv", "fractions-divide", fdiv),
};
for (const [name, qs] of Object.entries(files)) {
  writeFileSync(`content/questions/${name}.json`, "[\n" + qs.map((q) => " " + JSON.stringify(q)).join(",\n") + "\n]\n");
}
console.log("Wrote", Object.keys(files).join(", "));
