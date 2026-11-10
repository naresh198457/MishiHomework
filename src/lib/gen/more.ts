import { clean, fmt, fracDraft, gcd, type Gen, type PaperKind, type Rand } from "./core.ts";
import type { Figure } from "../types.ts";

// Second batch of generators: charts, diagrams, coordinates, shapes, sequences, algebra, volume...
// Every answer is computed from the numbers used in the question.

const shuffled = <T,>(r: Rand, items: T[]): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = r.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const sum = (xs: number[]) => xs.reduce((n, x) => n + x, 0);
const neg = (n: number) => String(n).replace("-", "−");
const pt = (x: number, y: number) => `${x},${y}`;
const ptText = (x: number, y: number) => `(${neg(x)}, ${neg(y)})`;
const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};

// ---------------- statistics (charts, tables, mean) ----------------
const THEMES = [
  { title: "Pets owned by Year 6", labels: ["Cats", "Dogs", "Fish", "Rabbits", "Birds"], noun: "children" },
  { title: "Favourite fruit", labels: ["Apple", "Banana", "Grape", "Orange", "Pear"], noun: "children" },
  { title: "Books read each day", labels: ["Mon", "Tue", "Wed", "Thu", "Fri"], noun: "books" },
  { title: "Cars passing the school", labels: ["8am", "9am", "10am", "11am", "12pm"], noun: "cars" },
];

const statistics: Gen = (r, d) => {
  const kind = d === 1 ? r.pick([0, 1]) : d === 2 ? r.pick([1, 2, 3, 7]) : r.pick([4, 5, 6, 3]);
  const theme = r.pick(THEMES);
  const scale = r.pick([1, 2, 5]);
  const values = theme.labels.map(() => r.int(2, 18) * scale);
  const bar: Figure = { type: "bar", title: theme.title, labels: theme.labels, values, yLabel: theme.noun };

  if (kind === 0) {
    const i = r.int(0, 4);
    return { paper: "reasoning", figure: bar, prompt: `Look at the bar chart. How many ${theme.noun} are shown for ${theme.labels[i]}?`, answer: values[i],
      explanation: `Read across from the top of the ${theme.labels[i]} bar to the side scale: ${values[i]}.` };
  }
  if (kind === 1) {
    let i = r.int(0, 4), j = (i + r.int(1, 4)) % 5;
    if (values[i] === values[j]) values[j] += scale;
    if (values[i] < values[j]) [i, j] = [j, i];
    return { paper: "reasoning", figure: { ...bar, values }, prompt: `How many more ${theme.noun} are shown for ${theme.labels[i]} than for ${theme.labels[j]}?`, answer: values[i] - values[j],
      explanation: `${theme.labels[i]} is ${values[i]} and ${theme.labels[j]} is ${values[j]}. ${values[i]} − ${values[j]} = ${values[i] - values[j]}.` };
  }
  if (kind === 2) {
    const items = shuffled(r, ["Pencils", "Rubbers", "Rulers", "Pens", "Books"]).slice(0, 4);
    const sold = items.map(() => r.int(6, 60));
    return { paper: "reasoning", figure: { type: "table", headers: ["Item", "Number sold"], rows: items.map((n, i) => [n, sold[i]]) },
      prompt: "The table shows items sold in the school shop. How many items were sold altogether?", answer: sum(sold),
      explanation: `${sold.join(" + ")} = ${sum(sold)}.` };
  }
  if (kind === 3) {
    const times = ["9am", "10am", "11am", "12pm", "1pm"];
    const temps = [r.int(6, 14)];
    for (let i = 1; i < 5; i++) temps.push(temps[i - 1] + r.int(1, 4));
    const i = r.int(0, 1), j = r.int(3, 4);
    return { paper: "reasoning", figure: { type: "line", title: "Temperature during the day", labels: times, values: temps, yLabel: "°C" },
      prompt: `The line graph shows the temperature. By how many degrees did it rise between ${times[i]} and ${times[j]}?`, answer: temps[j] - temps[i],
      explanation: `At ${times[i]} it was ${temps[i]}°C and at ${times[j]} it was ${temps[j]}°C. ${temps[j]} − ${temps[i]} = ${temps[j] - temps[i]}.` };
  }
  if (kind === 4) {
    const c = r.int(4, 6), m = r.int(5, 30);
    const offs = Array.from({ length: c - 1 }, () => r.int(-4, 4));
    offs.push(-sum(offs));
    const nums = offs.map((o) => m + o);
    if (nums.some((n) => n < 1)) return statistics(r, d);
    return { paper: "reasoning", prompt: `What is the mean of ${nums.join(", ")}?`, answer: m,
      explanation: `Add the numbers: ${nums.join(" + ")} = ${sum(nums)}. Divide by ${c}: ${sum(nums)} ÷ ${c} = ${m}.` };
  }
  if (kind === 5) {
    const parts = shuffled(r, [10, 15, 20, 25, 30, 35, 40, 45, 50]);
    const slices: number[] = [];
    let left = 100;
    for (let i = 0; i < 3; i++) {
      const choices = parts.filter((p) => p <= left - 10 * (3 - i));
      const v = r.pick(choices.length ? choices : [10]);
      slices.push(v);
      left -= v;
    }
    slices.push(left);
    if (slices.some((s) => s <= 0)) return statistics(r, d);
    const labels = ["Walk", "Bus", "Car", "Bike"];
    if (r.next() < 0.5) {
      const total = r.pick([40, 60, 80, 100, 120, 200]);
      const i = r.int(0, 3);
      return { paper: "reasoning", figure: { type: "pie", title: "How children travel to school", slices: labels.map((l, k) => ({ label: l, value: slices[k] })) },
        prompt: `${total} children were asked how they travel to school. How many children travel by ${labels[i].toLowerCase()}?`, answer: (total * slices[i]) / 100,
        explanation: `${slices[i]}% of ${total} = ${total} ÷ 100 × ${slices[i]} = ${(total * slices[i]) / 100}.` };
    }
    const i = r.int(0, 3);
    return { paper: "reasoning", figure: { type: "pie", title: "How children travel to school", slices: labels.map((l, k) => ({ label: l, value: k === i ? null : slices[k] })) },
      prompt: `The pie chart shows how children travel to school. What percentage travel by ${labels[i].toLowerCase()}? (Answer as a number)`, answer: slices[i],
      explanation: `A whole pie is 100%. The others add up to ${100 - slices[i]}%, so ${labels[i]} = 100 − ${100 - slices[i]} = ${slices[i]}%.` };
  }
  if (kind === 6) {
    const c = r.int(4, 6), m = r.int(6, 20);
    const known = Array.from({ length: c - 1 }, () => m + r.int(-3, 3));
    const last = c * m - sum(known);
    if (last < 1) return statistics(r, d);
    return { paper: "reasoning", marks: 2, prompt: `The mean of ${c} numbers is ${m}. ${c - 1} of the numbers are ${known.join(", ")}. What is the other number?`, answer: last,
      explanation: `The total must be ${c} × ${m} = ${c * m}. The known numbers add to ${sum(known)}, so the missing number is ${c * m} − ${sum(known)} = ${last}.` };
  }
  return { paper: "reasoning", figure: bar, prompt: `How many ${theme.noun} are shown altogether in the bar chart?`, answer: sum(values),
    explanation: `${values.join(" + ")} = ${sum(values)}.` };
};

