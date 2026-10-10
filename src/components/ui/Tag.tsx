import type { CSSProperties } from "react";
import s from "./ui.module.css";

/** 5.1 Section tag and 5.2 boxed multi-cell tag: cells share their borders. */
export default function Tag({ cells, className, ...rest }: { cells: string[]; className?: string } & Record<`data-${string}`, unknown>) {
  return (
    <span className={`${s.tags} small-label ${className ?? ""}`} {...rest}>
      {cells.map((c, i) => (
        <span key={c} className={s.cell} style={{ "--i": i } as CSSProperties}>
          {c}
        </span>
      ))}
    </span>
  );
}
