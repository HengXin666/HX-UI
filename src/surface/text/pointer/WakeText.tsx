"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 EchoText 条目, 实现为 HX 自有.

import { useEffect, useRef, type CSSProperties, type ElementType, type JSX } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { approach } from "../../../motion/spring/follow";
import { prefersReducedMotion } from "../../../primitives/motion";
import { cn } from "../../../primitives/utils";
import { usePointerField } from "../kernel/pointer";
import { DOUBLE, HALF, MS_PER_S, TEXT_FRAME } from "../kernel/tokens";
import { TextShell } from "../kernel/TextShell";
import { burstAt, driftLead, echoLook, followChain, pointerLead, wakeCount, type Vec, type WakeDirection, type WakeEase } from "./parts/wake";
import type { ExtrudeTone } from "./ExtrudeText";
import { EXTRUDE_OUTLINE_PX, EXTRUDE_REF_HZ, WAKE_BURST_GAP_MS, WAKE_BURST_LIFE_MS, WAKE_BURST_PUSH, WAKE_DEFAULTS, WAKE_DRIFT_IDLE_MS, WAKE_DRIFT_PERIOD_MS, WAKE_SETTLE_SHARE } from "./tokens";

export interface WakeTextProps {
  readonly text: string;
  /** 残影层数, 钳到 0 到 32. */
  readonly echoes?: number;
  /** 每 60Hz 帧留下的比例, 越大拖得越长. */
  readonly lag?: number;
  /** 最远一层的偏移 (px). */
  readonly offset?: number;
  /** 漂移时残影朝哪边. */
  readonly direction?: WakeDirection;
  /** 第一层的不透明度, 往后线性降到 0. */
  readonly fade?: number;
  /** 最后一层的模糊 (px). */
  readonly blur?: number;
  /** 残影颜色 (语义 token 名); 给了 echoColors 时按层轮换. */
  readonly tint?: ExtrudeTone;
  readonly echoColors?: readonly ExtrudeTone[];
  /** solid 实心; outline 只描边. */
  readonly echoStyle?: "solid" | "outline";
  /** 最后一层的缩放. */
  readonly echoScale?: number;
  /** drift 自己漂; pointer 只跟指针; both 指针停下一会儿后回到漂移. */
  readonly mode?: "drift" | "pointer" | "both";
  /** 点击时残影依次爆开. */
  readonly clickBurst?: boolean;
  /** 指针影响半径 (px). */
  readonly cursorRadius?: number;
  /** 领头点换目标后的回位时长 (毫秒). */
  readonly duration?: number;
  /** 爆开包络的曲线. */
  readonly ease?: WakeEase;
  readonly fontSize?: string;
  readonly fontWeight?: number;
  readonly as?: ElementType;
  readonly className?: string;
}

function toneVar(tone: ExtrudeTone): string {
  return tone === "current" ? "currentColor" : `var(--${tone})`;
}

/**
 * 残影字: 正文身后拖 N 层残影, 一层追一层 (链式一阶跟随), 自己沿方向漂移或背离指针, 点击时依次爆开.
 * 每帧只写各层的 transform 与 opacity, 不重渲染. 减弱动效: 残影静止在漂移的起点, 不跟不爆. 读屏读一份原文.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-text-pointer.md
 */
