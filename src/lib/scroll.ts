import type Lenis from "lenis";
import { prefersReducedMotion } from "./useReducedMotion";

let lenis: Lenis | null = null;

export const setLenis = (instance: Lenis | null) => {
  lenis = instance;
};
export const getLenis = () => lenis;

/** GSAP's power3.inOut (a quartic in-out curve). */
export const power3InOut = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);

/** Scrolls to "#id" (or "#top") or a pixel value: 1.6s, power3.inOut. */
export function scrollToTarget(target: string | number) {
  const el =
    typeof target === "number" || target === "#top"
      ? null
      : document.querySelector<HTMLElement>(target);
  const y = typeof target === "number" ? target : el ? el.getBoundingClientRect().top + window.scrollY : 0;
  if (lenis) {
    lenis.scrollTo(y, { duration: 1.6, easing: power3InOut, force: true });
  } else {
    window.scrollTo({ top: y, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }
}

/** Stops the page behind an overlay from scrolling. */
export function lockScroll(locked: boolean) {
  document.documentElement.classList.toggle("is-locked", locked);
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}
