"use client";

import { useEffect, type RefObject } from "react";
import { gsap, ScrollTrigger, SplitText } from "./gsap";
import { hasFinePointer, prefersReducedMotion } from "./useReducedMotion";

/**
 * Shared motion vocabulary. Markup opts in with data attributes so sections stay declarative:
 *   data-reveal            default block reveal (up 40px + fade, 0.9s power3.out, at 85%)
 *   data-headline          line-by-line masked reveal (SplitText)
 *   data-glow              letters near the cursor lift and light up acid
 *   data-magnetic          element leans toward the cursor
 *   data-tilt              card tilts in 3D toward the cursor
 */

const REVEAL_START = "top 85%";

function revealBlock(el: HTMLElement, reduced: boolean) {
  if (reduced) {
    gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, scrollTrigger: { trigger: el, start: REVEAL_START, once: true } });
    return;
  }
  gsap.fromTo(
    el,
    { autoAlpha: 0, y: 40 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      delay: Number(el.dataset.delay ?? 0),
      scrollTrigger: { trigger: el, start: REVEAL_START, once: true },
    },
  );
}

/** Neon proximity: letters near the cursor lift and light up acid (CSS reads --k, 0 → 1). */
export function glowLetters(el: HTMLElement, chars: HTMLElement[]) {
  if (!hasFinePointer() || prefersReducedMotion() || !chars.length) return () => {};
  const radius = Number(el.dataset.glowRadius ?? 140);
  const setters = chars.map((c) => {
    gsap.set(c, { "--k": 0 });
    return gsap.quickTo(c, "--k", { duration: 0.45, ease: "power3.out" });
  });
  let centres: { x: number; y: number }[] = [];
  const measure = () => {
    centres = chars.map((c) => {
      const r = c.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
  };
  const move = (e: PointerEvent) => {
    if (!centres.length) measure();
    centres.forEach((c, i) => {
      const d = Math.hypot(e.clientX - c.x, (e.clientY - c.y) * 1.6);
      const k = Math.max(0, 1 - d / radius);
      setters[i](k * k * (3 - 2 * k));
    });
  };
  const leave = () => {
    centres = [];
    setters.forEach((set) => set(0));
  };
  el.addEventListener("pointerenter", measure);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerleave", leave);
  window.addEventListener("scroll", leave, { passive: true });
  return () => {
    el.removeEventListener("pointerenter", measure);
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerleave", leave);
    window.removeEventListener("scroll", leave);
  };
}

function headline(el: HTMLElement, reduced: boolean, cleanups: (() => void)[]) {
  const wantsGlow = el.hasAttribute("data-glow");
  let played = false;
  let unglow = () => {};
  gsap.set(el, { autoAlpha: 1 });
  SplitText.create(el, {
    type: wantsGlow ? "lines,words,chars" : "lines",
    mask: "lines",
    linesClass: "split-line",
    charsClass: "split-char",
    autoSplit: true,
    onSplit(self) {
      unglow();
      if (wantsGlow) unglow = glowLetters(el, self.chars as HTMLElement[]);
      if (played) return;
      if (reduced) {
        played = true;
        return gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, scrollTrigger: { trigger: el, start: REVEAL_START, once: true } });
      }
      return gsap.from(self.lines, {
        yPercent: 110,
        duration: 1,
        ease: "power4.out",
        stagger: 0.08,
        delay: Number(el.dataset.delay ?? 0),
        scrollTrigger: { trigger: el, start: REVEAL_START, once: true },
        onComplete: () => {
          played = true;
        },
      });
    },
  });
  cleanups.push(() => unglow());
}

/** Element leans toward the cursor and springs back. */
export function magnetic(el: HTMLElement, strength = 0.3) {
  if (!hasFinePointer() || prefersReducedMotion()) return () => {};
  const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
  const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    xTo((e.clientX - (r.left + r.width / 2)) * strength);
    yTo((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const leave = () => {
    xTo(0);
    yTo(0);
  };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerleave", leave);
  return () => {
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerleave", leave);
  };
}

/** Card tilts in 3D toward the cursor; a light sheen follows it (CSS reads --mx / --my). */
export function tilt(el: HTMLElement, maxDeg = 6) {
  if (!hasFinePointer() || prefersReducedMotion()) return () => {};
  gsap.set(el, { transformPerspective: 1200 });
  const rx = gsap.quickTo(el, "rotationX", { duration: 0.8, ease: "power3.out" });
  const ry = gsap.quickTo(el, "rotationY", { duration: 0.8, ease: "power3.out" });
  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry((px - 0.5) * maxDeg * 2);
    rx(-(py - 0.5) * maxDeg * 2);
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
  };
  const leave = () => {
    rx(0);
    ry(0);
  };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerleave", leave);
  return () => {
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerleave", leave);
  };
}

/** Wires every data-* motion hook inside a section. Reverted on unmount. */
export function useSectionMotion(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    const cleanups: (() => void)[] = [];
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-reveal]").forEach((n) => revealBlock(n, reduced));
      el.querySelectorAll<HTMLElement>("[data-headline]").forEach((n) => headline(n, reduced, cleanups));
      el.querySelectorAll<HTMLElement>("[data-glow]:not([data-headline])").forEach((n) => {
        const split = SplitText.create(n, { type: "words,chars", charsClass: "split-char" });
        cleanups.push(glowLetters(n, split.chars as HTMLElement[]));
      });
      el.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((n) => cleanups.push(magnetic(n)));
      el.querySelectorAll<HTMLElement>("[data-tilt]").forEach((n) => cleanups.push(tilt(n, Number(n.dataset.tiltMax ?? 6))));
    }, el);
    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, [root]);
}

export { ScrollTrigger };
