import type { Question } from "./types";

// Question generators: every call produces fresh numbers, and the answer is COMPUTED
// from them (never typed by hand). A generated question is fully described by
// (topic, seed, difficulty), so its id can be turned back into the same question later.

export type Difficulty = 1 | 2 | 3;
export type PaperKind = "arithmetic" | "reasoning";

type Rand = { next(): number; int(a: number, b: number): number; pick<T>(items: T[]): T };

function makeRng(seed: string): Rand {
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

type Draft = {
  paper: PaperKind;
  marks?: number;
  format?: "numeric" | "fraction";
  prompt: string;
  answer: string | number;
  acceptable?: string[];
  unit?: string;
  explanation: string;
};
type Gen = (r: Rand, d: Difficulty) => Draft;

const fmt = (n: number) => n.toLocaleString("en-GB");
const clean = (x: number) => String(Math.round(x * 1e6) / 1e6);
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const gbp = (cents: number) => `£${(cents / 100).toFixed(2)}`;
const centsStr = (cents: number) => (cents / 100).toFixed(2);

// ---------- fraction helpers ----------
function simplest(n: number, d: number) {
  const g = gcd(n, d);
  n /= g;
  d /= g;
  const w = Math.floor(n / d);
  const r = n % d;
  const str = r === 0 ? `${w}` : w === 0 ? `${r}/${d}` : `${w} ${r}/${d}`;
  return { str, improper: r === 0 ? null : `${n}/${d}`, n, d };
}
const mixedText = (w: number, n: number, d: number) => (w ? `${w} ${n}/${d}` : `${n}/${d}`);
const fracDraft = (prompt: string, n: number, d: number, explanation: string): Draft => {
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

// ---------- topic generators ----------
const placeValue: Gen = (r, d) => {
  const digits = d === 1 ? r.int(4, 5) : d === 2 ? r.int(5, 6) : r.int(6, 7);
  const lo = 10 ** (digits - 1);
  const n = r.int(lo, lo * 10 - 1);
  const kind = r.int(0, 2);
  if (kind === 0) {
    const amount = r.pick([10, 100, 1000, 10000, 100000].filter((a) => a * 10 <= n));
    const up = r.next() < 0.5;
    const ans = up ? n + amount : n - amount;
    return { paper: "reasoning", prompt: `What is ${fmt(amount)} ${up ? "more" : "less"} than ${fmt(n)}?`, answer: ans,
      explanation: `${up ? "Add" : "Subtract"} ${fmt(amount)}: ${fmt(n)} ${up ? "+" : "−"} ${fmt(amount)} = ${fmt(ans)}.` };
  }
  if (kind === 1) {
    const to = r.pick([10, 100, 1000, 10000].filter((t) => t * 10 <= n));
    const ans = Math.round(n / to) * to;
    return { paper: "reasoning", prompt: `Round ${fmt(n)} to the nearest ${fmt(to)}.`, answer: ans,
      explanation: `Look at the digit to the right of the ${fmt(to)} column to decide whether to round up or down. The answer is ${fmt(ans)}.` };
  }
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = r.int(0, i);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  if (pool[0] === 0) [pool[0], pool[1]] = [pool[1], pool[0]];
  const ds = pool.slice(0, digits);
  const num = Number(ds.join(""));
  const idx = r.pick(ds.map((x, i) => (x !== 0 ? i : -1)).filter((i) => i >= 0));
  const power = 10 ** (digits - 1 - idx);
  return { paper: "reasoning", prompt: `What is the value of the digit ${ds[idx]} in ${fmt(num)}? (Write the number)`, answer: ds[idx] * power,
    explanation: `The ${ds[idx]} is in the ${fmt(power)}s column, so its value is ${fmt(ds[idx] * power)}.` };
};

const addSubtract: Gen = (r, d) => {
  const digits = d === 1 ? 4 : d === 2 ? 5 : r.int(6, 7);
  const dec = d >= 2 && r.next() < 0.35;
  const hi = 10 ** digits - 1;
  let a = r.int(10 ** (digits - 1), hi);
  let b = r.int(10 ** (digits - 2), hi);
  const add = r.next() < 0.5;
  if (!add && b > a) [a, b] = [b, a];
  if (dec) {
    a = r.int(100, 9999);
    b = r.int(100, 9999);
    if (!add && b > a) [a, b] = [b, a];
    const ans = add ? a + b : a - b;
    return { paper: "arithmetic", prompt: `${(a / 100).toFixed(2)} ${add ? "+" : "−"} ${(b / 100).toFixed(2)} =`, answer: clean(ans / 100),
      explanation: `Line up the decimal points and use the column method. The answer is ${clean(ans / 100)}.` };
  }
  const ans = add ? a + b : a - b;
  return { paper: "arithmetic", prompt: `${fmt(a)} ${add ? "+" : "−"} ${fmt(b)} =`, answer: ans,
    explanation: `Use the column method, lining up place values. The answer is ${fmt(ans)}.` };
};

const multiplication: Gen = (r, d) => {
  if (d === 1) {
    const a = r.int(2, 12), b = r.int(2, 12);
    return { paper: "arithmetic", prompt: `${a} × ${b} =`, answer: a * b, explanation: `${a} × ${b} = ${a * b}.` };
  }
  if (d === 2 && r.next() < 0.4) {
    const p = r.pick([10, 100]);
    const n = r.int(12, 999);
    return { paper: "arithmetic", prompt: `${fmt(n)} × ${p} =`, answer: n * p, explanation: `Multiplying by ${p} moves every digit ${p === 10 ? "one place" : "two places"} left: ${fmt(n * p)}.` };
  }
  if (d === 3 && r.next() < 0.5) {
    const p = r.pick([10, 100, 1000]);
    const n = r.int(11, 999) / 10;
    return { paper: "arithmetic", prompt: `${n} × ${fmt(p)} =`, answer: clean(n * p), explanation: `Multiplying by ${fmt(p)} moves the digits ${String(p).length - 1} place(s) left: ${clean(n * p)}.` };
  }
  const a = r.int(d === 2 ? 1000 : 2000, 9999), b = r.int(2, 9);
  return { paper: "arithmetic", prompt: `${fmt(a)} × ${b} =`, answer: a * b, explanation: `Short multiplication: ${fmt(a)} × ${b} = ${fmt(a * b)}.` };
};

const division: Gen = (r, d) => {
  if (d === 1) {
    const b = r.int(2, 12), q = r.int(2, 12);
    return { paper: "arithmetic", prompt: `${b * q} ÷ ${b} =`, answer: q, explanation: `${b} × ${q} = ${b * q}, so ${b * q} ÷ ${b} = ${q}.` };
  }
  if (d === 3 && r.next() < 0.35) {
    const k = r.pick([2, 4, 8]);
    const q = r.int(3, 40);
    const n = k * q + k / 2;
    return { paper: "arithmetic", prompt: `${n} ÷ ${k} =`, answer: clean(n / k), explanation: `${k} × ${q} = ${k * q}, and the remainder ${k / 2} ÷ ${k} = 0.5. The answer is ${clean(n / k)}.` };
  }
  const k = r.int(d === 2 ? 3 : 6, 9);
  const q = r.int(d === 2 ? 100 : 400, 1200);
  return { paper: "arithmetic", prompt: `${fmt(k * q)} ÷ ${k} =`, answer: q, explanation: `Short division: ${fmt(k * q)} ÷ ${k} = ${fmt(q)}. Check: ${fmt(q)} × ${k} = ${fmt(k * q)}.` };
};

const longMultiplication: Gen = (r, d) => {
  const a = d === 3 ? r.int(1000, 6999) : r.int(100, 999);
  const b = d === 1 ? r.int(11, 25) : r.int(26, 59);
  const tens = Math.floor(b / 10) * 10;
  return { paper: "arithmetic", marks: 2, prompt: `${fmt(a)} × ${b} =`, answer: a * b,
    explanation: `${fmt(a)} × ${tens} = ${fmt(a * tens)} and ${fmt(a)} × ${b % 10} = ${fmt(a * (b % 10))}. Add them: ${fmt(a * b)}.` };
};

const longDivision: Gen = (r, d) => {
  const b = d === 1 ? r.int(12, 18) : r.int(15, 45);
  const q = d === 1 ? r.int(15, 60) : r.int(30, 199);
  return { paper: "arithmetic", marks: 2, prompt: `${fmt(b * q)} ÷ ${b} =`, answer: q, explanation: `Long division gives ${fmt(q)}. Check: ${fmt(q)} × ${b} = ${fmt(b * q)}.` };
};

const fracAddSub: Gen = (r, d) => {
  const pairs = d === 1 ? [[2, 4], [5, 10], [3, 6], [4, 8], [2, 2], [3, 3]] : d === 2 ? [[2, 4], [3, 6], [5, 10], [4, 8], [2, 6], [3, 9], [5, 5]] : [[4, 6], [2, 3], [3, 4], [6, 8], [4, 8], [2, 5], [3, 5]];
  const [ad, bd] = r.pick(pairs);
  const mk = (den: number) => r.int(1, Math.max(1, den - 1));
  const aw = d === 1 ? 0 : r.int(0, d === 2 ? 2 : 5);
  const bw = d === 1 ? 0 : r.int(0, d === 2 ? 1 : 3);
  let an = mk(ad), bn = mk(bd);
  if (ad === 2 && an > 1) an = 1;
  if (bd === 2 && bn > 1) bn = 1;
  let add = d === 1 ? r.next() < 0.7 : r.next() < 0.5;
  const D = (ad * bd) / gcd(ad, bd);
  const A = (aw * ad + an) * (D / ad), B = (bw * bd + bn) * (D / bd);
  if (!add && A <= B) add = true;
  const res = add ? A + B : A - B;
  const aT = mixedText(aw, an, ad), bT = mixedText(bw, bn, bd);
  return fracDraft(`${aT} ${add ? "+" : "−"} ${bT} =`, res, D,
    `Use a common denominator of ${D}: ${A}/${D} ${add ? "+" : "−"} ${B}/${D} = ${res}/${D}.`);
};

const fracMultiply: Gen = (r, d) => {
  const kind = d === 3 ? r.pick([0, 2, 3]) : r.pick([0, 1, 2]); // 0 frac×frac, 1 frac×whole, 2 fraction of amount, 3 mixed×whole
  if (kind === 2) {
    const den = r.pick([2, 3, 4, 5, 8, 10]);
    const n = r.int(1, den - 1);
    const q = r.int(2, 12);
    const amount = den * q;
    return { paper: "arithmetic", prompt: `${n}/${den} of ${amount} =`, answer: q * n,
      explanation: `Find 1/${den} first: ${amount} ÷ ${den} = ${q}. Then multiply by ${n}: ${q} × ${n} = ${q * n}.` };
  }
  if (kind === 0) {
    const ad = r.int(2, 9), bd = r.int(2, 9);
    const an = r.int(1, ad - 1), bn = r.int(1, bd - 1);
    return fracDraft(`${an}/${ad} × ${bn}/${bd} =`, an * bn, ad * bd,
      `Multiply the numerators (${an} × ${bn} = ${an * bn}) and the denominators (${ad} × ${bd} = ${ad * bd}): ${an * bn}/${ad * bd}.`);
  }
  if (kind === 1) {
    const den = r.int(3, 10);
    const n = r.int(1, den - 1);
    const k = r.int(2, 9);
    return fracDraft(`${n}/${den} × ${k} =`, n * k, den,
      `Multiply the numerator by ${k}: ${n} × ${k} = ${n * k}, so the answer is ${n * k}/${den}.`);
  }
  const w = r.int(1, 4), den = r.pick([2, 3, 4, 5]);
  const n = r.int(1, den - 1);
  const k = r.int(2, 6);
  return fracDraft(`${w} ${n}/${den} × ${k} =`, (w * den + n) * k, den,
    `Change ${w} ${n}/${den} to ${w * den + n}/${den}. Then ${w * den + n} × ${k} = ${(w * den + n) * k}, giving ${(w * den + n) * k}/${den}.`);
};

const fracDivide: Gen = (r, d) => {
  const den = d === 1 ? r.pick([2, 3, 4, 5]) : r.int(2, 12);
  const n = r.int(1, den - 1);
  const k = d === 1 ? r.int(2, 4) : r.int(2, d === 2 ? 6 : 9);
  return fracDraft(`${n}/${den} ÷ ${k} =`, n, den * k,
    `Dividing by ${k} makes each part ${k} times smaller, so multiply the denominator by ${k}: ${n}/${den * k}.`);
};

const percentages: Gen = (r, d) => {
  const pcts = d === 1 ? [10, 50, 25, 20] : d === 2 ? [5, 15, 30, 40, 75] : [19, 65, 35, 45, 12, 8, 95];
  const p = r.pick(pcts);
  const step = 100 / gcd(p, 100);
  const maxN = d === 3 ? 3000 : 600;
  const n = step * r.int(Math.max(1, Math.ceil(40 / step)), Math.max(2, Math.floor(maxN / step)));
  const part = (n * p) / 100;
  if (r.next() < 0.3 && p !== 8 && p !== 12 && p !== 19) {
    const price = 20 * r.int(2, 15);
    const off = (price * p) / 100;
    if (Number.isInteger(off) && p <= 50)
      return { paper: "reasoning", prompt: `A coat costs £${price}. In a sale it is reduced by ${p}%. What is the sale price?`, answer: price - off, unit: "£",
        explanation: `${p}% of £${price} is £${off}. £${price} − £${off} = £${price - off}.` };
  }
  return { paper: "arithmetic", prompt: `${p}% of ${fmt(n)} =`, answer: part,
    explanation: `${p}% of ${fmt(n)}: 1% is ${clean(n / 100)}, so ${p}% is ${clean(n / 100)} × ${p} = ${clean(part)}.` };
};

const negatives: Gen = (r, d) => {
  const kind = d === 1 ? 0 : r.int(0, 3);
  if (kind === 0) {
    const start = r.int(-9, 6);
    const rise = r.next() < 0.5;
    const amt = rise ? r.int(2, 14) : r.int(2, 12);
    const ans = rise ? start + amt : start - amt;
    return { paper: "reasoning", prompt: `The temperature is ${String(start).replace("-", "−")}°C. It ${rise ? "rises" : "falls"} by ${amt}°C. What is the new temperature in °C?`, answer: ans,
      explanation: `${String(start).replace("-", "−")} ${rise ? "+" : "−"} ${amt} = ${String(ans).replace("-", "−")}.` };
  }
  if (kind === 1) {
    const a = r.int(2, 12), b = r.int(2, 15);
    return { paper: "reasoning", prompt: `The temperature in Oslo is −${a}°C and in Rome it is ${b}°C. How many degrees warmer is Rome?`, answer: a + b,
      explanation: `From −${a} up to 0 is ${a}, then 0 up to ${b} is ${b}. ${a} + ${b} = ${a + b}.` };
  }
  if (kind === 2) {
    const m = r.int(1, 5), n = r.int(m + 2, m + 9);
    return { paper: "reasoning", prompt: `Which number is ${n} less than ${m}?`, answer: m - n,
      explanation: `Count back ${n} from ${m}: ${m} − ${n} = ${String(m - n).replace("-", "−")}.` };
  }
  const depth = r.int(4, 20), up = r.int(2, depth - 1);
  return { paper: "reasoning", prompt: `A diver is ${depth} m below sea level (−${depth}). She swims up ${up} m. What number shows her position now?`, answer: -depth + up,
    explanation: `−${depth} + ${up} = ${String(-depth + up).replace("-", "−")}.` };
};

const orderOps: Gen = (r, d) => {
  const kinds = d === 1 ? [0, 1, 2] : d === 2 ? [1, 2, 3, 4] : [3, 4, 5, 6];
  const k = r.pick(kinds);
  let e: string, ans: number;
  if (k === 0) { const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, 9); e = `${a} + ${b} × ${c}`; ans = a + b * c; }
  else if (k === 1) { const c = r.int(2, 6), q = r.int(2, 9), a = r.int(20, 60); e = `${a} − ${c * q} ÷ ${c}`; ans = a - q; }
  else if (k === 2) { const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, 9); e = `(${a} + ${b}) × ${c}`; ans = (a + b) * c; }
  else if (k === 3) { const s = r.int(2, 9), t = r.int(2, 9), q = r.int(2, 9); e = `${(s + t) * q} ÷ (${s} + ${t})`; ans = q; }
  else if (k === 4) { const n = r.int(3, 9), m = r.int(2, n * n - 1); e = `${n}² − ${m}`; ans = n * n - m; }
  else if (k === 5) { const a = r.int(2, 9), n = r.int(2, 5), c = r.int(2, 5); e = `${a} + ${n}² × ${c}`; ans = a + n * n * c; }
  else { const a = r.int(2, 6), x = r.int(2, 6), y = r.int(2, 6), extra = r.int(5, 30); e = `${a * (x + y) + extra} − ${a} × (${x} + ${y})`; ans = extra; }
  return { paper: "arithmetic", prompt: `${e} =`, answer: ans,
    explanation: `Brackets and powers first, then × and ÷, then + and −. The answer is ${ans}.` };
};

