"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 InfiniteMenu 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格是 WebGL 实例化球面 (顶点着色器按速度拉伸格子, 圆角遮罩, 纹理图集). 这里每格一个 DOM 元素做 3D 变换, 见 note.

import { useEffect, useMemo, useRef, useState, type JSX, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { prefersReducedMotion } from "../../primitives/motion";
import { cssCurve } from "../../motion/curves";
import { cn } from "../../primitives/utils";
import * as S from "./parts/sphere";
import { KIT_FOCUS, clamp, decayToward, transitionOf, useKitMotion } from "./tokens";

export { SPHERE_DEFAULTS, fibonacciSphere, frontmost, frontness, nearestOfItem, snapTarget, tileLook, wrapAngle, type SpherePoint } from "./parts/sphere";

export interface SphereItem {
  readonly image: string;
  readonly title: string;
  readonly description?: string;
  readonly href?: string;
}

export interface SphereMenuProps {
  readonly items: readonly SphereItem[];
  readonly count?: number;
  readonly tileSize?: number;
  readonly roundness?: number;
  readonly zoom?: number;
  readonly pullBack?: number;
  readonly inertia?: number;
  readonly autoplay?: number;
  readonly grayscale?: boolean;
  readonly dim?: number;
  readonly intro?: boolean;
  readonly showInfo?: boolean;
  readonly renderInfo?: (item: SphereItem, index: number) => ReactNode;
  readonly onActiveChange?: (index: number) => void;
  readonly onItemClick?: (item: SphereItem, index: number) => void;
  readonly height?: number;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 球面菜单: count 个格子按斐波那契球面铺开, 循环填入 items. 拖转球体, 松手按惯性滑, 慢下来吸附最近朝前的格子, 它就是当前项 (onActiveChange).
 * 移动时镜头后退 (pullBack), 停下拉近到 zoom; 背面格隐去, 非当前格按 dim 压暗, grayscale 时只有当前格有色. 空闲 autoplay 秒转到下一项.
 * 方向键切上一项 / 下一项, Enter 打开当前项 (onItemClick 或 href). 减弱动效时无显现与惯性, 吸附直接到位, 不自动播放.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stage3d.md
 */
export function SphereMenu({
  items,
  count = S.SPHERE_DEFAULTS.count,
  tileSize = S.SPHERE_DEFAULTS.tileSize,
  roundness = S.SPHERE_DEFAULTS.roundness,
  zoom = S.SPHERE_DEFAULTS.zoom,
  pullBack = S.SPHERE_DEFAULTS.pullBack,
  inertia = S.SPHERE_DEFAULTS.inertia,
  autoplay = S.SPHERE_DEFAULTS.autoplay,
  grayscale = true,
  dim = S.SPHERE_DEFAULTS.dim,
  intro = true,
  showInfo = true,
  renderInfo,
  onActiveChange,
  onItemClick,
  height = 520,
  ariaLabel = "Menu",
  className,
}: SphereMenuProps): JSX.Element {
  const still = useReducedMotion();
  const n = items.length ? Math.max(items.length, count) : 0;
  const points = useMemo(() => S.fibonacciSphere(n), [n]);
  const ball = useRef<HTMLDivElement>(null);
  const tiles = useRef<Array<HTMLElement | null>>([]);
  const [active, setActive] = useState(0);
  const radius = height * 0.42 * (zoom / S.SPHERE_DEFAULTS.zoom);
  const tilePx = radius * 0.62 * tileSize * Math.sqrt(160 / Math.max(1, n));
  const s = useRef({ yaw: 0, pitch: 0, vyaw: 0, vpitch: 0, dragging: false, target: null as null | { yaw: number; pitch: number }, cam: 1, reveal: intro ? 0 : 1, idle: 0, last: { x: 0, y: 0, t: 0 } });

  const goTile = (i: number): void => {
    const p = points[i];
    if (!p) return;
    const st = s.current;
    st.target = S.snapTarget(p, st.yaw);
    st.idle = 0;
    motion.wake();
  };
  const goItem = (step: number): void => {
    if (!items.length) return;
    const want = (((active + step) % items.length) + items.length) % items.length;
    goTile(S.nearestOfItem(points, want, items.length, s.current.yaw, s.current.pitch));
  };

  const motion = useKitMotion(
    () => {
      const st = s.current;
      if (ball.current) ball.current.style.transform = `translateZ(${(0 - radius).toFixed(1)}px) scale(${st.cam.toFixed(4)}) rotateX(${S.toDeg(st.pitch)}deg) rotateY(${S.toDeg(st.yaw)}deg)`;
      points.forEach((p, i) => {
        const el = tiles.current[i];
        if (!el) return;
        const look = S.tileLook(S.frontness(p, st.yaw, st.pitch), dim);
        el.style.opacity = (look.alpha * st.reveal).toFixed(3);
        el.style.filter = `brightness(${look.shade.toFixed(3)})${grayscale ? ` grayscale(${(1 - look.focus).toFixed(3)})` : ""}`;
        el.style.visibility = look.alpha <= 0 ? "hidden" : "visible";
      });
    },
    still,
    (dtMs) => {
      const st = s.current;
      const dt = Math.min(0.05, dtMs / 1000);
      if (st.reveal < 1) st.reveal = Math.min(1, st.reveal + dt / (still ? 0.01 : S.SPHERE_REVEAL_S));
      let moving = st.dragging;
      if (!st.dragging) {
        const k = Math.exp(0 - dt * (6 - 5 * clamp(inertia, 0, 1)));
        st.vyaw = still ? 0 : st.vyaw * k;
        st.vpitch = still ? 0 : st.vpitch * k;
        st.yaw += st.vyaw * dt;
        st.pitch = clamp(st.pitch + st.vpitch * dt, 0 - S.SPHERE_PITCH_LIMIT, S.SPHERE_PITCH_LIMIT);
        const speed = Math.hypot(st.vyaw, st.vpitch);
        if (speed < S.SPHERE_SNAP_SPEED) {
          if (!st.target) {
            const p = points[S.frontmost(points, st.yaw, st.pitch)];
            if (p) st.target = S.snapTarget(p, st.yaw);
          }
          if (st.target) {
            const rate = S.SPHERE_RATES.snapTarget;
            st.yaw = still ? st.target.yaw : decayToward(st.yaw, st.target.yaw, rate, dt);
            st.pitch = still ? st.target.pitch : decayToward(st.pitch, st.target.pitch, rate, dt);
            if (st.yaw === st.target.yaw && st.pitch === st.target.pitch) st.target = null;
          }
        } else moving = true;
        if (st.target) moving = true;
      }
      const goal = 1 - (moving ? S.SPHERE_PULL * pullBack : 0);
      st.cam = still ? goal : decayToward(st.cam, goal, S.SPHERE_RATES.camera, dt);
      const front = S.frontmost(points, st.yaw, st.pitch);
      const idx = items.length ? front % items.length : 0;
      if (idx !== active && !moving) setActive(idx);
      if (!moving && autoplay > 0 && !still && items.length > 1) {
        st.idle += dt;
        if (st.idle >= autoplay) {
          st.idle = 0;
          goItem(1);
        }
        return true;
      }
      return moving || st.reveal < 1 || st.cam !== goal;
    },
  );

  useEffect(() => {
    if (still || prefersReducedMotion()) s.current.reveal = 1;
    motion.wake();
  }, [still, motion]);
  useEffect(() => onActiveChange?.(active), [active, onActiveChange]);

  const onDown = (event: PointerEvent<HTMLDivElement>): void => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    Object.assign(s.current, { dragging: true, target: null, vyaw: 0, vpitch: 0, idle: 0, last: { x: event.clientX, y: event.clientY, t: performance.now() } });
    motion.wake();
  };
  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    const st = s.current;
    if (!st.dragging) return;
    const now = performance.now();
    const dt = Math.max((now - st.last.t) / 1000, 1 / 240);
    const dy = (event.clientX - st.last.x) * S.SPHERE_DRAG;
    const dp = (event.clientY - st.last.y) * S.SPHERE_DRAG;
    st.yaw += dy;
    st.pitch = clamp(st.pitch - dp, 0 - S.SPHERE_PITCH_LIMIT, S.SPHERE_PITCH_LIMIT);
    const blend = 1 - Math.exp(0 - dt * S.SPHERE_RATES.follow);
    st.vyaw += (dy / dt - st.vyaw) * blend;
    st.vpitch += ((0 - dp) / dt - st.vpitch) * blend;
    st.last = { x: event.clientX, y: event.clientY, t: now };
    motion.wake();
  };
  const onUp = (): void => {
    s.current.dragging = false;
    motion.wake();
  };
  const open = (): void => {
    const item = items[active];
    if (!item) return;
    if (onItemClick) onItemClick(item, active);
    else if (item.href && typeof window !== "undefined") window.location.assign(item.href);
  };
  const onKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    const map: Record<string, () => void> = { ArrowRight: () => goItem(1), ArrowDown: () => goItem(1), ArrowLeft: () => goItem(-1), ArrowUp: () => goItem(-1), Enter: open, " ": open };
    const run = map[event.key];
    if (!run) return;
    event.preventDefault();
    run();
  };
  const current = items[active];
  const swap = transitionOf([["opacity", S.SPHERE_INFO_MS, "ease"], ["transform", S.SPHERE_INFO_MS, cssCurve("outQuint")]], still);

  return (
    <div data-slot="sphere-menu" className={cn("relative overflow-hidden", className)} style={{ height }}>
      <div
        role="listbox"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-activedescendant={current ? `sphere-item-${active}` : undefined}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onLostPointerCapture={onUp}
        onDoubleClick={open}
        onKeyDown={onKey}
        className={cn("absolute inset-0 grid touch-none select-none place-items-center", KIT_FOCUS)}
        style={{ perspective: height * 1.6 }}
      >
        <div ref={ball} data-slot="sphere-menu-ball" className="relative [transform-style:preserve-3d]">
          {points.map((p, i) => {
            const item = items[i % Math.max(1, items.length)];
            if (!item) return null;
            return (
              <div
                key={i}
                ref={(node) => {
                  tiles.current[i] = node;
                }}
                aria-hidden
                data-slot="sphere-menu-tile"
                className="absolute overflow-hidden border border-border bg-muted [backface-visibility:hidden]"
                style={{ width: tilePx, height: tilePx, left: -tilePx / 2, top: -tilePx / 2, borderRadius: `${(roundness * 50).toFixed(0)}%`, transform: `rotateY(${S.toDeg(p.lon)}deg) rotateX(${S.toDeg(0 - p.lat)}deg) translateZ(${radius.toFixed(1)}px)` }}
              >
                <img src={item.image} alt="" draggable={false} className="h-full w-full object-cover" />
              </div>
            );
          })}
        </div>
        <ul className="sr-only">
          {items.map((item, i) => (
            <li key={i} id={`sphere-item-${i}`} role="option" aria-selected={i === active}>
              {item.title}
            </li>
          ))}
        </ul>
      </div>
      {showInfo && current ? (
        <div key={active} data-slot="sphere-menu-info" aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-6 grid justify-items-center gap-1 text-center" style={{ transition: swap }}>
          {renderInfo?.(current, active) ?? [<span key="t" className="text-lg font-semibold">{current.title}</span>, current.description ? <span key="d" className="max-w-sm text-sm text-muted-foreground">{current.description}</span> : null]}
        </div>
      ) : null}
    </div>
  );
}
