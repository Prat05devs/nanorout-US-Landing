import { mulberry32, hash } from "./random";
import { catmullRom, catmullRomClosed, chamfer, f, lerp, poly, rad, roundedRect, type Pt } from "./geometry";

/* ------------------------------------------------------------------ */
/* 16.2 Neuron tree                                                    */
/* ------------------------------------------------------------------ */

export interface TreeOptions {
  seed: number;
  depth: number;
  baseLength: number;
  originX: number;
  originY: number;
  /** Degrees. 0 points right, -90 points up. */
  startAngle: number;
  bodyR?: number;
  tipR?: number;
  /** If given, the tree is scaled (around its cell body) to fit inside this box. */
  box?: { x0: number; y0: number; x1: number; y1: number };
  maxScale?: number;
}

export interface Tree {
  /** One path per level so levels can be drawn one after another. */
  levels: string[];
  tips: Pt[];
  body: Pt & { r: number };
  tipR: number;
}

function growTree(o: TreeOptions) {
  const rand = mulberry32(o.seed);
  const bodyR = o.bodyR ?? 10;
  const levels: string[][] = Array.from({ length: o.depth }, () => []);
  const tips: Pt[] = [];
  const reach: Pt[] = [];

  const grow = (sx: number, sy: number, angle: number, len: number, level: number) => {
    const a = rad(angle);
    const ex = sx + Math.cos(a) * len;
    const ey = sy + Math.sin(a) * len;
    const bend = (rand() * 2 - 1) * 0.08 * len;
    const cx = (sx + ex) / 2 - Math.sin(a) * bend;
    const cy = (sy + ey) / 2 + Math.cos(a) * bend;
    levels[level].push(`M${f(sx)} ${f(sy)}Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}`);
    reach.push({ x: ex, y: ey });
    if (level === o.depth - 1) {
      tips.push({ x: ex, y: ey });
      return;
    }
    const sides = rand() < 0.3 ? [-1, 1, rand() < 0.5 ? -1 : 1] : [-1, 1];
    for (const side of sides) {
      const turn = side * (18 + rand() * 20);
      const childLen = len * (0.72 + (rand() * 2 - 1) * 0.08);
      grow(ex, ey, angle + turn, childLen, level + 1);
    }
  };

  for (let i = 0; i < 4; i++) {
    const angle = o.startAngle - 100 + (i + 0.5) * 50;
    const a = rad(angle);
    grow(o.originX + Math.cos(a) * bodyR, o.originY + Math.sin(a) * bodyR, angle, o.baseLength, 0);
  }
  return { levels: levels.map((l) => l.join("")), tips, reach };
}

export function neuronTree(o: TreeOptions): Tree {
  let opts = o;
  const tipR = o.tipR ?? 3;
  if (o.box) {
    const probe = growTree(o);
    const m = tipR + 2;
    let s = o.maxScale ?? 1.6;
    for (const p of probe.reach) {
      const dx = p.x - o.originX;
      const dy = p.y - o.originY;
      if (dx > 0.01) s = Math.min(s, (o.box.x1 - m - o.originX) / dx);
      if (dx < -0.01) s = Math.min(s, (o.box.x0 + m - o.originX) / dx);
      if (dy > 0.01) s = Math.min(s, (o.box.y1 - m - o.originY) / dy);
      if (dy < -0.01) s = Math.min(s, (o.box.y0 + m - o.originY) / dy);
    }
    opts = { ...o, baseLength: o.baseLength * Math.max(0.2, s) };
  }
  const t = growTree(opts);
  return { levels: t.levels, tips: t.tips, body: { x: o.originX, y: o.originY, r: o.bodyR ?? 10 }, tipR };
}

/* ------------------------------------------------------------------ */
/* 16.3 AI network                                                     */
/* ------------------------------------------------------------------ */

export interface Net {
  nodes: (Pt & { col: number })[];
  /** One path per gap between columns. */
  edges: string[];
}