const NAMES = ["Mia", "Sam", "Priya", "Dan", "Aisha", "Leo", "Jo", "Zara"];
const wordProblems: Gen = (r, d) => {
  const name = r.pick(NAMES);
  const kind = d === 1 ? r.int(0, 1) : d === 2 ? r.int(0, 3) : r.int(2, 5);
  if (kind === 0) {
    const n = r.int(2, 8), price = r.int(55, 395);
    return { paper: "reasoning", prompt: `${name} buys ${n} pens at ${gbp(price)} each. How much do they cost altogether?`, answer: centsStr(n * price), unit: "£",
      explanation: `${n} × ${gbp(price)} = ${gbp(n * price)}.` };
  }
  if (kind === 1) {
    const cost = r.int(205, 895), note = cost < 1000 ? 1000 : 2000;
    return { paper: "reasoning", prompt: `A book costs ${gbp(cost)}. ${name} pays with a £${note / 100} note. How much change does ${name} get?`, answer: centsStr(note - cost), unit: "£",
      explanation: `£${note / 100} − ${gbp(cost)} = ${gbp(note - cost)}.` };
  }
  if (kind === 2) {
    const per = r.pick([4, 6, 8]);
    const kids = per * r.int(8, 30) - r.int(1, per - 1);
    const tables = Math.ceil(kids / per);
    return { paper: "reasoning", prompt: `There are ${kids} children and ${per} can sit at each table. How many tables are needed?`, answer: tables,
      explanation: `${kids} ÷ ${per} = ${Math.floor(kids / per)} remainder ${kids % per}, so one more table is needed: ${tables} tables.` };
  }
  if (kind === 3) {
    const n = r.pick([4, 5, 6, 8]), each = r.int(25, 150);
    return { paper: "reasoning", prompt: `A pack of ${n} cakes costs ${gbp(n * each)}. How much does one cake cost, in pounds?`, answer: centsStr(each), unit: "£",
      explanation: `${gbp(n * each)} ÷ ${n} = ${gbp(each)}.` };
  }
  if (kind === 4) {
    const k = r.int(2, 4), pr = r.int(120, 290), extra = r.int(85, 250), total = 2000;
    const spent = k * pr + extra;
    return { paper: "reasoning", prompt: `${name} has £20. ${name} buys ${k} notebooks at ${gbp(pr)} each and a pen for ${gbp(extra)}. How much money is left?`, answer: centsStr(total - spent), unit: "£",
      explanation: `${k} × ${gbp(pr)} = ${gbp(k * pr)}. ${gbp(k * pr)} + ${gbp(extra)} = ${gbp(spent)}. £20 − ${gbp(spent)} = ${gbp(total - spent)}.` };
  }
  const kids = r.int(20, 45), per = r.pick([1250, 1450, 850, 975]);
  return { paper: "reasoning", marks: 2, prompt: `A school trip costs ${gbp(per)} per child. ${kids} children go. What is the total cost in pounds?`, answer: centsStr(kids * per), unit: "£",
    explanation: `${kids} × ${gbp(per)} = ${gbp(kids * per)}.` };
};

