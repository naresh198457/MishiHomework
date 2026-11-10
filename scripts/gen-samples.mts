// Writes 8 fixed SAMPLE questions per generated topic as DRAFTS for parent review.
// A topic only goes live once its sample file has approved questions.
// Run: node --experimental-strip-types scripts/gen-samples.mts <topic> [<topic> ...]
import { writeFileSync } from "node:fs";
import { generateQuestion, type Difficulty } from "../src/lib/generators.ts";

const LADDER: Difficulty[] = [1, 1, 2, 2, 2, 3, 3, 3];
for (const topic of process.argv.slice(2)) {
  const qs = LADDER.map((d, i) => {
    const q = generateQuestion(topic, `sample${i + 1}`, d);
    return { ...q, id: `${topic}-${String(i + 1).padStart(3, "0")}`, source: "generated-sample", status: "draft" };
  });
  writeFileSync(`content/questions/${topic}.json`, "[\n" + qs.map((q) => " " + JSON.stringify(q)).join(",\n") + "\n]\n");
  console.log("wrote", topic);
}
