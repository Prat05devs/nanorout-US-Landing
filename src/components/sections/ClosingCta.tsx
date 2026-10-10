"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap } from "@/lib/gsap";
import { useSectionMotion } from "@/lib/motion";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import Button from "@/components/ui/Button";
import TextLink from "@/components/ui/TextLink";
import s from "./closing.module.css";

const ROLES = ["student", "researcher", "investor", "other"] as const;
type Role = (typeof ROLES)[number];
const PURPOSES: Record<Role, string[]> = {
  student: ["explore an internship"],
  researcher: ["discuss a collaboration"],
  investor: ["learn about partnerships"],
  other: ["say hello"],
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ClosingCta() {
  const root = useRef<HTMLElement>(null);
  const formWrap = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [org, setOrg] = useState("");
  const [purpose, setPurpose] = useState(PURPOSES.student[0]);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: boolean; email?: boolean }>({});
  const [fading, setFading] = useState(false);
  const [sent, setSent] = useState(false);
  useSectionMotion(root);

  const changeRole = (r: Role) => {
    setFading(true);
    setRole(r);
    window.setTimeout(() => {
      setPurpose(PURPOSES[r][0]);
      setFading(false);
    }, 200);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = { name: !name.trim(), email: !EMAIL_RE.test(email.trim()) };
    setErrors(next);
    if (next.name || next.email) {
      const first = next.name ? "cta-name" : "cta-email";
      document.getElementById(first)?.focus();
      return;
    }
    // demo only – connect a form service before launch
    const el = formWrap.current;
    if (!el || prefersReducedMotion()) {
      setSent(true);
      return;
    }
    gsap.to(el.querySelector("form"), { autoAlpha: 0, duration: 0.4, onComplete: () => setSent(true) });
  };

  useEffect(() => {
    if (!sent || !formWrap.current) return;
    const el = formWrap.current;
    el.querySelector<HTMLElement>("[data-success-focus]")?.focus();
    if (prefersReducedMotion()) return;
    gsap.fromTo(el.querySelector("[data-success]"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" });
    gsap.fromTo(el.querySelector("[data-tick]"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.6, ease: "power2.inOut", delay: 0.2 });
  }, [sent]);

  const reset = () => {
    setName("");
    setOrg("");
    setEmail("");
    setRole("student");
    setPurpose(PURPOSES.student[0]);
    setErrors({});
    setSent(false);
  };

  return (
    <section ref={root} id="contact" className="section" data-spine="CONTACT">
      <div className="container">
        <h2 className={s.headline} data-headline data-glow data-end-of-route>
          Let’s route the future together.
        </h2>

        <div ref={formWrap} className={s.formWrap} data-reveal>
          {!sent ? (
            <form noValidate onSubmit={submit}>
              <p className={s.sentence}>
                Hello, my name is{" "}
                <span className={`${s.field} ${errors.name ? s.invalid : ""}`} data-value={name || "your name"}>
                  <label htmlFor="cta-name" className="sr-only">
                    Your name (required)
                  </label>
                  <input
                    id="cta-name"
                    className={s.input}
                    type="text"
                    autoComplete="name"
                    placeholder="your name"
                    value={name}
                    required
                    aria-invalid={errors.name || undefined}
                    aria-describedby={errors.name ? "cta-name-error" : undefined}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((x) => ({ ...x, name: false }));
                    }}
                  />
                  {errors.name && (
                    <span id="cta-name-error" className={`${s.error} small-label`}>
                      ! PLEASE ADD YOUR NAME
                    </span>
                  )}
                </span>
                . I’m a{" "}
                <span className={`${s.field} ${s.selectField}`}>
                  <label htmlFor="cta-role" className="sr-only">
                    Your role
                  </label>
                  <select id="cta-role" className={s.select} value={role} onChange={(e) => changeRole(e.target.value as Role)}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <span className={s.caret} aria-hidden="true">
                    ▾
                  </span>
                </span>{" "}
                at{" "}
                <span className={s.field} data-value={org || "organisation"}>
                  <label htmlFor="cta-org" className="sr-only">
                    Organisation (optional)
                  </label>
                  <input
                    id="cta-org"
                    className={s.input}
                    type="text"
                    autoComplete="organization"
                    placeholder="organisation"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                  />
                </span>
                . I’d like to{" "}
                <span className={`${s.field} ${s.selectField} ${s.purpose} ${fading ? s.fading : ""}`}>
                  <label htmlFor="cta-purpose" className="sr-only">
                    What you would like to do
                  </label>
                  <select id="cta-purpose" className={s.select} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                    {PURPOSES[role].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <span className={s.caret} aria-hidden="true">
                    ▾
                  </span>
                </span>
                . You can reach me at{" "}
                <span className={`${s.field} ${errors.email ? s.invalid : ""}`} data-value={email || "your email"}>
                  <label htmlFor="cta-email" className="sr-only">
                    Your email (required)
                  </label>
                  <input
                    id="cta-email"
                    className={s.input}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="your email"
                    value={email}
                    required
                    aria-invalid={errors.email || undefined}
                    aria-describedby={errors.email ? "cta-email-error" : undefined}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((x) => ({ ...x, email: false }));
                    }}
                  />
                  {errors.email && (
                    <span id="cta-email-error" className={`${s.error} small-label`}>
                      ! PLEASE ADD A VALID EMAIL
                    </span>
                  )}
                </span>
                .
              </p>
              <Button type="submit" tall className={s.send}>
                SEND
              </Button>
            </form>
          ) : (
            <div className={s.success} data-success>
              <p className={s.successLine} tabIndex={-1} data-success-focus>
                Route received. We’ll be in touch.
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path data-tick d="M3 12.5L9 18.5L21 5.5" />
                </svg>
              </p>
              <TextLink onClick={reset}>SEND ANOTHER</TextLink>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