// ---------------- angles ----------------
const angles: Gen = (r, d) => {
  const kind = d === 1 ? r.pick([0, 1]) : d === 2 ? r.pick([0, 1, 2, 3]) : r.pick([2, 3, 4, 5]);
  if (kind === 0) {
    const a = r.int(2, 14) * 5, b = r.int(2, Math.floor((170 - a) / 5)) * 5;
    const c = 180 - a - b;
    if (c < 10) return angles(r, d);
    const hide = r.int(0, 2);
    const all = [a, b, c];
    return { paper: "reasoning", figure: { type: "triangle", angles: all.map((x, i) => (i === hide ? null : x)) },
      prompt: "Work out the size of the angle marked ? in the triangle. (Answer in degrees)", answer: all[hide],
      explanation: `Angles in a triangle add up to 180°. The other two are ${all.filter((_, i) => i !== hide).join("° and ")}°, so ? = 180 − ${sum(all.filter((_, i) => i !== hide))} = ${all[hide]}.` };
  }
  if (kind === 1) {
    const a = r.int(2, 34) * 5, b = 180 - a;
    return { paper: "reasoning", figure: { type: "straight", angles: [a, null] }, prompt: "Angles on a straight line add up to 180°. Work out the size of the angle marked ?.", answer: b,
      explanation: `180 − ${a} = ${b}.` };
  }
  if (kind === 2) {
    const a = r.int(3, 18) * 5, b = r.int(3, 18) * 5, c = 180 - a - b;
    if (c < 15) return angles(r, d);
    return { paper: "reasoning", figure: { type: "straight", angles: [a, null, b] }, prompt: "These angles are on a straight line. Work out the size of the angle marked ?.", answer: c,
      explanation: `Angles on a straight line add up to 180°. ${a} + ${b} = ${a + b}, so ? = 180 − ${a + b} = ${c}.` };
  }
  if (kind === 3) {
    const a = r.int(4, 20) * 5, b = r.int(4, 20) * 5, c = 360 - a - b - r.int(4, 20) * 5;
    const x = 360 - a - b - c;
    if (x < 15 || c < 15) return angles(r, d);
    return { paper: "reasoning", figure: { type: "point", angles: [a, b, c, null] }, prompt: "Angles around a point add up to 360°. Work out the size of the angle marked ?.", answer: x,
      explanation: `${a} + ${b} + ${c} = ${a + b + c}. 360 − ${a + b + c} = ${x}.` };
  }
  if (kind === 4) {
    const a = r.int(5, 20) * 5, b = r.int(5, 20) * 5, c = r.int(4, 22) * 5;
    const x = 360 - a - b - c;
    if (x < 20) return angles(r, d);
    return { paper: "reasoning", prompt: `Three angles of a quadrilateral are ${a}°, ${b}° and ${c}°. What is the fourth angle in degrees?`, answer: x,
      explanation: `Angles in a quadrilateral add up to 360°. ${a} + ${b} + ${c} = ${a + b + c}, so the fourth angle is 360 − ${a + b + c} = ${x}.` };
  }
  const apex = r.int(5, 16) * 10;
  return { paper: "reasoning", marks: 2, prompt: `An isosceles triangle has an angle of ${apex}° between its two equal sides. What size is each of the other two angles, in degrees?`, answer: (180 - apex) / 2,
    explanation: `180 − ${apex} = ${180 - apex}. The two equal angles share this: ${180 - apex} ÷ 2 = ${(180 - apex) / 2}.` };
};

