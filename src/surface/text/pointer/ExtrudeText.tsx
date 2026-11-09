"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 DepthText 条目, 实现为 HX 自有.

import { useEffect, useRef, type CSSProperties, type ElementType, type JSX } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { stepSpringExact } from "../../../motion/spring/step";
import { prefersReducedMotion } from "../../../primitives/motion";
import { cn } from "../../../primitives/utils";
import { usePointerField } from "../kernel/pointer";
import { DOUBLE, HALF, MS_PER_S, TEXT_FRAME } from "../kernel/tokens";
import { TextShell } from "../kernel/TextShell";
import { extrudeIntro, extrudeLayers, layerOpacity, orbitTilt, pointerTilt, pushTarget, smoothingStep, type Tilt } from "./parts/extrude";
import {
  EXTRUDE_DEFAULTS, EXTRUDE_FLOAT_EASE, EXTRUDE_FLOAT_PERIOD_S, EXTRUDE_FLOAT_SHARE, EXTRUDE_INTRO_MS, EXTRUDE_OUTLINE_PX, EXTRUDE_PUSH_SPRING, EXTRUDE_REST, EXTRUDE_SHADOW,
} from "./tokens";

/** 语义色 token 名, 落成 var(--name); current 跟随外层文字色. */
export type ExtrudeTone = "current" | "primary" | "accent-2" | "success" | "warning" | "danger" | "foreground" | "muted-foreground";

export interface ExtrudeTextProps {
  readonly text: string;
  /** 叠层数, 钳到 1 到 64. */
  readonly layers?: number;
  /** 相邻两层的间距 (px), 总厚度 = layers x depth. */
  readonly depth?: number;
  /** 正面颜色. */
  readonly faceTone?: ExtrudeTone;
  /** 侧面 (叠层) 颜色. */
  readonly depthTone?: ExtrudeTone;
  /** 叠层由前往后渐隐. */
  readonly gradientDepth?: boolean;
  /** 最大倾角 (度). */
  readonly tilt?: number;
  /** 倾角跟随指针. */
  readonly pointerTracking?: boolean;
  /** 每 60Hz 帧的跟随比例, 0 到 1. */
  readonly smoothing?: number;
  /** 透视距离 (px). */
  readonly perspective?: number;
  /** 指针不在时自己慢慢摆. */
  readonly autoOrbit?: boolean;
  /** 自转角速度 (rad/s). */
  readonly orbitSpeed?: number;
  /** 悬停时多推出的厚度 (相对原厚度). 按下另加 0.25. */
  readonly hoverPush?: number;
  /** 上下漂浮. */
  readonly float?: boolean;
  readonly fontSize?: string;
  readonly fontWeight?: number;
  /** 最深一层投一道深度色的影. */
  readonly shadow?: boolean;
  /** 正面描一圈深度色的边. */
  readonly outline?: boolean;
  /** 挂上时厚度从 0 长出来. */
  readonly intro?: boolean;
  readonly as?: ElementType;
  readonly className?: string;
}

function toneVar(tone: ExtrudeTone): string {
  return tone === "current" ? "currentColor" : `var(--${tone})`;
}

/**
 * 叠层厚字: 同一行字向后叠 N 层出厚度, 整体随指针倾斜或自己摆, 悬停与按下用弹簧推深, 入场时厚度长出来.
 * 每帧只写舞台的 transform 与 --hx-extrude (各层的 translateZ 由它在 CSS 里算), 不重渲染; 静止时停帧, 指针唤醒.
 * 减弱动效: 厚度直接到位, 不倾斜不漂浮. 读屏读一份原文.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-text-pointer.md
 */