const ratio: Gen = (r, d) => {
  const kind = d === 1 ? r.int(0, 1) : d === 2 ? r.int(1, 4) : r.int(3, 6);
  if (kind === 0) {
    const a = r.int(2, 5);
    let b = r.int(1, 5);
    if (b === a) b = a === 5 ? 4 : a + 1;
    const u = r.int(3, 9);
    return { paper: "reasoning", prompt: `In a bag the ratio of red to blue counters is ${a}:${b}. There are ${a * u} red counters. How many blue counters are there?`, answer: b * u,
      explanation: `${a * u} ÷ ${a} = ${u} for each part, so blue = ${b} × ${u} = ${b * u}.` };
  }
  if (kind === 1) {
    const kg = r.pick([2, 4, 5]), price = kg * r.pick([100, 125, 150, 200]), want = kg * r.int(2, 5) + (r.next() < 0.5 ? 0 : kg);
    return { paper: "reasoning", prompt: `${kg} kg of apples cost ${gbp(price)}. How much do ${want} kg cost, in pounds?`, answer: centsStr((price / kg) * want), unit: "£",
      explanation: `1 kg costs ${gbp(price / kg)}. ${want} × ${gbp(price / kg)} = ${gbp((price / kg) * want)}.` };
  }
  if (kind === 2) {
    const people = r.pick([2, 4, 5]), g = people * r.pick([50, 75, 100]), want = people * r.int(2, 4);
    return { paper: "reasoning", prompt: `A recipe for ${people} people uses ${g} g of rice. How many grams are needed for ${want} people?`, answer: (g / people) * want,
      explanation: `${g} ÷ ${people} = ${g / people} g per person. ${g / people} × ${want} = ${(g / people) * want}.` };
  }
  if (kind === 3) {
    const a = r.int(2, 5), b = r.int(a + 1, 7), unit = r.int(3, 9), total = (a + b) * unit;
    return { paper: "reasoning", prompt: `${r.pick(NAMES)} and ${r.pick(["Ben", "Ravi", "Tia"])} share ${total} sweets in the ratio ${a}:${b}. How many sweets does the one with the larger share get?`, answer: b * unit,
      explanation: `${a} + ${b} = ${a + b} parts. ${total} ÷ ${a + b} = ${unit} per part. The larger share is ${b} × ${unit} = ${b * unit}.` };
  }
  if (kind === 4) {
    const k = r.pick([2, 5, 10]), cm = r.int(3, 12) + r.pick([0, 0.5]);
    return { paper: "reasoning", prompt: `A map scale is 1 cm to ${k} km. Two towns are ${cm} cm apart on the map. How many km apart are they really?`, answer: clean(cm * k),
      explanation: `${cm} × ${k} = ${clean(cm * k)}.` };
  }
  const a = r.int(1, 3), b = a + r.int(1, 2), c = b + r.int(1, 2), u = r.int(3, 9), total = (a + b + c) * u;
  return { paper: "reasoning", marks: 2, prompt: `Three friends share £${total} in the ratio ${a}:${b}:${c}. How much does the friend with the largest share get, in pounds?`, answer: c * u, unit: "£",
    explanation: `${a} + ${b} + ${c} = ${a + b + c} parts. £${total} ÷ ${a + b + c} = £${u} per part. The largest share is ${c} × £${u} = £${c * u}.` };
};

