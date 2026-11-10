import type { Figure as FigureSpec } from "@/lib/types";

const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)", "var(--series-6)"];
const INK = "currentColor";
const MUTED = "var(--chart-muted)";
const GRID = "var(--chart-track)";

const niceMax = (v: number) => {
  const step = v <= 10 ? 2 : v <= 20 ? 5 : v <= 50 ? 10 : v <= 100 ? 20 : v <= 200 ? 50 : 100;
  return Math.ceil(v / step) * step || step;
};
const tickStep = (max: number) => (max <= 10 ? 2 : max <= 20 ? 5 : max <= 50 ? 10 : max <= 100 ? 20 : max <= 200 ? 50 : 100);

function Axes({ w, h, max, yLabel, pad }: { w: number; h: number; max: number; yLabel?: string; pad: { l: number; r: number; t: number; b: number } }) {
  const step = tickStep(max);
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  const y = (v: number) => pad.t + (h - pad.t - pad.b) * (1 - v / max);
  return (
    <g fontSize="11" fill={MUTED}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke={GRID} strokeWidth="1" />
          <text x={pad.l - 6} y={y(v) + 4} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      {yLabel && (
        <text x={4} y={pad.t - 12} fontSize="11" fill={MUTED}>
          {yLabel}
        </text>
      )}
    </g>
  );
}

function BarChart({ f }: { f: Extract<FigureSpec, { type: "bar" }> }) {
  const W = 360, H = 220, pad = { l: 36, r: 10, t: 26, b: 34 };
  const max = niceMax(Math.max(...f.values));
  const slot = (W - pad.l - pad.r) / f.values.length;
  const bw = Math.min(28, slot * 0.6);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img" aria-label={`Bar chart: ${f.title}`}>
      <Axes w={W} h={H} max={max} yLabel={f.yLabel} pad={pad} />
      {f.values.map((v, i) => {
        const x = pad.l + slot * i + (slot - bw) / 2;
        return (
          <g key={i}>
            <rect x={x} y={y(v)} width={bw} height={H - pad.b - y(v)} rx="3" fill="var(--series-1)" />
            <text x={x + bw / 2} y={H - pad.b + 14} fontSize="11" textAnchor="middle" fill={INK}>
              {f.labels[i]}
            </text>
          </g>
        );
      })}
      <text x={W / 2} y={14} fontSize="12" fontWeight="600" textAnchor="middle" fill={INK}>
        {f.title}
      </text>
    </svg>
  );
}

function LineChart({ f }: { f: Extract<FigureSpec, { type: "line" }> }) {
  const W = 360, H = 220, pad = { l: 36, r: 14, t: 26, b: 34 };
  const max = niceMax(Math.max(...f.values));
  const slot = (W - pad.l - pad.r) / (f.values.length - 1);
  const x = (i: number) => pad.l + slot * i;
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const pts = f.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img" aria-label={`Line graph: ${f.title}`}>
      <Axes w={W} h={H} max={max} yLabel={f.yLabel} pad={pad} />
      <polyline points={pts} fill="none" stroke="var(--series-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {f.values.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r="4" fill="var(--series-1)" stroke="var(--background)" strokeWidth="2" />
          <text x={x(i)} y={H - pad.b + 14} fontSize="11" textAnchor="middle" fill={INK}>
            {f.labels[i]}
          </text>
        </g>
      ))}
      <text x={W / 2} y={14} fontSize="12" fontWeight="600" textAnchor="middle" fill={INK}>
        {f.title}
      </text>
    </svg>
  );
}

