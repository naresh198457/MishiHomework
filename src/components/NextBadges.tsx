import Link from "next/link";
import { nextUp, type Stats } from "@/lib/badges";

// "How to earn your next badge": the badges a child is closest to, with the exact thing to do.
export default function NextBadges({ stats, count = 3, title = "🎯 Badges you can earn next", showLink = true }: { stats: Stats; count?: number; title?: string; showLink?: boolean }) {
  const items = nextUp(stats, count);
  if (items.length === 0) return <p className="font-bold">🏅 You have earned every badge. Amazing!</p>;
  return (
    <section className="card p-4">
      <h3 className="mb-2 text-lg font-extrabold">{title}</h3>
      <ul className="space-y-3">
        {items.map(({ badge, value }) => (
          <li key={badge.id} className="flex items-center gap-3">
            <span className="text-4xl" aria-hidden style={{ filter: "grayscale(0.6)" }}>
              {badge.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold leading-tight">{badge.title}</span>
              <span className="block text-sm">
                <b>How to earn:</b> {badge.desc}
              </span>
              <span className="mt-1 flex items-center gap-2">
                <span className="block h-2.5 flex-1 overflow-hidden rounded-full bg-[#e3e9f3]">
                  <span className="block h-full rounded-full" style={{ width: `${(value / badge.target) * 100}%`, background: "var(--series-1)" }} />
                </span>
                <span className="text-xs font-bold">
                  {value} / {badge.target}
                </span>
              </span>
            </span>
          </li>
        ))}
      </ul>
      {showLink && (
        <Link href="/badges/" className="mt-3 inline-block text-sm font-bold underline">
          See all badges
        </Link>
      )}
    </section>
  );
}
