"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scrollToTarget } from "@/lib/scroll";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { LINKEDIN_URL } from "@/lib/nav";
import { NMark } from "@/components/art/Logo";
import s from "./sidebar.module.css";

/* Section links: FC88-style big words, one per Home section. */
const LINKS = [
  { id: "nis", n: "01", label: "NIS" },
  { id: "route", n: "02", label: "THE ROUTE" },
  { id: "vision", n: "03", label: "VISION" },
  { id: "lab", n: "04", label: "SIGNAL LAB" },
  { id: "contact", n: "05", label: "CONTACT" },
];

type SpineNode = { id: string; at: number; trigger: number };

/**
 * Desktop navigation (1024px and up): a fixed acid panel on the left, after thisisfc88.com.
 * Its right edge carries the route spine (section 7): a dotted track, a fill that grows with
 * scroll, and one node per section.
 */
export default function Sidebar() {
  const root = useRef<HTMLElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const [nodes, setNodes] = useState<SpineNode[]>([]);
  const [reached, setReached] = useState(-1);
  const [active, setActive] = useState<string>("top");
  const activeRef = useRef("top");

  // Node positions follow where each section starts in the page.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const measure = () => {
      if (!desktop.matches) return;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const vh = window.innerHeight;
      setNodes(
        Array.from(document.querySelectorAll<HTMLElement>("[data-spine]")).map((el) => {
          const top = el.getBoundingClientRect().top + window.scrollY;
          const trigger = Math.max(0, top - 0.4 * vh);
          return { id: el.id, at: Math.min(1, trigger / max), trigger };
        }),
      );
    };
    measure();
    ScrollTrigger.addEventListener("refresh", measure);
    window.addEventListener("load", measure);
    desktop.addEventListener("change", measure);
    return () => {
      ScrollTrigger.removeEventListener("refresh", measure);
      window.removeEventListener("load", measure);
      desktop.removeEventListener("change", measure);
    };
  }, []);

  // Fill grows with page progress; nodes fill when reached; the link of the section in view lights up.
  useEffect(() => {
    if (!nodes.length || !fill.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(fill.current, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: prefersReducedMotion() ? true : 0.4 } });
    });
    const onScroll = () => {
      const y = window.scrollY;
      let r = -1;
      nodes.forEach((n, i) => {
        if (y >= n.trigger - 1) r = i;
      });
      setReached(r);
      const mid = y + window.innerHeight * 0.45;
      let a = "top";
      document.querySelectorAll<HTMLElement>("[data-spine]").forEach((el) => {
        if (el.getBoundingClientRect().top + window.scrollY <= mid) a = el.id;
      });
      if (a !== activeRef.current) {
        activeRef.current = a;
        setActive(a);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ctx.revert();
      window.removeEventListener("scroll", onScroll);
    };
  }, [nodes]);

  // 15.3 End of the route: a ring grows from the last node, once.
  useEffect(() => {
    const target = document.querySelector("[data-end-of-route]");
    if (!target || !ring.current || !nodes.length || prefersReducedMotion()) return;
    const st = ScrollTrigger.create({
      trigger: target,
      start: "top center",
      once: true,
      onEnter: () => gsap.fromTo(ring.current, { width: 10, height: 10, opacity: 1 }, { width: 44, height: 44, opacity: 0, duration: 1.0, ease: "power3.out" }),
    });
    return () => st.kill();
  }, [nodes.length]);

  // Entrance: the panel's contents rise in once the page has loaded.
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion() || !window.matchMedia("(min-width: 1024px)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-side-in]", { y: 24, autoAlpha: 0, duration: 0.8, ease: "power3.out", stagger: 0.07, delay: 0.2 });
      gsap.from("[data-rule]", { scaleX: 0, transformOrigin: "0 50%", duration: 0.9, ease: "power3.out", stagger: 0.07, delay: 0.35 });
    }, el);
    return () => ctx.revert();
  }, []);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToTarget(id === "top" ? "#top" : `#${id}`);
  };
  const last = nodes[nodes.length - 1];

  return (
    <aside ref={root} id="route-spine" className={s.side} aria-label="Sections">
      <div className={s.inner}>
        <a href="#top" className={s.logo} onClick={go("top")} aria-label="Nanorout, back to top" data-side-in>
          <NMark size={44} />
          <span>NANOROUT</span>
        </a>

        <nav aria-label="Page sections">
          <ul className={s.links}>
            {LINKS.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  className={`${s.link} ${active === l.id ? s.active : ""}`}
                  aria-current={active === l.id ? "location" : undefined}
                  onClick={go(l.id)}
                  data-side-in
                >
                  <span className={s.n}>{l.n}</span>
                  <span className={s.word}>{l.label}</span>
                  <span className={s.circle} aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M5 12h13M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </a>
                <span className={s.rule} data-rule aria-hidden="true" />
              </li>
            ))}
          </ul>
        </nav>

        <div className={s.bottom}>
          <a
            href="#contact"
            className={s.cta}
            onClick={go("contact")}
            data-side-in
          >
            <span>GET IN TOUCH</span>
            <span className={s.ctaArrow} aria-hidden="true">
              →
            </span>
          </a>
          <div className={s.meta} data-side-in>
            <span>© NANOROUT 2026</span>
            {/* replace: client LinkedIn page */}
            <a href={LINKEDIN_URL} className={s.metaLink}>
              LINKEDIN
            </a>
          </div>
        </div>
      </div>

      {/* 7. the route spine, along the panel's right edge */}
      <div className={s.spine} aria-hidden="true">
        <div className={s.track} />
        <div ref={fill} className={s.fill} />
        {nodes.map((n, i) => (
          <span key={n.id} className={`${s.node} ${i <= reached ? s.reached : ""}`} style={{ top: `${n.at * 100}%` } as CSSProperties} />
        ))}
        {last && <span ref={ring} className={s.ring} style={{ top: `${last.at * 100}%` }} />}
      </div>
    </aside>
  );
}
