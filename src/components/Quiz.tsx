"use client";

import Link from "next/link";
import { useState } from "react";
import MathText from "./MathText";
import { mark } from "@/lib/marking";
import { saveAttempt, type Result } from "@/lib/saveAttempt";
import type { Question } from "@/lib/types";

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
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">
          Score {score}/{results.length}
        </h2>
        {saveState === "saved" && <p className="text-sm text-green-600">Saved to your history.</p>}
        {saveState === "failed" && <p className="text-sm text-red-600">Could not save this attempt.</p>}
        <ul className="space-y-3">
          {results.map((r) => (
            <li key={r.q.id} className="rounded-xl border border-black/10 p-4 dark:border-white/15">
              <p className="font-medium">
                {r.correct ? "✅" : "❌"} <MathText text={r.q.prompt} />
              </p>
              {!r.correct && (
                <p className="mt-1 text-sm">
                  You wrote <b>{r.response || "(nothing)"}</b>. Correct: <b><MathText text={`${r.q.unit ?? ""}${r.q.answer}`} /></b>
                </p>
              )}
              <p className="mt-1 text-sm opacity-70"><MathText text={r.q.explanation} /></p>
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <button
            className="rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white"
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
            Try again
          </button>
          <Link href="/" className="rounded-full border border-black/20 px-6 py-3 font-semibold dark:border-white/30">
            Home
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

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium opacity-70">
        {title} · Question {index + 1} of {questions.length}
      </p>
      <p className="text-2xl font-semibold"><MathText text={q.prompt} /></p>
      <div className="flex items-center gap-2">
        {q.unit && <span className="text-2xl">{q.unit}</span>}
        <input
          inputMode={q.format === "fraction" ? "text" : "decimal"}
          autoFocus
          disabled={checked !== null}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (checked === null && response.trim()) check();
          }}
          className="w-40 rounded-lg border border-black/20 bg-transparent px-4 py-3 text-2xl dark:border-white/30"
          aria-label="Your answer"
        />
      </div>
      {q.format === "fraction" && (
        <p className="text-sm opacity-70">Write fractions like 3/4 and mixed numbers like 4 1/5, in simplest form.</p>
      )}
      {checked === null ? (
        <button
          disabled={!response.trim()}
          onClick={check}
          className="rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white disabled:opacity-40"
        >
          Check
        </button>
      ) : (
        <div className="space-y-4">
          <p className={`text-xl font-bold ${checked ? "text-green-600" : "text-red-600"}`}>
            {checked ? "Correct!" : <>Not quite. The answer is <MathText text={`${q.unit ?? ""}${q.answer}`} /></>}
          </p>
          <p className="opacity-80"><MathText text={q.explanation} /></p>
          <button
            autoFocus
            onClick={next}
            className="rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white"
          >
            {index + 1 === questions.length ? "See results" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}
