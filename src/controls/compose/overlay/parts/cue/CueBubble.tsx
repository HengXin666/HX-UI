/** CueTip 的气泡: 弹出/收起过渡, 热切换滑行层, 倾斜层, 内容与快捷键, 可选小三角. */
import type { JSX, ReactNode, RefObject } from "react";
import { COMPOSE_EASE_OUT, CSS_PROP, CUE, CUE_SIZES, PX, colorVar, transitionOf, type CueSide, type CueSize, type HxColor } from "../../../tokens";
import { arrowStyle, placement, riseOffset } from "./cue-geometry";

interface CueBubbleProps {
  readonly bubbleRef: RefObject<HTMLSpanElement | null>;
  readonly travelRef: RefObject<HTMLSpanElement | null>;
  readonly leanRef: RefObject<HTMLSpanElement | null>;
  readonly id: string;
  readonly open: boolean;
  readonly warmOpen: boolean;
  readonly reduced: boolean;
  readonly side: CueSide;
  readonly vertical: boolean;
  readonly gap: number;
  readonly popDuration: number;
  readonly popScale: number;
  readonly popBlur: number;
  readonly surfaceColor: HxColor;
  readonly inkColor: HxColor;
  readonly size: CueSize;
  readonly radius: number;
  readonly arrow: boolean;
  readonly content: ReactNode;
  readonly shortcut?: ReactNode;
}

export function CueBubble(props: CueBubbleProps): JSX.Element {
  const { bubbleRef, travelRef, leanRef, id, open, warmOpen, reduced, side, vertical, gap, popDuration, popScale, popBlur, surfaceColor, inkColor, size, radius, arrow, content, shortcut } = props;
  const dims = CUE_SIZES[size];
  const popMs = warmOpen ? CUE.warmPopMs : popDuration;
  const bubbleTransition = reduced
    ? undefined
    : open
      ? transitionOf([
          [CSS_PROP.opacity, popMs, COMPOSE_EASE_OUT],
          [CSS_PROP.transform, popMs, COMPOSE_EASE_OUT],
          [CSS_PROP.filter, popMs, COMPOSE_EASE_OUT],
        ])
      : transitionOf([[CSS_PROP.opacity, CUE.closeMs, COMPOSE_EASE_OUT]]);
  const scale = open || reduced ? 1 : popScale;

  return (
    <span
      ref={bubbleRef}
      id={id}
      role="tooltip"
      data-warm={warmOpen || undefined}
      className="pointer-events-none absolute z-50 whitespace-nowrap"
      style={{
        ...placement(side, gap),
        opacity: open ? 1 : 0,
        visibility: open || !reduced ? undefined : "hidden",
        transform: `${riseOffset(side, open)} scale(${scale})`,
        filter: open || reduced ? undefined : `blur(${popBlur}${PX})`,
        transition: bubbleTransition,
      }}
    >
      <span ref={travelRef} className="block">
        <span ref={leanRef} className="block" style={{ transformOrigin: vertical ? "center bottom" : "center" }}>
          <span
            className="relative flex items-center gap-2 border border-border"
            style={{
              background: colorVar(surfaceColor),
              color: colorVar(inkColor),
              borderRadius: radius,
              fontSize: dims.font,
              padding: `${dims.padY}${PX} ${dims.padX}${PX}`,
            }}
          >
            <span>{content}</span>
            {shortcut ? <kbd className="rounded border border-border px-1 font-mono text-muted-foreground">{shortcut}</kbd> : null}
            {arrow ? <span aria-hidden className="absolute border-b border-r border-border" style={{ ...arrowStyle(side), background: colorVar(surfaceColor) }} /> : null}
          </span>
        </span>
      </span>
    </span>
  );
}
