"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useSectionMotion } from "@/lib/motion";
import { hasFinePointer, prefersReducedMotion } from "@/lib/useReducedMotion";
import { aiNetwork, neuronTree, wafer } from "@/lib/art";
import { NetArt, TreeArt, WaferArt, useStrokeScale } from "@/components/art/primitives";
import { NMark } from "@/components/art/Logo";
import Button from "@/components/ui/Button";
import s from "./triad.module.css";

const FINAL = [
  [-0.28, -0.16],
  [0.28, -0.16],
  [0, 0.32],
];
const START = [
  [-1.2, -0.7],
  [1.2, -0.7],
  [0, 0.8],
];
const LABELS = ["NEUROSCIENCE", "AI", "SEMICONDUCTORS"];

function DiscArt({ index }: { index: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useStrokeScale(ref, 440);
  const content = useMemo(() => {
    if (index === 0) {
      return <TreeArt tree={neuronTree({ seed: 42, depth: 4, baseLength: 70, originX: 190, originY: 230, startAngle: -110, box: { x0: 56, y0: 60, x1: 300, y1: 300 } })} />;
    }
    if (index === 1) return <NetArt net={aiNetwork([3, 4, 4, 3], 170, 380, 180, 46)} r={8} />;
    return <WaferArt wafer={wafer(220, 250, 132, false, false)} />;
  }, [index]);
  return (
    <svg ref={ref} className="art" viewBox="0 0 440 440" aria-hidden="true">
      {content}
    </svg>
  );
}

export default function TriadVision() {
  const root = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [hot, setHot] = useState<number | null>(null);
  useSectionMotion(root);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    const q = gsap.utils.selector(el);
    const D = () => parseFloat(getComputedStyle(el).getPropertyValue("--D")) || el.querySelector<HTMLElement>("[data-disc]")!.offsetWidth;
    const size = () => el.querySelector<HTMLElement>("[data-disc]")!.offsetWidth || D();
    const pair = (i: number) => q(`[data-c="${i}"]`);

    const mm = gsap.matchMedia();
    const build = (scale: number, scrub: boolean) => {
      [0, 1, 2].forEach((i) => gsap.set(pair(i), { x: () => FINAL[i][0] * size(), y: () => FINAL[i][1] * size() }));
      if (reduced) return;
      const tl = gsap.timeline(
        scrub
          ? { scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } }
          : { scrollTrigger: { trigger: el, start: "top 70%", once: true } },
      );
      const dur = scrub ? 0.7 : 1.6;
      const ease = scrub ? "power2.inOut" : "power3.inOut";
      [0, 1, 2].forEach((i) => {
        tl.fromTo(
          pair(i),
          { x: () => START[i][0] * scale * size(), y: () => START[i][1] * scale * size() },
          { x: () => FINAL[i][0] * size(), y: () => FINAL[i][1] * size(), duration: dur, ease },
          0,
        );
      });
      tl.fromTo(q("[data-disc] [data-draw]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: scrub ? 0.5 : 1.6, ease: "power2.inOut" }, 0);
      const t2 = scrub ? 0.7 : dur;
      tl.fromTo(q("[data-centre]"), { scale: 0 }, { scale: 1, duration: scrub ? 0.1 : 0.4, ease: "power3.out" }, t2)
        .fromTo(q("[data-centre] path"), { drawSVG: "0%" }, { drawSVG: "100%", duration: scrub ? 0.15 : 0.6, ease: "power2.inOut" }, t2)
        .fromTo(q("[data-label]"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: scrub ? 0.15 : 0.5, stagger: scrub ? 0.02 : 0.08 }, scrub ? 0.85 : t2 + 0.6);
    };
    mm.add("(min-width: 1024px)", () => build(1, true));
    mm.add("(max-width: 1023px)", () => build(0.6, false));
    return () => mm.revert();
  }, []);

  const enter = (i: number, disc: HTMLElement) => {
    if (!hasFinePointer()) return;
    setHot(i);
    if (prefersReducedMotion()) return;
    gsap.fromTo(disc.querySelectorAll("[data-draw]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.0, ease: "power2.inOut", overwrite: true });
  };

  return (
    <section ref={root} id="vision" className="section" data-spine="03 — VISION">
      <div className="container">
        <div className={s.head}>
          <h2 className="h2" data-headline data-glow>
            One university. Three disciplines.
          </h2>
          <p className="mono-para" data-reveal>
            Neuroscience, AI and Semiconductors, together under one roof. Nanorout is working toward the world’s first Triad
            University.
          </p>
        </div>
      </div>

      <div ref={wrap} className={s.wrapper}>
        <div className={s.sticky}>
          <div className={s.group}>
            {[0, 1, 2].map((i) => (
              <div
                key={`d${i}`}
                className={`${s.disc} ${s[`d${i}`]} ${hot === i ? s.hot : ""} on-light`}
                data-disc
                data-c={i}
                onPointerEnter={(e) => enter(i, e.currentTarget)}
                onPointerLeave={() => setHot(null)}
              >
                <DiscArt index={i} />
              </div>
            ))}
            {[0, 1, 2].map((i) => (
              <div key={`o${i}`} className={`${s.outline} ${hot === i ? s.hot : ""}`} data-c={i}>
                <span className={`${s.label} ${s[`l${i}`]} ${hot === i ? s.labelHot : ""} small-label`} data-label>
                  {LABELS[i]}
                </span>
              </div>
            ))}
            <div className={s.centre} data-centre aria-hidden="true">
              <NMark size={56} />
            </div>
          </div>
        </div>
      </div>

      <div className={`container ${s.cta}`} data-reveal>
        <Button to="#contact">GET IN TOUCH</Button>
      </div>
    </section>
  );
}
