"use client";

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { heroRoute } from "@/lib/art";
import { f } from "@/lib/geometry";
import { hasFinePointer, prefersReducedMotion } from "@/lib/useReducedMotion";

export type HeroRouteHandle = { play: (delay: number) => void };

const DRAW = 3.0;

/**
 * 10.2 One route from neuron to chip. Generated at the drawing's real pixel size,
 * so lines are exactly 1.5px and circles stay round at every screen width.
 */
const HeroRoute = forwardRef<HeroRouteHandle, { className?: string }>(function HeroRoute({ className }, ref) {
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const played = useRef(false);
  const pending = useRef<number | null>(null);

  const geo = useMemo(() => (size ? heroRoute(size.w, size.h, size.w < 640) : null), [size]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      const h = Math.round(e.contentRect.height);
      setSize((old) => (old && old.w === w && old.h === h ? old : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const run = (delay: number) => {
    const root = svg.current;
    if (!root || !geo) return;
    played.current = true;
    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(root);
    const tl = gsap.timeline({ delay });
    const ease = "power2.inOut";
    // Zone 1: the neuron, level by level
    tl.fromTo(q("[data-body]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.3, ease }, 0);
    geo.tree.levels.forEach((_, i) => {
      tl.fromTo(q(`[data-level="${i}"]`), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.32, ease }, 0.1 + i * 0.18);
    });
    tl.fromTo(q("[data-tip]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.25, ease, stagger: 0.002 }, 0.95);
    // Zone 2: the change
    tl.fromTo(q("[data-converge]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.3, ease }, 1.0);
    tl.fromTo(q("[data-wave]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.45, ease }, 1.25);
    // Zone 3: the circuit
    const circuitStart = 1.65;
    const circuitDur = 0.95;
    tl.fromTo(q("[data-lead], [data-trace], [data-tail]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: circuitDur, ease: "none" }, circuitStart);
    geo.dots.forEach((d, i) => {
      tl.fromTo(
        q(`[data-dot="${i}"]`),
        { scale: 0, autoAlpha: 0 },
        { keyframes: [{ scale: 1.8, autoAlpha: 1, duration: 0.25 }, { scale: 1, duration: 0.25 }], transformOrigin: "50% 50%", ease: "power2.out" },
        circuitStart + Math.max(0, Math.min(1, d.t)) * circuitDur,
      );
    });
    tl.fromTo(q("[data-chip]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.4, ease }, DRAW - 0.4);
  };

  useImperativeHandle(ref, () => ({
    play(delay: number) {
      if (geo) run(delay);
      else pending.current = delay;
    },
  }));

  // Before the intro plays everything is undrawn; after it, regenerated geometry simply appears.
  useLayoutEffect(() => {
    const root = svg.current;
    if (!root || !geo) return;
    if (!played.current && !prefersReducedMotion()) {
      gsap.set(root.querySelectorAll("[data-draw]"), { drawSVG: "0%" });
      gsap.set(root.querySelectorAll("[data-dot]"), { autoAlpha: 0 });
    }
    if (pending.current !== null) {
      const d = pending.current;
      pending.current = null;
      run(d);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo]);

  // Cursor parallax: up to 12px sideways and 6px up/down, lerp 0.08.
  useEffect(() => {
    const root = svg.current;
    if (!root || !hasFinePointer() || prefersReducedMotion() || window.innerWidth < 1024) return;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 24;
      target.y = (e.clientY / window.innerHeight - 0.5) * 12;
    };
    const tick = () => {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      root.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0)`;
    };
    window.addEventListener("pointermove", onMove);
    gsap.ticker.add(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.ticker.remove(tick);
    };
  }, [geo]);

  return (
    <div ref={wrap} className={className} aria-hidden="true">
      {geo && size && (
        <svg ref={svg} className="art" viewBox={`0 0 ${size.w} ${size.h}`} width={size.w} height={size.h}>
          <g data-body-wrap>
            {geo.tree.levels.map((d, i) => (
              <path key={i} d={d} data-draw data-level={i} />
            ))}
          </g>
          {geo.converge.map((d, i) => (
            <path key={i} d={d} data-draw data-converge />
          ))}
          <path d={geo.wave} data-draw data-wave />
          <path d={geo.lead} data-draw data-lead />
          {geo.traces.map((d, i) => (
            <path key={i} d={d} data-draw data-trace />
          ))}
          <path d={geo.tail} data-draw data-tail />
          <circle className="hollow" data-draw data-body cx={f(geo.tree.body.x)} cy={f(geo.tree.body.y)} r={10} />
          {geo.tree.tips.map((t, i) => (
            <circle key={i} className="hollow" data-draw data-tip cx={f(t.x)} cy={f(t.y)} r={3} />
          ))}
          <g data-chip-wrap>
            <path d={geo.chip.pins} data-draw data-chip />
            <path className="hollow" d={geo.chip.body} data-draw data-chip />
            <path d={geo.chip.core} data-draw data-chip />
          </g>
          {geo.dots.map((d, i) => (
            <circle key={i} className="dot" data-dot={i} cx={f(d.x)} cy={f(d.y)} r={3} />
          ))}
        </svg>
      )}
    </div>
  );
});

export default HeroRoute;
