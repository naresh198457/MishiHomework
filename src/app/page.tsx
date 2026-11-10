import Link from "next/link";
import { TOPICS } from "@/lib/topics";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-4xl font-bold">Maths Practice</h1>
      <p className="mt-2 text-lg opacity-70">KS2 SATs practice for Mishitha. Pick a topic to start.</p>
      <ul className="mt-8 space-y-4">
        {TOPICS.map((t) => (
          <li key={t.id}>
            <Link
              href={`/practice/${t.id}/`}
              className="block rounded-2xl border border-black/10 p-5 transition hover:border-indigo-500 dark:border-white/15"
            >
              <span className="text-xl font-semibold">{t.title}</span>
              <span className="mt-1 block opacity-70">{t.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
