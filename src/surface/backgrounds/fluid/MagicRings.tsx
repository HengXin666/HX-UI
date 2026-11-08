"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 MagicRings 条目, 实现为 HX 自有.
// ENGINE-GAP: 条目用 128 段的环带网格加 Canvas2D 叠层, 这里在全屏片元里按半径距离解析地画环, 倾斜只做竖向压扁不做透视.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import type { Rgb } from "../../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import {
  RINGS_BURST_LIFE, RINGS_BURST_SPEED, RINGS_MAX_BURSTS, ringsBurstLife, ringsLayout, stepRingsSpring, type RingsMotion, type RingsSpring,
} from "./magic-rings-motion";
import { RINGS_FRAGMENT } from "./magic-rings-shader";

export interface MagicRingsProps extends BackdropCommonProps {
  /** 内环颜色, 默认 primary. */
  readonly color?: string;
  /** 外环颜色, 默认 accent. */
  readonly colorTwo?: string;
  /** 环数 1..12, 默认 6. */
  readonly ringCount?: number;
  /** pulse 依次出生向外推开, breathe 原地起伏, static 不动. 默认 pulse. */
  readonly motion?: RingsMotion;
  /** 线宽 (CSS 像素), 默认 2. */
  readonly lineThickness?: number;
  /** 光晕, 默认 1. */
  readonly glow?: number;
  /** 最内环半径 (占短边), 默认 0.35. */
  readonly baseRadius?: number;
  /** 相邻环的半径差, 默认 0.1. */
  readonly radiusStep?: number;
  /** 起伏 / 推开幅度, 默认 0.1. */
  readonly expansion?: number;
  /** 沿角度渐细的程度, 默认 1.5. */
  readonly taper?: number;
  /** 初始转角 (度), 默认 0. */
  readonly rotation?: number;
  /** 自转 (弧度每秒), 默认 0. */
  readonly spin?: number;
  /** 俯仰 (度), 默认 0. */
  readonly tilt?: number;
  /** 色散, 默认 0. */
  readonly dispersion?: number;
  /** 颗粒, 默认 0. */
  readonly grain?: number;
  /** 环心跟随指针, 默认 false. */
  readonly followMouse?: boolean;
  /** 跟随幅度, 默认 0.2. */
  readonly mouseInfluence?: number;
  /** 悬停时放大倍率, 默认 1.2. */
  readonly hoverScale?: number;
  /** 悬停时指针附近增亮, 默认 1. */
  readonly hoverIntensity?: number;
  /** 外环随指针多偏一点的视差, 默认 0.05. */
  readonly parallax?: number;
  /** 点击放出爆环, 默认 true. */
  readonly clickBurst?: boolean;
  /** 出现时环由内向外依次亮起, 默认 true. */
  readonly intro?: boolean;
}

const DEFAULT_LINE = 2;
const DEFAULT_BASE = 0.35;
const DEFAULT_STEP = 0.1;
const DEFAULT_EXPANSION = 0.1;
const DEFAULT_TAPER = 1.5;
const DEFAULT_INFLUENCE = 0.2;
const DEFAULT_HOVER_SCALE = 1.2;
const DEFAULT_PARALLAX = 0.05;
const DEFAULT_RINGS = 6;
const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 魔法环: 一组同心发光环, pulse 模式下按 0.5 秒错开依次出生, 3.45 秒一周期向外推开并熄灭;
 * 悬停放大增亮 (临界阻尼弹簧), 可选环心跟手 (刚度 70, 1/240 秒子步), 点击放出爆环 (1.1 秒, 0.9 单位每秒).
 * 减弱动效只画一帧静止的环.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-fluid.md
 */
export function MagicRings(props: MagicRingsProps): JSX.Element {
  const {
    color = "primary", colorTwo = "accent", ringCount = DEFAULT_RINGS, motion = "pulse", lineThickness = DEFAULT_LINE, glow = 1, baseRadius = DEFAULT_BASE,
    radiusStep = DEFAULT_STEP, expansion = DEFAULT_EXPANSION, taper = DEFAULT_TAPER, rotation = 0, spin = 0, tilt = 0, dispersion = 0, grain = 0, followMouse = false,
    mouseInfluence = DEFAULT_INFLUENCE, hoverScale = DEFAULT_HOVER_SCALE, hoverIntensity = 1, parallax = DEFAULT_PARALLAX, clickBurst = true, intro = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const spring = useRef<RingsSpring>({ x: 0, y: 0, vx: 0, vy: 0, hover: 0, hoverVelocity: 0 });

  const offsetOf = (frame: BackdropFrame): readonly [number, number] => {
    const { pointer, fit } = frame;
    const short = Math.min(fit.width, fit.height) || 1;
    return [((pointer.x - 0.5) * fit.width) / short, ((pointer.y - 0.5) * fit.height) / short];
  };

  const burstsOf = (frame: BackdropFrame): number[] => {
    const list = new Array<number>(RINGS_MAX_BURSTS * 4).fill(0);
    if (!clickBurst || frame.reduced) return list;
    const { fit } = frame;
    const short = Math.min(fit.width, fit.height) || 1;
    frame.pointer.taps.slice(-RINGS_MAX_BURSTS).forEach((tap, i) => {
      const age = frame.elapsed - tap.at;
      list[i * 4] = ((tap.x - 0.5) * fit.width) / short;
      list[i * 4 + 1] = ((tap.y - 0.5) * fit.height) / short;
      list[i * 4 + 2] = baseRadius * 0.5 + age * RINGS_BURST_SPEED;
      list[i * 4 + 3] = ringsBurstLife(age / RINGS_BURST_LIFE);
    });
    return list;
  };

  const handle = useShaderBackdrop(
    {
      fragment: RINGS_FRAGMENT,
      uniforms: (frame) => {
        const s = spring.current;
        const [ox, oy] = offsetOf(frame);
        const inside = frame.pointer.inside && !frame.reduced;
        if (frame.reduced) Object.assign(s, { x: 0, y: 0, vx: 0, vy: 0, hover: 0, hoverVelocity: 0 });
        else stepRingsSpring(s, followMouse && inside ? ox * mouseInfluence : 0, followMouse && inside ? oy * mouseInfluence : 0, inside ? 1 : 0, frame.dt);
        const hover = Math.max(0, Math.min(1, s.hover));
        const layout = { ringCount, motion: frame.reduced && motion === "pulse" ? "breathe" : motion, baseRadius, radiusStep, expansion, intro: intro && !frame.reduced } as const;
        return {
          u_c0: frame.colors[0] ?? GREY,
          u_c1: frame.colors[1] ?? GREY,
          u_rings: { list: ringsLayout(layout, frame.time, frame.elapsed), size: 4 },
          u_bursts: { list: burstsOf(frame), size: 4 },
          u_line: lineThickness,
          u_glow: glow,
          u_taper: taper,
          u_angle: (rotation * Math.PI) / 180 + frame.time * spin,
          u_tilt: tilt,
          u_dispersion: dispersion,
          u_grain: grain,
          u_center: [s.x, s.y],
          u_parallax: inside ? [ox * parallax, oy * parallax] : [0, 0],
          u_zoom: 1 + (hoverScale - 1) * hover,
          u_boost: hoverIntensity * hover,
          u_aim: [ox - s.x, oy - s.y],
        };
      },
    },
    { ...options, colors: [color, colorTwo] },
  );

  return (
    <BackdropShell handle={handle} fallback={glowFallback("background", color)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
