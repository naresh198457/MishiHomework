import Link from "next/link";
import RequireLogin from "@/components/RequireLogin";
import TopicQuizLoader from "@/components/TopicQuizLoader";
import { loadQuestions } from "@/lib/questions";
import { TOPICS, topicTitle } from "@/lib/topics";

export const dynamicParams = false;

export function generateStaticParams() {
  return TOPICS.map((t) => ({ topic: t.id }));
}

export default async function PracticePage({ params }: PageProps<"/practice/[topic]">) {
  const { topic } = await params;
  const questions = loadQuestions(topic);
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/" className="btn-ghost !px-4 !py-1.5 text-sm">
        ← Back
      </Link>
      <div className="mt-6">
        <RequireLogin>
          <TopicQuizLoader topic={topic} title={topicTitle(topic)} fixed={questions} />
        </RequireLogin>
      </div>
    </main>
  );
}
