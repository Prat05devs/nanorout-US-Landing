"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { glowLetters, magnetic } from "@/lib/motion";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import HeroRoute, { type HeroRouteHandle } from "@/components/art/HeroRoute";
import s from "./hero.module.css";

// three.js only loads in the browser, after the page is interactive.
const ChromeNeuron = dynamic(() => import("@/components/art/ChromeNeuron"), { ssr: false });

const LINES = ["HELLO", "NANOTECH."];

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const routeRef = useRef<HeroRouteHandle>(null);
  const [neuronOn, setNeuronOn] = useState(false);
  const onNeuronReady = useCallback(() => setNeuronOn(true), []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    const cleanups: (() => void)[] = [];
    let cancelled = false;
    const ctx = gsap.context(() => {});

    const q = gsap.utils.selector(el);
    const start = () => {
      if (cancelled) return;
      ctx.add(() => {
        gsap.set(q("[data-intro]"), { visibility: "visible" });
        if (reduced) {
          gsap.set(q("[data-strike-line]"), { scaleX: 1, rotate: -2 });
          gsap.set(q("[data-strike-word]"), { opacity: 0.4 });
          gsap.from(q("[data-intro]"), { autoAlpha: 0, duration: 0.3 });
          routeRef.current?.play(0);
          return;
        }
        const tl = gsap.timeline();
        tl.from(q("[data-sun]"), { scale: 0.55, autoAlpha: 0, duration: 1.8, ease: "power3.out" }, 0)
          .from(q("[data-path]"), { autoAlpha: 0, duration: 0.6 }, 0)
          .from(q("[data-serif]"), { yPercent: 110, duration: 1.0, ease: "power4.out" }, 0.1)
          .from(q('[data-line="0"]'), { yPercent: 110, duration: 1.1, ease: "power4.out" }, 0.25)
          .from(q('[data-line="1"]'), { yPercent: 110, duration: 1.1, ease: "power4.out" }, 0.4)
          .fromTo(q("[data-neon]"), { opacity: 0 }, { keyframes: { opacity: [0, 1, 0.2, 1, 0.5, 1] }, duration: 0.9, ease: "none" }, 1.3)
          .call(() => routeRef.current?.play(0), [], 0.6)
          .to(q("[data-strike-line]"), { scaleX: 1, duration: 0.6, ease: "power3.inOut" }, 0.9)
          .to(q("[data-strike-word]"), { opacity: 0.4, duration: 0.4 }, 1.5)
          .from(q("[data-tag] > *"), { y: 20, autoAlpha: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 }, 1.0)
          .from(q("[data-para]"), { y: 20, autoAlpha: 0, duration: 0.8, ease: "power3.out" }, 1.2)
          .from(q("[data-buttons] > *"), { y: 20, autoAlpha: 0, duration: 0.6, ease: "power3.out", stagger: 0.1 }, 1.4);

        // the sun drifts slower than the page; the title lifts away
        gsap.to(q("[data-sun]"), { yPercent: 30, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true } });
        gsap.to(q("[data-content]"), { y: -60, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true } });
      });
      const title = el.querySelector<HTMLElement>("[data-title]");
      if (title) cleanups.push(glowLetters(title, Array.from(title.querySelectorAll<HTMLElement>("[data-char]"))));
      el.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((m) => cleanups.push(magnetic(m)));
    };
    document.fonts.ready.then(start);


    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return (
    <section ref={root} id="top" className={s.hero} data-spine="HOME">
      <div className={s.sun} data-sun aria-hidden="true" />
      <ChromeNeuron className={`${s.neuron} ${neuronOn ? s.neuronOn : ""}`} onReady={onNeuronReady} />

      <div className={`container ${s.content}`} data-content>
        <p className={`small-label ${s.path}`} data-intro data-path>
          <span className={s.home}>HOME</span> → NANOROUT
        </p>

        <p className={`serif-line ${s.serif}`}>
          <span className={s.mask}>
            <span className={s.maskInner} data-intro data-serif>
              Goodbye{" "}
              <span className={s.strike}>
                <span className={s.strikeWord} data-strike-word>
                  Guesswork
                </span>
                <span className={s.strikeLine} data-strike-line aria-hidden="true" />
              </span>
              ,
            </span>
          </span>
        </p>

        <h1 className={`giant ${s.title}`} data-title aria-label="HELLO NANOTECH.">
          {LINES.map((line, i) => (
            <span key={line} className={s.titleLine} aria-hidden="true">
              <span className={s.titleInner} data-intro data-line={i}>
                {line.split("").map((ch, j) =>
                  ch === "." ? (
                    // the full stop is a neon dot that flickers on
                    <span key={j} className={`${s.char} ${s.neon}`} data-char data-neon>
                      {ch}
                    </span>
                  ) : (
                    <span key={j} className={s.char} data-char>
                      {ch}
                    </span>
                  ),
                )}
              </span>
            </span>
          ))}
        </h1>

        <Tag cells={["NEUROSCIENCE", "AI", "SEMICONDUCTORS"]} className={s.tag} data-intro data-tag />

        <p className={`mono-para ${s.para}`} data-intro data-para>
          Nanorout is building the Neuro Information System, where the brain’s signals become clear, usable insight.
        </p>

        <div className={s.buttons} data-intro data-buttons>
          <Button to="#nis">EXPLORE NIS</Button>
          <Button to="#vision" variant="outline">
            OUR VISION
          </Button>
        </div>
      </div>


      <HeroRoute ref={routeRef} className={s.route} />
    </section>
  );
}
