"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "@/lib/gsap";
import { lockScroll, scrollToTarget } from "@/lib/scroll";
import { prefersReducedMotion, hasFinePointer } from "@/lib/useReducedMotion";
import { CONTACT_EMAIL, LINKEDIN_URL, NAV, NOTICE, type NavItem } from "@/lib/nav";
import Logo from "@/components/art/Logo";
import { DOODLES, Doodle, DrawingA, DrawingB, DrawingC } from "@/components/art/MenuArt";
import s from "./chrome.module.css";

const PLUS_MARKS: CSSProperties[] = [
  { left: "6%", top: "12%" },
  { left: "38%", top: "8%" },
  { left: "62%", top: "18%" },
  { left: "90%", top: "36%" },
  { left: "48%", top: "44%" },
  { left: "22%", top: "88%" },
  { left: "70%", top: "62%" },
  { left: "86%", top: "86%" },
  { left: "54%", top: "92%" },
  { left: "4%", top: "64%" },
];

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function SiteChrome() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [announce, setAnnounce] = useState("");

  const buttonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const loopRef = useRef<gsap.core.Timeline | null>(null);
  const afterClose = useRef<(() => void) | null>(null);
  const openRef = useRef(false);

  /* ---------- 9.1 hide on scroll ---------- */
  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 10);
        if (!openRef.current) {
          if (y < 100) setHidden(false);
          else if (y > last + 2) setHidden(true);
          else if (y < last - 2) setHidden(false);
        }
        last = y;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* ---------- the AI network comes alive (9.5 step 6) ---------- */
  const startLoop = useCallback(() => {
    if (prefersReducedMotion() || !overlayRef.current) return;
    const nodes = Array.from(overlayRef.current.querySelectorAll<SVGElement>('[data-drawing="B"] [data-node]')).sort(
      (a, b) => Number(a.dataset.col) - Number(b.dataset.col),
    );
    const loop = gsap.timeline({ repeat: -1 });
    nodes.forEach((n, i) => loop.call(() => n.classList.add("lit"), [], i * 0.06));
    loop.call(() => nodes.forEach((n) => n.classList.remove("lit")), [], nodes.length * 0.06 + 3);
    loop.to({}, { duration: 0.6 });
    loopRef.current = loop;
  }, []);

  const stopLoop = () => {
    loopRef.current?.kill();
    loopRef.current = null;
    overlayRef.current?.querySelectorAll(".lit").forEach((n) => n.classList.remove("lit"));
  };

  /* ---------- 9.5 opening timeline ---------- */
  const openMenu = useCallback(() => {
    const overlay = overlayRef.current;
    const btn = buttonRef.current;
    if (!overlay || !btn) return;
    openRef.current = true;
    setOpen(true);
    setHidden(false);
    lockScroll(true);
    for (const id of ["main", "site-footer", "route-spine"]) {
      const el = document.getElementById(id);
      if (el) el.inert = true;
    }

    tlRef.current?.kill();
    const b = btn.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    const R =
      Math.max(Math.hypot(cx, cy), Math.hypot(innerWidth - cx, cy), Math.hypot(cx, innerHeight - cy), Math.hypot(innerWidth - cx, innerHeight - cy)) + 20;

    const q = gsap.utils.selector(overlay);
    const items = q("[data-item]");
    const rows = q("[data-item-row]");
    const doodles = q("[data-doodle]");
    const bottom = q("[data-bottom]");
    const tl = gsap.timeline({ paused: true });

    if (prefersReducedMotion()) {
      tl.set(overlay, { visibility: "visible", clipPath: "none" })
        .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 })
        .set([rows, doodles, bottom], { autoAlpha: 1, y: 0, scale: 1 }, 0)
        .set(q("[data-draw]"), { drawSVG: "100%" }, 0);
    } else {
      tl.set(overlay, { visibility: "visible", autoAlpha: 1 })
        .fromTo(
          overlay,
          { clipPath: `circle(0px at ${cx}px ${cy}px)` },
          { clipPath: `circle(${R}px at ${cx}px ${cy}px)`, duration: 0.9, ease: "power3.inOut" },
          0,
        )
        .fromTo(rows, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: "power3.out", stagger: 0.06 }, 0.35);
      (["A", "B", "C"] as const).forEach((k, i) => {
        tl.fromTo(
          q(`[data-drawing="${k}"] [data-draw]`),
          { drawSVG: "0%" },
          { drawSVG: "100%", duration: 1.4, ease: "power2.inOut" },
          0.45 + i * 0.15,
        );
      });
      tl.fromTo(
        doodles,
        { scale: 0.6, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.5, ease: "power3.out", stagger: 0.04, transformOrigin: "50% 50%" },
        0.8,
      ).fromTo(bottom, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 1.0);
    }

    // Focus the first menu item as soon as it is visible.
    tl.call(() => (items[0] as HTMLElement | undefined)?.focus({ preventScroll: true }), [], prefersReducedMotion() ? 0.05 : 0.4);
    tl.eventCallback("onComplete", startLoop);
    tl.eventCallback("onReverseComplete", () => {
      gsap.set(overlay, { visibility: "hidden" });
      lockScroll(false);
      for (const id of ["main", "site-footer", "route-spine"]) {
        const el = document.getElementById(id);
        if (el) el.inert = false;
      }
      openRef.current = false;
      setOpen(false);
      buttonRef.current?.focus();
      const next = afterClose.current;
      afterClose.current = null;
      next?.();
    });
    tlRef.current = tl;
    tl.timeScale(1).play(0);
  }, [startLoop]);

  const closeMenu = useCallback((then?: () => void) => {
    if (!openRef.current || !tlRef.current) return;
    afterClose.current = then ?? null;
    stopLoop();
    // Same timeline backwards, at least 1.8× speed, never longer than ~0.55s.
    const tl = tlRef.current;
    tl.timeScale(Math.max(1.8, tl.time() / 0.55)).reverse();
  }, []);

  /* ---------- 9.6 Esc + focus trap ---------- */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key !== "Tab" || !overlayRef.current || !buttonRef.current) return;
      const list = [buttonRef.current, ...Array.from(overlayRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))];
      const i = list.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? list.length - 1 : i - 1) : i === list.length - 1 ? 0 : i + 1;
      e.preventDefault();
      list[next].focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeMenu]);

  useEffect(() => () => {
    tlRef.current?.kill();
    loopRef.current?.kill();
  }, []);

  /* ---------- 8. demo actions ---------- */
  const showNotice = (el: HTMLElement | null) => {
    if (!el) return;
    setAnnounce("");
    requestAnimationFrame(() => setAnnounce(NOTICE));
    gsap.killTweensOf(el);
    gsap
      .timeline()
      .fromTo(el, { autoAlpha: 0, x: -6 }, { autoAlpha: 1, x: 0, duration: 0.2, ease: "power3.out" })
      .to(el, { autoAlpha: 0, duration: 0.3 }, "+=2.5");
  };

  const redraw = (key?: NavItem["draws"]) => {
    if (!key || !hasFinePointer() || prefersReducedMotion() || !overlayRef.current) return;
    gsap.fromTo(
      overlayRef.current.querySelectorAll(`[data-drawing="${key}"] [data-draw]`),
      { drawSVG: "0%" },
      { drawSVG: "100%", duration: 0.8, ease: "power2.inOut", overwrite: true },
    );
  };

  const go = (target: string) => closeMenu(() => scrollToTarget(target));

  return (
    <>
      <header className={`${s.header} ${scrolled ? s.scrolled : ""} ${hidden && !open ? s.hidden : ""} ${open ? s.open : ""}`}>
        <div className={`container ${s.bar}`}>
          <Logo
            className={s.logo}
            onClick={(e) => {
              e.preventDefault();
              if (open) go("#top");
              else scrollToTarget("#top");
            }}
          />
          <button
            ref={buttonRef}
            type="button"
            className={s.menuBtn}
            aria-expanded={open}
            aria-controls="main-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => (open ? closeMenu() : openMenu())}
          >
            <span className={s.menuWord} aria-hidden="true">
              <span>MENU</span>
              <span>CLOSE</span>
            </span>
            <svg className={s.plus} viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 1v14M1 8h14" />
            </svg>
          </button>
        </div>
      </header>

      <div ref={overlayRef} id="main-menu" className={`${s.overlay} on-red`} role="dialog" aria-modal="true" aria-label="Main menu">
        <div className={s.grid} aria-hidden="true" />
        {PLUS_MARKS.map((st, i) => (
          <span key={i} className={s.plusMark} style={st} aria-hidden="true" />
        ))}
        <div aria-hidden="true">
          <DrawingA className={s.drawA} />
          <DrawingB className={s.drawB} />
          <DrawingC className={s.drawC} />
          {DOODLES.map((d, i) => (
            <Doodle key={i} spec={d} className={s.doodle} />
          ))}
        </div>

        <nav className={s.nav} aria-label="Main">
          <ol className={s.items}>
            {NAV.map((item) => {
              const current = item.label === "HOME";
              const content = (
                <>
                  <span className={s.num}>{item.n}</span>
                  <span>{item.label}</span>
                  <span className={s.itemArrow} aria-hidden="true">
                    →
                  </span>
                </>
              );
              return (
                <li key={item.n} className={s.li} data-item-row>
                  {item.target ? (
                    <a
                      href={item.target}
                      data-item
                      className={`${s.item} ${current ? s.current : ""}`}
                      aria-current={current ? "page" : undefined}
                      onPointerEnter={() => redraw(item.draws)}
                      onClick={(e) => {
                        e.preventDefault();
                        go(item.target!);
                      }}
                    >
                      {content}
                    </a>
                  ) : (
                    <button
                      type="button"
                      data-item
                      className={s.item}
                      onPointerEnter={() => redraw(item.draws)}
                      onClick={(e) => showNotice(e.currentTarget.nextElementSibling as HTMLElement)}
                    >
                      {content}
                    </button>
                  )}
                  {!item.target && (
                    <span className={`${s.notice} small-label`} aria-hidden="true">
                      {NOTICE}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className={`${s.bottom} label`} data-bottom>
          {/* replace with client email */}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          {/* replace: client LinkedIn page */}
          <a href={LINKEDIN_URL}>LINKEDIN</a>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              go("#contact");
            }}
          >
            LET’S TALK
          </a>
        </div>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>
    </>
  );
}
