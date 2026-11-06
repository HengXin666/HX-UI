import type { JSX } from "react";
import { CAPTION, LABEL, SWATCH_CARD, SWATCH_INFO } from "./impl/token-classes";

/**
 * 一块色样: 色块 + 变量名 + 用途. 语义色与品牌辅色两组共用.
 * .agents/notes/implemented/feature/2026-11-01-design-tokens-depth-motion.md
 */
export function Swatch({ name, use }: { name: string; use: string }): JSX.Element {
  return (
    <div className={SWATCH_CARD}>
      <div className="h-14" style={{ background: `var(${name})` }} />
      <div className={SWATCH_INFO}>
        <div className={LABEL}>{name}</div>
        <div className={CAPTION}>{use}</div>
      </div>
    </div>
  );
}