// ---------------- coordinates (grid, plotting, translation, reflection) ----------------
const coordinates: Gen = (r, d) => {
  const lim = 6;
  const lo = d === 1 ? 0 : -lim;
  const c = () => r.int(lo, lim);
  const kind = d === 1 ? r.pick([0, 1]) : d === 2 ? r.pick([0, 1, 2]) : r.pick([2, 3, 4]);
  const grid = (points: { x: number; y: number; label: string }[], plot = false): Figure => ({ type: "grid", min: lo, max: lim, points, plot });
  if (kind === 0) {
    const x = c(), y = c();
    return { paper: "reasoning", format: "coordinate", figure: grid([{ x, y, label: "A" }]), prompt: "What are the coordinates of point A?", answer: pt(x, y),
      explanation: `Go across to ${neg(x)} on the x-axis, then up/down to ${neg(y)} on the y-axis: ${ptText(x, y)}.` };
  }
  if (kind === 1) {
    const x = c(), y = c();
    return { paper: "reasoning", format: "plot", figure: grid([], true), prompt: `Plot the point ${ptText(x, y)} on the grid.`, answer: pt(x, y),
      explanation: `Start at the origin, go ${x >= 0 ? "right" : "left"} ${Math.abs(x)}, then ${y >= 0 ? "up" : "down"} ${Math.abs(y)}.` };
  }
  if (kind === 2) {
    const x = r.int(-3, 3), y = r.int(-3, 3);
    const dx = r.int(-3, 3), dy = r.int(-3, 3);
    if (dx === 0 && dy === 0) return coordinates(r, d);
    const dirX = dx === 0 ? "" : `${Math.abs(dx)} ${dx > 0 ? "right" : "left"}`;
    const dirY = dy === 0 ? "" : `${Math.abs(dy)} ${dy > 0 ? "up" : "down"}`;
    const how = [dirX, dirY].filter(Boolean).join(" and ");
    return { paper: "reasoning", format: "coordinate", figure: grid([{ x, y, label: "A" }]), prompt: `Point A is at ${ptText(x, y)}. It is translated ${how}. What are the new coordinates?`, answer: pt(x + dx, y + dy),
      explanation: `x: ${neg(x)} ${dx >= 0 ? "+" : "−"} ${Math.abs(dx)} = ${neg(x + dx)}. y: ${neg(y)} ${dy >= 0 ? "+" : "−"} ${Math.abs(dy)} = ${neg(y + dy)}. The new point is ${ptText(x + dx, y + dy)}.` };
  }
  if (kind === 3) {
    const x = r.int(1, 5) * (r.next() < 0.5 ? 1 : -1), y = r.int(1, 5) * (r.next() < 0.5 ? 1 : -1);
    const axis = r.pick(["x", "y"]);
    const [nx, ny] = axis === "y" ? [-x, y] : [x, -y];
    return { paper: "reasoning", format: "coordinate", figure: grid([{ x, y, label: "A" }]), prompt: `Point A is at ${ptText(x, y)}. It is reflected in the ${axis}-axis. What are the coordinates of the reflection?`, answer: pt(nx, ny),
      explanation: `Reflecting in the ${axis}-axis ${axis === "y" ? "changes the sign of the x-coordinate" : "changes the sign of the y-coordinate"}: ${ptText(nx, ny)}.` };
  }
  const x1 = r.int(-5, 0), y1 = r.int(-5, 0), w = r.int(2, 5), h = r.int(2, 5);
  return { paper: "reasoning", marks: 2, format: "coordinate",
    figure: grid([{ x: x1, y: y1, label: "A" }, { x: x1 + w, y: y1, label: "B" }, { x: x1 + w, y: y1 + h, label: "C" }]),
    prompt: `A, B and C are three corners of a rectangle ABCD. What are the coordinates of D?`, answer: pt(x1, y1 + h),
    explanation: `D is directly above A and level with C, so it has the x-coordinate of A (${neg(x1)}) and the y-coordinate of C (${neg(y1 + h)}): ${ptText(x1, y1 + h)}.` };
};

// ---------------- shape properties (multiple choice + counting) ----------------
type Shape2 = { name: string; sides: number; parallel: number; right: number; symmetry: number };
const SHAPES2: Shape2[] = [
  { name: "Square", sides: 4, parallel: 2, right: 4, symmetry: 4 },
  { name: "Rectangle", sides: 4, parallel: 2, right: 4, symmetry: 2 },
  { name: "Rhombus", sides: 4, parallel: 2, right: 0, symmetry: 2 },
  { name: "Parallelogram", sides: 4, parallel: 2, right: 0, symmetry: 0 },
  { name: "Kite", sides: 4, parallel: 0, right: 0, symmetry: 1 },
  { name: "Equilateral triangle", sides: 3, parallel: 0, right: 0, symmetry: 3 },
  { name: "Right-angled triangle", sides: 3, parallel: 0, right: 1, symmetry: 0 },
  { name: "Regular pentagon", sides: 5, parallel: 0, right: 0, symmetry: 5 },
  { name: "Regular hexagon", sides: 6, parallel: 3, right: 0, symmetry: 6 },
];
const SOLIDS = [
  { name: "cube", faces: 6, edges: 12, vertices: 8 },
  { name: "cuboid", faces: 6, edges: 12, vertices: 8 },
  { name: "triangular prism", faces: 5, edges: 9, vertices: 6 },
  { name: "square-based pyramid", faces: 5, edges: 8, vertices: 5 },
  { name: "tetrahedron", faces: 4, edges: 6, vertices: 4 },
  { name: "pentagonal prism", faces: 7, edges: 15, vertices: 10 },
];