const measurement: Gen = (r, d) => {
  const kind = d === 1 ? r.int(0, 3) : d === 2 ? r.int(0, 5) : r.int(4, 7);
  if (kind === 0) { const x = r.int(11, 99) / 10; return { paper: "reasoning", prompt: `How many millimetres are in ${x} cm?`, answer: clean(x * 10), explanation: `1 cm = 10 mm, so ${x} × 10 = ${clean(x * 10)}.` }; }
  if (kind === 1) { const x = r.int(11, 99) / 10; return { paper: "reasoning", prompt: `How many grams are in ${x} kg?`, answer: clean(x * 1000), explanation: `1 kg = 1,000 g, so ${x} × 1,000 = ${fmt(x * 1000)}.` }; }
  if (kind === 2) { const ml = r.int(1, 19) * 50; return { paper: "reasoning", prompt: `How many litres is ${ml} ml? (Write as a decimal)`, answer: clean(ml / 1000), explanation: `1 litre = 1,000 ml, so ${ml} ÷ 1,000 = ${clean(ml / 1000)}.` }; }
  if (kind === 3) { const x = r.int(11, 99) / 10; return { paper: "reasoning", prompt: `A rope is ${x} m long. How many centimetres is that?`, answer: clean(x * 100), explanation: `1 m = 100 cm, so ${x} × 100 = ${clean(x * 100)}.` }; }
  if (kind === 4) { const km = r.int(1, 9), m = r.int(1, 19) * 50; return { paper: "reasoning", prompt: `How many metres are in ${km} km ${m} m?`, answer: km * 1000 + m, explanation: `${km} km = ${fmt(km * 1000)} m. ${fmt(km * 1000)} + ${m} = ${fmt(km * 1000 + m)}.` }; }
  if (kind === 5) { const kg = r.int(11, 39) / 10, used = r.int(2, 9) * 50; const left = Math.round(kg * 1000) - used; return { paper: "reasoning", prompt: `A bag holds ${kg} kg of flour. ${r.pick(NAMES)} uses ${used} g. How many grams are left?`, answer: left, explanation: `${kg} kg = ${fmt(Math.round(kg * 1000))} g. ${fmt(Math.round(kg * 1000))} − ${used} = ${fmt(left)}.` }; }
  if (kind === 6) { const piece = r.pick([20, 25, 40, 50]), n = r.int(4, 12), m = (piece * n) / 100; return { paper: "reasoning", prompt: `A ribbon is ${clean(m)} m long. It is cut into pieces that are each ${piece} cm long. How many pieces are there?`, answer: n, explanation: `${clean(m)} m = ${piece * n} cm. ${piece * n} ÷ ${piece} = ${n}.` }; }
  const litres = r.int(2, 4), cup = r.pick([200, 250]), cups = r.int(2, 5);
  return { paper: "reasoning", marks: 2, prompt: `A jug holds ${litres} litres. ${r.pick(NAMES)} pours out ${cups} cups of ${cup} ml each. How many millilitres are left in the jug?`, answer: litres * 1000 - cups * cup,
    explanation: `${cups} × ${cup} = ${cups * cup} ml poured. ${litres} litres = ${fmt(litres * 1000)} ml. ${fmt(litres * 1000)} − ${cups * cup} = ${fmt(litres * 1000 - cups * cup)}.` };
};

