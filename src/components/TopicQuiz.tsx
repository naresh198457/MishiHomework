"use client";

import { useState } from "react";
import { generateQuestion, hasGenerator, randomSeed, type Difficulty } from "@/lib/generators";
import type { Question } from "@/lib/types";
import Quiz from "./Quiz";

const LADDER: Difficulty[] = [1, 1, 2, 2, 2, 3, 3, 3];

// Fresh questions every time: 8 generated questions climbing from easy to hard.
// Topics with no generator fall back to the fixed approved bank.
function makeSet(topic: string, fixed: Question[]): Question[] {
  if (!hasGenerator(topic) || fixed.length === 0) return fixed;
  const base = randomSeed();
  return LADDER.map((d, i) => generateQuestion(topic, `${base}${i}`, d));
}

export default function TopicQuiz({ topic, title, fixed }: { topic: string; title: string; fixed: Question[] }) {
  const [round, setRound] = useState(0);
  const [questions, setQuestions] = useState(() => makeSet(topic, fixed));
  return (
    <Quiz
      key={round}
      title={title}
      questions={questions}
      onRestart={() => {
        setQuestions(makeSet(topic, fixed));
        setRound((r) => r + 1);
      }}
    />
  );
}
