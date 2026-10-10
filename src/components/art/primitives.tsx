"use client";

import { useEffect, type RefObject } from "react";
import type { Chip, Net, Tree, Wafer } from "@/lib/art";
import { f } from "@/lib/geometry";

/**
 * Keeps lines at 1.5px on screen however large the SVG is drawn:
 * stroke width = 1.5 * viewBoxWidth / renderedWidth, updated on resize.
 */
export function useStrokeScale(ref: RefObject<SVGSVGElement | null>, viewBoxWidth: number, px = 1.5) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) el.style.setProperty("--sw", f((px * viewBoxWidth) / w).toString());
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, viewBoxWidth, px]);
}

export function TreeArt({ tree, bodyR }: { tree: Tree; bodyR?: number }) {
  return (
    <g>
      {tree.levels.map((d, i) => (
        <path key={i} d={d} data-draw data-level={i} />
      ))}
      <circle className="hollow" data-draw cx={tree.body.x} cy={tree.body.y} r={bodyR ?? tree.body.r} />
      {tree.tips.map((t, i) => (
        <circle key={i} className="hollow" data-draw data-tip cx={f(t.x)} cy={f(t.y)} r={tree.tipR} />
      ))}
    </g>
  );
}

export function NetArt({ net, r = 5 }: { net: Net; r?: number }) {
  return (
    <g>
      {net.edges.map((d, i) => (
        <path key={i} d={d} data-draw />
      ))}
      {net.nodes.map((n, i) => (
        <circle key={i} className="hollow" data-draw data-node data-col={n.col} cx={f(n.x)} cy={f(n.y)} r={r} />
      ))}
    </g>
  );
}

export function ChipArt({ chip }: { chip: Chip }) {
  return (
    <g>
      <path d={chip.pins} data-draw />
      <path className="hollow" d={chip.body} data-draw />
      <path d={chip.core} data-draw />
    </g>
  );
}

export function WaferArt({ wafer }: { wafer: Wafer }) {
  return (
    <g>
      {wafer.traces.map((t, i) => (
        <path key={i} d={t.d} data-draw />
      ))}
      <path className="hollow" d={wafer.outline} data-draw />
      <path d={wafer.dies} data-draw />
      {wafer.traces.map((t, i) =>
        t.end.pad ? (
          <circle key={`e${i}`} className="hollow" data-draw cx={f(t.end.x)} cy={f(t.end.y)} r={4} />
        ) : (
          <circle key={`e${i}`} className="dot" cx={f(t.end.x)} cy={f(t.end.y)} r={3} />
        ),
      )}
    </g>
  );
}
