import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Question } from "./types";

// Build-time only. Production serves approved questions only; `next dev`
// also shows drafts so the parent can preview them before approving.
export function loadQuestions(topic: string): Question[] {
  const file = join(process.cwd(), "content", "questions", `${topic}.json`);
  const all = JSON.parse(readFileSync(file, "utf8")) as Question[];
  const showDrafts = process.env.NODE_ENV !== "production";
  return all.filter((q) => q.status === "approved" || (showDrafts && q.status === "draft"));
}
