export type Question = {
  id: string;
  topic: string;
  paper: "arithmetic" | "reasoning";
  difficulty: number;
  marks: number;
  format: "numeric";
  prompt: string;
  answer: string;
  acceptable?: string[];
  unit?: string;
  explanation: string;
  source: string;
  status: "draft" | "approved" | "rejected";
};
