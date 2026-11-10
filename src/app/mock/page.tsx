import Link from "next/link";
import RequireLogin from "@/components/RequireLogin";
import { loadQuestions } from "@/lib/questions";
import { buildPaper, PAPERS, type PaperKey } from "@/lib/mock";
import { TOPICS } from "@/lib/topics";

export default function MockIndex() {
  const all = TOPICS.flatMap((t) => loadQuestions(t.id));
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/" className="text-sm underline">
        ← Back
      </Link>
      <h1 className="mb-2 mt-6 text-3xl font-bold">Mock SATs papers</h1>
      <p className="mb-6 opacity-70">Timed practice papers. You see your marks and corrections at the end.</p>
      <RequireLogin>
        <ul className="space-y-4">
          {(Object.keys(PAPERS) as PaperKey[]).map((key) => {
            const spec = PAPERS[key];
            const n = buildPaper(all, key).length;
            return (
              <li key={key}>
                <Link
                  href={`/mock/${key}/`}
                  className="block rounded-2xl border border-black/10 p-5 transition hover:border-indigo-500 dark:border-white/15"
                >
                  <span className="text-xl font-semibold">{spec.title}</span>
                  <span className="mt-1 block opacity-70">
                    {n} questions · {spec.minutes} minutes
                    {n < spec.count ? ` (only ${n} approved questions so far, aiming for ${spec.count})` : ""}
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
