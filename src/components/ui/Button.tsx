"use client";

import type { ReactNode } from "react";
import { scrollToTarget } from "@/lib/scroll";
import s from "./ui.module.css";

type Props = {
  children: ReactNode;
  variant?: "solid" | "outline";
  /** Section id to scroll to, e.g. "#nis". Renders a link. */
  to?: string;
  type?: "button" | "submit";
  tall?: boolean;
  ink?: boolean;
  className?: string;
  onClick?: () => void;
};

export default function Button({ children, variant = "solid", to, type = "button", tall, ink, className, onClick }: Props) {
  const cls = [s.btn, s[variant], tall && s.tall, ink && s.inkBtn, className].filter(Boolean).join(" ");
  const inner = (
    <>
      <span>{children}</span>
      <span className={s.arrow} aria-hidden="true">
        →
      </span>
    </>
  );
  if (to) {
    return (
      <a
        href={to}
        className={cls}
        data-magnetic
        onClick={(e) => {
          e.preventDefault();
          onClick?.();
          scrollToTarget(to);
        }}
      >
        {inner}
      </a>
    );
  }
  return (
    <button type={type} className={cls} data-magnetic onClick={onClick}>
      {inner}
    </button>
  );
}
