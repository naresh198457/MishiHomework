import { Fragment } from "react";

// Renders text, turning fractions such as "3/4" or "4 1/5" into stacked
// numerator-over-denominator form. Everything else is left as plain text.
const FRACTION = /(?:(\d+)\s+)?(\d+)\/(\d+)/g;

function Stack({ n, d }: { n: string; d: string }) {
  return (
    <span className="mx-0.5 inline-flex flex-col items-center align-middle text-[0.8em] leading-[1.15]" role="math">
      <span className="border-b-2 border-current px-1">{n}</span>
      <span className="px-1">{d}</span>
    </span>
  );
}

export default function MathText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(FRACTION)) {
    const start = m.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <span key={start} className="whitespace-nowrap">
        {m[1] && <span className="mr-0.5">{m[1]}</span>}
        <Stack n={m[2]} d={m[3]} />
      </span>,
    );
    last = start + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}
