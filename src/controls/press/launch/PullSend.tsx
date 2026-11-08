"use client";
// 行为规格参照 docs/research/catalog/micro.md 的 SlingButton 条目, 实现为 HX 自有.

import { SendIcon } from "lucide-react";
import { useRef, useState, type JSX, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { springFromDuration } from "../../../motion/spring/fit";
import { DOUBLE, FADE_MS, HALF, MS_PER_SECOND, PLAIN_EASE, PRESS_EASE_OUT, PRESS_FEEDBACK_MS, PRESS_FIT, clamp, transitionOf } from "../tokens";
import { useDrivenValue } from "../../../motion/drive/use-driven-value";

/** 本文件内重复出现的字面量, 只写一次. */
const NEG_ONE = -1;

/** 垫子与井壁的间隙. */
export const PULL_GAP = 4;
/** 判定开始拉动的死区: 鼠标 4px, 手指 8px. */
export const PULL_SLOP = { fine: 4, coarse: 8 } as const;
/** 松手速度上限 (px/s): 手指, 鼠标. */
export const PULL_FINGER_MAX = 3000;
export const PULL_HAND_MAX = 6000;
/** 已上膛后拉回到 armAt 的这个比例以内就退膛 (滞回). */
export const PULL_CANCEL = 0.5;
/** 发射力度上限. */
export const PULL_POWER_CAP = 1.5;
/** 领头粒子时长; 其余粒子在 0.7 到 1.7 倍之间随机, 延迟 0 到 70ms. */
export const PULL_DOT_MS = 300;
export const PULL_DOT_SPREAD = { min: 0.7, delayMs: 70 } as const;
/** 图标飞出的过渡时长. */
export const PULL_ICON_MS = 360;
/** 速度取样窗: 最后一个样本早于它就视为已停手. */
export const PULL_SAMPLE_MS = 50;
/** 回弹弹簧时长 0.4s, bounce 取 recoil. */
export const PULL_RECOIL_S = 0.4;
/** 角度换弧度. */
const DEGREE = Math.PI / 180;
export const PULL_DEFAULTS = { size: 56, armAt: 48, maxPull: 160, launchSpeed: 2600, recoil: 0.2, flight: 120, particles: 14, spread: 60 } as const;

export type PullAxis = "any" | "x" | "y";
type PointerKind = keyof typeof PULL_SLOP;

export interface PullSendProps {
  readonly children?: ReactNode;
  /** 发送, 参数是 0 到 PULL_POWER_CAP 的力度; 轻点与键盘为 1. */
  readonly onSend?: (power: number) => void;
  readonly size?: number;
  readonly armAt?: number;
  readonly maxPull?: number;
  readonly launchSpeed?: number;
  readonly recoil?: number;
  readonly flight?: number;
  readonly particles?: number;
  readonly spread?: number;
  readonly axis?: PullAxis;
  readonly tapSends?: boolean;
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
  readonly className?: string;
}

interface Sample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}

/** 松手速度: 只用最后两个样本, 最后一个样本太旧就是 0. 再按指针类型钳上限. */
export function releaseVelocity(a: Sample, b: Sample, now: number, kind: PointerKind): { x: number; y: number } {
  const dt = b.t - a.t;
  if (dt <= 0 || now - b.t >= PULL_SAMPLE_MS) return { x: 0, y: 0 };
  const vx = ((b.x - a.x) / dt) * MS_PER_SECOND;
  const vy = ((b.y - a.y) / dt) * MS_PER_SECOND;
  const cap = kind === "coarse" ? PULL_FINGER_MAX : PULL_HAND_MAX;
  const speed = Math.hypot(vx, vy);
  const scale = speed > cap ? cap / speed : 1;
  return { x: vx * scale, y: vy * scale };
}

/** 力度: 拉开比例加回弹速度比例, 封顶 PULL_POWER_CAP. */
export function launchPower(distance: number, maxPull: number, speed: number, launchSpeed: number): number {
  return clamp(distance / maxPull + speed / launchSpeed, 0, PULL_POWER_CAP);
}

