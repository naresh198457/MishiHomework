/* eslint-disable @typescript-eslint/no-explicit-any */
// Independent re-computation for the newer topics: parses the prompt and the figure data,
// computes the answer a different way from the generator, and returns it (or null if not covered).
const SH: Record<string, { sym: number; right: number; par: number; sides: number }> = {
  Square: { sym: 4, right: 4, par: 2, sides: 4 },
  Rectangle: { sym: 2, right: 4, par: 2, sides: 4 },
  Rhombus: { sym: 2, right: 0, par: 2, sides: 4 },
  Parallelogram: { sym: 0, right: 0, par: 2, sides: 4 },
  Kite: { sym: 1, right: 0, par: 0, sides: 4 },
  "Equilateral triangle": { sym: 3, right: 0, par: 0, sides: 3 },
  "Right-angled triangle": { sym: 0, right: 1, par: 0, sides: 3 },
  "Regular pentagon": { sym: 5, right: 0, par: 0, sides: 5 },
  "Regular hexagon": { sym: 6, right: 0, par: 3, sides: 6 },
};
const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};
const sumOf = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x);
const g = (s: string) => Number(s.replace("−", "-"));
const known = (a: (number | null)[]) => a.filter((v): v is number => v !== null);

type Q = { prompt: string; answer: string; figure?: any; options?: string[]; format: string };

