import Link from "next/link";
import ReviewClient from "@/components/ReviewClient";
import { hasGenerator } from "@/lib/generators";
import { loadQuestions } from "@/lib/questions";
import { TOPICS } from "@/lib/topics";

export default function ReviewPage() {
  const topics = TOPICS.filter((t) => hasGenerator(t.id)).map((t) => ({
    id: t.id,
    title: t.title,
    live: loadQuestions(t.id).length > 0,
  }));
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/" className="btn-ghost !px-4 !py-1.5 text-sm">
        ← Back
      </Link>
      <h1 className="mb-2 mt-6 text-3xl font-bold">Parent review</h1>
      <p className="mb-6 opacity-70">
        Preview new questions with their answers, and report anything that looks wrong. Not visible to children.
      </p>
      <ReviewClient topics={topics} />
    </main>
  );
}
