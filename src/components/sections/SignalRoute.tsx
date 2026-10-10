"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useSectionMotion } from "@/lib/motion";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import Tag from "@/components/ui/Tag";
import StoryArt, { MobileStation } from "@/components/art/StoryArt";
import s from "./route.module.css";

const STEPS = [
  {
    tag: ["STEP 01", "NEUROSCIENCE"],
    word: "CAPTURE",
    text: "Everything begins at the source: neurons firing, signals travelling. We start by capturing them with imaging and sensing.",
  },
  {
    tag: ["STEP 02", "AI"],
    word: "DECODE",
    text: "Raw signals are noisy. AI finds the pattern inside the noise and turns it into something we can read.",
  },
  {
    tag: ["STEP 03", "SEMICONDUCTORS"],
    word: "ACT",
    text: "Insight needs hardware: tiny, efficient chips that process neural data where it is born. That is the “nano” in Nanorout.",
  },
];
const STATION_AT = [0.02, 0.36, 0.7];

export default function SignalRoute() {
  const root = useRef<HTMLElement>(null);
  const story = useRef<HTMLDivElement>(null);
  const blocks = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const activeRef = useRef(0);
  useSectionMotion(root);

  /* ---------- desktop: sticky drawing + scrubbed route ---------- */
  useEffect(() => {
    const el = story.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const q = gsap.utils.selector(el);
      const right = q("[data-steps]")[0];
      const route = q("[data-route]");
      const stations = [1, 2, 3].map((n) => q(`[data-station="${n}"] [data-draw]`));
      const steps = q("[data-step]");

      if (reduced) {
        gsap.set(route, { drawSVG: "100%" });
        steps.forEach((st) => gsap.set(st.querySelectorAll("[data-step-part]"), { autoAlpha: 0 }));
      } else {
        gsap.set(stations.flat(), { drawSVG: "0%" });
        gsap.set(q("[data-station] .dot"), { autoAlpha: 0 });
        // one route, three path pieces: each gets a share of the scroll equal to its length
        const lengths = route.map((r) => (r as unknown as SVGPathElement).getTotalLength());
        const tl = gsap.timeline({ scrollTrigger: { trigger: right, start: "top 75%", end: "bottom bottom", scrub: 0.6 } });
        route.forEach((r, i) => tl.fromTo(r, { drawSVG: "0%" }, { drawSVG: "100%", ease: "none", duration: lengths[i] }));
      }

      const drawn = [false, false, false];
      ScrollTrigger.create({
        trigger: right,
        start: "top 75%",
        end: "bottom bottom",
        onUpdate: (self) => {
          STATION_AT.forEach((at, i) => {
            if (drawn[i] || self.progress < at) return;
            drawn[i] = true;
            if (reduced) return;
            gsap.to(stations[i], { drawSVG: "100%", duration: 1.0, ease: "power2.inOut", stagger: 0.01 });
            const dots = q(`[data-station="${i + 1}"] .dot`);
            if (dots.length) gsap.to(dots, { autoAlpha: 1, duration: 0.4, delay: 0.6 });
          });
        },
      });

      // Only the step in the middle of the screen is visible.
      const show = (i: number) => {
        steps.forEach((st, k) => {
          const parts = st.querySelectorAll("[data-step-part]");
          gsap.killTweensOf(parts);
          if (k === i) {
            gsap.fromTo(parts, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: reduced ? 0.3 : 0.5, ease: "power3.out", stagger: reduced ? 0 : 0.1 });
          } else {
            gsap.to(parts, { autoAlpha: 0, y: 24, duration: 0.3 });
          }
        });
        if (activeRef.current !== i) {
          setPrev(activeRef.current);
          activeRef.current = i;
          setActive(i);
        }
      };
      gsap.set(q("[data-step-part]"), { autoAlpha: 0, y: 24 });
      steps.forEach((st, i) => {
        ScrollTrigger.create({
          trigger: st,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => self.isActive && show(i),
        });
      });
    });
    return () => mm.revert();
  }, []);

  /* ---------- counter: old number slides up and out, new one slides in ---------- */
  const counter = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = counter.current;
    if (!el || prev === null) return;
    const [oldEl, newEl] = el.children;
    gsap.fromTo(oldEl, { yPercent: 0 }, { yPercent: -110, duration: 0.4, ease: "power3.out" });
    gsap.fromTo(newEl, { yPercent: 110 }, { yPercent: 0, duration: 0.4, ease: "power3.out" });
  }, [active, prev]);

  /* ---------- mobile / tablet blocks ---------- */
  useEffect(() => {
    const el = blocks.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    const mm = gsap.matchMedia();
    mm.add("(max-width: 1023px)", () => {
      el.querySelectorAll<HTMLElement>("[data-block]").forEach((b) => {
        const lines = b.querySelectorAll("[data-draw]");
        if (reduced) return;
        gsap.fromTo(lines, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.2, ease: "power2.inOut", scrollTrigger: { trigger: b, start: "top 60%", once: true } });
      });
      el.querySelectorAll<HTMLElement>("[data-connector]").forEach((c) => {
        if (reduced) return;
        const tl = gsap.timeline({ scrollTrigger: { trigger: c, start: "top 80%", once: true } });
        tl.fromTo(c.children[0], { scaleY: 0 }, { scaleY: 1, duration: 0.6, ease: "power2.inOut" }).fromTo(c.children[1], { scale: 0 }, { scale: 1, duration: 0.3, ease: "power3.out" });
      });
    });
    return () => mm.revert();
  }, []);

  const n = (i: number) => `0${i + 1}`;

  return (
    <section ref={root} id="route" className="section" data-spine="02 — THE ROUTE">
      <div className="container">
        <div className={s.head}>
          <h2 className="h2" data-headline data-glow>
            Every signal has a route.
          </h2>
          <p className="mono-para" data-reveal>
            From the first spark to the final decision, three disciplines carry it.
          </p>
        </div>

        <div ref={story} className={s.story}>
          <div className={s.sticky}>
            <div className={`${s.card} on-light`} data-tilt>
              <StoryArt />
              <span className={s.cardCaption} aria-hidden="true">
                FIG. 02 — SIGNAL ROUTE
              </span>
            </div>
            <p className={s.counter} aria-hidden="true">
              <span ref={counter} className={s.counterNum}>
                <span>{n(prev ?? 0)}</span>
                <span>{n(active)}</span>
              </span>
              <span>/ 03</span>
            </p>
          </div>
          <div className={s.steps} data-steps>
            {STEPS.map((st) => (
              <article key={st.word} className={s.step} data-step>
                <div data-step-part>
                  <Tag cells={st.tag} />
                </div>
                <h3 className={s.word} data-step-part data-glow >
                  {st.word}
                </h3>
                <p className={`body ${s.text}`} data-step-part>
                  {st.text}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div ref={blocks} className={s.blocks}>
          {STEPS.map((st, i) => (
            <div key={st.word}>
              <article className={s.block} data-block>
                <div className={`${s.card} on-light`}>
                  <MobileStation index={i} />
                </div>
                <Tag cells={st.tag} />
                <h3 className={s.word}>{st.word}</h3>
                <p className={`body ${s.text}`}>{st.text}</p>
              </article>
              {i < STEPS.length - 1 && (
                <div className={s.connector} data-connector aria-hidden="true">
                  <span />
                  <span />
                </div>
              )}
            </div>
          ))}
        </div>

        <p className={`serif-line ${s.closing}`} data-headline>
          Three disciplines. One route. That’s why we’re building a university for them.
        </p>
      </div>
    </section>
  );
}
