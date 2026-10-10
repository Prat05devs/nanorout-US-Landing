import { mulberry32 } from "@/lib/random";
import { catmullRom, f, poly } from "@/lib/geometry";
import { wobble } from "@/lib/art";

/* 11.3 The four icons: 72 × 72, 1.5px line, no fill. Every stroke is its own path so it can be redrawn. */

const rhombus = (cy: number) => `M12 ${cy}L36 ${cy - 10}L60 ${cy}L36 ${cy + 10}Z`;

function Neuroinformatics() {
  return (
    <>
      {[18, 34, 50].map((cy) => (
        <path key={cy} d={rhombus(cy)} data-draw />
      ))}
      {[
        [12, 18, 50],
        [60, 18, 50],
        [36, 8, 24],
        [36, 28, 40],
        [36, 44, 60],
      ].map(([x, y1, y2], i) => (
        <path key={i} d={`M${x} ${y1}V${y2}`} strokeDasharray="2 4" data-dotted />
      ))}
      {[18, 34, 50].map((cy) => (
        <circle key={cy} className="dot" cx={36} cy={cy} r={3} />
      ))}
    </>
  );
}

function Neuroimaging() {
  return (
    <>
      {[6, 12, 18, 24, 30].map((r) => (
        <path key={r} d={wobble(36, 36, r, 5)} data-draw />
      ))}
    </>
  );
}

const noisy = (() => {
  const rand = mulberry32(17);
  const pts = Array.from({ length: 11 }, (_, i) => ({ x: 4 + i * 2, y: 36 + (rand() * 2 - 1) * 9 }));
  return poly(pts);
})();
const clean = catmullRom(Array.from({ length: 13 }, (_, i) => ({ x: 48 + (i * 20) / 12, y: 36 - 8 * Math.sin((i / 12) * Math.PI * 2) })));

function SignalProcessing() {
  return (
    <>
      <path d={noisy} data-draw />
      <path d="M28 36H44M39 31L44 36L39 41" data-draw />
      <path d={clean} data-draw />
    </>
  );
}

function BrainComputerInterface() {
  const dots = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) dots.push({ x: 6 + c * 6, y: 24 + r * 6 });
  return (
    <>
      {dots.map((d, i) => (
        <circle key={i} cx={f(d.x)} cy={f(d.y)} r={2} data-draw />
      ))}
      <path d="M26 33H44" data-draw />
      <path d="M46 26H64A2 2 0 0 1 66 28V44A2 2 0 0 1 64 46H46A2 2 0 0 1 44 44V28A2 2 0 0 1 46 26Z" data-draw />
      <path d="M52 31V38L54 36L56 40L57.5 39.3L55.6 35.4H58.4Z" data-draw />
    </>
  );
}

const ICONS = [Neuroinformatics, Neuroimaging, SignalProcessing, BrainComputerInterface];

export default function NisIcon({ index, className }: { index: number; className?: string }) {
  const Icon = ICONS[index];
  return (
    <svg className={`art ${className ?? ""}`} viewBox="0 0 72 72" aria-hidden="true">
      <Icon />
    </svg>
  );
}
