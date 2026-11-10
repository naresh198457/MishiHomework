import { normCoordinate, parseShape } from "@/lib/marking";
import type { Question } from "@/lib/types";
import Figure from "./Figure";

// The question's figure for the results screen, with the correct answer revealed for plotting/drawing questions.
export default function ResultFigure({ q, response }: { q: Question; response: string }) {
  if (!q.figure) return null;
  if (q.format === "plot") {
    const [cx, cy] = normCoordinate(q.answer).split(",").map(Number);
    const mine = normCoordinate(response);
    const [mx, my] = mine ? mine.split(",").map(Number) : [NaN, NaN];
    return <Figure figure={q.figure} show={{ x: cx, y: cy }} selected={mine ? { x: mx, y: my } : null} />;
  }
  if (q.format === "draw") return <Figure figure={q.figure} answerShape={parseShape(q.answer)} drawn={parseShape(response)} />;
  return <Figure figure={q.figure} />;
}