const shapeProps: Gen = (r, d) => {
  const kind = d === 1 ? r.pick([0, 1]) : d === 2 ? r.pick([1, 2, 3]) : r.pick([2, 3, 4]);
  if (kind === 0) {
    const s = r.pick(SHAPES2.filter((x) => x.symmetry > 0));
    return { paper: "reasoning", prompt: `How many lines of symmetry does a ${s.name.toLowerCase()} have?`, answer: s.symmetry,
      explanation: `A ${s.name.toLowerCase()} has ${s.symmetry} line${s.symmetry === 1 ? "" : "s"} of symmetry.` };
  }
  if (kind === 1) {
    const s = r.pick(SOLIDS), prop = r.pick(["faces", "edges", "vertices"] as const);
    return { paper: "reasoning", prompt: `How many ${prop} does a ${s.name} have?`, answer: s[prop], explanation: `A ${s.name} has ${s.faces} faces, ${s.edges} edges and ${s.vertices} vertices.` };
  }
  // choice: exactly one option has the property
  const props = [
    { key: "symmetry" as const, test: (s: Shape2) => s.symmetry === 0, text: "has no lines of symmetry" },
    { key: "right" as const, test: (s: Shape2) => s.right === 4, text: "has four right angles" },
    { key: "parallel" as const, test: (s: Shape2) => s.parallel === 0, text: "has no parallel sides" },
    { key: "sides" as const, test: (s: Shape2) => s.sides === 5, text: "has exactly 5 sides" },
    { key: "symmetry" as const, test: (s: Shape2) => s.symmetry === 1, text: "has exactly one line of symmetry" },
    { key: "right" as const, test: (s: Shape2) => s.right === 1, text: "has exactly one right angle" },
  ];
  const p = r.pick(props);
  const yes = SHAPES2.filter(p.test), no = SHAPES2.filter((s) => !p.test(s));
  const right = r.pick(yes);
  const others = shuffled(r, no).slice(0, 3);
  if (yes.length > 1 && others.some(p.test)) return shapeProps(r, d);
  // Only keep the question when the answer is unique among the options shown
  const options = shuffled(r, [right, ...others]).map((s) => s.name);
  return { paper: "reasoning", format: "choice", options, prompt: `Which of these shapes ${p.text}?`, answer: right.name,
    explanation: `The ${right.name.toLowerCase()} ${p.text}. The others do not.` };
};

// ---------------- sequences, multiples, factors, primes ----------------
const sequences: Gen = (r, d) => {
  const kind = d === 1 ? r.pick([0, 1, 2]) : d === 2 ? r.pick([2, 3, 4, 5]) : r.pick([4, 5, 6, 7, 8]);
  if (kind === 0) {
    const step = r.int(2, 9), a = r.int(1, 20), seq = [0, 1, 2, 3].map((i) => a + step * i);
    return { paper: "reasoning", prompt: `What is the next number in the sequence ${seq.join(", ")}, ...?`, answer: seq[3] + step,
      explanation: `The sequence goes up by ${step} each time. ${seq[3]} + ${step} = ${seq[3] + step}.` };
  }
  if (kind === 1) {
    const step = r.int(2, 8), a = r.int(40, 90), seq = [0, 1, 2, 3].map((i) => a - step * i);
    return { paper: "reasoning", prompt: `What is the next number in the sequence ${seq.join(", ")}, ...?`, answer: seq[3] - step,
      explanation: `The sequence goes down by ${step} each time. ${seq[3]} − ${step} = ${seq[3] - step}.` };
  }
  if (kind === 2) {
    const n = r.int(3, 12), k = r.int(4, 12);
    return { paper: "reasoning", prompt: `What is the ${k}th multiple of ${n}?`, answer: n * k, explanation: `${k} × ${n} = ${n * k}.` };
  }
  if (kind === 3) {
    const step = r.int(3, 9), a = r.int(2, 15), seq = [0, 1, 2, 3, 4].map((i) => a + step * i), hide = r.int(1, 3);
    return { paper: "reasoning", prompt: `Find the missing number in the sequence ${seq.map((x, i) => (i === hide ? "?" : x)).join(", ")}.`, answer: seq[hide],
      explanation: `The sequence goes up by ${step} each time, so the missing number is ${seq[hide]}.` };
  }
  if (kind === 4) {
    const n = r.pick([12, 16, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 60]);
    let count = 0;
    for (let i = 1; i <= n; i++) if (n % i === 0) count++;
    const list = Array.from({ length: n }, (_, i) => i + 1).filter((i) => n % i === 0);
    return { paper: "reasoning", prompt: `How many factors does ${n} have?`, answer: count, explanation: `The factors of ${n} are ${list.join(", ")}. That is ${count} factors.` };
  }
  if (kind === 5) {
    const primes = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
    const composites = Array.from({ length: 90 }, (_, i) => i + 10).filter((n) => !isPrime(n) && n % 2 === 1 && n > 20);
    const p = r.pick(primes);
    const others = shuffled(r, composites).slice(0, 3);
    return { paper: "reasoning", format: "choice", options: shuffled(r, [p, ...others]).map(String), prompt: "Which of these numbers is a prime number?", answer: String(p),
      explanation: `${p} can only be divided by 1 and itself. ${others.map((o) => `${o} = ${[3, 5, 7, 9, 11, 13].find((f) => o % f === 0)} × ${o / ([3, 5, 7, 9, 11, 13].find((f) => o % f === 0) ?? 1)}`).join(", ")}.` };
  }
  if (kind === 6) {
    const a = r.pick([4, 6, 8, 9, 10, 12]), b = r.pick([3, 5, 6, 8, 15]);
    if (a === b || a % b === 0 || b % a === 0) return sequences(r, d);
    const l = (a * b) / gcd(a, b);
    return { paper: "reasoning", prompt: `What is the lowest common multiple of ${a} and ${b}?`, answer: l, explanation: `Multiples of ${a} and ${b}: the first number in both lists is ${l}.` };
  }
  if (kind === 7) {
    const g = r.pick([2, 3, 4, 5, 6]), a = g * r.int(2, 5), b = g * r.int(2, 6);
    if (a === b || gcd(a, b) !== g) return sequences(r, d);
    return { paper: "reasoning", prompt: `What is the highest common factor of ${a} and ${b}?`, answer: g, explanation: `The biggest number that divides exactly into both ${a} and ${b} is ${g}.` };
  }
  const n = r.int(6, 15);
  return { paper: "reasoning", prompt: `What is ${n}²? (${n} squared)`, answer: n * n, explanation: `${n} × ${n} = ${n * n}.` };
};

