"use client";

import type { ReactNode } from "react";
import { scrollToTarget } from "@/lib/scroll";
import s from "./ui.module.css";

type Props = {
  children: ReactNode;
  arrow?: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
};

/** 5.4 Text link: underline redraws left to right on hover, arrow nudges 6px. */
export default function TextLink({ children, arrow, to, href, onClick, className }: Props) {
  const cls = `${s.textLink} label ${className ?? ""}`;
  const body = (
    <>
      <span>{children}</span>
      {arrow && (
        <span className={s.arrow} aria-hidden="true">
          {arrow}
        </span>
      )}
    </>
  );
  if (to || href) {
    return (
      <a
        href={to ?? href}
        className={cls}
        onClick={(e) => {
          if (!to) return;
          e.preventDefault();
          onClick?.();
          scrollToTarget(to);
        }}
      >
        {body}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick}>
      {body}
    </button>
  );
}
