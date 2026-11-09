"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 Lanyard 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格是 three 场景里的 3D 刚体绳索与卡片 (厚度, 倒角, 金属扣, 箔面着色器). 这里只在 2D 平面解绳, 见 note.

import { useEffect, useRef, useState, type JSX, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { prefersReducedMotion } from "../../primitives/motion";
import { cn } from "../../primitives/utils";
import * as R from "./parts/rope";
import { KIT_FOCUS, kitTone, omegaSpring, useKitMotion, type KitTone } from "./tokens";

export { ROPE_ANCHORS, cardAngle, createRope, ropePath, stepRope, type Rope, type RopeAnchor, type RopeParams } from "./parts/rope";

/** 翻面自转 omega 9 (Lanyard.jsx:37 FLIP_SPIN), zeta 0.7 (HX 自定). */
export const LANYARD_FLIP = omegaSpring(9, 0.7);
/** 卡尺寸 px (size 1 时的竖版宽), 静止速度阈值 px/s, 拖动判点击阈值 px (HX 自定). */
export const LANYARD_CARD_W = 300;
export const LANYARD_REST_SPEED = 2;
export const LANYARD_TAP_PX = 6;

export interface SwingLanyardProps {
  readonly front?: ReactNode;
  readonly back?: ReactNode;
  readonly frontImage?: string;
  readonly backImage?: string;
  readonly label?: string;
  readonly orientation?: "portrait" | "landscape";
  readonly size?: number;
  readonly cornerRadius?: number;
  readonly anchor?: R.RopeAnchor;
  readonly strapLength?: number;
  readonly strapTone?: KitTone;
  readonly strapWidth?: number;
  readonly gravity?: number;
  readonly damping?: number;
  readonly elasticity?: number;
  readonly breeze?: number;
  readonly interactive?: boolean;
  readonly intro?: boolean;
  readonly height?: number;
  readonly className?: string;
}

/**
 * 挂绳工牌: 顶端挂点 (left / center / right) 垂下一条 4 节绳, 末端挂卡; 绳按位置积分加距离约束解 (子步 1/960s, 约束 2 次),
 * 卡随末段方向摆动. 可拖卡甩动, 松手后带速度摆回; 点一下 (不拖) 或 Enter / 空格翻面. intro 时卡从上方落下. breeze 吹出轻微摆动.
 * 减弱动效时静止下垂, 不落下, 不起风, 拖动跟手但不甩, 翻面直接到位.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stage3d.md
 */
export function SwingLanyard({
  front,
  back,
  frontImage,
  backImage,
  label = "Badge",
  orientation = "portrait",
  size = 0.6,
  cornerRadius = 0.3,
  anchor = "center",
  strapLength = 0.5,
  strapTone = "foreground",
  strapWidth = 0.65,
  gravity = 1,
  damping = 0.5,
  elasticity = 0.5,
  breeze = 0.5,
  interactive = true,
  intro = true,
  height = 560,
  className,
}: SwingLanyardProps): JSX.Element {
  const still = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const strap = useRef<SVGPathElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const rope = useRef<R.Rope | null>(null);
  const drag = useRef<{ x: number; y: number; sx: number; sy: number; moved: boolean } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const cw = LANYARD_CARD_W * size * (orientation === "landscape" ? 1.4 : 1);
  const ch = cw * (orientation === "landscape" ? 0.63 : 1.4);
  const params: R.RopeParams = { gravity, damping, elasticity, breeze: still ? 0 : breeze };

  const motion = useKitMotion(
    (m) => {
      const r = rope.current;
      if (!r) return;
      strap.current?.setAttribute("d", R.ropePath(r));
      const n = r.x.length - 1;
      if (card.current) card.current.style.transform = `translate(${(r.x[n] ?? 0).toFixed(1)}px, ${(r.y[n] ?? 0).toFixed(1)}px) rotate(${R.cardAngle(r).toFixed(2)}deg) translate(-50%, 0) rotateY(${m.get("flip").toFixed(1)}deg)`;
    },
    still,
    (dtMs) => {
      const r = rope.current;
      if (!r) return false;
      const d = drag.current;
      if (still && !d) return false;
      const speed = R.stepRope(r, dtMs / 1000, params, d ? { x: d.x, y: d.y } : null);
      return Boolean(d) || breeze > 0 && !still || speed > LANYARD_REST_SPEED;
    },
  );

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const w = node.clientWidth || cw * 2;
    const len = strapLength * height;
    const drop = intro && !still && !prefersReducedMotion() ? height * 0.6 : 0;
    rope.current = R.createRope(w * R.ROPE_ANCHORS[anchor], 0, len, drop);
    if (still) R.stepRope(rope.current, R.ROPE_MAX_DT, { ...params, breeze: 0 }, null);
    motion.wake();
    motion.paint();
    // 只在几何变化时重建绳, 物理参数每帧读最新值.
  }, [anchor, strapLength, height, still, intro, motion]);

  useEffect(() => {
    motion.spring("flip", flipped ? 180 : 0, LANYARD_FLIP);
  }, [flipped, motion]);

  const local = (event: PointerEvent<HTMLElement>): { x: number; y: number } => {
    const box = root.current?.getBoundingClientRect();
    return { x: event.clientX - (box?.left ?? 0), y: event.clientY - (box?.top ?? 0) };
  };
  const onDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (!interactive) return;
    const p = local(event);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { ...p, sx: p.x, sy: p.y, moved: false };
    motion.wake();
  };
  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    const d = drag.current;
    if (!d) return;
    const p = local(event);
    Object.assign(d, p, { moved: d.moved || Math.hypot(p.x - d.sx, p.y - d.sy) > LANYARD_TAP_PX });
    if (still && rope.current) R.stepRope(rope.current, 0.016, params, p);
    motion.wake();
    if (still) motion.paint();
  };
  const onUp = (): void => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) setFlipped((v) => !v);
    motion.wake();
  };
  const face = (img: string | undefined, node: ReactNode, isBack: boolean): JSX.Element => (
    <div className="absolute inset-0 overflow-hidden border border-border bg-card text-card-foreground [backface-visibility:hidden]" style={{ borderRadius: cornerRadius * 40, transform: isBack ? "rotateY(180deg)" : undefined, boxShadow: "var(--shadow-xl)" }}>
      {img ? <img src={img} alt="" draggable={false} className="h-full w-full object-cover" /> : null}
      {node}
    </div>
  );

  return (
    <div ref={root} data-slot="swing-lanyard" className={cn("relative w-full overflow-hidden", className)} style={{ height }}>
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        <path ref={strap} data-slot="swing-lanyard-strap" fill="none" stroke={kitTone(strapTone)} strokeWidth={Math.max(2, strapWidth * 24)} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div
        ref={card}
        role="button"
        tabIndex={interactive ? 0 : -1}
        aria-label={label}
        aria-pressed={flipped}
        data-slot="swing-lanyard-card"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => {
          drag.current = null;
          motion.wake();
        }}
        onLostPointerCapture={() => {
          if (drag.current) onUp();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          setFlipped((v) => !v);
        }}
        className={cn("absolute left-0 top-0 origin-top touch-none [transform-style:preserve-3d]", interactive ? "cursor-grab active:cursor-grabbing" : "pointer-events-none", KIT_FOCUS)}
        style={{ width: cw, height: ch, borderRadius: cornerRadius * 40 }}
      >
        {face(frontImage, front, false)}
        {face(backImage, back, true)}
      </div>
    </div>
  );
}
