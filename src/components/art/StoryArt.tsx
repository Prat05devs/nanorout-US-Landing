import { aiNetwork, chip, neuronTree } from "@/lib/art";
import { catmullRom, poly, type Pt } from "@/lib/geometry";
import { hash } from "@/lib/random";
import { ChipArt, NetArt, TreeArt } from "./primitives";

/* 12.4 The big drawing: one route from top to bottom through three stations. */

function noisyLine(x0: number, x1: number, y: number, amp: number, seed: number) {
  const pts: Pt[] = [];
  for (let x = x0, i = 0; x <= x1; x += 3, i++) pts.push({ x, y: y + hash(i, seed) * amp * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.7))) });
  pts[pts.length - 1] = { x: x1, y };
  return pts;
}
function sineLine(x0: number, x1: number, y: number, amp: number, periods: number) {
  return Array.from({ length: 31 }, (_, i) => ({ x: x0 + ((x1 - x0) * i) / 30, y: y - amp * Math.sin((i / 30) * Math.PI * 2 * periods) }));
}

// Route: top → neuron → (bend left) noisy into the network → clean sine out → back to centre → chip.
const enterCurve = `M280 162V250C280 300 60 290 60 355`;
const noisy = poly(noisyLine(60, 155, 355, 14, 31)).replace(/^M/, "L");
const sine = catmullRom(sineLine(405, 500, 355, 12, 1.5)).replace(/^M[^C]+/, "");
/** Separate paths, drawn one after another: SVG restarts dash patterns at every subpath. */
export const STORY_ROUTE = ["M280 0V138", `${enterCurve}${noisy}`, `M405 355${sine}C540 355 280 420 280 470V500`];

const tree = neuronTree({ seed: 23, depth: 4, baseLength: 90, originX: 280, originY: 150, startAngle: -90, bodyR: 12, box: { x0: 40, y0: 20, x1: 520, y1: 250 } });
const net = aiNetwork([3, 4, 4, 3], 160, 400, 355, 32);
const theChip = chip(200, 500, 160, 110, 8, 5, 48);
const legs = [235, 262, 298, 325].map((x) => ({ x, d: `M${x} 610V632` }));

export function Station1() {
  return (
    <g data-station="1">
      <TreeArt tree={tree} bodyR={12} />
      <path d="M436.6 63.6L292 142" data-draw />
      <circle className="hollow" cx={440} cy={60} r={5} data-draw />
    </g>
  );
}
export function Station2() {
  return (
    <g data-station="2">
      <NetArt net={net} />
    </g>
  );
}
export function Station3() {
  return (
    <g data-station="3">
      {legs.map((l) => (
        <path key={l.x} d={l.d} data-draw />
      ))}
      <ChipArt chip={theChip} />
      {legs.map((l) => (
        <circle key={l.x} className="dot" cx={l.x} cy={635} r={3} />
      ))}
    </g>
  );
}

export default function StoryArt({ className }: { className?: string }) {
  return (
    <svg className={`art ${className ?? ""}`} viewBox="0 0 560 640" aria-hidden="true">
      {STORY_ROUTE.map((d, i) => (
        <path key={i} d={d} data-route />
      ))}
      <Station1 />
      <Station2 />
      <Station3 />
    </svg>
  );
}

/* 12.7 Mobile: a small drawing of only one station (viewBox 280 × 240). */

const mTree = neuronTree({ seed: 23, depth: 4, baseLength: 60, originX: 140, originY: 150, startAngle: -90, bodyR: 12, box: { x0: 16, y0: 12, x1: 264, y1: 214 } });
const mNet = aiNetwork([3, 4, 4, 3], 90, 200, 120, 28);
const mChip = chip(90, 70, 100, 76, 6, 5, 32);
const mNoisy = poly(noisyLine(8, 85, 120, 12, 31));
const mSine = catmullRom(sineLine(205, 272, 120, 10, 1.5));

export function MobileStation({ index }: { index: number }) {
  return (
    <svg className="art" viewBox="0 0 280 240" aria-hidden="true">
      {index === 0 && (
        <>
          <path d="M140 0V138M140 162V240" data-draw />
          <TreeArt tree={mTree} bodyR={12} />
          <path d="M226.5 37.5L152 142" data-draw />
          <circle className="hollow" cx={230} cy={34} r={5} data-draw />
        </>
      )}
      {index === 1 && (
        <>
          <path d={mNoisy} data-draw />
          <path d={mSine} data-draw />
          <NetArt net={mNet} r={5} />
        </>
      )}
      {index === 2 && (
        <>
          <path d="M140 0V70" data-draw />
          {[110, 130, 150, 170].map((x) => (
            <path key={x} d={`M${x} 146V178`} data-draw />
          ))}
          <ChipArt chip={mChip} />
          {[110, 130, 150, 170].map((x) => (
            <circle key={x} className="dot" cx={x} cy={182} r={3} />
          ))}
        </>
      )}
    </svg>
  );
}

