// A diagram attached to a question. Drawn as SVG by components/Figure.tsx.
export type Figure =
  | { type: "bar"; title: string; labels: string[]; values: number[]; yLabel?: string }
  | { type: "line"; title: string; labels: string[]; values: number[]; yLabel?: string }
  // Pie slices are percentages; a null value is shown as "?"
  | { type: "pie"; title: string; slices: { label: string; value: number | null }[] }
  | { type: "table"; headers: string[]; rows: (string | number)[][] }
  // Angle diagrams: a null angle is the unknown, shown as "?"
  | { type: "triangle"; angles: (number | null)[] }
  | { type: "straight"; angles: (number | null)[] }
  | { type: "point"; angles: (number | null)[] }
  // Coordinate grid (four quadrants). `plot` makes the grid clickable.
  | { type: "grid"; min: number; max: number; points: { x: number; y: number; label: string }[]; plot?: boolean };

export type Question = {
  id: string;
  topic: string;
  paper: "arithmetic" | "reasoning";
  difficulty: number;
  marks: number;
  // numeric: typed number · fraction: typed fraction · choice: pick an option
  // coordinate: typed "x,y" · plot: click a point on the grid
  format: "numeric" | "fraction" | "choice" | "coordinate" | "plot";
  prompt: string;
  answer: string;
  acceptable?: string[];
  options?: string[];
  figure?: Figure;
  unit?: string;
  explanation: string;
  source: string;
  status: "draft" | "approved" | "rejected";
};
