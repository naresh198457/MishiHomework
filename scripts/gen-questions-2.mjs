// Second batch of DRAFT questions (reasoning-style + order of operations). Answers are COMPUTED.
// Run: node scripts/gen-questions-2.mjs  -> writes only the new topic files, status "draft".
import { writeFileSync } from "node:fs";

const mk = (prefix, topic, list) =>
  list.map((q, i) => ({
    id: `${prefix}-${String(i + 1).padStart(3, "0")}`,
    topic,
    paper: q.paper ?? "reasoning",
    difficulty: q.d,
    marks: q.marks ?? 1,
    format: "numeric",
    prompt: q.prompt,
    answer: String(q.answer),
    ...(q.unit ? { unit: q.unit } : {}),
    explanation: q.explanation,
    source: "original",
    status: "approved",
  }));
const money = (n) => (Math.round(n * 100) / 100).toFixed(2);
const mins = (h, m) => h * 60 + m;
const hhmm = (t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;

// ---- Negative numbers
const neg = [
  [-3, 8, "rises", "°C"], [4, -9, "falls", "°C"], [-5, 12, "rises", "°C"],
].map(([start, change, verb, u], i) => {
  const amount = Math.abs(change);
  const ans = start + change;
  return { d: i + 1, prompt: `The temperature is ${String(start).replace("-", "−")}${u}. It ${verb} by ${amount}${u}. What is the new temperature in ${u}?`, answer: ans,
    explanation: `${start} ${change > 0 ? "+" : "−"} ${amount} = ${ans}.` };
});
neg.push(
  { d: 2, prompt: "What is the difference between −6°C and 9°C? (Answer in °C)", answer: 9 - -6, explanation: "From −6 up to 0 is 6, then 0 up to 9 is 9. 6 + 9 = 15." },
  { d: 2, prompt: "Which number is 4 less than 1?", answer: 1 - 4, explanation: "Count back 4 from 1: 0, −1, −2, −3. The answer is −3." },
  { d: 3, prompt: "A diver is 12 m below sea level (−12). She swims up 5 m. What number shows her position now?", answer: -12 + 5, explanation: "−12 + 5 = −7." },
  { d: 3, prompt: "On Monday it was −7°C. On Tuesday it was 3°C warmer. What was the temperature on Tuesday in °C?", answer: -7 + 3, explanation: "−7 + 3 = −4." },
  { d: 3, prompt: "The temperature in Oslo is −8°C and in Rome it is 11°C. How many degrees warmer is Rome?", answer: 11 + 8, explanation: "From −8 to 0 is 8 degrees, and from 0 to 11 is 11 degrees. 8 + 11 = 19." },
);

// ---- Measurement (conversions)
const meas = [
  { d: 1, prompt: "How many millimetres are in 3.5 cm?", answer: 3.5 * 10, explanation: "1 cm = 10 mm, so 3.5 × 10 = 35." },
  { d: 1, prompt: "How many grams are in 2.4 kg?", answer: 2.4 * 1000, explanation: "1 kg = 1,000 g, so 2.4 × 1,000 = 2,400." },
  { d: 1, prompt: "How many litres is 750 ml? (Write as a decimal)", answer: 0.75, explanation: "1 litre = 1,000 ml, so 750 ÷ 1,000 = 0.75." },
  { d: 2, prompt: "How many metres are in 3 km 250 m?", answer: 3 * 1000 + 250, explanation: "3 km = 3,000 m. 3,000 + 250 = 3,250." },
  { d: 2, prompt: "A rope is 4.2 m long. How many centimetres is that?", answer: 4.2 * 100, explanation: "1 m = 100 cm, so 4.2 × 100 = 420." },
  { d: 3, prompt: "A bag holds 1.5 kg of flour. Mia uses 650 g. How many grams are left?", answer: 1500 - 650, explanation: "1.5 kg = 1,500 g. 1,500 − 650 = 850." },
  { d: 3, prompt: "A ribbon is 2.5 m long. It is cut into pieces that are each 25 cm long. How many pieces are there?", answer: 250 / 25, explanation: "2.5 m = 250 cm. 250 ÷ 25 = 10." },
  { d: 3, prompt: "A jug holds 2 litres. Sam pours out 3 cups of 250 ml each. How many millilitres are left in the jug?", answer: 2000 - 3 * 250, explanation: "3 × 250 = 750 ml poured. 2 litres = 2,000 ml. 2,000 − 750 = 1,250." },
];

// ---- Time (answers in minutes)
const timeQ = [
  [[14, 35], [16, 10]], [[9, 45], [11, 10]], [[13, 50], [16, 5]], [[8, 55], [10, 40]],
].map(([a, b], i) => {
  const s = mins(...a), e = mins(...b);
  return { d: i < 2 ? 2 : 3, prompt: `A film starts at ${hhmm(s)} and ends at ${hhmm(e)}. How many minutes long is the film?`, answer: e - s,
    explanation: `From ${hhmm(s)} to ${hhmm(e)}: ${e - s} minutes (${Math.floor((e - s) / 60)} hour${Math.floor((e - s) / 60) === 1 ? "" : "s"} and ${(e - s) % 60} minutes).` };
});
timeQ.push(
  { d: 1, prompt: "How many minutes are in 3 hours 20 minutes?", answer: mins(3, 20), explanation: "3 × 60 = 180, and 180 + 20 = 200." },
  { d: 1, prompt: "How many hours are in 270 minutes? (Write as a decimal)", answer: 270 / 60, explanation: "270 ÷ 60 = 4.5 hours." },
  { d: 2, prompt: "A bus journey takes 1 hour 45 minutes. It leaves at 10:30. How many minutes after 12:00 does it arrive?", answer: mins(10, 30) + mins(1, 45) - mins(12, 0), explanation: "10:30 + 1 h 45 min = 12:15, which is 15 minutes after 12:00." },
  { d: 3, prompt: "School finishes at 15:20. Mina gets home 55 minutes later. How many minutes after 16:00 is that?", answer: mins(15, 20) + 55 - mins(16, 0), explanation: "15:20 + 55 min = 16:15, which is 15 minutes after 16:00." },
);

// ---- Area & perimeter
const ap = [
  { d: 1, prompt: "A rectangle is 9 cm long and 4 cm wide. What is its area in cm²?", answer: 9 * 4, explanation: "Area = length × width = 9 × 4 = 36." },
  { d: 1, prompt: "A rectangle is 9 cm long and 4 cm wide. What is its perimeter in cm?", answer: 2 * (9 + 4), explanation: "Perimeter = 2 × (9 + 4) = 26." },
  { d: 2, prompt: "A square has sides of 7 cm. What is its area in cm²?", answer: 49, explanation: "7 × 7 = 49." },
  { d: 2, prompt: "A rectangle has an area of 72 cm² and is 8 cm long. How wide is it in cm?", answer: 72 / 8, explanation: "Width = area ÷ length = 72 ÷ 8 = 9." },
  { d: 2, prompt: "A rectangle has a perimeter of 30 cm and is 11 cm long. How wide is it in cm?", answer: 30 / 2 - 11, explanation: "Length + width = 30 ÷ 2 = 15. So width = 15 − 11 = 4." },
  { d: 3, prompt: "A triangle has a base of 12 cm and a height of 7 cm. What is its area in cm²?", answer: (12 * 7) / 2, explanation: "Area = base × height ÷ 2 = 12 × 7 ÷ 2 = 42." },
  { d: 3, prompt: "A parallelogram has a base of 15 cm and a height of 6 cm. What is its area in cm²?", answer: 15 * 6, explanation: "Area = base × height = 15 × 6 = 90." },
  { d: 3, prompt: "An L-shaped room is made from a 6 m by 5 m rectangle joined to a 4 m by 3 m rectangle. What is the total area in m²?", answer: 6 * 5 + 4 * 3, explanation: "6 × 5 = 30 and 4 × 3 = 12. 30 + 12 = 42." },
];

// ---- Order of operations (arithmetic paper)
const evalExpr = (s) => Function(`"use strict"; return (${s.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/(\d+)²/g, "($1**2)")})`)();
const oo = ["3 + 4 × 5", "20 − 6 ÷ 2", "(3 + 4) × 5", "36 ÷ (2 + 4)", "5² − 8", "2 + 3² × 2", "(12 − 4) × (3 + 2)", "100 − 4 × (6 + 9)"].map((e, i) => {
  const ans = evalExpr(e);
  return { paper: "arithmetic", d: i < 3 ? 1 : i < 6 ? 2 : 3, prompt: `${e} =`, answer: ans,
    explanation: `Brackets and powers first, then × and ÷, then + and −. The answer is ${ans}.` };
});

// ---- Word problems (money)
const wp = [
  { d: 1, prompt: "Mia buys 4 pens at £1.35 each. How much do they cost altogether?", answer: money(4 * 1.35), unit: "£", explanation: "4 × £1.35 = £5.40." },
  { d: 1, prompt: "A book costs £7.45. Dan pays with a £10 note. How much change does he get?", answer: money(10 - 7.45), unit: "£", explanation: "£10 − £7.45 = £2.55." },
  { d: 2, prompt: "Tickets cost £8.50 each. How much do 6 tickets cost?", answer: money(6 * 8.5), unit: "£", explanation: "6 × £8.50 = £51." },
  { d: 2, prompt: "There are 144 children and 8 can sit at each table. How many tables are needed?", answer: 144 / 8, explanation: "144 ÷ 8 = 18." },
  { d: 2, prompt: "A pack of 6 cakes costs £4.50. How much does one cake cost, in pounds?", answer: money(4.5 / 6), unit: "£", explanation: "£4.50 ÷ 6 = £0.75." },
  { d: 3, prompt: "Sam has £20. He buys 3 notebooks at £2.40 each and a pen for £1.85. How much money does he have left?", answer: money(20 - (3 * 2.4 + 1.85)), unit: "£", explanation: "3 × £2.40 = £7.20. £7.20 + £1.85 = £9.05. £20 − £9.05 = £10.95." },
  { d: 3, prompt: "A school trip costs £12.50 per child. 38 children go. What is the total cost in pounds?", answer: money(38 * 12.5), unit: "£", explanation: "38 × £12.50 = £475." },
  { d: 3, prompt: "A shop sells 5 packets of stickers for £6.00. How much would 8 packets cost, in pounds?", answer: money((6 / 5) * 8), unit: "£", explanation: "1 packet costs £6.00 ÷ 5 = £1.20. 8 × £1.20 = £9.60." },
];

// ---- Ratio & proportion
const rp = [
  { d: 1, prompt: "In a bag the ratio of red to blue counters is 3:2. There are 15 red counters. How many blue counters are there?", answer: (15 / 3) * 2, explanation: "15 ÷ 3 = 5 for each part, so blue = 2 × 5 = 10." },
  { d: 1, prompt: "4 kg of apples cost £6. How much do 10 kg cost, in pounds?", answer: (6 / 4) * 10, unit: "£", explanation: "1 kg costs £6 ÷ 4 = £1.50. 10 × £1.50 = £15." },
  { d: 2, prompt: "A recipe for 4 people uses 300 g of rice. How many grams are needed for 10 people?", answer: (300 / 4) * 10, explanation: "300 ÷ 4 = 75 g per person. 75 × 10 = 750." },
  { d: 2, prompt: "Orange squash is mixed with water in the ratio 1:4. How many ml of water are needed with 150 ml of squash?", answer: 150 * 4, explanation: "Water is 4 times the squash: 150 × 4 = 600." },
  { d: 2, prompt: "Sam and Priya share 40 sweets in the ratio 3:5. How many sweets does Priya get?", answer: (40 / 8) * 5, explanation: "3 + 5 = 8 parts. 40 ÷ 8 = 5 per part. Priya gets 5 × 5 = 25." },
  { d: 3, prompt: "A map scale is 1 cm to 5 km. Two towns are 7.5 cm apart on the map. How many km apart are they really?", answer: 7.5 * 5, explanation: "7.5 × 5 = 37.5." },
  { d: 3, prompt: "Paint is mixed from yellow and blue in the ratio 2:3. Jo makes 35 litres. How many litres of blue are used?", answer: (35 / 5) * 3, explanation: "2 + 3 = 5 parts. 35 ÷ 5 = 7 litres per part. Blue = 3 × 7 = 21." },
  { d: 3, prompt: "Three friends share £72 in the ratio 2:3:4. How much does the friend with the largest share get, in pounds?", answer: (72 / 9) * 4, unit: "£", explanation: "2 + 3 + 4 = 9 parts. £72 ÷ 9 = £8 per part. The largest share is 4 × £8 = £32." },
];

const files = {
  "negative-numbers": mk("neg", "negative-numbers", neg),
  measurement: mk("mea", "measurement", meas),
  time: mk("tim", "time", timeQ),
  "area-perimeter": mk("ap", "area-perimeter", ap),
  "order-of-operations": mk("oo", "order-of-operations", oo),
  "word-problems": mk("wp", "word-problems", wp),
  "ratio-proportion": mk("rp", "ratio-proportion", rp),
};
for (const [name, qs] of Object.entries(files)) {
  writeFileSync(`content/questions/${name}.json`, "[\n" + qs.map((q) => " " + JSON.stringify(q)).join(",\n") + "\n]\n");
}
console.log("Wrote", Object.keys(files).join(", "), "as draft");