/** 拉动位移: 按轴向裁掉一维, 再把长度钳到 maxPull. */
export function constrainPull(dx: number, dy: number, axis: PullAxis, maxPull: number): { x: number; y: number } {
  const x = axis === "y" ? 0 : dx;
  const y = axis === "x" ? 0 : dy;
  const length = Math.hypot(x, y);
  if (length <= maxPull || length === 0) return { x, y };
  return { x: (x / length) * maxPull, y: (y / length) * maxPull };
}

/**
 * 弹弓发送. 拖动垫子拉开橡皮筋, 超过 armAt 上膛, 松手向反方向发射并按松手速度回弹.
 * 轻点或键盘 Enter / Space 直接发送. 减弱动效时没有粒子和飞行, 垫子直接归位.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-press.md
 */
export function PullSend({
  children,
  onSend,
  size = PULL_DEFAULTS.size,
  armAt = PULL_DEFAULTS.armAt,
  maxPull = PULL_DEFAULTS.maxPull,
  launchSpeed = PULL_DEFAULTS.launchSpeed,
  recoil = PULL_DEFAULTS.recoil,
  flight = PULL_DEFAULTS.flight,
  particles = PULL_DEFAULTS.particles,
  spread = PULL_DEFAULTS.spread,
  axis = "any",
  tapSends = true,
  disabled = false,
  ariaLabel = "Send",
  className,
}: PullSendProps): JSX.Element {
  const reduced = useReducedMotion();
  const px = useDrivenValue(0, reduced);
  const py = useDrivenValue(0, reduced);
  const [armed, setArmed] = useState(false);
  const [shot, setShot] = useState<{ x: number; y: number; id: number } | null>(null);
  const gesture = useRef<{ origin: Sample; samples: Sample[]; kind: PointerKind; pulling: boolean } | null>(null);
  const fx = useRef<HTMLSpanElement>(null);
  const pad = size - PULL_GAP * DOUBLE;
  const reach = Math.max(maxPull, flight * PULL_POWER_CAP) + size;

  const burst = (dirX: number, dirY: number, distance: number): void => {
    const layer = fx.current;
    if (!layer || reduced) return;
    const base = Math.atan2(dirY, dirX);
    const half = (spread / DOUBLE) * DEGREE;
    for (let i = 0; i < particles; i += 1) {
      const lead = i === 0;
      const angle = base + (lead ? 0 : (Math.random() * DOUBLE - 1) * half);
      const dot = document.createElement("span");
      dot.className = "pointer-events-none absolute left-1/2 top-1/2 size-1 rounded-full bg-primary";
      layer.appendChild(dot);
      const travel = distance * (lead ? 1 : HALF + Math.random() * HALF);
      const motion = dot.animate?.(
        [{ transform: "translate(-50%, -50%)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(angle) * travel}px), calc(-50% + ${Math.sin(angle) * travel}px))`, opacity: 0 }],
        { duration: lead ? PULL_DOT_MS : PULL_DOT_MS * (PULL_DOT_SPREAD.min + Math.random()), delay: lead ? 0 : Math.random() * PULL_DOT_SPREAD.delayMs, easing: PRESS_EASE_OUT, fill: "forwards" },
      );
      if (motion) motion.onfinish = () => dot.remove();
      else dot.remove();
    }
  };

  const send = (dirX: number, dirY: number, power: number): void => {
    onSend?.(power);
    const length = Math.hypot(dirX, dirY) || 1;
    const distance = flight * power;
    if (!reduced) setShot({ x: (dirX / length) * distance, y: (dirY / length) * distance, id: performance.now() });
    burst(dirX / length, dirY / length, distance);
  };

  const recoilTo = (vx: number, vy: number): void => {
    const spec = springFromDuration(PULL_RECOIL_S, recoil, PRESS_FIT);
    px.spring(0, spec, vx);
    py.spring(0, spec, vy);
  };

  const sample = (event: PointerEvent<HTMLButtonElement>): Sample => ({ x: event.clientX, y: event.clientY, t: performance.now() });

  return (
    <span data-slot="pull-send" className={cn("relative inline-block", className)} style={{ width: size, height: size }}>
      <span aria-hidden className="absolute inset-0 rounded-full border border-border bg-muted" />
      <svg aria-hidden className={cn("pointer-events-none absolute overflow-visible", armed ? "text-primary" : "text-border")} style={{ left: -reach, top: -reach, width: size + reach * DOUBLE, height: size + reach * DOUBLE, transition: transitionOf([["color", FADE_MS, PLAIN_EASE]], reduced) }}>
        {px.value !== 0 || py.value !== 0 ? (
          <path d={`M${reach} ${reach + size / DOUBLE} L${reach + size / DOUBLE + px.value} ${reach + size / DOUBLE + py.value} L${reach + size} ${reach + size / DOUBLE}`} fill="none" stroke="currentColor" strokeWidth={1} />
        ) : null}
      </svg>
      <span ref={fx} aria-hidden className="pointer-events-none absolute inset-0" />
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        data-armed={armed || undefined}
        className="absolute flex touch-none select-none items-center justify-center rounded-full bg-foreground text-background outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        style={{ left: PULL_GAP, top: PULL_GAP, width: pad, height: pad, transform: `translate(${px.value}px, ${py.value}px)` }}
        onClick={(event) => {
          if (event.detail === 0) send(0, NEG_ONE, 1);
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          const origin = sample(event);
          px.jump(px.read());
          py.jump(py.read());
          gesture.current = { origin, samples: [origin], kind: event.pointerType === "touch" ? "coarse" : "fine", pulling: false };
        }}
        onPointerMove={(event) => {
          const g = gesture.current;
          if (!g) return;
          const point = sample(event);
          g.samples = [...g.samples.slice(NEG_ONE), point];
          const dx = point.x - g.origin.x;
          const dy = point.y - g.origin.y;
          if (!g.pulling && Math.hypot(dx, dy) < PULL_SLOP[g.kind]) return;
          g.pulling = true;
          const pull = constrainPull(dx, dy, axis, maxPull);
          px.jump(pull.x);
          py.jump(pull.y);
          const distance = Math.hypot(pull.x, pull.y);
          setArmed((was) => (was ? distance >= armAt * PULL_CANCEL : distance >= armAt));
        }}
        onPointerUp={() => {
          const g = gesture.current;
          gesture.current = null;
          if (!g) return;
          if (!g.pulling) {
            if (tapSends) send(0, NEG_ONE, 1);
            return;
          }
          const [a, b] = g.samples.length > 1 ? g.samples : [g.origin, g.origin];
          const v = releaseVelocity(a, b, performance.now(), g.kind);
          const pullX = px.read();
          const pullY = py.read();
          if (armed) send(-pullX, -pullY, launchPower(Math.hypot(pullX, pullY), maxPull, Math.hypot(v.x, v.y), launchSpeed));
          setArmed(false);
          recoilTo(v.x, v.y);
        }}
        onPointerCancel={() => {
          gesture.current = null;
          setArmed(false);
          recoilTo(0, 0);
        }}
      >
        <span
          key={shot?.id}
          className="inline-flex"
          style={{ transition: transitionOf([["transform", PULL_ICON_MS, PRESS_EASE_OUT], ["opacity", FADE_MS, PLAIN_EASE, PRESS_FEEDBACK_MS]], reduced) }}
          ref={(node) => {
            if (!node || !shot) return;
            requestAnimationFrame(() => {
              node.style.transform = `translate(${shot.x}px, ${shot.y}px)`;
              node.style.opacity = "0";
            });
          }}
          onTransitionEnd={(event) => {
            if (event.propertyName === "opacity") setShot(null);
          }}
        >
          {children ?? <SendIcon aria-hidden className="size-5" />}
        </span>
      </button>
    </span>
  );
}
