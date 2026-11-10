"use client";

import { normCoordinate, parseShape } from "@/lib/marking";
import type { Question } from "@/lib/types";
import Figure from "./Figure";
import Scratchpad from "./Scratchpad";

// The figure (if any) plus the right kind of answer control for the question's format.
export default function AnswerInput({
  q,
  value,
  onChange,
  disabled,
  onEnter,
  autoFocus,
}: {
  q: Question;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  onEnter?: () => void;
  autoFocus?: boolean;
}) {
  const picked = q.format === "plot" && value ? normCoordinate(value).split(",").map(Number) : null;
  const selected = picked && picked.length === 2 ? { x: picked[0], y: picked[1] } : null;
  const shape = q.format === "draw" ? parseShape(value) : [];
  const setShape = (pts: { x: number; y: number }[]) => onChange(pts.map((p) => `${p.x},${p.y}`).join(";"));
  const toggle = (x: number, y: number) => {
    const exists = shape.some((p) => p.x === x && p.y === y);
    setShape(exists ? shape.filter((p) => !(p.x === x && p.y === y)) : [...shape, { x, y }]);
  };

  return (
    <div>
      {q.figure && (
        <Figure
          figure={q.figure}
          selected={selected}
          onPick={q.format === "plot" && !disabled ? (x, y) => onChange(`${x},${y}`) : undefined}
          drawn={q.format === "draw" ? shape : undefined}
          onToggle={q.format === "draw" && !disabled ? toggle : undefined}
        />
      )}
      {q.format === "draw" && (
        <div className="text-sm">
          <p className="opacity-70">
            Tap each corner of your shape on the grid. Tap a corner again to remove it.
            {shape.length > 0 ? ` Corners so far: ${shape.length}.` : ""}
          </p>
          <div className="mt-1 flex gap-3">
            <button type="button" className="underline" disabled={disabled || shape.length === 0} onClick={() => setShape(shape.slice(0, -1))}>
              Undo last corner
            </button>
            <button type="button" className="underline" disabled={disabled || shape.length === 0} onClick={() => setShape([])}>
              Clear
            </button>
          </div>
        </div>
      )}
      {q.format === "plot" && (
        <p className="text-sm opacity-70">{selected ? `You picked (${selected.x}, ${selected.y}).` : "Tap the grid to place your point."}</p>
      )}
      {q.format === "choice" && (
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Choose an answer">
          {(q.options ?? []).map((o) => (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={value === o}
              disabled={disabled}
              onClick={() => onChange(o)}
              className={`rounded-2xl border-2 px-4 py-2 text-lg font-bold ${
                value === o ? "border-indigo-600 bg-indigo-600 text-white" : "border-[#c9d4ee] bg-white"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
      {(q.format === "numeric" || q.format === "fraction" || q.format === "coordinate") && (
        <>
          <div className="mt-2 flex items-center gap-2">
            {q.unit && <span className="text-2xl">{q.unit}</span>}
            <input
              inputMode={q.format === "numeric" ? "decimal" : "text"}
              autoFocus={autoFocus}
              disabled={disabled}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onEnter?.();
              }}
              className="w-44 rounded-2xl border-2 border-[#c9d4ee] bg-white px-4 py-3 text-2xl font-bold focus:border-indigo-500 focus:outline-none"
              aria-label="Your answer"
            />
          </div>
          {q.format === "fraction" && (
            <p className="mt-1 text-sm opacity-70">Write fractions like 3/4 and mixed numbers like 4 1/5, in simplest form.</p>
          )}
          {q.format === "coordinate" && <p className="mt-1 text-sm opacity-70">Write the coordinates like 3,-2 (x first, then y).</p>}
        </>
      )}
      {!disabled && <Scratchpad />}
    </div>
  );
}