// ---------------- equivalent fractions, simplifying, mixed numbers ----------------
const fractionsEquivalent: Gen = (r, d) => {
  const kind = d === 1 ? r.pick([0, 1]) : d === 2 ? r.pick([0, 1, 2, 3]) : r.pick([2, 3, 4, 0]);
  const den = r.int(3, 12), num = r.int(1, den - 1);
  const g = gcd(num, den), bn = num / g, bd = den / g;
  if (kind === 0) {
    const k = r.int(2, 6);
    return { ...fracDraft(`Simplify ${bn * k}/${bd * k}.`, bn * k, bd * k, `Divide the top and bottom by ${k}: ${bn}/${bd}.`), paper: "arithmetic" as PaperKind };
  }
  if (kind === 1) {
    const k = r.int(2, 8);
    return { paper: "arithmetic", prompt: `Fill in the missing number: ${bn}/${bd} = ■/${bd * k}`, answer: bn * k,
      explanation: `${bd} × ${k} = ${bd * k}, so multiply the top by ${k} too: ${bn} × ${k} = ${bn * k}.` };
  }
  if (kind === 2) {
    const d2 = r.int(3, 9), whole = r.int(1, 6), rem = r.int(1, d2 - 1), top = whole * d2 + rem;
    return { paper: "arithmetic", format: "fraction", prompt: `Write ${top}/${d2} as a mixed number.`, answer: `${whole} ${rem}/${d2}`,
      explanation: `${top} ÷ ${d2} = ${whole} remainder ${rem}, so ${top}/${d2} = ${whole} ${rem}/${d2}.` };
  }
  if (kind === 3) {
    const d2 = r.int(3, 9), whole = r.int(1, 6), rem = r.int(1, d2 - 1), top = whole * d2 + rem;
    return { paper: "arithmetic", format: "fraction", prompt: `Write ${whole} ${rem}/${d2} as an improper fraction.`, answer: `${top}/${d2}`,
      explanation: `${whole} × ${d2} = ${whole * d2}, plus ${rem} makes ${top}, so the answer is ${top}/${d2}.` };
  }
  const pairs: [number, number][] = [[3, 4], [5, 8], [2, 3], [7, 10], [4, 5], [5, 6], [7, 12], [3, 5]];
  const a = r.pick(pairs);
  let b = r.pick(pairs);
  if (a[0] * b[1] === b[0] * a[1]) b = [a[0] + 1, a[1] + 1];
  const bigger = a[0] * b[1] > b[0] * a[1] ? a : b;
  return { paper: "arithmetic", format: "choice", options: [`${a[0]}/${a[1]}`, `${b[0]}/${b[1]}`], prompt: `Which fraction is larger: ${a[0]}/${a[1]} or ${b[0]}/${b[1]}?`, answer: `${bigger[0]}/${bigger[1]}`,
    explanation: `Use a common denominator of ${a[1] * b[1]}: ${a[0] * b[1]}/${a[1] * b[1]} and ${b[0] * a[1]}/${a[1] * b[1]}. The larger is ${bigger[0]}/${bigger[1]}.` };
};

