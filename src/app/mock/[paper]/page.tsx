import Link from "next/link";
import MockPaper from "@/components/MockPaper";
import RequireLogin from "@/components/RequireLogin";
import { loadQuestions } from "@/lib/questions";
import { buildPaper, PAPERS, type PaperKey } from "@/lib/mock";
import { TOPICS } from "@/lib/topics";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PAPERS).map((paper) => ({ paper }));
}

export default async function MockPage({ params }: PageProps<"/mock/[paper]">) {
  const { paper } = await params;
  const key = paper as PaperKey;
  const spec = PAPERS[key];
  const questions = buildPaper(
    TOPICS.flatMap((t) => loadQuestions(t.id)),
    key,
  );
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/mock/" className="text-sm underline">
        ← Mock papers
      </Link>
      <h1 className="mb-6 mt-6 text-3xl font-bold">{spec.title}</h1>
      <RequireLogin>
        <MockPaper paperKey={key} minutes={spec.minutes} questions={questions} />
      </RequireLogin>
    </main>
  );
}