export function aiNetwork(counts: number[], x0: number, x1: number, cy: number, gap: number): Net {
  const cols = counts.map((n, c) => {
    const x = counts.length === 1 ? (x0 + x1) / 2 : lerp(x0, x1, c / (counts.length - 1));
    return Array.from({ length: n }, (_, i) => ({ x, y: cy + (i - (n - 1) / 2) * gap, col: c }));
  });
  const edges = cols.slice(0, -1).map((col, c) => {
    const next = cols[c + 1];
    const k = next.length > col.length ? 3 : 2;
    const seen = new Set<string>();
    let d = "";
    col.forEach((a, ai) => {
      const nearest = next
        .map((b, bi) => ({ b, bi, dy: Math.abs(b.y - a.y) }))
        .sort((p, q) => p.dy - q.dy || p.bi - q.bi)
        .slice(0, k);
      nearest.forEach(({ b, bi }) => {
        const key = `${ai}-${bi}`;
        if (seen.has(key)) return;
        seen.add(key);
        d += `M${f(a.x)} ${f(a.y)}L${f(b.x)} ${f(b.y)}`;
      });
    });
    return d;
  });
  return { nodes: cols.flat(), edges };
}

/* ------------------------------------------------------------------ */
/* 16.4 EEG wave                                                       */
/* ------------------------------------------------------------------ */

export function eegWave(x0: number, x1: number, yMid: number, amp: number, seed = 3) {
  const raw: Pt[] = [];
  for (let x = 0; x <= x1 - x0; x += 2) {
    const v = 0.5 * Math.sin(x / 18) + 0.3 * Math.sin(x / 7 + 1) + 0.15 * Math.sin(x / 3 + 2) + 0.05 * hash(x, seed);
    raw.push({ x: x0 + x, y: v });
  }
  const peak = Math.max(...raw.map((p) => Math.abs(p.y))) || 1;
  const pts = raw.map((p) => ({ x: p.x, y: yMid - (p.y / peak) * amp }));
  const dots = [0.25, 0.55, 0.8].map((t) => pts[Math.round(t * (pts.length - 1))]);
  return { d: poly(pts), dots };
}

/* ------------------------------------------------------------------ */
/* 16.6 Circuit traces and chip                                        */
/* ------------------------------------------------------------------ */

export interface TraceEnd extends Pt {
  pad: boolean;
}

/** Five traces leaving to the left on a 24px grid. Lanes are 72px apart and wander at most one cell, so they never cross. */
export function leftTraces(seed: number, starts: Pt[], xEnd: number, grid = 24) {
  const rand = mulberry32(seed);
  return starts.map((s, k) => {
    const pts: Pt[] = [{ ...s }];
    let x = s.x;
    let off = 0;
    for (;;) {
      const run = (3 + Math.floor(rand() * 6)) * grid;
      x -= run;
      if (x <= xEnd) {
        pts.push({ x: xEnd, y: s.y + off * grid });
        break;
      }
      pts.push({ x, y: s.y + off * grid });
      const options = [-1, 0, 1].filter((o) => o !== off);
      off = options[Math.floor(rand() * options.length)];
      pts.push({ x, y: s.y + off * grid });
    }
    const end = pts[pts.length - 1];
    return { d: chamfer(pts, 8), end: { ...end, pad: k % 2 === 1 } as TraceEnd };
  });
}

export interface Chip {
  body: string;
  pins: string;
  core: string;
}

export function chip(x: number, y: number, w: number, h: number, r: number, pins: number, core: number, pinLen = 14): Chip {
  let p = "";
  for (let i = 0; i < pins; i++) {
    const py = y + (h * (i + 0.5)) / pins;
    p += `M${f(x - pinLen)} ${f(py)}H${f(x)}M${f(x + w)} ${f(py)}H${f(x + w + pinLen)}`;
  }
  return {
    body: roundedRect(x, y, w, h, r),
    pins: p,
    core: roundedRect(x + w / 2 - core / 2, y + h / 2 - core / 2, core, core, 1),
  };
}

/* ------------------------------------------------------------------ */
/* 16.5 Wafer                                                          */
/* ------------------------------------------------------------------ */

export interface Wafer {
  outline: string;
  dies: string;
  traces: { d: string; end: TraceEnd }[];
}