export function WakeText({
  text,
  echoes = WAKE_DEFAULTS.echoes,
  lag = WAKE_DEFAULTS.lag,
  offset = WAKE_DEFAULTS.offset,
  direction = "right",
  fade = WAKE_DEFAULTS.fade,
  blur = WAKE_DEFAULTS.blur,
  tint = "accent-2",
  echoColors,
  echoStyle = "solid",
  echoScale = WAKE_DEFAULTS.echoScale,
  mode = "both",
  clickBurst = true,
  cursorRadius = WAKE_DEFAULTS.cursorRadius,
  duration = WAKE_DEFAULTS.duration,
  ease = "ease-out",
  fontSize = WAKE_DEFAULTS.fontSize,
  fontWeight = WAKE_DEFAULTS.fontWeight,
  as,
  className,
}: WakeTextProps): JSX.Element {
  const reduced = useReducedMotion();
  const host = useRef<HTMLElement>(null);
  const layers = useRef<(HTMLSpanElement | null)[]>([]);
  const count = wakeCount(echoes);
  const still = reduced || prefersReducedMotion();
  const rest = driftLead(direction, offset, 0);
  const s = useRef({ lead: { x: rest.x, y: rest.y }, chain: [] as { x: number; y: number }[], phase: 0, now: 0, lastPointer: -Infinity, burst: -Infinity });
  if (s.current.chain.length !== count) s.current.chain = Array.from({ length: count }, () => ({ x: rest.x, y: rest.y }));

  const loop = useFrameLoop((dtMs) => {
    const el = host.current;
    if (!el) return false;
    const st = s.current;
    const dt = dtMs / MS_PER_S;
    st.now += dtMs;
    st.phase += (dtMs / WAKE_DRIFT_PERIOD_MS) * Math.PI * DOUBLE;
    const pointing = mode !== "drift" && field.seen && (field.inside || st.now - st.lastPointer < WAKE_DRIFT_IDLE_MS);
    let target: Vec;
    if (pointing) target = pointerLead(field.x - el.clientWidth * HALF, field.y - el.clientHeight * HALF, offset, cursorRadius);
    else target = mode === "pointer" ? { x: 0, y: 0 } : driftLead(direction, offset, st.phase);
    const tau = duration / MS_PER_S / WAKE_SETTLE_SHARE;
    st.lead.x = approach(st.lead.x, target.x, dt, tau);
    st.lead.y = approach(st.lead.y, target.y, dt, tau);
    followChain(st.chain, st.lead, lag, dt, EXTRUDE_REF_HZ);
    const since = st.now - st.burst;
    st.chain.forEach((p, i) => {
      const node = layers.current[i];
      if (!node) return;
      const look = echoLook(i, count, fade, blur, echoScale);
      const share = (i + 1) / Math.max(1, count);
      const push = 1 + WAKE_BURST_PUSH * burstAt(since, i, ease);
      node.style.transform = `translate(${p.x * share * push}px, ${p.y * share * push}px) scale(${look.scale})`;
    });
    const bursting = since < WAKE_BURST_LIFE_MS + count * WAKE_BURST_GAP_MS;
    return mode !== "pointer" || pointing || bursting || Math.hypot(st.lead.x - target.x, st.lead.y - target.y) > HALF;
  }, { ...TEXT_FRAME, active: !still });

  const field = usePointerField(host, (_f, kind) => {
    if (kind === "move" || kind === "enter") s.current.lastPointer = s.current.now;
    if (kind === "down" && clickBurst) s.current.burst = s.current.now;
    loop.wake();
  }, { enabled: !still });

  useEffect(() => {
    if (!still) return;
    layers.current.forEach((node, i) => {
      if (!node) return;
      const share = (i + 1) / Math.max(1, count);
      node.style.transform = `translate(${rest.x * share}px, ${rest.y * share}px) scale(${echoLook(i, count, fade, blur, echoScale).scale})`;
    });
  }, [still, count, rest.x, rest.y, fade, blur, echoScale]);

  const order = Array.from({ length: count }, (_, i) => count - 1 - i);
  return (
    <TextShell
      ref={host}
      as={as}
      text={text}
      slot="wake-text"
      className={cn("relative inline-block select-none", className)}
      style={{ fontSize, fontWeight }}
      visualClassName="relative inline-block whitespace-nowrap"
    >
      {order.map((i) => {
        const look = echoLook(i, count, fade, blur, echoScale);
        const tone = toneVar(echoColors && echoColors.length > 0 ? echoColors[i % echoColors.length] : tint);
        const share = (i + 1) / Math.max(1, count);
        const style = {
          "--hx-echo": tone,
          color: echoStyle === "outline" ? "transparent" : "var(--hx-echo)",
          WebkitTextStroke: echoStyle === "outline" ? `${EXTRUDE_OUTLINE_PX}px var(--hx-echo)` : undefined,
          opacity: look.opacity,
          filter: look.blur > 0 ? `blur(${look.blur}px)` : undefined,
          transform: `translate(${rest.x * share}px, ${rest.y * share}px) scale(${look.scale})`,
        } as CSSProperties;
        return (
          <span key={i} ref={(node) => { layers.current[i] = node; }} data-echo={i} className="pointer-events-none absolute inset-0" style={style}>
            {text}
          </span>
        );
      })}
      <span data-part="face" className="relative">{text}</span>
    </TextShell>
  );
}
