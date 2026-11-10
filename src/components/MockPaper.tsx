"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { randomSeed } from "@/lib/generators";
import { mark } from "@/lib/marking";
import { buildPaper, MIN_TOPICS, PAPERS, topicsForPaper, type PaperKey } from "@/lib/mock";
import { saveAttempt, type Result } from "@/lib/saveAttempt";
import type { Question } from "@/lib/types";
import MathText from "./MathText";

type Phase = "intro" | "running" | "done";

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function MockPaper({
  paperKey,
  liveTopics,
}: {
  paperKey: PaperKey;
  liveTopics: string[];
}) {
  const minutes = PAPERS[paperKey].minutes;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [deadline, setDeadline] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [left, setLeft] = useState(minutes * 60);
  const [results, setResults] = useState<Result[]>([]);
  const [usedSeconds, setUsedSeconds] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "failed">("idle");
  const finished = useRef(false);

  const available = topicsForPaper(liveTopics, paperKey).length;
  const totalMarks = questions.reduce((n, q) => n + q.marks, 0);

  function finish(auto: boolean) {
    if (finished.current) return;
    finished.current = true;
    const now = Date.now();
    const seconds = Math.min(minutes * 60, Math.round((now - startedAt) / 1000));
    const res = questions.map((q) => ({ q, response: answers[q.id] ?? "", correct: mark(q, answers[q.id] ?? "") }));
    setResults(res);
    setUsedSeconds(auto ? minutes * 60 : seconds);
    setPhase("done");
    saveAttempt({ kind: "mock", mockPaper: paperKey, results: res, seconds }).then(({ id, failed }) => {
      if (failed) setSaveState("failed");
      else if (id) setSaveState("saved");
    });
  }

  // Countdown. The paper is handed in automatically when time runs out.
  useEffect(() => {
    if (phase !== "running") return;
    const tick = () => {
      const remaining = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) finish(true);
    };
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, deadline]);

  if (available < MIN_TOPICS)
    return (
      <p>
        This paper needs at least {MIN_TOPICS} approved topics that fit it (there {available === 1 ? "is" : "are"} {available} so far). Ask a parent to approve more topics.
      </p>
    );

  if (phase === "intro") {
    return (
      <div className="space-y-4">
        <p className="text-lg">
          {PAPERS[paperKey].count} questions · {minutes} minutes
        </p>
        <ul className="list-disc space-y-1 pl-5 opacity-80">
          <li>Every paper is brand new, with different numbers each time.</li>
          <li>The timer starts when you press Start.</li>
          <li>You will not see whether you are right until you hand in.</li>
          <li>The paper is handed in automatically when the time is up.</li>
        </ul>
        <button
          className="rounded-full bg-indigo-600 px-8 py-3 text-lg font-semibold text-white"
          onClick={() => {
            const now = Date.now();
            setQuestions(buildPaper(liveTopics, paperKey, randomSeed()));
            setAnswers({});
            finished.current = false;
            setStartedAt(now);
            setDeadline(now + minutes * 60 * 1000);
            setLeft(minutes * 60);
            setPhase("running");
          }}
        >
          Start
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const score = results.reduce((n, r) => n + (r.correct ? r.q.marks : 0), 0);
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">
          {score}/{totalMarks} marks <span className="text-lg font-normal opacity-70">({Math.round((100 * score) / totalMarks)}%)</span>
        </h2>
        <p className="opacity-70">Time used: {clock(usedSeconds)}</p>
        {saveState === "saved" && <p className="text-sm text-green-600">Saved to your history.</p>}
        {saveState === "failed" && <p className="text-sm text-red-600">Could not save this attempt.</p>}
        <ul className="space-y-3">
          {results.map((r, i) => (
            <li key={r.q.id} className="rounded-xl border border-black/10 p-4 dark:border-white/15">
              <p className="font-medium">
                {r.correct ? "✅" : "❌"} {i + 1}. <MathText text={r.q.prompt} /> <span className="text-sm opacity-60">[{r.q.marks}]</span>
              </p>
              {!r.correct && (
                <p className="mt-1 text-sm">
                  You wrote <b>{r.response || "(nothing)"}</b>. Correct:{" "}
                  <b>
                    <MathText text={`${r.q.unit ?? ""}${r.q.answer}`} />
                  </b>
                </p>
              )}
              <p className="mt-1 text-sm opacity-70">
                <MathText text={r.q.explanation} />
              </p>
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <button
            className="rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white"
            onClick={() => {
              setPhase("intro");
              setSaveState("idle");
            }}
          >
            New paper
          </button>
          <Link href="/mock/" className="rounded-full border border-black/20 px-6 py-3 font-semibold dark:border-white/30">
            Back to mock papers
          </Link>
        </div>
      </div>
    );
  }

  const answered = questions.filter((q) => (answers[q.id] ?? "").trim() !== "").length;
  const low = left <= 300;
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-6 mb-6 flex items-center justify-between bg-[var(--background)] px-6 py-3 shadow-sm">
        <p className={`text-2xl font-bold tabular-nums ${low ? "text-red-600" : ""}`} aria-live="off">
          ⏱ {clock(left)}
        </p>
        <p className="text-sm opacity-70">
          {answered}/{questions.length} answered
        </p>
      </div>
      <ol className="space-y-6">
        {questions.map((q, i) => (
          <li key={q.id} className="rounded-xl border border-black/10 p-4 dark:border-white/15">
            <p className="text-lg">
              <b>{i + 1}.</b> <MathText text={q.prompt} /> <span className="text-sm opacity-60">[{q.marks} mark{q.marks > 1 ? "s" : ""}]</span>
            </p>
            <div className="mt-3 flex items-center gap-2">
              {q.unit && <span className="text-xl">{q.unit}</span>}
              <input
                inputMode={q.format === "fraction" ? "text" : "decimal"}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                className="w-40 rounded-lg border border-black/20 bg-transparent px-3 py-2 text-xl dark:border-white/30"
                aria-label={`Answer to question ${i + 1}`}
              />
            </div>
          </li>
        ))}
      </ol>
      <button
        className="mt-8 rounded-full bg-indigo-600 px-8 py-3 text-lg font-semibold text-white"
        onClick={() => {
          if (answered === questions.length || window.confirm(`You have answered ${answered} of ${questions.length}. Hand in now?`)) finish(false);
        }}
      >
        Hand in
      </button>
    </div>
  );
}
