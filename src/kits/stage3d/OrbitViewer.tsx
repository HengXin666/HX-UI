"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 ModelViewer 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格用 @react-three/fiber 加载并渲染 glTF 模型 (网格, 材质, 光照, 环境贴图). 这里只转 DOM 3D 内容, 不加载模型, 见 note.

import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import * as O from "./parts/orbit";
import { KIT_FOCUS, cardPoint, clamp, transitionOf, useKitMotion } from "./tokens";

export { ORBIT_DRAG_SPEED, ORBIT_FOV_DEG, clampPitch, createOrbit, orbitDrag, orbitPerspective, orbitTransform, stepOrbit, type OrbitOptions, type OrbitState } from "./parts/orbit";

export interface OrbitViewerProps {
  /** 用 preserve-3d 搭的 DOM 立体内容, 以舞台中心为原点. */
  readonly children?: ReactNode;
  /** 规格的模型地址. 本件不加载模型 (ENGINE-GAP), 只保留给调用方判断; 有 poster 时显示 poster. */
  readonly src?: string;
  readonly poster?: string;
  readonly alt?: string;
  readonly width?: number | string;
  readonly height?: number;
  readonly autoRotate?: boolean;
  readonly autoRotateSpeed?: number;
  readonly turntable?: boolean;
  readonly tilt?: number;
  readonly initialYaw?: number;
  readonly initialPitch?: number;
  readonly enableDrag?: boolean;
  readonly enableZoom?: boolean;
  readonly enableParallax?: boolean;
  readonly minZoom?: number;
  readonly maxZoom?: number;
  readonly intro?: "fade" | "none";
  readonly className?: string;
}

/**
 * 转台查看器: 舞台按视场 30 度设透视, 内容可拖转 (0.0065 rad/px, 松手惯性按 4.5/s 衰减), 自转 (速度按 2/s 趋近),
 * 转台模式下俯仰回到 tilt, 滚轮缩放 (按 8/s 趋近, 钳 minZoom..maxZoom), 指针视差 (6/s), 双击或 Home 复位 (7/s). 入场 1.3s, 淡入 0.6s.
 * 键盘: 方向键转, + / - 缩放. 减弱动效时不自转, 无惯性与视差, 缩放直接到位, 不淡入.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stage3d.md
 */
export function OrbitViewer({
  children,
  src,
  poster,
  alt = "3D view",
  width = "100%",
  height = 420,
  autoRotate = true,
  autoRotateSpeed = 0.35,
  turntable = false,
  tilt = 10,
  initialYaw = 0,
  initialPitch = 0.15,
  enableDrag = true,
  enableZoom = true,
  enableParallax = true,
  minZoom = 0.5,
  maxZoom = 2,
  intro = "fade",
  className,
}: OrbitViewerProps): JSX.Element {
  const still = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const opts: O.OrbitOptions = { autoRotate, autoRotateSpeed, turntable, tiltDeg: tilt, initialYaw, initialPitch, reduced: still };
  const st = useRef<O.OrbitState | null>(null);
  if (!st.current) st.current = O.createOrbit(opts, intro !== "none");
  const drag = useRef<{ x: number; y: number; t: number } | null>(null);
  const [shown, setShown] = useState(intro === "none" || still);

  const motion = useKitMotion(
    () => {
      const s = st.current;
      if (stage.current && s) stage.current.style.transform = O.orbitTransform(s);
    },
    false,
    (dtMs) => (st.current ? O.stepOrbit(st.current, opts, dtMs / 1000) : false),
  );
  useEffect(() => {
    setShown(true);
    motion.wake();
  }, [motion]);
  useEffect(() => {
    motion.wake();
  }, [autoRotate, autoRotateSpeed, turntable, tilt, still, motion]);

  const zoomBy = (factor: number): void => {
    const s = st.current;
    if (!s || !enableZoom) return;
    s.zoomGoal = clamp(s.zoomGoal * factor, minZoom, maxZoom);
    motion.wake();
  };
  const reset = (): void => {
    if (st.current) st.current.resetting = true;
    motion.wake();
  };
  const onDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (!enableDrag || !st.current) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, t: performance.now() };
    Object.assign(st.current, { dragging: true, vyaw: 0, vpitch: 0 });
    motion.wake();
  };
  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    const s = st.current;
    if (!s) return;
    const d = drag.current;
    if (d) {
      const now = performance.now();
      O.orbitDrag(s, event.clientX - d.x, event.clientY - d.y, (now - d.t) / 1000);
      Object.assign(d, { x: event.clientX, y: event.clientY, t: now });
    } else if (enableParallax) {
      const p = cardPoint(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
      s.tiltGoalX = clamp(p.nx, -1, 1) * O.ORBIT_PARALLAX;
      s.tiltGoalY = clamp(p.ny, -1, 1) * O.ORBIT_PARALLAX;
    }
    motion.wake();
  };
  const onUp = (): void => {
    drag.current = null;
    if (st.current) st.current.dragging = false;
    motion.wake();
  };
  const onKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    const s = st.current;
    if (!s) return;
    const step = 0.2;
    const map: Record<string, () => void> = {
      ArrowLeft: () => (s.yaw -= step),
      ArrowRight: () => (s.yaw += step),
      ArrowUp: () => (s.pitch = O.clampPitch(s.pitch - step)),
      ArrowDown: () => (s.pitch = O.clampPitch(s.pitch + step)),
      "+": () => zoomBy(1.15),
      "=": () => zoomBy(1.15),
      "-": () => zoomBy(1 / 1.15),
      Home: reset,
      "0": reset,
    };
    const act = map[event.key];
    if (!act) return;
    event.preventDefault();
    act();
    motion.wake();
    motion.paint();
  };

  return (
    <div
      role="group"
      aria-label={alt}
      aria-roledescription="3D viewer"
      tabIndex={0}
      data-slot="orbit-viewer"
      data-src={src}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={() => {
        if (st.current) Object.assign(st.current, { tiltGoalX: 0, tiltGoalY: 0 });
        motion.wake();
      }}
      onWheel={(event) => {
        if (!enableZoom) return;
        zoomBy(1 - event.deltaY * O.ORBIT_WHEEL_STEP);
      }}
      onDoubleClick={reset}
      onKeyDown={onKey}
      className={cn("relative grid touch-none select-none place-items-center overflow-hidden", enableDrag && "cursor-grab active:cursor-grabbing", KIT_FOCUS, className)}
      style={{ width, height, perspective: O.orbitPerspective(height), opacity: shown ? 1 : 0, transition: transitionOf([["opacity", O.ORBIT_FADE_MS, "ease"]], still || intro === "none") }}
    >
      <div ref={stage} data-slot="orbit-viewer-stage" className="relative [transform-style:preserve-3d]">
        {children ?? (poster ? <img src={poster} alt="" draggable={false} className="max-h-full max-w-full" /> : null)}
      </div>
    </div>
  );
}
