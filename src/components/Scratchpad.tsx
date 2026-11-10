"use client";

import { useEffect, useRef, useState } from "react";

type Stroke = { x: number; y: number }[];

// A free-hand pad for working things out. Works with mouse, finger and pen. Not marked, never saved.
export default function Scratchpad() {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);

  function redraw() {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== Math.round(c.clientWidth * dpr) || c.height !== Math.round(c.clientHeight * dpr)) {
      c.width = Math.round(c.clientWidth * dpr);
      c.height = Math.round(c.clientHeight * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, c.clientWidth, c.clientHeight);
    ctx.strokeStyle = getComputedStyle(c).color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of [...strokes.current, ...(current.current ? [current.current] : [])]) {
      ctx.beginPath();
      s.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      if (s.length === 1) ctx.lineTo(s[0].x + 0.01, s[0].y);
      ctx.stroke();
    }
  }

  useEffect(() => {
    if (open) redraw();
  }, [open]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setEverOpened(true);
        }}
        className="rounded-full border border-black/20 px-4 py-1.5 text-sm font-medium dark:border-white/30"
        aria-expanded={open}
      >
        ✏️ {open ? "Hide scratchpad" : "Scratchpad"}
      </button>
      {everOpened && (
        <div className={open ? "mt-2" : "hidden"}>
          <canvas
            ref={canvas}
            className="h-56 w-full rounded-xl border border-dashed border-black/30 dark:border-white/30"
            style={{ touchAction: "none" }}
            aria-label="Scratchpad for your working. It is not marked."
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              current.current = [pos(e)];
              redraw();
            }}
            onPointerMove={(e) => {
              if (!current.current) return;
              current.current.push(pos(e));
              redraw();
            }}
            onPointerUp={() => {
              if (current.current) strokes.current.push(current.current);
              current.current = null;
              redraw();
            }}
            onPointerCancel={() => {
              current.current = null;
              redraw();
            }}
          />
          <div className="mt-1 flex gap-3 text-sm">
            <button
              type="button"
              className="underline"
              onClick={() => {
                strokes.current.pop();
                redraw();
              }}
            >
              Undo
            </button>
            <button
              type="button"
              className="underline"
              onClick={() => {
                strokes.current = [];
                redraw();
              }}
            >
              Clear
            </button>
            <span className="opacity-60">Your working is not marked.</span>
          </div>
        </div>
      )}
    </div>
  );
}