function PieChart({ f }: { f: Extract<FigureSpec, { type: "pie" }> }) {
  const known = f.slices.reduce((n, s) => n + (s.value ?? 0), 0);
  const unknown = f.slices.filter((s) => s.value === null).length;
  const share = (s: { value: number | null }) => (s.value ?? (100 - known) / Math.max(1, unknown)) / 100;
  const cx = 90, cy = 90, r = 78;
  const shares = f.slices.map(share);
  const starts = shares.map((_, i) => -Math.PI / 2 + shares.slice(0, i).reduce((n, x) => n + x, 0) * Math.PI * 2);
  return (
    <div>
      <p className="mb-1 text-sm font-semibold">{f.title}</p>
      <div className="flex flex-wrap items-center gap-4">
        <svg viewBox="0 0 180 180" className="w-44" role="img" aria-label={`Pie chart: ${f.title}`}>
          {f.slices.map((s, i) => {
            const a0 = starts[i];
            const a1 = a0 + shares[i] * Math.PI * 2;
            const large = a1 - a0 > Math.PI ? 1 : 0;
            const d = `M ${cx} ${cy} L ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`;
            return <path key={i} d={d} fill={SERIES[i % SERIES.length]} stroke="var(--background)" strokeWidth="2" />;
          })}
        </svg>
        <ul className="space-y-1 text-sm">
          {f.slices.map((s, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: SERIES[i % SERIES.length] }} />
              {s.label}: <b>{s.value === null ? "?" : `${s.value}%`}</b>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Table({ f }: { f: Extract<FigureSpec, { type: "table" }> }) {
  return (
    <table className="text-left text-sm">
      <thead>
        <tr>
          {f.headers.map((h) => (
            <th key={h} className="border-b px-3 py-1 font-semibold" style={{ borderColor: GRID }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {f.rows.map((row, i) => (
          <tr key={i}>
            {row.map((c, j) => (
              <td key={j} className="border-b px-3 py-1" style={{ borderColor: GRID }}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Angle diagrams are drawn schematically (not to scale) with the number labelled on each angle.
function AngleDiagram({ f }: { f: Extract<FigureSpec, { type: "triangle" | "straight" | "point" }> }) {
  const label = (a: number | null) => (a === null ? "?" : `${a}°`);
  if (f.type === "triangle") {
    return (
      <svg viewBox="0 0 220 140" className="w-56" role="img" aria-label="Triangle with angles marked (not to scale)">
        <polygon points="20,120 200,120 110,20" fill="none" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <text x="42" y="112" fontSize="13" fill={INK}>{label(f.angles[0])}</text>
        <text x="158" y="112" fontSize="13" fill={INK}>{label(f.angles[1])}</text>
        <text x="100" y="50" fontSize="13" fill={INK}>{label(f.angles[2])}</text>
        <text x="110" y="136" fontSize="10" textAnchor="middle" fill={MUTED}>Not drawn to scale</text>
      </svg>
    );
  }
  // straight line / around a point: rays fanned out at evenly spaced directions, labels between them
  const n = f.angles.length;
  const half = f.type === "straight";
  const total = half ? Math.PI : Math.PI * 2;
  const cx = 110, cy = half ? 100 : 80, r = 70;
  const known = f.angles.reduce<number>((s, a) => s + (a ?? 0), 0);
  const unk = f.angles.filter((a) => a === null).length;
  const sum = half ? 180 : 360;
  const weights = f.angles.map((a) => (a ?? (sum - known) / Math.max(1, unk)) / sum);
  let a0 = 0;
  const rays: number[] = [a0];
  const mids: number[] = [];
  weights.forEach((w) => {
    mids.push(a0 + (w * total) / 2);
    a0 += w * total;
    rays.push(a0);
  });
  return (
    <svg viewBox={`0 0 220 ${half ? 120 : 170}`} className="w-56" role="img" aria-label="Angles marked (not to scale)">
      {half && <line x1={cx - r - 10} y1={cy} x2={cx + r + 10} y2={cy} stroke={INK} strokeWidth="2" />}
      {rays.slice(0, half ? n + 1 : n).map((t, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(t)} y2={cy - r * Math.sin(t)} stroke={INK} strokeWidth="2" />
      ))}
      {mids.map((t, i) => (
        <text key={i} x={cx + 38 * Math.cos(t)} y={cy - 38 * Math.sin(t) + 4} fontSize="12" textAnchor="middle" fill={INK}>
          {label(f.angles[i])}
        </text>
      ))}
    </svg>
  );
}

function Grid({
  f,
  selected,
  onPick,
  show,
  drawn,
  onToggle,
  answerShape,
}: {
  f: Extract<FigureSpec, { type: "grid" }>;
  selected?: { x: number; y: number } | null;
  onPick?: (x: number, y: number) => void;
  show?: { x: number; y: number } | null;
  drawn?: { x: number; y: number }[];
  onToggle?: (x: number, y: number) => void;
  answerShape?: { x: number; y: number }[]; // reveal the correct shape (used in results)
}) {
  const size = f.max - f.min;
  const S = 22, off = 24;
  const W = size * S + off * 2;
  const X = (x: number) => off + (x - f.min) * S;
  const Y = (y: number) => off + (f.max - y) * S;
  const nums: number[] = [];
  for (let v = f.min; v <= f.max; v++) nums.push(v);
  const polyPoints = (pts: { x: number; y: number }[]) => pts.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ");
  const click = onPick ?? onToggle;
  return (
    <svg viewBox={`0 0 ${W} ${W}`} className="w-full max-w-sm" role="img" aria-label="Coordinate grid">
      {nums.map((v) => (
        <g key={v}>
          <line x1={X(v)} x2={X(v)} y1={Y(f.max)} y2={Y(f.min)} stroke={v === 0 ? INK : GRID} strokeWidth={v === 0 ? 1.5 : 1} />
          <line x1={X(f.min)} x2={X(f.max)} y1={Y(v)} y2={Y(v)} stroke={v === 0 ? INK : GRID} strokeWidth={v === 0 ? 1.5 : 1} />
          {(v !== 0 || f.min === 0) && (
            <>
              <text x={X(v)} y={Y(Math.max(0, f.min)) + 12} fontSize="9" textAnchor="middle" fill={MUTED}>{v === 0 && f.min < 0 ? "" : v}</text>
              <text x={X(Math.max(0, f.min)) - 4} y={Y(v) + 3} fontSize="9" textAnchor="end" fill={MUTED}>{v === 0 && f.min < 0 ? "" : v}</text>
            </>
          )}
        </g>
      ))}
      <text x={X(f.max) + 2} y={Y(Math.max(0, f.min)) - 4} fontSize="11" fill={INK}>x</text>
      <text x={X(Math.max(0, f.min)) + 5} y={Y(f.max) - 4} fontSize="11" fill={INK}>y</text>
      {f.line && (
        <line
          x1={f.line.axis === "x" ? X(f.line.at) : X(f.min)}
          x2={f.line.axis === "x" ? X(f.line.at) : X(f.max)}
          y1={f.line.axis === "y" ? Y(f.line.at) : Y(f.min)}
          y2={f.line.axis === "y" ? Y(f.line.at) : Y(f.max)}
          stroke="var(--series-4)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
      )}
      {f.polygon && (
        <polygon points={polyPoints(f.polygon.map(([x, y]) => ({ x, y })))} fill="var(--series-1)" fillOpacity="0.15" stroke="var(--series-1)" strokeWidth="2" strokeLinejoin="round" />
      )}
      {answerShape && answerShape.length > 1 && (
        <polygon points={polyPoints(answerShape)} fill="var(--series-3)" fillOpacity="0.15" stroke="var(--series-3)" strokeWidth="2" strokeLinejoin="round" />
      )}
      {drawn && drawn.length > 1 && (
        <polygon points={polyPoints(drawn)} fill="var(--series-2)" fillOpacity="0.12" stroke="var(--series-2)" strokeWidth="2" strokeLinejoin="round" />
      )}
      {drawn?.map((p, i) => (
        <circle key={i} cx={X(p.x)} cy={Y(p.y)} r="5" fill="var(--series-2)" stroke="var(--background)" strokeWidth="2" />
      ))}
      {f.points.map((p) => (
        <g key={p.label}>
          <circle cx={X(p.x)} cy={Y(p.y)} r="5" fill="var(--series-1)" stroke="var(--background)" strokeWidth="2" />
          <text x={X(p.x) + 8} y={Y(p.y) - 6} fontSize="12" fontWeight="600" fill={INK}>{p.label}</text>
        </g>
      ))}
      {show && <circle cx={X(show.x)} cy={Y(show.y)} r="6" fill="var(--series-3)" stroke="var(--background)" strokeWidth="2" />}
      {selected && <circle cx={X(selected.x)} cy={Y(selected.y)} r="6" fill="var(--series-2)" stroke="var(--background)" strokeWidth="2" />}
      {click &&
        nums.flatMap((x) =>
          nums.map((y) => (
            <circle
              key={`${x},${y}`}
              cx={X(x)}
              cy={Y(y)}
              r={S / 2}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onClick={() => click(x, y)}
              aria-label={`Point ${x}, ${y}`}
            />
          )),
        )}
    </svg>
  );
}

export default function Figure({
  figure,
  selected,
  onPick,
  show,
  drawn,
  onToggle,
  answerShape,
}: {
  figure: FigureSpec;
  selected?: { x: number; y: number } | null;
  onPick?: (x: number, y: number) => void;
  show?: { x: number; y: number } | null; // reveal the correct point (used in results)
  drawn?: { x: number; y: number }[];
  onToggle?: (x: number, y: number) => void;
  answerShape?: { x: number; y: number }[];
}) {
  return (
    <div className="my-3">
      {figure.type === "bar" && <BarChart f={figure} />}
      {figure.type === "line" && <LineChart f={figure} />}
      {figure.type === "pie" && <PieChart f={figure} />}
      {figure.type === "table" && <Table f={figure} />}
      {(figure.type === "triangle" || figure.type === "straight" || figure.type === "point") && <AngleDiagram f={figure} />}
      {figure.type === "grid" && <Grid f={figure} selected={selected} onPick={onPick} show={show} drawn={drawn} onToggle={onToggle} answerShape={answerShape} />}
    </div>
  );
}