export function verifyMore(q: Q, topic: string): string | null {
  const p = q.prompt;
  const f = q.figure;
  let m: RegExpMatchArray | null;

  if (f?.type === "triangle" || f?.type === "straight") return String(180 - sumOf(known(f.angles)));
  if (f?.type === "point") return String(360 - sumOf(known(f.angles)));
  if (f?.type === "table") return String(sumOf(f.rows.map((r: (string | number)[]) => Number(r[1]))));
  if (f?.type === "pie") {
    if (f.slices.some((s: { value: number | null }) => s.value === null))
      return String(100 - sumOf(f.slices.filter((s: { value: number | null }) => s.value !== null).map((s: { value: number }) => s.value)));
    const t = p.match(/^(\d+) children .*by (\w+)\?$/);
    if (t) {
      const s = f.slices.find((x: { label: string }) => x.label.toLowerCase() === t[2]);
      return String((Number(t[1]) * s.value) / 100);
    }
  }
  if (f?.type === "line" && (m = p.match(/between (\S+) and (\S+)\?/))) return String(f.values[f.labels.indexOf(m[2])] - f.values[f.labels.indexOf(m[1])]);
  if (f?.type === "bar") {
    if ((m = p.match(/more .* shown for (\S+) than for (\S+)\?$/))) return String(f.values[f.labels.indexOf(m[1])] - f.values[f.labels.indexOf(m[2])]);
    if ((m = p.match(/shown for (\S+)\?$/))) return String(f.values[f.labels.indexOf(m[1])]);
    if (p.includes("altogether")) return String(sumOf(f.values));
  }
  if ((m = p.match(/^What is the mean of ([\d, ]+)\?$/))) {
    const a = m[1].split(",").map(Number);
    return String(sumOf(a) / a.length);
  }
  if ((m = p.match(/^The mean of (\d+) numbers is (\d+)\. \d+ of the numbers are ([\d, ]+)\./)))
    return String(Number(m[1]) * Number(m[2]) - sumOf(m[3].split(",").map(Number)));

  if (topic === "transformations" && f?.type === "grid" && f.polygon) {
    const poly: [number, number][] = f.polygon;
    let out: [number, number][] | null = null;
    if ((m = p.match(/^Translate the shape (.+)\. Tap/))) {
      let dx = 0, dy = 0;
      for (const part of m[1].split(" and ")) {
        const [n, dir] = part.split(" ");
        if (dir === "right") dx += Number(n);
        if (dir === "left") dx -= Number(n);
        if (dir === "up") dy += Number(n);
        if (dir === "down") dy -= Number(n);
      }
      out = poly.map(([x, y]) => [x + dx, y + dy]);
    } else if ((m = p.match(/mirror line \((x|y) = (\d+)\)/))) {
      const k = Number(m[2]);
      out = poly.map(([x, y]) => (m![1] === "x" ? [2 * k - x, y] : [x, 2 * k - y]));
    }
    if (out) {
      if (out.some(([x, y]) => x < 0 || x > 10 || y < 0 || y > 10)) return "OFF-GRID";
      return [...out].sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([x, y]) => `${x},${y}`).join(";");
    }
  }

  if (topic === "coordinates") {
    const at = p.match(/Point A is at \((−?\d+), (−?\d+)\)/);
    if (at && (m = p.match(/translated (.+)\. What/))) {
      let [x, y] = [g(at[1]), g(at[2])];
      for (const part of m[1].split(" and ")) {
        const [n, dir] = part.split(" ");
        const k = Number(n);
        if (dir === "right") x += k;
        if (dir === "left") x -= k;
        if (dir === "up") y += k;
        if (dir === "down") y -= k;
      }
      return `${x},${y}`;
    }
    if (at && (m = p.match(/reflected in the (\w)-axis/))) {
      const [x, y] = [g(at[1]), g(at[2])];
      return m[1] === "y" ? `${-x},${y}` : `${x},${-y}`;
    }
    if (f?.type === "grid" && f.points.length === 1 && p.startsWith("What are the coordinates")) return `${f.points[0].x},${f.points[0].y}`;
    if (f?.type === "grid" && f.points.length === 3) return `${f.points[0].x},${f.points[2].y}`;
    if (q.format === "plot" && (m = p.match(/^Plot the point \((−?\d+), (−?\d+)\)/))) return `${g(m[1])},${g(m[2])}`;
  }

  if (topic === "shape-properties") {
    if ((m = p.match(/^How many lines of symmetry does a (.+) have\?$/))) return String(SH[Object.keys(SH).find((n) => n.toLowerCase() === m![1])!].sym);
    if (q.format === "choice") {
      const tests: Record<string, (s: (typeof SH)[string]) => boolean> = {
        "has no lines of symmetry": (s) => s.sym === 0,
        "has four right angles": (s) => s.right === 4,
        "has no parallel sides": (s) => s.par === 0,
        "has exactly 5 sides": (s) => s.sides === 5,
        "has exactly one line of symmetry": (s) => s.sym === 1,
        "has exactly one right angle": (s) => s.right === 1,
      };
      const t = Object.keys(tests).find((k) => p.includes(k))!;
      const ok = q.options!.filter((o) => tests[t](SH[o]));
      return ok.length === 1 ? ok[0] : "NOT-UNIQUE";
    }
  }

  if (topic === "sequences") {
    if ((m = p.match(/^What is the next number in the sequence ([\d, ]+), \.\.\.\?$/))) {
      const a = m[1].split(",").map(Number);
      return String(a[3] + (a[1] - a[0]));
    }
    if ((m = p.match(/^What is the (\d+)th multiple of (\d+)\?$/))) return String(Number(m[1]) * Number(m[2]));
    if ((m = p.match(/^How many factors does (\d+) have\?$/))) {
      let c = 0;
      for (let i = 1; i <= Number(m[1]); i++) if (Number(m[1]) % i === 0) c++;
      return String(c);
    }
    if (p === "Which of these numbers is a prime number?") {
      const pr = q.options!.filter((o) => isPrime(Number(o)));
      return pr.length === 1 ? pr[0] : "NOT-UNIQUE";
    }
    if ((m = p.match(/^What is the lowest common multiple of (\d+) and (\d+)\?$/))) {
      const [a, b] = [Number(m[1]), Number(m[2])];
      let l = a;
      while (l % b) l += a;
      return String(l);
    }
    if ((m = p.match(/^What is the highest common factor of (\d+) and (\d+)\?$/))) {
      const [a, b] = [Number(m[1]), Number(m[2])];
      let d = Math.min(a, b);
      while (a % d || b % d) d--;
      return String(d);
    }
    if ((m = p.match(/^What is (\d+)²\?/))) return String(Number(m[1]) ** 2);
    if ((m = p.match(/^Find the missing number in the sequence (.+)\.$/))) {
      const items = m[1].split(", ");
      const idx = items.indexOf("?");
      const nums = items.map(Number);
      const first = nums.findIndex((x) => !Number.isNaN(x));
      const second = nums.findIndex((x, k) => k > first && !Number.isNaN(x));
      const step = (nums[second] - nums[first]) / (second - first);
      return String(nums[first] + step * (idx - first));
    }
  }

  if (topic === "volume") {
    if ((m = p.match(/^A cuboid is (\d+) cm long, (\d+) cm wide and (\d+) cm tall/))) return String(Number(m[1]) * Number(m[2]) * Number(m[3]));
    if ((m = p.match(/^A cube has sides of (\d+) cm/))) return String(Number(m[1]) ** 3);
    if ((m = p.match(/volume of (\d+) cm³\. It is (\d+) cm long and (\d+) cm wide/))) return String(Number(m[1]) / (Number(m[2]) * Number(m[3])));
    if ((m = p.match(/Box A is (\d+) cm by (\d+) cm by (\d+) cm\. Box B is (\d+) cm by (\d+) cm by (\d+) cm/)))
      return String(Number(m[1]) * Number(m[2]) * Number(m[3]) + Number(m[4]) * Number(m[5]) * Number(m[6]));
    if ((m = p.match(/^A tank is (\d+) cm long, (\d+) cm wide and (\d+) cm tall/))) return String((Number(m[1]) * Number(m[2]) * Number(m[3])) / 1000);
    if ((m = p.match(/^(\d+) cubes with sides of (\d+) cm/))) return String(Number(m[1]) * Number(m[2]) ** 3);
  }

  if (topic === "algebra") {
    if ((m = p.match(/^a = (\d+)\. Work out the value of (\d+)a \+ (\d+)\.$/))) return String(Number(m[2]) * Number(m[1]) + Number(m[3]));
    if ((m = p.match(/^n \+ (\d+) = (\d+)\. What is the value of n\?$/))) return String(Number(m[2]) - Number(m[1]));
    if ((m = p.match(/^a = (\d+) and b = (\d+)\. Work out the value of (\d+)a \+ b\.$/))) return String(Number(m[3]) * Number(m[1]) + Number(m[2]));
    if ((m = p.match(/^(\d+)n \+ (\d+) = (\d+)\. What is the value of n\?$/))) return String((Number(m[3]) - Number(m[2])) / Number(m[1]));
    if ((m = p.match(/^The nth term of a sequence is (\d+)n (\+|−) (\d+)\. What is the (\d+)th term\?$/)))
      return String(Number(m[1]) * Number(m[4]) + (m[2] === "+" ? 1 : -1) * Number(m[3]));
    if ((m = p.match(/^x = (\d+)\. Work out the value of (\d+)\(x \+ (\d+)\)\.$/))) return String(Number(m[2]) * (Number(m[1]) + Number(m[3])));
    if ((m = p.match(/costs £(\d+) plus £(\d+) for every mile.*How much does a (\d+)-mile/))) return String(Number(m[1]) + Number(m[2]) * Number(m[3]));
  }

  if (topic === "fractions-equivalent") {
    if ((m = p.match(/^Simplify (\d+)\/(\d+)\.$/))) {
      const d = gcd(Number(m[1]), Number(m[2]));
      return `${Number(m[1]) / d}/${Number(m[2]) / d}`;
    }
    if ((m = p.match(/^Fill in the missing number: (\d+)\/(\d+) = ■\/(\d+)$/))) return String((Number(m[1]) * Number(m[3])) / Number(m[2]));
    if ((m = p.match(/^Write (\d+)\/(\d+) as a mixed number\.$/))) return `${Math.floor(Number(m[1]) / Number(m[2]))} ${Number(m[1]) % Number(m[2])}/${m[2]}`;
    if ((m = p.match(/^Write (\d+) (\d+)\/(\d+) as an improper fraction\.$/))) return `${Number(m[1]) * Number(m[3]) + Number(m[2])}/${m[3]}`;
    if ((m = p.match(/^Which fraction is larger: (\d+)\/(\d+) or (\d+)\/(\d+)\?$/)))
      return Number(m[1]) * Number(m[4]) > Number(m[3]) * Number(m[2]) ? `${m[1]}/${m[2]}` : `${m[3]}/${m[4]}`;
  }

  if (topic === "fdp-conversions") {
    if ((m = p.match(/^Write (\d+)\/(\d+) as a decimal\.$/))) return String(Math.round((Number(m[1]) / Number(m[2])) * 1e6) / 1e6);
    if ((m = p.match(/^Write ([\d.]+) as a percentage/))) return String(Math.round(Number(m[1]) * 100));
    if ((m = p.match(/^Write (\d+)% as a decimal\.$/))) return String(Number(m[1]) / 100);
    if ((m = p.match(/^Write (\d+)\/(\d+) as a percentage/))) return String((Number(m[1]) * 100) / Number(m[2]));
    if ((m = p.match(/^Write (\d+)% as a fraction in simplest form\.$/))) {
      const d = gcd(Number(m[1]), 100);
      return `${Number(m[1]) / d}/${100 / d}`;
    }
    if ((m = p.match(/^Write ([\d.]+) as a fraction in simplest form\.$/))) {
      const top = Math.round(Number(m[1]) * 100);
      const d = gcd(top, 100);
      return `${top / d}/${100 / d}`;
    }
  }

  if (topic === "decimals") {
    if ((m = p.match(/^([\d.]+) (×|÷) (\d+) =$/))) {
      const v = m[2] === "×" ? Number(m[1]) * Number(m[3]) : Number(m[1]) / Number(m[3]);
      return String(Math.round(v * 1e6) / 1e6);
    }
    if ((m = p.match(/^Round (\d)\.(\d{3}) to (\d) decimal/))) {
      const thousandths = Number(m[1]) * 1000 + Number(m[2]);
      const unit = m[3] === "1" ? 100 : 10;
      return String(Math.floor((thousandths + unit / 2) / unit) / (m[3] === "1" ? 10 : 100));
    }
    if (q.format === "choice") {
      const v = q.options!.map(Number);
      return String(p.includes("largest") ? Math.max(...v) : Math.min(...v));
    }
  }
  return null;
}