const hhmm = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
const timeGen: Gen = (r, d) => {
  const kind = d === 1 ? r.int(0, 1) : r.int(0, 3);
  if (kind === 0) { const h = r.int(1, 5), m = r.int(1, 11) * 5; return { paper: "reasoning", prompt: `How many minutes are in ${h} hours ${m} minutes?`, answer: h * 60 + m, explanation: `${h} × 60 = ${h * 60}, and ${h * 60} + ${m} = ${h * 60 + m}.` }; }
  if (kind === 1) { const hrs = r.int(2, 8) + r.pick([0, 0.5, 0.25]); return { paper: "reasoning", prompt: `How many hours are in ${clean(hrs * 60)} minutes? (Write as a decimal)`, answer: clean(hrs), explanation: `${clean(hrs * 60)} ÷ 60 = ${clean(hrs)} hours.` }; }
  if (kind === 2) {
    const start = r.int(7 * 12, 18 * 12) * 5, dur = r.int(5, d === 2 ? 20 : 34) * 5;
    return { paper: "reasoning", prompt: `A film starts at ${hhmm(start)} and ends at ${hhmm(start + dur)}. How many minutes long is the film?`, answer: dur,
      explanation: `From ${hhmm(start)} to ${hhmm(start + dur)} is ${Math.floor(dur / 60)} hour${Math.floor(dur / 60) === 1 ? "" : "s"} and ${dur % 60} minutes, which is ${dur} minutes.` };
  }
  const start = r.int(8 * 12, 14 * 12) * 5, dur = r.int(8, 30) * 5, base = Math.floor((start + dur) / 60) * 60 + 60;
  return { paper: "reasoning", marks: 2, prompt: `A bus leaves at ${hhmm(start)}. The journey takes ${Math.floor(dur / 60)} hour${Math.floor(dur / 60) === 1 ? "" : "s"} ${dur % 60} minutes. How many minutes before ${hhmm(base)} does it arrive?`, answer: base - (start + dur),
    explanation: `${hhmm(start)} + ${dur} minutes = ${hhmm(start + dur)}. From ${hhmm(start + dur)} to ${hhmm(base)} is ${base - (start + dur)} minutes.` };
};

