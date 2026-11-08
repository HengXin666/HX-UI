/** ReasoningTrace 行首图形: 进行中为星芒或圆点, 落定后换成勾; 也可传入自定义节点. */
import type { ReactNode } from "react";
import { CURRENT_COLOR, NONE } from "../../tokens";

export const TRACE_GLYPH = { sparkle: "sparkle", dot: "dot", none: "none" } as const;
export type TraceGlyph = (typeof TRACE_GLYPH)[keyof typeof TRACE_GLYPH];

const GLYPH_BOX = "0 0 16 16";
const SPARKLE = "M8 1.5l1.6 4.9 4.9 1.6-4.9 1.6L8 14.5l-1.6-4.9L1.5 8l4.9-1.6z";
const CHECK = "M3.5 8.5l3 3 6-7";
const DOT_R = 3;
const CENTER = 8;
const GLYPH_EM = "1em";

export function TraceGlyphMark({ kind, done }: { kind: TraceGlyph | ReactNode; done: boolean }): ReactNode {
  if (kind === TRACE_GLYPH.none) return null;
  if (done) {
    return (
      <svg aria-hidden viewBox={GLYPH_BOX} width={GLYPH_EM} height={GLYPH_EM} fill={NONE}>
        <path d={CHECK} stroke={CURRENT_COLOR} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === TRACE_GLYPH.dot) {
    return (
      <svg aria-hidden viewBox={GLYPH_BOX} width={GLYPH_EM} height={GLYPH_EM}>
        <circle cx={CENTER} cy={CENTER} r={DOT_R} fill={CURRENT_COLOR} />
      </svg>
    );
  }
  if (kind === TRACE_GLYPH.sparkle) {
    return (
      <svg aria-hidden viewBox={GLYPH_BOX} width={GLYPH_EM} height={GLYPH_EM}>
        <path d={SPARKLE} fill={CURRENT_COLOR} />
      </svg>
    );
  }
  return kind;
}
