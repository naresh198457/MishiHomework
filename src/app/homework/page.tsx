import Link from "next/link";
import HomeworkClient from "@/components/HomeworkClient";
import { loadQuestions } from "@/lib/questions";
import { TOPICS } from "@/lib/topics";

export default function HomeworkPage() {
  const questions = TOPICS.flatMap((t) => loadQuestions(t.id));
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/" className="text-sm underline">
        ← Back
      </Link>
      <h1 className="mb-6 mt-6 text-3xl font-bold">Today&apos;s homework</h1>
      <HomeworkClient questions={questions} />
    </main>
  );
}