const areaPerimeter: Gen = (r, d) => {
  const kind = d === 1 ? r.int(0, 2) : d === 2 ? r.int(1, 5) : r.int(4, 7);
  const l = r.int(5, 15), w = r.int(2, l - 1);
  if (kind === 0) return { paper: "reasoning", prompt: `A rectangle is ${l} cm long and ${w} cm wide. What is its area in cm²?`, answer: l * w, explanation: `Area = length × width = ${l} × ${w} = ${l * w}.` };
  if (kind === 1) return { paper: "reasoning", prompt: `A rectangle is ${l} cm long and ${w} cm wide. What is its perimeter in cm?`, answer: 2 * (l + w), explanation: `Perimeter = 2 × (${l} + ${w}) = ${2 * (l + w)}.` };
  if (kind === 2) return { paper: "reasoning", prompt: `A square has sides of ${w + 2} cm. What is its area in cm²?`, answer: (w + 2) ** 2, explanation: `${w + 2} × ${w + 2} = ${(w + 2) ** 2}.` };
  if (kind === 3) return { paper: "reasoning", prompt: `A rectangle has an area of ${l * w} cm² and is ${l} cm long. How wide is it in cm?`, answer: w, explanation: `Width = area ÷ length = ${l * w} ÷ ${l} = ${w}.` };
  if (kind === 4) return { paper: "reasoning", prompt: `A rectangle has a perimeter of ${2 * (l + w)} cm and is ${l} cm long. How wide is it in cm?`, answer: w, explanation: `Length + width = ${2 * (l + w)} ÷ 2 = ${l + w}. So width = ${l + w} − ${l} = ${w}.` };
  if (kind === 5) { const b = r.int(4, 14) * 2, h = r.int(3, 12); return { paper: "reasoning", prompt: `A triangle has a base of ${b} cm and a height of ${h} cm. What is its area in cm²?`, answer: (b * h) / 2, explanation: `Area = base × height ÷ 2 = ${b} × ${h} ÷ 2 = ${(b * h) / 2}.` }; }
  if (kind === 6) { const b = r.int(6, 20), h = r.int(3, 12); return { paper: "reasoning", prompt: `A parallelogram has a base of ${b} cm and a height of ${h} cm. What is its area in cm²?`, answer: b * h, explanation: `Area = base × height = ${b} × ${h} = ${b * h}.` }; }
  const a1 = r.int(4, 9), a2 = r.int(3, 8), b1 = r.int(2, 5), b2 = r.int(2, 5);
  return { paper: "reasoning", marks: 2, prompt: `An L-shaped room is made from a ${a1} m by ${a2} m rectangle joined to a ${b1} m by ${b2} m rectangle. What is the total area in m²?`, answer: a1 * a2 + b1 * b2,
    explanation: `${a1} × ${a2} = ${a1 * a2} and ${b1} × ${b2} = ${b1 * b2}. ${a1 * a2} + ${b1 * b2} = ${a1 * a2 + b1 * b2}.` };
};