// ---------------- fractions, decimals, percentages conversions ----------------
const fdp: Gen = (r, d) => {
  const kind = d === 1 ? r.pick([0, 1]) : d === 2 ? r.pick([1, 2, 3]) : r.pick([0, 3, 4, 5]);
  if (kind === 0) {
    const den = r.pick([2, 4, 5, 8, 10, 20, 25]), n = r.int(1, den - 1);
    return { paper: "reasoning", prompt: `Write ${n}/${den} as a decimal.`, answer: clean(n / den), explanation: `${n} ÷ ${den} = ${clean(n / den)}.` };
  }
  if (kind === 1) {
    const p = r.int(1, 19) * 5;
    return { paper: "reasoning", prompt: `Write ${clean(p / 100)} as a percentage. (Answer as a number)`, answer: p, explanation: `Multiply by 100: ${clean(p / 100)} × 100 = ${p}%.` };
  }
  if (kind === 2) {
    const p = r.int(1, 99);
    return { paper: "reasoning", prompt: `Write ${p}% as a decimal.`, answer: clean(p / 100), explanation: `${p}% means ${p} out of 100: ${p} ÷ 100 = ${clean(p / 100)}.` };
  }
  if (kind === 3) {
    const p = r.pick([5, 10, 15, 20, 25, 35, 40, 45, 60, 65, 75, 80]);
    return { ...fracDraft(`Write ${p}% as a fraction in simplest form.`, p, 100, `${p}% = ${p}/100.`), paper: "reasoning" as PaperKind };
  }
  if (kind === 4) {
    const t = r.pick([2, 4, 5, 10, 20, 25]), n = r.int(1, t - 1);
    return { paper: "reasoning", prompt: `Write ${n}/${t} as a percentage. (Answer as a number)`, answer: (n * 100) / t, explanation: `${n} ÷ ${t} = ${clean(n / t)}, and × 100 gives ${clean((n * 100) / t)}%.` };
  }
  const dec = r.pick([2, 4, 5, 6, 8].map((x) => x * 0.1)), top = Math.round(dec * 100);
  return { ...fracDraft(`Write ${clean(dec)} as a fraction in simplest form.`, top, 100, `${clean(dec)} = ${top}/100.`), paper: "reasoning" as PaperKind };
};

// ---------------- decimals ----------------
const decimals: Gen = (r, d) => {
  const kind = d === 1 ? r.pick([0, 1]) : d === 2 ? r.pick([1, 2, 3]) : r.pick([2, 3, 4, 5]);
  if (kind === 0) {
    const x = r.int(11, 999) / 100, p = r.pick([10, 100]), mul = r.next() < 0.5;
    const ans = mul ? x * p : x / p;
    return { paper: "arithmetic", prompt: `${x} ${mul ? "×" : "÷"} ${p} =`, answer: clean(ans), explanation: `${mul ? "Multiplying" : "Dividing"} by ${p} moves the digits ${p === 10 ? "one place" : "two places"} ${mul ? "left" : "right"}: ${clean(ans)}.` };
  }
  if (kind === 1) {
    let t = r.int(11, 99);
    if (t % 10 === 0) t += 1;
    const x = t / 10, k = r.int(2, 9);
    return { paper: "arithmetic", prompt: `${x} × ${k} =`, answer: clean(x * k), explanation: `${Math.round(x * 10)} × ${k} = ${Math.round(x * 10) * k}, then divide by 10: ${clean(x * k)}.` };
  }
  if (kind === 2) {
    const k = r.int(2, 8), q = r.int(11, 99) / 10;
    return { paper: "arithmetic", prompt: `${clean(q * k)} ÷ ${k} =`, answer: clean(q), explanation: `${clean(q)} × ${k} = ${clean(q * k)}, so ${clean(q * k)} ÷ ${k} = ${clean(q)}.` };
  }
  if (kind === 3) {
    const v = r.int(1000, 9999), dp = r.pick([1, 2]), div = dp === 1 ? 100 : 10;
    const rounded = Math.floor((v + div / 2) / div) / (dp === 1 ? 10 : 100);
    return { paper: "arithmetic", prompt: `Round ${(v / 1000).toFixed(3)} to ${dp} decimal place${dp === 1 ? "" : "s"}.`, answer: clean(rounded),
      explanation: `Look at the digit after the ${dp === 1 ? "first" : "second"} decimal place to decide whether to round up or down: ${clean(rounded)}.` };
  }
  const pool = new Set<number>();
  while (pool.size < 4) pool.add(r.int(1, 99) * 10 + r.int(0, 9));
  const list = [...pool].map((x) => x / 1000).map((x) => x.toFixed(3));
  const largest = r.next() < 0.5;
  const vals = list.map(Number);
  const target = largest ? Math.max(...vals) : Math.min(...vals);
  return { paper: "arithmetic", format: "choice", options: list.map((x) => String(Number(x))), prompt: `Which of these decimals is the ${largest ? "largest" : "smallest"}?`, answer: String(target),
    explanation: `Compare the digits from the left. The ${largest ? "largest" : "smallest"} is ${target}.` };
};

