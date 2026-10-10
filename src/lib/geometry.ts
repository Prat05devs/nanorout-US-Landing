export type Pt = { x: number; y: number };

/** Rounds to 2 decimals so server and client render identical path strings. */
export const f = (n: number) => Math.round(n * 100) / 100;
export const rad = (deg: number) => (deg * Math.PI) / 180;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

export function poly(points: Pt[]) {
  return points.map((p, i) => `${i ? "L" : "M"}${f(p.x)} ${f(p.y)}`).join("");
}

/** Orthogonal polyline with every corner cut at 45 degrees (chamfer). */
export function chamfer(points: Pt[], c = 8) {
  if (points.length < 3) return poly(points);
  let d = `M${f(points[0].x)} ${f(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1];
    const b = points[i];
    const n = points[i + 1];
    const cc = Math.min(c, dist(a, b) / 2, dist(b, n) / 2);
    const t1 = cc / (dist(a, b) || 1);
    const t2 = cc / (dist(b, n) || 1);
    d += `L${f(lerp(b.x, a.x, t1))} ${f(lerp(b.y, a.y, t1))}`;
    d += `L${f(lerp(b.x, n.x, t2))} ${f(lerp(b.y, n.y, t2))}`;
  }
  const last = points[points.length - 1];
  return `${d}L${f(last.x)} ${f(last.y)}`;
}

/** Smooth closed curve through the points (Catmull-Rom converted to cubic Béziers). */
export function catmullRomClosed(p: Pt[]) {
  const n = p.length;
  let d = `M${f(p[0].x)} ${f(p[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    d += `C${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return `${d}Z`;
}

/** Smooth open curve through the points. */
export function catmullRom(p: Pt[]) {
  let d = `M${f(p[0].x)} ${f(p[0].y)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(p.length - 1, i + 2)];
    d += `C${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}

export function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  return (
    `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${r} ${r} 0 0 1 ${f(x + w)} ${f(y + r)}` +
    `V${f(y + h - r)}A${r} ${r} 0 0 1 ${f(x + w - r)} ${f(y + h)}` +
    `H${f(x + r)}A${r} ${r} 0 0 1 ${f(x)} ${f(y + h - r)}` +
    `V${f(y + r)}A${r} ${r} 0 0 1 ${f(x + r)} ${f(y)}Z`
  );
}
