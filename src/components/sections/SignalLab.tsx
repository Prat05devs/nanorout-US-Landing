"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useSectionMotion } from "@/lib/motion";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { hash } from "@/lib/random";
import s from "./lab.module.css";

/* 14.4 The signals */
const TAU = Math.PI * 2;
const base = (x: number) => 0.6 * Math.sin((TAU * x) / 220) + 0.25 * Math.sin((TAU * x) / 90 + 1) + 0.1 * Math.sin((TAU * x) / 37 + 2);
const noise = (x: number) => 0.55 * hash(Math.floor(x / 2), 99) + 0.2 * Math.sin(x / 5);

const INK = "#121417";
const SPEED = 60; // px per second

function drawTrace(canvas: HTMLCanvasElement, offset: number, k: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;

  // tick marks every 40px (top and bottom) and a dashed centre line
  for (let x = 0; x <= w; x += 40) {
    ctx.fillRect(x, 0, 1, 6);
    ctx.fillRect(x, h - 6, 1, 6);
  }
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 6]);
  ctx.beginPath();
  ctx.moveTo(0, h / 2 + 0.5);
  ctx.lineTo(w, h / 2 + 0.5);
  ctx.stroke();
  ctx.setLineDash([]);

  // the trace: a point every 2px; value 1 = 40% of the area height
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let sx = 0; sx <= w; sx += 2) {
    const x = sx + offset;
    const v = base(x) + noise(x) * k;
    const y = h / 2 - v * h * 0.4;
    if (sx === 0) ctx.moveTo(sx, y);
    else ctx.lineTo(sx, y);
  }
  ctx.stroke();
}

export default function SignalLab() {
  const root = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLCanvasElement>(null);
  const output = useRef<HTMLCanvasElement>(null);
  const slider = useRef<HTMLInputElement>(null);
  const strike = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [touched, setTouched] = useState(false);
  const clarity = useRef(0);
  const offset = useRef(0);
  const auto = useRef<gsap.core.Tween | null>(null);
  const struck = useRef(false);
  useSectionMotion(root);

  const redraw = useCallback(() => {
    if (input.current) drawTrace(input.current, offset.current, 1);
    if (output.current) drawTrace(output.current, offset.current, Math.pow(1 - clarity.current, 1.5));
  }, []);

  const apply = useCallback(
    (v: number) => {
      clarity.current = v / 100;
      setValue(v);
      // 14.5 strikethrough: draws at 98%+, undraws below 90%
      const line = strike.current;
      if (line) {
        if (v >= 98 && !struck.current) {
          struck.current = true;
          gsap.to(line, { scaleX: 1, duration: 0.5, ease: "power3.inOut", overwrite: true });
        } else if (v < 90 && struck.current) {
          struck.current = false;
          gsap.to(line, { scaleX: 0, duration: 0.3, ease: "power3.inOut", overwrite: true });
        }
      }
      if (prefersReducedMotion()) redraw();
    },
    [redraw],
  );

  // Monitor loop: traces scroll left at 60px/s, only while the panel is on screen.
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    let raf = 0;
    let last = 0;
    let visible = false;
    let autoStarted = false;
    const frame = (t: number) => {
      if (last) offset.current += ((t - last) / 1000) * SPEED;
      last = t;
      redraw();
      if (visible) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        cancelAnimationFrame(raf);
        last = 0;
        if (reduced) redraw();
        else if (visible) raf = requestAnimationFrame(frame);
        // 14.6: first time half the panel is visible, the slider glides 0 → 100 by itself
        if (e.intersectionRatio >= 0.5 && !autoStarted && !reduced) {
          autoStarted = true;
          const proxy = { v: 0 };
          auto.current = gsap.to(proxy, {
            v: 100,
            delay: 0.8,
            duration: 3.2,
            ease: "power2.inOut",
            onUpdate: () => apply(Math.round(proxy.v)),
          });
        }
      },
      { threshold: [0, 0.5] },
    );
    io.observe(el);
    redraw();
    const onResize = () => redraw();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      auto.current?.kill();
    };
  }, [redraw, apply]);

  const takeOver = () => {
    auto.current?.kill();
    auto.current = null;
    setTouched(true);
  };

  const locked = value >= 98;
  const pct = String(value).padStart(3, "0");

  return (
    <section ref={root} id="lab" className="section" data-spine="04 — SIGNAL LAB">
      <div className="container">
        <div className={s.head}>
          <h2 className="h2" data-reveal>
            Drag to remove the{" "}
            <span className={s.strike}>
              guesswork
              <span ref={strike} className={s.strikeLine} aria-hidden="true" />
            </span>
            .
          </h2>
        </div>

        <div className={s.panelWrap} data-reveal>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`${s.corner} ${s[`c${i}`]}`} aria-hidden="true" />
          ))}
          <div ref={panel} className={`${s.panel} on-light`} data-tilt data-tilt-max="2.5">
            <div className={s.titleBar}>
              <span className="small-label">SIGNAL LAB — ILLUSTRATIVE SIMULATION</span>
              <span className={`${s.chip} ${locked ? s.locked : ""} small-label`} aria-live="polite">
                {locked ? (
                  <svg className={s.tick} viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M1.5 6.5L4.5 9.5L10.5 2.5" />
                  </svg>
                ) : (
                  <span className={s.blink} aria-hidden="true" />
                )}
                {locked ? "STATUS: SIGNAL LOCKED" : "STATUS: GUESSWORK DETECTED"}
              </span>
            </div>

            <div className={s.area}>
              <span className={`${s.areaLabel} small-label`}>INPUT</span>
              <canvas ref={input} aria-hidden="true" />
            </div>
            <div className={s.area}>
              <span className={`${s.areaLabel} small-label`}>OUTPUT</span>
              <canvas ref={output} aria-hidden="true" />
            </div>
            <p className="sr-only">Two signal traces. As the slider moves toward Nanotech, the output trace becomes smooth.</p>

            <div className={s.controls}>
              <span className={`${s.left} label`} aria-hidden="true">
                GUESSWORK
              </span>
              <input
                ref={slider}
                className={s.slider}
                type="range"
                min={0}
                max={100}
                step={1}
                value={value}
                aria-label="Clarity"
                aria-valuetext={`${value} percent`}
                onPointerDown={takeOver}
                onKeyDown={takeOver}
                onChange={(e) => {
                  takeOver();
                  apply(Number(e.target.value));
                }}
              />
              <span className={`${s.right} label`} aria-hidden="true">
                NANOTECH
              </span>
              <span className={`${s.hint} ${touched ? s.hintGone : ""} small-label`} aria-hidden="true">
                DRAG THE SQUARE
              </span>
              <output className={s.readout} aria-hidden="true">
                CLARITY {pct}%
              </output>
            </div>
          </div>
        </div>
        <p className={`${s.caption} small-label`} data-reveal>
          This is an illustration, not real patient data.
        </p>
      </div>
    </section>
  );
}