// ---------------- algebra ----------------
const algebra: Gen = (r, d) => {
  const kind = d === 1 ? r.pick([0, 1]) : d === 2 ? r.pick([1, 2, 3]) : r.pick([3, 4, 5, 6]);
  if (kind === 0) {
    const a = r.int(2, 9), v = r.int(2, 9), c = r.int(1, 9);
    return { paper: "reasoning", prompt: `a = ${v}. Work out the value of ${a}a + ${c}.`, answer: a * v + c, explanation: `${a} × ${v} = ${a * v}, and ${a * v} + ${c} = ${a * v + c}.` };
  }
  if (kind === 1) {
    const n = r.int(3, 30), c = r.int(2, 20);
    return { paper: "reasoning", prompt: `n + ${c} = ${n + c}. What is the value of n?`, answer: n, explanation: `n = ${n + c} − ${c} = ${n}.` };
  }
  if (kind === 2) {
    const a2 = r.int(2, 9), b = r.int(2, 9), v = r.int(2, 9);
    return { paper: "reasoning", prompt: `a = ${v} and b = ${b}. Work out the value of ${a2}a + b.`, answer: a2 * v + b, explanation: `${a2} × ${v} + ${b} = ${a2 * v} + ${b} = ${a2 * v + b}.` };
  }
  if (kind === 3) {
    const a = r.int(2, 6), n = r.int(2, 12), c = r.int(1, 15);
    return { paper: "reasoning", marks: 2, prompt: `${a}n + ${c} = ${a * n + c}. What is the value of n?`, answer: n, explanation: `${a * n + c} − ${c} = ${a * n}. Then ${a * n} ÷ ${a} = ${n}.` };
  }
  if (kind === 4) {
    const a = r.int(2, 9), c = r.int(-3, 5), pos = r.int(8, 20);
    return { paper: "reasoning", prompt: `The nth term of a sequence is ${a}n ${c >= 0 ? "+" : "−"} ${Math.abs(c)}. What is the ${pos}th term?`, answer: a * pos + c,
      explanation: `${a} × ${pos} = ${a * pos}, then ${c >= 0 ? "add" : "subtract"} ${Math.abs(c)}: ${a * pos + c}.` };
  }
  if (kind === 5) {
    const fixed = r.int(3, 9), per = r.int(2, 6), h = r.int(3, 9);
    return { paper: "reasoning", marks: 2, prompt: `A taxi charges £${fixed} plus £${per} for every mile. The cost in pounds is ${fixed} + ${per}m, where m is the number of miles. How much does a ${h}-mile journey cost?`, answer: fixed + per * h, unit: "£",
      explanation: `${per} × ${h} = ${per * h}. ${fixed} + ${per * h} = ${fixed + per * h}, so the cost is £${fixed + per * h}.` };
  }
  const a = r.int(2, 6), b = r.int(2, 6), v = r.int(2, 8);
  return { paper: "reasoning", marks: 2, prompt: `x = ${v}. Work out the value of ${a}(x + ${b}).`, answer: a * (v + b), explanation: `Brackets first: ${v} + ${b} = ${v + b}. Then ${a} × ${v + b} = ${a * (v + b)}.` };
};

// ---------------- volume ----------------
const volume: Gen = (r, d) => {
  const kind = d === 1 ? r.pick([0, 1]) : d === 2 ? r.pick([0, 2, 3]) : r.pick([2, 3, 4, 5]);
  const l = r.int(3, 12), w = r.int(2, 8), h = r.int(2, 9);
  if (kind === 0) return { paper: "reasoning", prompt: `A cuboid is ${l} cm long, ${w} cm wide and ${h} cm tall. What is its volume in cm³?`, answer: l * w * h, explanation: `Volume = length × width × height = ${l} × ${w} × ${h} = ${l * w * h}.` };
  if (kind === 1) { const s = r.int(2, 9); return { paper: "reasoning", prompt: `A cube has sides of ${s} cm. What is its volume in cm³?`, answer: s ** 3, explanation: `${s} × ${s} × ${s} = ${s ** 3}.` }; }
  if (kind === 2) return { paper: "reasoning", prompt: `A cuboid has a volume of ${l * w * h} cm³. It is ${l} cm long and ${w} cm wide. How tall is it in cm?`, answer: h, explanation: `Base area = ${l} × ${w} = ${l * w}. Height = ${l * w * h} ÷ ${l * w} = ${h}.` };
  if (kind === 3) {
    const l2 = r.int(2, 6), w2 = r.int(2, 5), h2 = r.int(2, 5);
    return { paper: "reasoning", marks: 2, prompt: `Two boxes are packed together. Box A is ${l} cm by ${w} cm by ${h} cm. Box B is ${l2} cm by ${w2} cm by ${h2} cm. What is their total volume in cm³?`, answer: l * w * h + l2 * w2 * h2,
      explanation: `Box A: ${l} × ${w} × ${h} = ${l * w * h}. Box B: ${l2} × ${w2} × ${h2} = ${l2 * w2 * h2}. Total = ${l * w * h + l2 * w2 * h2}.` };
  }
  if (kind === 4) {
    const k = r.pick([10, 20]), a = r.pick([10, 20, 25]), b = r.pick([10, 20, 40]);
    const v = k * a * b;
    return { paper: "reasoning", marks: 2, prompt: `A tank is ${k} cm long, ${a} cm wide and ${b} cm tall. How many litres of water does it hold when full? (1 litre = 1,000 cm³)`, answer: clean(v / 1000),
      explanation: `${k} × ${a} × ${b} = ${fmt(v)} cm³. ${fmt(v)} ÷ 1,000 = ${clean(v / 1000)} litres.` };
  }
  const s = r.int(2, 5), n = r.int(2, 4);
  return { paper: "reasoning", marks: 2, prompt: `${n} cubes with sides of ${s} cm are stacked in a tower. What is the total volume of the tower in cm³?`, answer: n * s ** 3, explanation: `Each cube is ${s} × ${s} × ${s} = ${s ** 3} cm³. ${n} × ${s ** 3} = ${n * s ** 3}.` };
};

