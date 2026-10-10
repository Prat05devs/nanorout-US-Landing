"use client";

import { Fragment, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { getLenis } from "@/lib/scroll";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import s from "./marquee.module.css";

const WORDS = ["NEUROINFORMATICS", "NEUROIMAGING", "SIGNAL PROCESSING", "BRAIN-COMPUTER INTERFACE", "AI", "SEMICONDUCTORS"];
const SPEED = 60;

function Group({ hidden }: { hidden?: boolean }) {
  return (
    <div className={s.group} aria-hidden={hidden || undefined}>
      {WORDS.map((w) => (
        <Fragment key={w}>
          <span className={s.word}>{w}</span>
          <svg className={s.plus} viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 1v14M1 8h14" />
          </svg>
        </Fragment>
      ))}
    </div>
  );
}

/** 15.4 Keyword band: drifts left at 60px/s, pauses on hover, speeds up (max ×2) when scrolling fast. */
export default function Marquee() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!el || !tr || prefersReducedMotion()) return;
    let x = 0;
    let boost = 1;
    let hovering = false;
    let visible = false;
    let lastY = window.scrollY;
    const tick = (_t: number, dt: number) => {
      if (!visible) return;
      const lenis = getLenis();
      const y = window.scrollY;
      const v = lenis ? Math.abs(lenis.velocity) : Math.abs(y - lastY);
      lastY = y;
      const target = 1 + Math.min(1, v / 40);
      boost += (target - boost) * 0.06;
      if (!hovering) {
        const w = (tr.firstElementChild as HTMLElement).offsetWidth;
        x = (x - (SPEED * boost * dt) / 1000) % w;
        tr.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      }
    };
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const enter = () => (hovering = true);
    const leave = () => (hovering = false);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={root} className={s.band}>
      <div ref={track} className={s.track}>
        <Group />
        <Group hidden />
        <Group hidden />
      </div>
    </div>
  );
}
