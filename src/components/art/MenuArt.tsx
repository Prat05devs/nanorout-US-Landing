"use client";

import { useMemo, useRef, type CSSProperties } from "react";
import { aiNetwork, eegWave, neuronTree, sideChip, wafer } from "@/lib/art";
import { catmullRom, f } from "@/lib/geometry";
import { NetArt, TreeArt, WaferArt, useStrokeScale } from "./primitives";

/** Drawing A — Neuroscience: a neuron tree (seed 7) crossed by an EEG wave. */
export function DrawingA({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useStrokeScale(ref, 520);
  const tree = useMemo(
    () => neuronTree({ seed: 7, depth: 5, baseLength: 110, originX: 230, originY: 300, startAngle: -70, box: { x0: 12, y0: 12, x1: 508, y1: 508 } }),
    [],
  );
  const eeg = useMemo(() => eegWave(10, 510, 330, 40, 3), []);
  return (
    <svg ref={ref} className={`art ${className ?? ""}`} viewBox="0 0 520 520" aria-hidden="true" data-drawing="A">
      <TreeArt tree={tree} />
      <path d={eeg.d} data-draw />
      {eeg.dots.map((p, i) => (
        <circle key={i} className="dot" cx={f(p.x)} cy={f(p.y)} r={3} />
      ))}
    </svg>
  );
}

/** Drawing B — AI: hollow circles in 4 columns (4, 5, 5, 3). */
export function DrawingB({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useStrokeScale(ref, 400);
  const net = useMemo(() => aiNetwork([4, 5, 5, 3], 30, 370, 130, 52), []);
  return (
    <svg ref={ref} className={`art ${className ?? ""}`} viewBox="0 0 400 260" aria-hidden="true" data-drawing="B">
      <NetArt net={net} r={7} />
    </svg>
  );
}

/** Drawing C — Semiconductors: notched wafer with traces, plus a side-view chip. */
export function DrawingC({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useStrokeScale(ref, 640);
  const w = useMemo(() => wafer(400, 360, 230, true, true, 5, 30), []);
  const sc = useMemo(() => sideChip(470, 24), []);
  return (
    <svg ref={ref} className={`art ${className ?? ""}`} viewBox="0 0 640 640" aria-hidden="true" data-drawing="C">
      <WaferArt wafer={w} />
      <path d={sc.bars} data-draw />
      <path d={sc.vias} data-draw />
      <circle className="dot" cx={sc.dot.x} cy={sc.dot.y} r={3} />
    </svg>
  );
}

/* ---------- 16.8 Doodles ---------- */

const sine = catmullRom(Array.from({ length: 13 }, (_, i) => ({ x: 4 + i * (40 / 12), y: 24 - 12 * Math.sin((i / 12) * Math.PI * 2) })));
const plus = (s: number) => `M${s / 2} 0V${s}M0 ${s / 2}H${s}M${s * 0.2} ${s * 0.2}L${s * 0.32} ${s * 0.32}M${s * 0.8} ${s * 0.8}L${s * 0.68} ${s * 0.68}`;

const SHAPES: Record<string, { size: number; d: string; circles?: [number, number, number][] }> = {
  electrode: { size: 48, d: "M24 46V16", circles: [[24, 10, 5]] },
  resistor: { size: 48, d: "M2 24H10L13 16L19 32L25 16L31 32L35 24H46" },
  and: { size: 48, d: "M10 10H22A14 14 0 0 1 22 38H10ZM2 17H10M2 31H10M36 24H46" },
  transistor: { size: 48, d: "M6 24H17M17 14V34M17 19L30 11V3M17 29L30 37V45M25 36L30 37L28 32", circles: [[22, 24, 15]] },
  capacitor: { size: 48, d: "M2 24H20M20 12V36M28 12V36M28 24H46" },
  sine: { size: 48, d: sine },
  plus12: { size: 12, d: plus(12) },
  plus18: { size: 18, d: plus(18) },
  plus24: { size: 24, d: plus(24) },
};

export type DoodleSpec = {
  shape: keyof typeof SHAPES;
  num?: number;
  mobile?: boolean;
  /** anchored beside a menu row (row index, characters in that row, extra x offset) */
  row?: [number, number, number];
  /** or placed freely */
  at?: CSSProperties;
};

export const DOODLES: DoodleSpec[] = [
  { shape: "resistor", num: 4, mobile: true, row: [0, 4, 0] },
  { shape: "plus18", mobile: true, row: [0, 4, 220] },
  { shape: "electrode", num: 9, mobile: true, row: [1, 6, 10] },
  { shape: "sine", row: [1, 6, 260] },
  { shape: "and", num: 18, row: [4, 10, 0] },
  { shape: "plus12", row: [4, 10, 200] },
  { shape: "transistor", num: 21, row: [6, 7, 0] },
  { shape: "plus24", row: [6, 7, 260] },
  { shape: "capacitor", num: 22, row: [3, 22, 0] },
  { shape: "sine", mobile: true, at: { left: "42vw", bottom: "112px" } },
  { shape: "plus18", num: 26, mobile: true, at: { left: "58vw", bottom: "72px" } },
  { shape: "resistor", at: { left: "46vw", top: "88px" } },
];

export function Doodle({ spec, className }: { spec: DoodleSpec; className?: string }) {
  const shape = SHAPES[spec.shape];
  const style = spec.row
    ? ({ "--row": spec.row[0], "--chars": spec.row[1], "--dx": `${spec.row[2]}px` } as CSSProperties)
    : spec.at;
  return (
    <span className={className} style={style} data-doodle data-anchored={spec.row ? "" : undefined} data-mobile={spec.mobile ? "" : undefined}>
      <svg className="art" viewBox={`0 0 ${shape.size} ${shape.size}`} width={shape.size} height={shape.size} aria-hidden="true">
        <path d={shape.d} />
        {shape.circles?.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </svg>
      {spec.num !== undefined && <span className="doodle-num">{spec.num}</span>}
    </span>
  );
}
