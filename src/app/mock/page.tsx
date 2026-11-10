import Link from "next/link";
import RequireLogin from "@/components/RequireLogin";
import { loadQuestions } from "@/lib/questions";
import { MIN_TOPICS, PAPERS, topicsForPaper, type PaperKey } from "@/lib/mock";
import { TOPICS } from "@/lib/topics";

export default function MockIndex() {
  const liveTopics = TOPICS.filter((t) => loadQuestions(t.id).length > 0).map((t) => t.id);
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/" className="btn-ghost !px-4 !py-1.5 text-sm">
        ← Back
      </Link>
      <h1 className="mb-2 mt-6 text-3xl font-bold">Mock SATs papers</h1>
      <p className="mb-6 opacity-70">
        Timed practice papers. Every paper is brand new, and you see your marks and corrections at the end.
      </p>
      <RequireLogin>
        <ul className="space-y-4">
          {(Object.keys(PAPERS) as PaperKey[]).map((key) => {
            const spec = PAPERS[key];
            const n = topicsForPaper(liveTopics, key).length;
            return (
              <li key={key}>
                <Link
                  href={`/mock/${key}/`}
                  className="card block p-5 transition hover:-translate-y-0.5"
                >
                  <span className="text-xl font-semibold">{spec.title}</span>
                  <span className="mt-1 block opacity-70">
                    {spec.count} questions · {spec.minutes} minutes
                    {n < MIN_TOPICS ? ` (needs ${MIN_TOPICS} approved topics, has ${n})` : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </RequireLogin>
    </main>
  );
}
