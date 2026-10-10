"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useSectionMotion } from "@/lib/motion";
import { hasFinePointer, prefersReducedMotion } from "@/lib/useReducedMotion";
import TextLink from "@/components/ui/TextLink";
import NisIcon from "@/components/art/NisIcons";
import s from "./nis.module.css";

const ROWS = [
  { n: "01", title: "Neuroinformatics", line: "Organising brain data so it can be understood at scale." },
  { n: "02", title: "Neuroimaging", line: "Seeing the structure and activity of the brain more clearly." },
  { n: "03", title: "Signal Processing", line: "Separating meaningful signals from noise." },
  { n: "04", title: "Brain-Computer Interface", line: "Turning brain signals into direct action." },
];

export default function NisList() {
  const root = useRef<HTMLElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useSectionMotion(root);

  // 11.5 entrance: each row's top line draws, then its content rises. Rows 0.1s apart.
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      const rules = el.querySelectorAll("[data-rule]");
      const contents = el.querySelectorAll("[data-row-content]");
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%", once: true } });
      if (reduced) {
        tl.fromTo([rules, contents], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
        return;
      }
      rules.forEach((r, i) => tl.fromTo(r, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.out" }, i * 0.1));
      contents.forEach((c, i) =>
        tl.fromTo(c, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out" }, i * 0.1),
      );
      tl.fromTo(el.querySelectorAll("[data-card] [data-draw]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.2, ease: "power2.inOut", stagger: 0.03 }, 0.3);
    }, el);
    return () => ctx.revert();
  }, []);

  // 11.4 hover: the icon redraws.
  const redraw = (row: HTMLElement) => {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    gsap.fromTo(row.querySelectorAll("[data-draw]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.8, ease: "power2.inOut", overwrite: true });
  };

  return (
    <section ref={root} id="nis" className="section" data-spine="01 — NIS">
      <div className="container">
        <div className={s.head}>
          <h2 className="h2" data-headline data-glow>
            One system for the brain’s data.
          </h2>
          <p className={`mono-para ${s.para}`} data-reveal>
            The Neuro Information System connects four fields that are usually kept apart.
          </p>
        </div>

        <div ref={list} className={s.list} role="list">
          {ROWS.map((r, i) => (
            <div key={r.n} role="listitem">
              <div className={s.rule} data-rule />
              <div className={s.row} data-row-content onPointerEnter={(e) => redraw(e.currentTarget)}>
                <span className={s.num} aria-hidden="true">
                  <span>{r.n}</span>
                  <span>{r.n}</span>
                </span>
                <h3 className={s.title}>
                  <span className="sr-only">{r.n} </span>
                  {r.title}
                </h3>
                <p className={s.line}>{r.line}</p>
                <span className={s.card} data-card>
                  <NisIcon index={i} />
                </span>
                <span className={s.arrow} aria-hidden="true">
                  →
                </span>
              </div>
            </div>
          ))}
          <div className={s.rule} data-rule />
        </div>

        <div className={s.more} data-reveal>
          <TextLink to="#route" arrow="↓">
            SEE HOW IT WORKS
          </TextLink>
        </div>
      </div>
    </section>
  );
}
