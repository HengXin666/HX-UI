"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 TechText 条目, 实现为 HX 自有.

import { useEffect, useRef, type CSSProperties, type ElementType, type JSX } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { approach } from "../../../motion/spring/follow";
import { prefersReducedMotion } from "../../../primitives/motion";
import { cn } from "../../../primitives/utils";
import { usePointerField } from "../kernel/pointer";
import { graphemes } from "../kernel/split";
import { HALF, MS_PER_S, PERCENT, TEXT_FRAME } from "../kernel/tokens";
import { TextShell } from "../kernel/TextShell";
import { draftDamping, kickShare, nearestGlyph, outlineAmount, springBack, typeShown, type Glyph2 } from "./parts/draft";
import type { ExtrudeTone } from "./ExtrudeText";
import { DRAFT_CLICK_SLOP_PX, DRAFT_DEFAULTS, DRAFT_FRAME_PAD_PX, DRAFT_INTRO_DELAY_S, DRAFT_KICK_PX_S, DRAFT_TAU_S, DRAFT_TYPE_STEP_S, EXTRUDE_REST } from "./tokens";

export interface DraftTextProps {
  readonly text: string;
  /** 正文颜色与制图线颜色 (语义 token 名). */
  readonly tone?: ExtrudeTone;
  readonly accentTone?: ExtrudeTone;
  /** 指针感应半径 (px). */
  readonly reach?: number;
  /** 描边过渡的柔度, 0 到 1. */
  readonly softness?: number;
  readonly dashLength?: number;
  readonly dashGap?: number;
  readonly strokeWidth?: number;
  /** 十字辅助线. */
  readonly guides?: boolean;
  /** 选框. */
  readonly selection?: boolean;
  /** 选框上的字与坐标标签. */
  readonly labels?: boolean;
  /** 字形可拖, 松手回弹. */
  readonly draggable?: boolean;
  /** 回弹弹性, 0 到 1. */
  readonly bounce?: number;
  /** 点击时字形向上踢开, 向两侧衰减. */
  readonly clickKick?: boolean;
  /** none 直接显示; type 逐字打出. */
  readonly intro?: "none" | "type";
  /** 入场速度倍数. */
  readonly speed?: number;
  readonly fontSize?: string;
  readonly fontWeight?: number;
  readonly as?: ElementType;
  readonly className?: string;
}

function toneVar(tone: ExtrudeTone): string {
  return tone === "current" ? "currentColor" : `var(--${tone})`;
}

/**
 * 制图字: 指针靠近时字形转成描边, 最近一格套上虚线选框与坐标标签, 十字辅助线跟着指针; 字形可拖, 松手按弹簧回弹, 点击向上踢开.
 * DOM + SVG 实现, 每帧只写字形 transform 与两个自定义属性, 选框与辅助线的位置和透明度. 减弱动效: 静止原文, 不拖不踢. 读屏读一份原文.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-text-pointer.md
 */