export function wafer(cx: number, cy: number, R: number, notch: boolean, showTraces: boolean, seed = 5, traceEndX = 0): Wafer {
  let outline: string;
  if (notch) {
    const h = 0.12 * R;
    const yN = cy + Math.sqrt(R * R - h * h);
    outline = `M${f(cx - h)} ${f(yN)}A${f(R)} ${f(R)} 0 1 1 ${f(cx + h)} ${f(yN)}Z`;
  } else {
    outline = `M${f(cx - R)} ${f(cy)}A${f(R)} ${f(R)} 0 1 1 ${f(cx + R)} ${f(cy)}A${f(R)} ${f(R)} 0 1 1 ${f(cx - R)} ${f(cy)}Z`;
  }

  // Dies share edges, so the grid is drawn as line segments, not as hundreds of rectangles.
  const w = 0.1 * R;
  const h = 0.075 * R;
  const lim = R - 0.04 * R;
  const inside = (x: number, y: number) => (x - cx) ** 2 + (y - cy) ** 2 <= lim * lim;
  const has = (i: number, j: number) => {
    const x = cx + i * w;
    const y = cy + j * h;
    return inside(x, y) && inside(x + w, y) && inside(x, y + h) && inside(x + w, y + h);
  };
  const nI = Math.ceil(R / w) + 1;
  const nJ = Math.ceil(R / h) + 1;
  let dies = "";
  for (let j = -nJ; j <= nJ; j++) {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = -nI; i <= nI; i++) {
      if (has(i, j - 1) || has(i, j)) {
        lo = Math.min(lo, i);
        hi = Math.max(hi, i);
      }
    }
    if (lo <= hi) dies += `M${f(cx + lo * w)} ${f(cy + j * h)}H${f(cx + (hi + 1) * w)}`;
  }
  for (let i = -nI; i <= nI; i++) {
    let lo = Infinity;
    let hi = -Infinity;
    for (let j = -nJ; j <= nJ; j++) {
      if (has(i - 1, j) || has(i, j)) {
        lo = Math.min(lo, j);
        hi = Math.max(hi, j);
      }
    }
    if (lo <= hi) dies += `M${f(cx + i * w)} ${f(cy + lo * h)}V${f(cy + (hi + 1) * h)}`;
  }

  let traces: Wafer["traces"] = [];
  if (showTraces) {
    const starts = [-2, -1, 0, 1, 2].map((k) => {
      const y = Math.round((cy + k * 72) / 24) * 24;
      return { x: cx - Math.sqrt(Math.max(0, R * R - (y - cy) ** 2)), y };
    });
    traces = leftTraces(seed, starts, traceEndX);
  }
  return { outline, dies, traces };
}

/** The small side-view chip: 5 flat bars joined by 3 vias, a dot on top. */
export function sideChip(x: number, y: number) {
  let bars = "";
  for (let i = 0; i < 5; i++) bars += roundedRect(x, y + i * 18, 80, 8, 1);
  let vias = "";
  [16, 40, 64].forEach((vx, k) => {
    for (let i = 0; i < 4; i++) {
      if ((i + k) % 2 === 0) vias += `M${f(x + vx)} ${f(y + 8 + i * 18)}V${f(y + 18 + i * 18)}`;
    }
  });
  return { bars, vias, dot: { x: x + 40, y: y - 6 } };
}

/* ------------------------------------------------------------------ */
/* 16.7 Wobbly closed curve                                            */
/* ------------------------------------------------------------------ */

export function wobble(cx: number, cy: number, r: number, seed: number) {
  const rand = mulberry32(seed + Math.round(r) * 31);
  const pts = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const rr = r + (rand() * 2 - 1) * 2;
    return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr };
  });
  return catmullRomClosed(pts);
}

/* ------------------------------------------------------------------ */
/* 10.2 Hero route: neuron → change → circuit → chip                   */
/* ------------------------------------------------------------------ */

export interface HeroRouteGeo {
  tree: Tree;
  converge: string[];
  wave: string;
  lead: string;
  traces: string[];
  tail: string;
  dots: (Pt & { t: number })[];
  chip: Chip;
  /** x where the circuit zone starts and ends, used to time the drawing. */
  span: { from: number; to: number };
}

