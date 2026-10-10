"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { scrollToTarget } from "@/lib/scroll";
import { CONTACT_EMAIL, LINKEDIN_URL, NAV, NOTICE } from "@/lib/nav";
import Logo from "@/components/art/Logo";
import s from "./footer.module.css";

/**
 * Giant outlined wordmark. Drawn as SVG text so it spans the container exactly;
 * the viewBox stops at 88% of the cap height, so the bottom 12% of the letters is cut off.
 */
function Wordmark() {
  const ref = useRef<SVGSVGElement>(null);
  // Defaults close to Archivo Black's real metrics; refined after fonts load.
  const [box, setBox] = useState({ w: 640, cap: 72 });
  useEffect(() => {
    document.fonts.ready.then(() => {
      const el = ref.current?.querySelector("text");
      if (!el) return;
      const c = document.createElement("canvas").getContext("2d");
      if (!c) return;
      const family = getComputedStyle(el).fontFamily;
      c.font = `400 100px ${family}`;
      const m = c.measureText("NANOROUT");
      const cap = c.measureText("N").actualBoundingBoxAscent;
      if (m.width && cap) setBox({ w: Math.ceil(m.width), cap });
    });
  }, []);
  const h = box.cap * 0.88;
  return (
    <svg ref={ref} className={s.wordmark} viewBox={`0 0 ${box.w} ${h.toFixed(2)}`} aria-hidden="true">
      <text x="0" y={box.cap.toFixed(2)} fontSize="100" textLength={box.w} lengthAdjust="spacing">
        NANOROUT
      </text>
    </svg>
  );
}

export default function Footer() {
  const notice = (el: HTMLElement | null) => {
    if (!el) return;
    gsap.killTweensOf(el);
    gsap
      .timeline()
      .fromTo(el, { autoAlpha: 0, x: -6 }, { autoAlpha: 1, x: 0, duration: 0.2 })
      .to(el, { autoAlpha: 0, duration: 0.3 }, "+=2.5");
  };

  return (
    <footer id="site-footer" className={s.footer}>
      <div className="container">
        <div className={s.cols}>
          <div>
            <Logo
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget("#top");
              }}
            />
            <p className={`body ${s.about}`}>
              Nanorout is building the Neuro Information System at the meeting point of neuroscience, AI and semiconductors.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className={`small-label ${s.colTitle}`}>PAGES</p>
            <ul className={`${s.links} label`}>
              {NAV.map((item) => (
                <li key={item.n} className={s.linkWrap}>
                  {item.target ? (
                    <a
                      className={s.link}
                      href={item.target}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToTarget(item.target!);
                      }}
                    >
                      {item.footer}
                    </a>
                  ) : (
                    <>
                      <button type="button" className={s.link} onClick={(e) => notice(e.currentTarget.nextElementSibling as HTMLElement)}>
                        {item.footer}
                      </button>
                      <span className={`${s.notice} small-label`} role="status">
                        {NOTICE}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className={`small-label ${s.colTitle}`}>CONTACT</p>
            <ul className={`${s.links} label`}>
              <li>
                {/* replace with client email */}
                <a className={s.link} href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                {/* replace */}
                <a className={s.link} href={LINKEDIN_URL}>
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className={`small-label ${s.colTitle}`}>LEGAL</p>
            <ul className={`${s.links} label`}>
              <li>
                <a className={s.link} href="#">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a className={s.link} href="#">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={`${s.bottom} label`}>
          <span>© NANOROUT 2026</span>
          <a
            className={s.top}
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget("#top");
            }}
          >
            <span>BACK TO TOP</span>
            <span aria-hidden="true">↑</span>
          </a>
        </div>
        <Wordmark />
      </div>
    </footer>
  );
}
