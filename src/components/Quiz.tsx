"use client";

import Link from "next/link";
import { useState } from "react";
import AnswerInput from "./AnswerInput";
import ResultFigure from "./ResultFigure";
import MathText from "./MathText";
import { mark } from "@/lib/marking";
import { saveAttempt, type Result } from "@/lib/saveAttempt";
import type { Question } from "@/lib/types";

const CHEERS = ["Brilliant! 🎉", "Super! ⭐", "You got it! 🙌", "Fantastic! 🚀", "Well done! 👏", "Spot on! 🎯"];
const TRY_AGAIN = ["Nearly there! 💪", "Good try! Let's see why.", "Not this time. You will get the next one! 🌈"];

function verdict(score: number, total: number) {
  const f = total ? score / total : 0;
  if (f === 1) return { stars: 3, emoji: "🏆", text: "Perfect score! You are a maths superstar!" };
  if (f >= 0.7) return { stars: 3, emoji: "🌟", text: "Fantastic work! Keep it up!" };
  if (f >= 0.4) return { stars: 2, emoji: "👍", text: "Good effort! Practice makes perfect." };
  return { stars: 1, emoji: "💪", text: "Great try! Have another go and you will improve." };
}

export default function Quiz({
  title,
  questions,
  kind = "topic",
  onSaved,
  onRestart,
}: {
  title: string;
  questions: Question[];
  kind?: "topic" | "homework";
  onSaved?: (attemptId: string) => void;
  onRestart?: () => void; // when given, "Try again" asks the parent for a brand-new set
}) {
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [checked, setChecked] = useState<boolean | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "failed">("idle");
  const [startedAt, setStartedAt] = useState(() => Date.now());

  if (questions.length === 0) {
    return <p className="text-lg">No approved questions for this topic yet.</p>;
  }

  if (index >= questions.length) {
    const score = results.filter((r) => r.correct).length;
    const v = verdict(score, results.length);
    return (
      <div className="space-y-6">
        <div className="card p-6 text-center">
          <p className="text-6xl" aria-hidden>
            {v.emoji}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold">
            You scored {score} out of {results.length}!
          </h2>
          <p className="mt-1 text-2xl" aria-label={`${v.stars} stars`}>
            {"⭐".repeat(v.stars)}
            {"☆".repeat(3 - v.stars)}
          </p>
          <p className="mt-2 text-lg font-semibold">{v.text}</p>
          {saveState === "saved" && <p className="mt-2 text-sm font-semibold text-green-700">✔ Saved to your history</p>}
          {saveState === "failed" && <p className="mt-2 text-sm font-semibold text-red-600">Could not save this attempt</p>}
        </div>
        <h3 className="text-xl font-extrabold">Let&apos;s look at your answers</h3>
        <ul className="space-y-3">
          {results.map((r) => (
            <li
              key={r.q.id}
              className="card p-4"
              style={{ borderLeft: `8px solid ${r.correct ? "#1f9d6b" : "#f08a00"}` }}
            >
              <p className="font-bold">
                {r.correct ? "✅" : "🔶"} <MathText text={r.q.prompt} />
              </p>
              <ResultFigure q={r.q} response={r.response} />
              {!r.correct && (
                <p className="mt-1">
                  You wrote <b>{r.response || "(nothing)"}</b>. The answer is{" "}
                  <b>
                    <MathText text={`${r.q.unit ?? ""}${r.q.answer}`} />
                  </b>
                </p>
              )}
              <p className="mt-1 text-sm" style={{ color: "var(--chart-muted)" }}>
                <MathText text={r.q.explanation} />
              </p>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          <button
            className="btn"
            onClick={() => {
              if (onRestart) return onRestart();
              setIndex(0);
              setResults([]);
              setResponse("");
              setChecked(null);
              setSaveState("idle");
              setStartedAt(Date.now());
            }}
          >
            🔁 Play again
          </button>
          <Link href="/" className="btn-ghost">
            🏠 Home
          </Link>
        </div>
      </div>
    );
  }

  const q = questions[index];

  function check() {
    const correct = mark(q, response);
    setChecked(correct);
    setResults((r) => [...r, { q, response, correct }]);
  }

  async function save(finalResults: Result[]) {
    const seconds = Math.round((Date.now() - startedAt) / 1000);
    const { id, failed } = await saveAttempt({ kind, results: finalResults, seconds });
    if (failed) return setSaveState("failed");
    if (id) {
      setSaveState("saved");
      onSaved?.(id);
    }
  }

  function next() {
    if (index + 1 === questions.length) save(results);
    setIndex((i) => i + 1);
    setResponse("");
    setChecked(null);
  }

  const cheer = CHEERS[index % CHEERS.length];
  const oops = TRY_AGAIN[index % TRY_AGAIN.length];
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex justify-between text-sm font-bold" style={{ color: "var(--chart-muted)" }}>
          <span>{title}</span>
          <span>
            Question {index + 1} of {questions.length}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-[#dfe7f7]" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index}>
          <div className="h-full rounded-full transition-all" style={{ width: `${(index / questions.length) * 100}%`, background: "linear-gradient(90deg,#6a5cf0,#ec6bb0)" }} />
        </div>
      </div>

      <div className="card p-5">
        <p className="text-2xl font-extrabold leading-snug">
          <MathText text={q.prompt} />
        </p>
        <AnswerInput
          key={q.id}
          q={q}
          value={response}
          onChange={setResponse}
          disabled={checked !== null}
          autoFocus
          onEnter={() => {
            if (checked === null && response.trim()) check();
          }}
        />
      </div>

      {checked === null ? (
        <button disabled={!response.trim()} onClick={check} className="btn text-lg">
          Check my answer ✓
        </button>
      ) : (
        <div className="card space-y-3 p-5" style={{ borderLeft: `8px solid ${checked ? "#1f9d6b" : "#f08a00"}` }}>
          <p className="text-2xl font-extrabold" style={{ color: checked ? "#15803d" : "#c2410c" }}>
            {checked ? cheer : oops}
          </p>
          {!checked && (
            <p className="text-lg">
              The answer is{" "}
              <b>
                <MathText text={`${q.unit ?? ""}${q.answer}`} />
              </b>
            </p>
          )}
          <p style={{ color: "var(--chart-muted)" }}>
            <MathText text={q.explanation} />
          </p>
          <button autoFocus onClick={next} className="btn text-lg">
            {index + 1 === questions.length ? "See my results 🎉" : "Next question →"}
          </button>
        </div>
      )}
    </div>
  );
}
