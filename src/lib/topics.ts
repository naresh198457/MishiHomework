export type Topic = { id: string; title: string; blurb: string };

// Topics that have a question file in content/questions/<id>.json
export const TOPICS: Topic[] = [
  { id: "place-value", title: "Place value & rounding", blurb: "Digit values, rounding, 2,000 more than" },
  { id: "add-subtract", title: "Addition & subtraction", blurb: "Up to 7 digits and decimals" },
  { id: "multiplication", title: "Multiplication", blurb: "Times tables, ×10/100, short multiplication" },
  { id: "division", title: "Division", blurb: "Short division, ÷10, decimals" },
  { id: "long-multiplication", title: "Long multiplication", blurb: "3-4 digit × 2 digit (2 marks)" },
  { id: "long-division", title: "Long division", blurb: "3-4 digit ÷ 2 digit (2 marks)" },
  { id: "fractions-add-subtract", title: "Fractions: add & subtract", blurb: "Unlike denominators and mixed numbers" },
  { id: "fractions-multiply", title: "Fractions: multiply", blurb: "Fraction × fraction, × whole number, fraction of an amount" },
  { id: "fractions-divide", title: "Fractions: divide", blurb: "Divide a fraction by a whole number" },
  { id: "percentages", title: "Percentages", blurb: "5%, 10%, 19%, 65% of an amount" },
];

export const topicTitle = (id: string) => TOPICS.find((t) => t.id === id)?.title ?? id;
