import Link from "next/link";
import HomeStatus from "@/components/HomeStatus";
import HomeHeader from "@/components/HomeHeader";
import RequireLogin from "@/components/RequireLogin";
import { TOPICS } from "@/lib/topics";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <HomeHeader />
      <h1 className="text-4xl font-bold">Maths Practice</h1>
      <p className="mt-2 text-lg opacity-70">
        KS2 SATs practice for Mishitha. Pick a topic to start.
      </p>
      <RequireLogin>
        <HomeStatus />
        <Link
        href="/mock/"
        className="mt-4 block rounded-2xl border border-indigo-500/50 p-5 transition hover:border-indigo-500"
      >
        <span className="text-xl font-semibold">⏱ Mock SATs papers</span>
        <span className="mt-1 block opacity-70">Arithmetic and Reasoning papers against the clock</span>
      </Link>
      <ul className="mt-4 space-y-4">
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
      </RequireLogin>
    </main>
  );
}