export function ExtrudeText({
  text,
  layers = EXTRUDE_DEFAULTS.layers,
  depth = EXTRUDE_DEFAULTS.depth,
  faceTone = "current",
  depthTone = "primary",
  gradientDepth = false,
  tilt = EXTRUDE_DEFAULTS.tilt,
  pointerTracking = true,
  smoothing = EXTRUDE_DEFAULTS.smoothing,
  perspective = EXTRUDE_DEFAULTS.perspective,
  autoOrbit = true,
  orbitSpeed = EXTRUDE_DEFAULTS.orbitSpeed,
  hoverPush = EXTRUDE_DEFAULTS.hoverPush,
  float = false,
  fontSize = EXTRUDE_DEFAULTS.fontSize,
  fontWeight = EXTRUDE_DEFAULTS.fontWeight,
  shadow = true,
  outline = false,
  intro = true,
  as,
  className,
}: ExtrudeTextProps): JSX.Element {
  const reduced = useReducedMotion();
  const host = useRef<HTMLElement>(null);
  const rig = useRef<HTMLSpanElement>(null);
  const count = extrudeLayers(layers);
  const still = reduced || prefersReducedMotion();
  const s = useRef({ rx: 0, ry: 0, phase: 0, push: 1, pv: 0, elapsed: 0, floatT: 0 });

  const loop = useFrameLoop((dtMs) => {
    const el = host.current;
    const node = rig.current;
    if (!el || !node) return false;
    const st = s.current;
    const dt = dtMs / MS_PER_S;
    st.elapsed += dtMs;
    const grow = intro ? extrudeIntro(st.elapsed, EXTRUDE_INTRO_MS) : 1;
    const tracking = pointerTracking && field.inside;
    const orbiting = autoOrbit && !tracking;
    if (orbiting) st.phase += orbitSpeed * dt;
    const target: Tilt = tracking ? pointerTilt(field.x, field.y, el.clientWidth, el.clientHeight, tilt) : orbiting ? orbitTilt(st.phase, tilt) : { x: 0, y: 0 };
    const k = smoothingStep(smoothing, dt);
    st.rx += (target.x - st.rx) * k;
    st.ry += (target.y - st.ry) * k;
    const step = stepSpringExact(st.push, st.pv, pushTarget(field.inside, field.down, hoverPush), EXTRUDE_PUSH_SPRING, dtMs);
    st.push = step.current;
    st.pv = step.velocity;
    let lift = 0;
    if (float) {
      st.floatT += dt;
      const wave = HALF + HALF * Math.sin((st.floatT / EXTRUDE_FLOAT_PERIOD_S) * Math.PI * DOUBLE);
      lift = -EXTRUDE_FLOAT_SHARE * count * depth * wave * (1 + (st.push - 1) * EXTRUDE_FLOAT_EASE);
    }
    node.style.transform = `translateY(${lift}px) rotateX(${st.rx}deg) rotateY(${st.ry}deg)`;
    node.style.setProperty("--hx-extrude", String(grow * st.push));
    const settled = Math.abs(target.x - st.rx) < EXTRUDE_REST && Math.abs(target.y - st.ry) < EXTRUDE_REST;
    return orbiting || float || grow < 1 || !step.resting || !settled;
  }, { ...TEXT_FRAME, active: !still });

  const field = usePointerField(host, () => loop.wake(), { enabled: !still });

  useEffect(() => {
    if (!still || !rig.current) return;
    rig.current.style.transform = "";
    rig.current.style.setProperty("--hx-extrude", "1");
  }, [still]);

  const depthColor = toneVar(depthTone);
  const rigStyle = { "--hx-extrude": intro && !still ? "0" : "1" } as CSSProperties;
  const back = Array.from({ length: count }, (_, i) => count - 1 - i);
  return (
    <TextShell
      ref={host}
      as={as}
      text={text}
      slot="extrude-text"
      className={cn("relative inline-block select-none", className)}
      style={{ perspective: `${perspective}px`, fontSize, fontWeight }}
      visualClassName="relative inline-block"
    >
      <span ref={rig} data-part="rig" className="relative inline-block whitespace-nowrap [transform-style:preserve-3d]" style={rigStyle}>
        {back.map((i) => (
          <span
            key={i}
            data-layer={i}
            className="absolute inset-0"
            style={{
              transform: `translateZ(calc(var(--hx-extrude) * ${-(i + 1) * depth}px))`,
              "--hx-layer": `color-mix(in srgb, ${depthColor} ${layerOpacity(i, count, gradientDepth)}%, transparent)`,
              color: "var(--hx-layer)",
              textShadow: shadow && i === count - 1 ? `0 ${EXTRUDE_SHADOW.y}em ${EXTRUDE_SHADOW.blur}em color-mix(in srgb, ${depthColor} ${EXTRUDE_SHADOW.mix}%, transparent)` : undefined,
            } as CSSProperties}
          >
            {text}
          </span>
        ))}
        <span data-part="face" className="relative" style={{ color: toneVar(faceTone), WebkitTextStroke: outline ? `${EXTRUDE_OUTLINE_PX}px ${depthColor}` : undefined }}>
          {text}
        </span>
      </span>
    </TextShell>
  );
}
