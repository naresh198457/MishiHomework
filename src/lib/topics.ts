export type Topic = { id: string; title: string; blurb: string };

// Topics that have a question file in content/questions/<id>.json
export const TOPICS: Topic[] = [
  { id: "percentages", title: "Percentages", blurb: "5%, 10%, 19%, 65% of an amount" },
];

export const topicTitle = (id: string) => TOPICS.find((t) => t.id === id)?.title ?? id;