export function heroRoute(W: number, H: number, mobile: boolean): HeroRouteGeo {
  const grid = 24;
  const pad = mobile ? 24 : 80;
  const yS = Math.round((H * 0.56) / grid) * grid;

  // Zone 1: the neuron (0–35%)
  const bodyX = Math.max(14, W * 0.03) + 10;
  const tree = neuronTree({
    seed: 11,
    depth: 5,
    baseLength: ((W * 0.35) / 560) * 90,
    originX: bodyX,
    originY: H * 0.64,
    startAngle: -15,
    box: { x0: 4, y0: 6, x1: W * (mobile ? 0.3 : 0.335), y1: H - 6 },
    maxScale: 2.4,
  });

  // Zone 2: the change (35–45%). The furthest tips join into one wave that snaps onto the grid.
  const C = { x: W * (mobile ? 0.32 : 0.37), y: yS - grid };
  const S = { x: Math.round((W * (mobile ? 0.4 : 0.45)) / grid) * grid, y: yS };
  const furthest = [...tree.tips].sort((a, b) => b.x - a.x).slice(0, 3);
  const converge = furthest.map(
    (t) => `M${f(t.x)} ${f(t.y)}C${f(lerp(t.x, C.x, 0.55))} ${f(t.y)} ${f(lerp(t.x, C.x, 0.6))} ${f(C.y)} ${f(C.x)} ${f(C.y)}`,
  );
  const wavePts: Pt[] = [];
  const amp = Math.min(18, H * 0.08);
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    wavePts.push({ x: lerp(C.x, S.x, t), y: lerp(C.y, S.y, t) + amp * (1 - 0.35 * t) * Math.sin(t * Math.PI * 4) });
  }
  const wave = catmullRom(wavePts);

  // Zone 3: the circuit (45–100%) ending at a chip
  const cw = mobile ? 72 : 120;
  const ch = mobile ? 52 : 80;
  const chipX = W - pad - 14 - cw;
  const theChip = chip(chipX, yS - ch / 2, cw, ch, 6, mobile ? 4 : 6, mobile ? 16 : 24);
  const lead = mobile ? 1 : 2;
  const P1 = { x: S.x + lead * grid, y: yS };
  const P2 = { x: Math.floor((chipX - 14 - lead * grid) / grid) * grid, y: yS };
  const offsets = mobile ? [-grid, grid] : [-grid, 0, grid];

  // One shared step pattern keeps the traces parallel, so they never cross.
  const rand = mulberry32(11);
  const steps: { x: number; off: number }[] = [];
  let x = P1.x + grid;
  let off = 0;
  for (;;) {
    x += (3 + Math.floor(rand() * 6)) * grid;
    if (x > P2.x - 2 * grid) break;
    const options = [-1, 0, 1].filter((o) => o !== off);
    off = options[Math.floor(rand() * options.length)];
    steps.push({ x, off });
  }
  const traces = offsets.map((o) => {
    const pts: Pt[] = [{ x: P1.x, y: yS }];
    let y = yS + o;
    if (o !== 0) pts.push({ x: P1.x, y });
    for (const s of steps) {
      pts.push({ x: s.x, y });
      y = yS + o + s.off * grid;
      pts.push({ x: s.x, y });
    }
    pts.push({ x: P2.x, y });
    if (y !== yS) pts.push({ x: P2.x, y: yS });
    return chamfer(pts, 8);
  });

  const span = { from: S.x, to: chipX };
  const tOf = (px: number) => (px - span.from) / (span.to - span.from);
  const dots = [
    { ...P1, t: tOf(P1.x) },
    { ...P2, t: tOf(P2.x) },
    ...steps.slice(0, 3).map((s, i) => ({ x: s.x, y: yS + offsets[0] + (i ? steps[i - 1].off : 0) * grid, t: tOf(s.x) })),
  ];

  return {
    tree,
    converge,
    wave,
    lead: `M${f(S.x)} ${f(S.y)}H${f(P1.x)}`,
    traces,
    tail: `M${f(P2.x)} ${f(yS)}H${f(chipX)}`,
    dots,
    chip: theChip,
    span,
  };
}
