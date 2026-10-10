"use client";

import { useRef, type CSSProperties, type MouseEvent } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import s from "@/components/ui/ui.module.css";

/** 16.1 The "N" mark: one continuous line with a dot at its end. */
export function NMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg className={`art ${className ?? ""}`} viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" style={{ "--sw": 2 } as CSSProperties}>
      <path data-n d="M6 26V6L26 26V6" />
      <circle className="dot" cx="26" cy="6" r="2.5" />
    </svg>
  );
}

/** Header/footer logo. On hover the N redraws and the letters roll. */
export default function Logo({ onClick, className }: { onClick?: (e: MouseEvent<HTMLAnchorElement>) => void; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const redraw = () => {
    const path = ref.current?.querySelector("[data-n]");
    if (!path || prefersReducedMotion()) return;
    gsap.fromTo(path, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.7, ease: "power2.inOut", overwrite: true });
  };
  return (
    <a
      ref={ref}
      href="#top"
      className={`${s.logo} ${className ?? ""}`}
      aria-label="Nanorout, home"
      onPointerEnter={redraw}
      onClick={onClick}
    >
      <NMark />
      <span className={s.word} aria-hidden="true">
        {"NANOROUT".split("").map((ch, i) => (
          <span key={i} style={{ "--i": i } as CSSProperties}>
            {ch}
          </span>
        ))}
      </span>
    </a>
  );
}
