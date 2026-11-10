export type GroupId = "number" | "fractions" | "ratio-algebra" | "measure-shape" | "data";

export type Topic = { id: string; title: string; blurb: string; emoji: string; group: GroupId };

export type Group = { id: GroupId; title: string; emoji: string; colour: string; tint: string };

// Section headings on the home page. `colour` is the accent, `tint` a soft background for its cards.
export const GROUPS: Group[] = [
  { id: "number", title: "Number", emoji: "🔢", colour: "#2f6fed", tint: "#e8f0ff" },
  { id: "fractions", title: "Fractions, decimals & percentages", emoji: "🍕", colour: "#e0457b", tint: "#ffe9f1" },
  { id: "ratio-algebra", title: "Ratio & algebra", emoji: "🧩", colour: "#7c4dff", tint: "#f0eaff" },
  { id: "measure-shape", title: "Measurement & shape", emoji: "📐", colour: "#1f9d6b", tint: "#e3f7ee" },
  { id: "data", title: "Statistics & problem solving", emoji: "📊", colour: "#f08a00", tint: "#fff1dc" },
];

// Topics that have a question file in content/questions/<id>.json
export const TOPICS: Topic[] = [
  // Number
  { id: "place-value", group: "number", emoji: "🏠", title: "Place value & rounding", blurb: "Digit values, rounding, 2,000 more than" },
  { id: "negative-numbers", group: "number", emoji: "🌡️", title: "Negative numbers", blurb: "Temperatures, number lines, differences across zero" },
  { id: "sequences", group: "number", emoji: "🔗", title: "Sequences, factors & primes", blurb: "Multiples, factors, primes, squares" },
  { id: "add-subtract", group: "number", emoji: "➕", title: "Addition & subtraction", blurb: "Up to 7 digits and decimals" },
  { id: "multiplication", group: "number", emoji: "✖️", title: "Multiplication", blurb: "Times tables, ×10/100, short multiplication" },
  { id: "division", group: "number", emoji: "➗", title: "Division", blurb: "Short division, ÷10, decimals" },
  { id: "long-multiplication", group: "number", emoji: "🏗️", title: "Long multiplication", blurb: "3-4 digit × 2 digit (2 marks)" },
  { id: "long-division", group: "number", emoji: "🪜", title: "Long division", blurb: "3-4 digit ÷ 2 digit (2 marks)" },
  { id: "order-of-operations", group: "number", emoji: "🎯", title: "Order of operations", blurb: "Brackets, powers, × ÷ before + −" },
  { id: "decimals", group: "number", emoji: "🔟", title: "Decimals", blurb: "×÷ by 10/100, rounding, ordering" },
  // Fractions, decimals & percentages
  { id: "fractions-equivalent", group: "fractions", emoji: "⚖️", title: "Equivalent fractions", blurb: "Simplify, mixed numbers, compare" },
  { id: "fractions-add-subtract", group: "fractions", emoji: "🍰", title: "Fractions: add & subtract", blurb: "Unlike denominators and mixed numbers" },
  { id: "fractions-multiply", group: "fractions", emoji: "🍫", title: "Fractions: multiply", blurb: "Fraction × fraction, × whole number, fraction of an amount" },
  { id: "fractions-divide", group: "fractions", emoji: "🥧", title: "Fractions: divide", blurb: "Divide a fraction by a whole number" },
  { id: "fdp-conversions", group: "fractions", emoji: "🔄", title: "Fractions, decimals & percentages", blurb: "Convert between all three" },
  { id: "percentages", group: "fractions", emoji: "💯", title: "Percentages", blurb: "5%, 10%, 19%, 65% of an amount" },
  // Ratio & algebra
  { id: "ratio-proportion", group: "ratio-algebra", emoji: "🥤", title: "Ratio & proportion", blurb: "Scaling, sharing, unit cost" },
  { id: "algebra", group: "ratio-algebra", emoji: "🔤", title: "Algebra", blurb: "Substitute, solve, nth term" },
  // Measurement & shape
  { id: "measurement", group: "measure-shape", emoji: "📏", title: "Measurement", blurb: "mm, cm, m, km, g, kg, ml, litres" },
  { id: "time", group: "measure-shape", emoji: "⏰", title: "Time", blurb: "24-hour clock and durations" },
  { id: "area-perimeter", group: "measure-shape", emoji: "🟩", title: "Area & perimeter", blurb: "Rectangles, triangles, parallelograms, L-shapes" },
  { id: "volume", group: "measure-shape", emoji: "🧊", title: "Volume", blurb: "Cubes and cuboids" },
  { id: "angles", group: "measure-shape", emoji: "📐", title: "Angles", blurb: "Triangles, straight lines, around a point" },
  { id: "shape-properties", group: "measure-shape", emoji: "🔷", title: "Shape properties", blurb: "Symmetry, faces, edges, vertices" },
  { id: "coordinates", group: "measure-shape", emoji: "📍", title: "Coordinates", blurb: "Read, plot, translate and reflect in four quadrants" },
  { id: "transformations", group: "measure-shape", emoji: "🪞", title: "Translation & reflection", blurb: "Draw shapes moved or reflected on a grid" },
  // Statistics & problem solving
  { id: "statistics", group: "data", emoji: "📊", title: "Charts & averages", blurb: "Bar charts, line graphs, pie charts, tables, mean" },
  { id: "word-problems", group: "data", emoji: "🛒", title: "Word problems", blurb: "Money and everyday maths" },
];

export const topicTitle = (id: string) => TOPICS.find((t) => t.id === id)?.title ?? id;
