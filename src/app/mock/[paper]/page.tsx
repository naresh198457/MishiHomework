import Link from "next/link";
import MockPaper from "@/components/MockPaper";
import RequireLogin from "@/components/RequireLogin";
import { loadQuestions } from "@/lib/questions";
import { PAPERS, type PaperKey } from "@/lib/mock";
import { TOPICS } from "@/lib/topics";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PAPERS).map((paper) => ({ paper }));
}

export default async function MockPage({ params }: PageProps<"/mock/[paper]">) {
  const { paper } = await params;
  const key = paper as PaperKey;
  const spec = PAPERS[key];
  // A topic is "live" once it has approved questions. Papers are then generated fresh in the browser.
  const liveTopics = TOPICS.filter((t) => loadQuestions(t.id).length > 0).map((t) => t.id);
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/mock/" className="text-sm underline">
        ← Mock papers
      </Link>
      <h1 className="mb-6 mt-6 text-3xl font-bold">{spec.title}</h1>
      <RequireLogin>
        <MockPaper paperKey={key} liveTopics={liveTopics} />
      </RequireLogin>
    </main>
  );
}