const GENERATORS: Record<string, { gen: Gen; kinds: PaperKind[] }> = {
  "place-value": { gen: placeValue, kinds: ["reasoning"] },
  "add-subtract": { gen: addSubtract, kinds: ["arithmetic"] },
  multiplication: { gen: multiplication, kinds: ["arithmetic"] },
  division: { gen: division, kinds: ["arithmetic"] },
  "long-multiplication": { gen: longMultiplication, kinds: ["arithmetic"] },
  "long-division": { gen: longDivision, kinds: ["arithmetic"] },
  "fractions-add-subtract": { gen: fracAddSub, kinds: ["arithmetic"] },
  "fractions-multiply": { gen: fracMultiply, kinds: ["arithmetic"] },
  "fractions-divide": { gen: fracDivide, kinds: ["arithmetic"] },
  percentages: { gen: percentages, kinds: ["arithmetic", "reasoning"] },
  "negative-numbers": { gen: negatives, kinds: ["reasoning"] },
  "order-of-operations": { gen: orderOps, kinds: ["arithmetic"] },
  "word-problems": { gen: wordProblems, kinds: ["reasoning"] },
  "ratio-proportion": { gen: ratio, kinds: ["reasoning"] },
  measurement: { gen: measurement, kinds: ["reasoning"] },
  time: { gen: timeGen, kinds: ["reasoning"] },
  "area-perimeter": { gen: areaPerimeter, kinds: ["reasoning"] },
};