// ---------------- transformations: draw the translated / reflected shape on a grid ----------------
type Pt = [number, number];
const shapeAt = (r: Rand, x0: number, y0: number): Pt[] => {
  const w = r.int(1, 3), h = r.int(1, 3);
  const kind = r.int(0, 2);
  if (kind === 0) return [[x0, y0], [x0 + w + 1, y0], [x0, y0 + h + 1]];
  if (kind === 1) return [[x0, y0], [x0 + w + 1, y0], [x0 + w + 1, y0 + h + 1], [x0, y0 + h + 1]];
  const s = r.int(1, 2);
  return [[x0, y0], [x0 + w + 1, y0], [x0 + w + 1 + s, y0 + h], [x0 + s, y0 + h]];
};
const inGrid = (pts: Pt[]) => pts.every(([x, y]) => x >= 0 && x <= 10 && y >= 0 && y <= 10);
const shapeText = (pts: Pt[]) => [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([x, y]) => `${x},${y}`).join(";");

const transformations: Gen = (r, d) => {
  const kind = d === 1 ? 0 : d === 2 ? 1 : r.pick([2, 3]); // 0 translate, 1 reflect in x = k, 2 reflect in y = k, 3 translate (left/down)
  for (let attempt = 0; attempt < 60; attempt++) {
    const poly = shapeAt(r, r.int(0, 8), r.int(0, 8));
    if (!inGrid(poly)) continue;
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    if (kind === 0 || kind === 3) {
      const dx = r.int(kind === 3 ? -5 : 1, kind === 3 ? -1 : 5), dy = kind === 3 ? r.int(-4, 4) : r.int(0, 5);
      const out = poly.map(([x, y]): Pt => [x + dx, y + dy]);
      if (!inGrid(out) || (dx === 0 && dy === 0)) continue;
      const how = [dx === 0 ? "" : `${Math.abs(dx)} ${dx > 0 ? "right" : "left"}`, dy === 0 ? "" : `${Math.abs(dy)} ${dy > 0 ? "up" : "down"}`].filter(Boolean).join(" and ");
      return { paper: "reasoning", marks: 2, format: "draw", figure: { type: "grid", min: 0, max: 10, points: [], polygon: poly, draw: true },
        prompt: `Translate the shape ${how}. Tap the corners of the new shape.`, answer: shapeText(out),
        explanation: `Move every corner ${how}. For example (${poly[0][0]}, ${poly[0][1]}) moves to (${out[0][0]}, ${out[0][1]}).` };
    }
    if (kind === 1) {
      const k = r.int(Math.max(...xs), 9);
      if (k < 1 || Math.min(...xs) === k) continue;
      const out = poly.map(([x, y]): Pt => [2 * k - x, y]);
      if (!inGrid(out)) continue;
      return { paper: "reasoning", marks: 2, format: "draw", figure: { type: "grid", min: 0, max: 10, points: [], polygon: poly, draw: true, line: { axis: "x", at: k } },
        prompt: `Reflect the shape in the dashed mirror line (x = ${k}). Tap the corners of the reflected shape.`, answer: shapeText(out),
        explanation: `Each corner goes to the same distance on the other side of the mirror line. For example (${poly[0][0]}, ${poly[0][1]}) is ${k - poly[0][0]} from the line, so it reflects to (${out[0][0]}, ${out[0][1]}).` };
    }
    const k = r.int(Math.max(...ys), 9);
    if (k < 1 || Math.min(...ys) === k) continue;
    const out = poly.map(([x, y]): Pt => [x, 2 * k - y]);
    if (!inGrid(out)) continue;
    return { paper: "reasoning", marks: 2, format: "draw", figure: { type: "grid", min: 0, max: 10, points: [], polygon: poly, draw: true, line: { axis: "y", at: k } },
      prompt: `Reflect the shape in the dashed mirror line (y = ${k}). Tap the corners of the reflected shape.`, answer: shapeText(out),
      explanation: `Each corner goes to the same distance on the other side of the mirror line. For example (${poly[0][0]}, ${poly[0][1]}) is ${k - poly[0][1]} from the line, so it reflects to (${out[0][0]}, ${out[0][1]}).` };
  }
  const poly: Pt[] = [[2, 2], [4, 2], [2, 4]];
  const out = poly.map(([x, y]): Pt => [x + 3, y + 3]);
  return { paper: "reasoning", marks: 2, format: "draw", figure: { type: "grid", min: 0, max: 10, points: [], polygon: poly, draw: true },
    prompt: "Translate the shape 3 right and 3 up. Tap the corners of the new shape.", answer: shapeText(out), explanation: "Move every corner 3 right and 3 up." };
};

export const MORE_GENERATORS: Record<string, { gen: Gen; kinds: PaperKind[] }> = {
  transformations: { gen: transformations, kinds: ["reasoning"] },
  statistics: { gen: statistics, kinds: ["reasoning"] },
  angles: { gen: angles, kinds: ["reasoning"] },
  coordinates: { gen: coordinates, kinds: ["reasoning"] },
  "shape-properties": { gen: shapeProps, kinds: ["reasoning"] },
  sequences: { gen: sequences, kinds: ["reasoning"] },
  "fractions-equivalent": { gen: fractionsEquivalent, kinds: ["arithmetic"] },
  "fdp-conversions": { gen: fdp, kinds: ["reasoning"] },
  decimals: { gen: decimals, kinds: ["arithmetic"] },
  algebra: { gen: algebra, kinds: ["reasoning"] },
  volume: { gen: volume, kinds: ["reasoning"] },
};
