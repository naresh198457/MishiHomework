import Link from "next/link";
import RequireLogin from "@/components/RequireLogin";
import Quiz from "@/components/Quiz";
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
      <Link href="/" className="text-sm underline">
        ← Back
      </Link>
      <div className="mt-6">
        <RequireLogin>
          <Quiz title={topicTitle(topic)} questions={questions} />
        </RequireLogin>
      </div>
    </main>
  );
}