export const hasGenerator = (topic: string) => topic in GENERATORS;
export const topicKinds = (topic: string): PaperKind[] => GENERATORS[topic]?.kinds ?? [];
export const generatorTopics = () => Object.keys(GENERATORS);
export const randomSeed = () => Math.random().toString(36).slice(2, 8);

export function generateQuestion(topic: string, seed: string, d: Difficulty): Question {
  const g = GENERATORS[topic];
  if (!g) throw new Error(`No generator for ${topic}`);
  const draft = g.gen(makeRng(`${topic}:${seed}:${d}`), d);
  return {
    id: `gen:${topic}:${seed}:${d}`,
    topic,
    paper: draft.paper,
    difficulty: d,
    marks: draft.marks ?? 1,
    format: draft.format ?? "numeric",
    prompt: draft.prompt,
    answer: String(draft.answer),
    ...(draft.acceptable ? { acceptable: draft.acceptable } : {}),
    ...(draft.unit ? { unit: draft.unit } : {}),
    explanation: draft.explanation,
    source: "generated",
    status: "approved",
  };
}

// Rebuild a generated question from its id (used for saved homework). null if not a generated id.
export function questionFromId(id: string): Question | null {
  const m = id.match(/^gen:([a-z-]+):([a-z0-9-]+):([123])$/);
  return m && hasGenerator(m[1]) ? generateQuestion(m[1], m[2], Number(m[3]) as Difficulty) : null;
}

// Keep trying seeds until the question belongs to the wanted paper (some topics make both kinds).
export function generateFor(topic: string, seedBase: string, d: Difficulty, paper?: PaperKind): Question {
  for (let i = 0; i < 80; i++) {
    const q = generateQuestion(topic, i === 0 ? seedBase : `${seedBase}x${i}`, d);
    if (!paper || q.paper === paper) return q;
  }
  return generateQuestion(topic, seedBase, d);
}
