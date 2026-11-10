"use client";

import { useCallback, useState } from "react";
import { generateQuestion, randomSeed, type Difficulty } from "@/lib/generators";
import { supabase } from "@/lib/supabase";
import type { Question } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import MathText from "./MathText";
import RequireLogin from "./RequireLogin";
import ResultFigure from "./ResultFigure";

type TopicInfo = { id: string; title: string; live: boolean };
type Report = { id: string; question_id: string; topic_id: string; prompt: string; answer: string; note: string | null; resolved: boolean; created_at: string };

const LADDER: Difficulty[] = [1, 1, 1, 2, 2, 2, 3, 3, 3, 3];
const FORMAT_LABEL: Record<Question["format"], string> = {
  numeric: "type a number",
  fraction: "type a fraction",
  choice: "multiple choice",
  coordinate: "type coordinates",
  plot: "tap a point on the grid",
  draw: "draw a shape on the grid",
};

function makeSamples(topic: string): Question[] {
  if (!topic) return [];
  const base = randomSeed();
  return LADDER.map((d, i) => generateQuestion(topic, `${base}${i}`, d));
}

function QuestionCard({ q, onReport, reported }: { q: Question; onReport: (note: string) => Promise<boolean>; reported: boolean }) {
  const [noting, setNoting] = useState(false);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "failed">("idle");
  return (
    <li className="card p-4">
      <p className="text-xs opacity-60">
        Level {q.difficulty} · {q.marks} mark{q.marks > 1 ? "s" : ""} · {q.paper} paper · {FORMAT_LABEL[q.format]}
      </p>
      <p className="mt-1 text-lg font-medium">
        <MathText text={q.prompt} />
      </p>
      <ResultFigure q={q} response={q.answer} />
      {q.options && <p className="text-sm opacity-80">Options: {q.options.join(" · ")}</p>}
      <p className="mt-1">
        Answer:{" "}
        <b>
          <MathText text={`${q.unit ?? ""}${q.answer}`} />
        </b>
        {q.acceptable && <span className="text-sm opacity-70"> (also accepts {q.acceptable.join(", ")})</span>}
      </p>
      <p className="mt-1 text-sm opacity-70">
        <MathText text={q.explanation} />
      </p>
      <div className="mt-3 text-sm">
        {reported ? (
          <span className="text-green-600">✔ Reported. Thank you.</span>
        ) : !noting ? (
          <button className="underline" onClick={() => setNoting(true)}>
            ⚠ Something looks wrong
          </button>
        ) : (
          <div className="space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What is wrong? (optional)"
              className="w-full rounded-xl border-2 border-[#c9d4ee] bg-white p-2"
              rows={2}
            />
            <div className="flex gap-3">
              <button
                disabled={state === "saving"}
                className="btn"
                onClick={async () => {
                  setState("saving");
                  const ok = await onReport(note);
                  setState(ok ? "idle" : "failed");
                }}
              >
                Send report
              </button>
              <button className="underline" onClick={() => setNoting(false)}>
                Cancel
              </button>
              {state === "failed" && <span className="text-red-600">Could not save the report.</span>}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function Review({ topics }: { topics: TopicInfo[] }) {
  const { role, session } = useAuth();
  const [tab, setTab] = useState<"preview" | "reports">("preview");
  const [topic, setTopic] = useState(topics[0]?.id ?? "");
  const [questions, setQuestions] = useState<Question[]>(() => makeSamples(topics[0]?.id ?? ""));
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [reports, setReports] = useState<Report[] | null>(null);

  const regenerate = (t: string) => {
    setQuestions(makeSamples(t));
    setReportedIds(new Set());
  };

  const loadReports = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("question_reports").select("id, question_id, topic_id, prompt, answer, note, resolved, created_at").order("created_at", { ascending: false }).limit(100);
    setReports((data as Report[]) ?? []);
  }, []);

  if (role !== "parent") {
    return (
      <div className="space-y-2">
        <p className="text-lg font-semibold">This page is for parents.</p>
        <p className="opacity-70">
          {session && role === null
            ? "Your account has not been marked as a parent yet. Run supabase/migrations/002_review.sql with the right email addresses."
            : "Please ask a parent to open this page."}
        </p>
      </div>
    );
  }

  async function report(q: Question, note: string) {
    if (!supabase || !session) return false;
    const { error } = await supabase.from("question_reports").insert({
      user_id: session.user.id,
      question_id: q.id,
      topic_id: q.topic,
      prompt: q.prompt,
      answer: q.answer,
      figure: q.figure ?? null,
      note: note.trim() || null,
    });
    if (!error) setReportedIds((s) => new Set(s).add(q.id));
    return !error;
  }

  const current = topics.find((t) => t.id === topic);
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["preview", "reports"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              if (t === "reports") void loadReports();
            }}
            className={`rounded-full px-4 py-1.5 font-semibold ${tab === t ? "bg-indigo-600 text-white" : "border border-black/20 dark:border-white/30"}`}
          >
            {t === "preview" ? "Preview questions" : "Reports"}
          </button>
        ))}
      </div>

      {tab === "preview" && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                regenerate(e.target.value);
              }}
              className="rounded-xl border-2 border-[#c9d4ee] bg-white px-3 py-2"
              aria-label="Topic"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id} className="text-black">
                  {t.title} {t.live ? "" : "(not live yet)"}
                </option>
              ))}
            </select>
            <button className="btn" onClick={() => regenerate(topic)}>
              New samples
            </button>
          </div>
          {current && !current.live && (
            <p className="rounded-lg bg-amber-500/15 p-3 text-sm">
              This topic is <b>not live</b>: children cannot see it until its sample file in content/questions/ has approved questions.
            </p>
          )}
          <ul className="space-y-4">
            {questions.map((q) => (
              <QuestionCard key={q.id} q={q} reported={reportedIds.has(q.id)} onReport={(note) => report(q, note)} />
            ))}
          </ul>
        </>
      )}

      {tab === "reports" && (
        <div className="space-y-3">
          {reports === null ? (
            <p>Loading…</p>
          ) : reports.length === 0 ? (
            <p>No reports yet.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className={`card p-4 ${r.resolved ? "opacity-60" : ""}`}>
                <p className="text-xs opacity-60">
                  {new Date(r.created_at).toLocaleString("en-GB")} · {r.topic_id} · {r.question_id}
                </p>
                <p className="mt-1 font-medium">
                  <MathText text={r.prompt} />
                </p>
                <p className="text-sm">Answer given: <b>{r.answer}</b></p>
                {r.note && <p className="mt-1 text-sm">“{r.note}”</p>}
                <div className="mt-2 flex gap-4 text-sm">
                  <button
                    className="underline"
                    onClick={async () => {
                      await supabase?.from("question_reports").update({ resolved: !r.resolved }).eq("id", r.id);
                      void loadReports();
                    }}
                  >
                    {r.resolved ? "Re-open" : "Mark as fixed"}
                  </button>
                  <button
                    className="underline"
                    onClick={async () => {
                      await supabase?.from("question_reports").delete().eq("id", r.id);
                      void loadReports();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ReviewClient({ topics }: { topics: TopicInfo[] }) {
  return (
    <RequireLogin>
      <Review topics={topics} />
    </RequireLogin>
  );
}
