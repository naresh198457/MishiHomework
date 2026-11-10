import Link from "next/link";
import HomeHeader from "@/components/HomeHeader";
import HomeStatus from "@/components/HomeStatus";
import Greeting from "@/components/Greeting";
import RequireLogin from "@/components/RequireLogin";
import { loadQuestions } from "@/lib/questions";
import { GROUPS, TOPICS } from "@/lib/topics";

export default function Home() {
  // Only topics with approved questions are shown to children.
  const live = TOPICS.filter((t) => loadQuestions(t.id).length > 0);
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      <HomeHeader />
      <header className="mb-6 text-center">
        <p className="text-6xl" aria-hidden>
          🦉
        </p>
        <h1 className="mt-2 text-4xl font-extrabold">
          <Greeting />
        </h1>
        <p className="mt-1 text-lg font-semibold" style={{ color: "var(--chart-muted)" }}>
          Ready for some maths? Pick something fun to practise!
        </p>
      </header>

      <RequireLogin>
        <HomeStatus />

        <Link href="/mock/" className="card mt-5 flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
          <span className="text-4xl" aria-hidden>
            ⏱️
          </span>
          <span>
            <span className="block text-xl font-extrabold">Mock SATs papers</span>
            <span className="block" style={{ color: "var(--chart-muted)" }}>
              Race the clock with a real-test-style paper
            </span>
          </span>
        </Link>

        <h2 className="mb-1 mt-10 text-2xl font-extrabold">Pick a topic</h2>
        <p className="mb-2" style={{ color: "var(--chart-muted)" }}>
          {live.length} topics to explore. Every time you play, the questions are new!
        </p>

        {GROUPS.map((g) => {
          const topics = live.filter((t) => t.group === g.id);
          if (topics.length === 0) return null;
          return (
            <section key={g.id} className="mt-8">
              <h3 className="mb-3 flex items-center gap-2 text-xl font-extrabold" style={{ color: g.colour }}>
                <span className="text-2xl" aria-hidden>
                  {g.emoji}
                </span>
                {g.title}
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {topics.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/practice/${t.id}/`}
                      className="card flex h-full items-center gap-3 p-4 transition hover:-translate-y-0.5"
                      style={{ borderLeft: `8px solid ${g.colour}` }}
                    >
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                        style={{ background: g.tint }}
                        aria-hidden
                      >
                        {t.emoji}
                      </span>
                      <span>
                        <span className="block text-lg font-extrabold leading-tight">{t.title}</span>
                        <span className="block text-sm" style={{ color: "var(--chart-muted)" }}>
                          {t.blurb}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </RequireLogin>
    </main>
  );
}