export function DraftText({
  text,
  tone = "current",
  accentTone = "primary",
  reach = DRAFT_DEFAULTS.reach,
  softness = DRAFT_DEFAULTS.softness,
  dashLength = DRAFT_DEFAULTS.dashLength,
  dashGap = DRAFT_DEFAULTS.dashGap,
  strokeWidth = DRAFT_DEFAULTS.strokeWidth,
  guides = true,
  selection = true,
  labels = true,
  draggable = true,
  bounce = DRAFT_DEFAULTS.bounce,
  clickKick = true,
  intro = "none",
  speed = DRAFT_DEFAULTS.speed,
  fontSize = DRAFT_DEFAULTS.fontSize,
  fontWeight = DRAFT_DEFAULTS.fontWeight,
  as,
  className,
}: DraftTextProps): JSX.Element {
  const reduced = useReducedMotion();
  const still = reduced || prefersReducedMotion();
  const cells = graphemes(text);
  const host = useRef<HTMLElement>(null);
  const spans = useRef<(HTMLSpanElement | null)[]>([]);
  const frame = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const lines = useRef<SVGGElement>(null);
  const s = useRef({ glyphs: [] as (Glyph2 & { o: number })[], fx: 0, fy: 0, fw: 0, fh: 0, fa: 0, ga: 0, t: 0, grab: null as null | { i: number; dx: number; dy: number; x0: number; y0: number; moved: boolean } });
  if (s.current.glyphs.length !== cells.length) s.current.glyphs = cells.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, o: 0 }));

  const loop = useFrameLoop((dtMs) => {
    const st = s.current;
    const dt = dtMs / MS_PER_S;
    st.t += dt;
    const damping = draftDamping(bounce);
    const centers = spans.current.map((n) => (n ? { x: n.offsetLeft + n.offsetWidth * HALF, y: n.offsetTop + n.offsetHeight * HALF } : { x: 0, y: 0 }));
    const focus = st.grab ? st.grab.i : field.inside ? nearestGlyph(field.x, field.y, centers, reach) : -1;
    let busy = field.inside || st.grab !== null;
    st.glyphs.forEach((g, i) => {
      const node = spans.current[i];
      if (st.grab?.i === i) {
        g.x = approach(g.x, field.x - st.grab.dx, dt, DRAFT_TAU_S.grab);
        g.y = approach(g.y, field.y - st.grab.dy, dt, DRAFT_TAU_S.grab);
      } else springBack(g, damping, dt);
      const near = field.inside ? outlineAmount(Math.hypot(field.x - centers[i].x, field.y - centers[i].y), reach, softness) : 0;
      g.o = approach(g.o, Math.max(near, i === focus ? 1 : 0), dt, DRAFT_TAU_S.outline);
      if (Math.abs(g.x) + Math.abs(g.y) + Math.abs(g.vx) + Math.abs(g.vy) > EXTRUDE_REST || g.o > EXTRUDE_REST) busy = true;
      if (!node) return;
      const shown = intro === "type" ? typeShown(i, st.t * speed, DRAFT_INTRO_DELAY_S, DRAFT_TYPE_STEP_S) : 1;
      if (shown < 1) busy = true;
      node.style.transform = `translate(${g.x}px, ${g.y}px)`;
      node.style.opacity = String(shown);
      node.style.setProperty("--hx-fill", `${(1 - g.o) * PERCENT}%`);
      node.style.setProperty("--hx-edge", `${g.o * PERCENT}%`);
    });
    const box = focus >= 0 ? spans.current[focus] : null;
    if (box) {
      const g = st.glyphs[focus];
      st.fx = approach(st.fx, box.offsetLeft + g.x - DRAFT_FRAME_PAD_PX, dt, DRAFT_TAU_S.glide);
      st.fy = approach(st.fy, box.offsetTop + g.y - DRAFT_FRAME_PAD_PX, dt, DRAFT_TAU_S.glide);
      st.fw = approach(st.fw, box.offsetWidth + DRAFT_FRAME_PAD_PX * 2, dt, DRAFT_TAU_S.glide);
      st.fh = approach(st.fh, box.offsetHeight + DRAFT_FRAME_PAD_PX * 2, dt, DRAFT_TAU_S.glide);
    }
    st.fa = approach(st.fa, box && selection ? 1 : 0, dt, DRAFT_TAU_S.frame);
    st.ga = approach(st.ga, guides && field.inside ? 1 : 0, dt, DRAFT_TAU_S.guide);
    if (frame.current) {
      frame.current.style.transform = `translate(${st.fx}px, ${st.fy}px)`;
      frame.current.style.width = `${st.fw}px`;
      frame.current.style.height = `${st.fh}px`;
      frame.current.style.opacity = String(st.fa);
    }
    if (label.current && box && labels) label.current.textContent = `${cells[focus]} ${Math.round(st.fx)},${Math.round(st.fy)}`;
    if (lines.current) {
      lines.current.style.opacity = String(st.ga);
      lines.current.setAttribute("transform", `translate(${field.x} ${field.y})`);
    }
    return busy || st.fa > EXTRUDE_REST || st.ga > EXTRUDE_REST;
  }, { ...TEXT_FRAME, active: !still });

  const field = usePointerField(host, (f, kind) => {
    const st = s.current;
    if (kind === "down" && draggable) {
      const i = nearestGlyph(f.x, f.y, spans.current.map((n) => (n ? { x: n.offsetLeft + n.offsetWidth * HALF, y: n.offsetTop + n.offsetHeight * HALF } : { x: 0, y: 0 })), reach);
      if (i >= 0) st.grab = { i, dx: f.x - st.glyphs[i].x, dy: f.y - st.glyphs[i].y, x0: f.x, y0: f.y, moved: false };
    } else if (kind === "move" && st.grab && Math.hypot(f.x - st.grab.x0, f.y - st.grab.y0) > DRAFT_CLICK_SLOP_PX) st.grab.moved = true;
    else if ((kind === "up" || kind === "leave") && st.grab) {
      const { i, moved } = st.grab;
      st.grab = null;
      if (!moved && clickKick) st.glyphs.forEach((g, j) => { g.vy -= DRAFT_KICK_PX_S * kickShare(j, i); });
    }
    loop.wake();
  }, { enabled: !still, scope: "window" });

  useEffect(() => {
    if (!still) return;
    spans.current.forEach((n) => { if (n) { n.style.transform = ""; n.style.opacity = "1"; } });
  }, [still]);

  const ink = toneVar(tone);
  const accent = toneVar(accentTone);
  const dash = `${dashLength} ${dashGap}`;
  const glyphStyle = {
    color: `color-mix(in srgb, ${ink} var(--hx-fill), transparent)`,
    WebkitTextStroke: `${strokeWidth}px color-mix(in srgb, ${accent} var(--hx-edge), transparent)`,
    "--hx-fill": "100%",
    "--hx-edge": "0%",
    opacity: intro === "type" && !still ? 0 : 1,
  } as CSSProperties;
  return (
    <TextShell
      ref={host}
      as={as}
      text={text}
      slot="draft-text"
      className={cn("relative inline-block select-none", draggable && !still && "touch-none", className)}
      style={{ fontSize, fontWeight }}
      visualClassName="relative inline-block whitespace-pre"
    >
      {cells.map((c, i) => (
        <span key={i} ref={(n) => { spans.current[i] = n; }} data-glyph={i} className={cn("relative inline-block", draggable && !still && "cursor-grab")} style={glyphStyle}>
          {c}
        </span>
      ))}
      <div ref={frame} data-part="frame" className="pointer-events-none absolute left-0 top-0 border border-dashed opacity-0" style={{ borderColor: accent }}>
        {labels && <span ref={label} className="absolute -top-5 left-0 whitespace-nowrap font-mono text-[10px] leading-none" style={{ color: accent }} />}
      </div>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" fill="none">
        <g ref={lines} data-part="guides" opacity={0} stroke={accent} strokeWidth={strokeWidth} strokeDasharray={dash}>
          <line x1={-reach} y1={0} x2={reach} y2={0} />
          <line x1={0} y1={-reach} x2={0} y2={reach} />
        </g>
      </svg>
    </TextShell>
  );
}
