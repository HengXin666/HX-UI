"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Topography 条目, 实现为 HX 自有.
// ENGINE-GAP: 条目用网格地形, 4 级泛光与 256 格雕刻纹理; 这里在全屏片元里对高度场射线步进,
// 泛光近似为等高线外的指数光晕, 雕刻纹理改为 8 个拖尾采样点的高斯隆起, 景深只加宽变淡不做模糊.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import type { Rgb } from "../../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import { approach } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import {
  TOPO_DIRECTIONS, TOPO_FRAGMENT, TOPO_HOVER_SIGN, TOPO_MAX_PULSES, TOPO_SAMPLE_SECONDS, TOPO_TRAIL, topoIntro, topoPulse, topoTrailWeight, type TopoDirection,
  type TopoHover,
} from "./topography-shader";

export interface TopographyProps extends BackdropCommonProps {
  /** 等高线颜色, 默认 primary. */
  readonly color?: string;
  /** 底色, 默认 background. */
  readonly backgroundColor?: string;
  /** 从谷底到峰顶的等高线条数, 默认 22. */
  readonly lineCount?: number;
  /** 线宽 (CSS 像素), 默认 1.2. */
  readonly lineWidth?: number;
  /** 每 5 条加粗一条主等高线, 默认 true. */
  readonly majorLines?: boolean;
  /** 地形高度倍率, 默认 1. */
  readonly elevation?: number;
  /** 近处地形变淡的程度, 默认 0.2. */
  readonly foreground?: number;
  /** 地形尺度, 默认 1. */
  readonly scale?: number;
  /** 细碎起伏, 默认 0.35. */
  readonly detail?: number;
  /** 俯视角 (度), 默认 32. */
  readonly tilt?: number;
  /** 地形流动方向, 默认 forward. */
  readonly direction?: TopoDirection;
  /** 地形自身演化快慢, 默认 0.2. */
  readonly morph?: number;
  /** 等高线光晕, 默认 0.6. */
  readonly glow?: number;
  /** 景深 (离对焦距离越远线越宽越淡), 默认 0.4. */
  readonly depthOfField?: number;
  /** 远处雾化, 默认 0.35. */
  readonly fog?: number;
  /** 亮度倍率, 默认 1. */
  readonly brightness?: number;
  /** 指针处地形抬起, 压下或不动, 默认 lift. */
  readonly hoverEffect?: TopoHover;
  /** 指针影响半径 (世界单位), 默认 1. */
  readonly mouseRadius?: number;
  /** 指针影响强度, 默认 0.6. */
  readonly mouseStrength?: number;
  /** 指针拖尾留存 (乘 3 秒), 0 关掉, 默认 0.3. */
  readonly trail?: number;
  /** 相机随指针偏转的程度, 默认 0.5. */
  readonly parallax?: number;
  /** 点击在地形上推开一圈波, 默认 pulse. */
  readonly clickEffect?: "pulse" | "none";
}

const DEFAULT_SPEED = 0.25;
const DEFAULT_LINES = 22;
const DEFAULT_WIDTH = 1.2;
const DEFAULT_FOREGROUND = 0.2;
const DEFAULT_DETAIL = 0.35;
const DEFAULT_TILT = 32;
const DEFAULT_MORPH = 0.2;
const DEFAULT_GLOW = 0.6;
const DEFAULT_DOF = 0.4;
const DEFAULT_FOG = 0.35;
const DEFAULT_STRENGTH = 0.6;
const DEFAULT_TRAIL = 0.3;
const DEFAULT_PARALLAX = 0.5;
/** 射线步进件默认像素比上限压到 1. */
const DEFAULT_DPR = 1;
/** 流动速度 (世界单位每场秒). */
const FLOW_RATE = 1.2;
/** 相机偏转的时间常数 (秒) 与满幅 (弧度). */
const LOOK_TAU = 0.4;
const LOOK_RANGE = 0.12;
const GREY: Rgb = [0.5, 0.5, 0.5];

interface Mark {
  readonly x: number;
  readonly y: number;
  readonly at: number;
}

interface TopoState {
  marks: Mark[];
  sampledAt: number;
  lookX: number;
  lookY: number;
}

/**
 * 地形等高线: 斜视的分形地形沿 direction 流动, 等高线按屏幕导数定宽, 主线加粗, 景深加宽, 过密处淡出, 远处雾化;
 * 指针处地形隆起并留下拖尾, 点击推开一圈波, 相机随指针轻微偏转. 减弱动效只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-fluid.md
 */
export function Topography(props: TopographyProps): JSX.Element {
  const {
    color = "primary", backgroundColor = "background", lineCount = DEFAULT_LINES, lineWidth = DEFAULT_WIDTH, majorLines = true, elevation = 1, foreground = DEFAULT_FOREGROUND,
    scale = 1, detail = DEFAULT_DETAIL, tilt = DEFAULT_TILT, direction = "forward", morph = DEFAULT_MORPH, glow = DEFAULT_GLOW, depthOfField = DEFAULT_DOF, fog = DEFAULT_FOG,
    brightness = 1, hoverEffect = "lift", mouseRadius = 1, mouseStrength = DEFAULT_STRENGTH, trail = DEFAULT_TRAIL, parallax = DEFAULT_PARALLAX, clickEffect = "pulse",
    speed = DEFAULT_SPEED, dpr = DEFAULT_DPR, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon({ ...common, speed, dpr });
  const state = useRef<TopoState>({ marks: [], sampledAt: -1, lookX: 0, lookY: 0 });

  const marksOf = (frame: BackdropFrame): number[] => {
    const s = state.current;
    const { pointer, elapsed } = frame;
    if (frame.reduced) s.marks = [];
    else if (trail > 0 && pointer.inside && elapsed - s.sampledAt >= TOPO_SAMPLE_SECONDS) {
      s.sampledAt = elapsed;
      s.marks = [...s.marks, { x: pointer.x, y: pointer.y, at: elapsed }].slice(-TOPO_TRAIL);
    }
    const list = new Array<number>(TOPO_TRAIL * 4).fill(0);
    s.marks.forEach((m, i) => {
      list[i * 4] = m.x;
      list[i * 4 + 1] = m.y;
      list[i * 4 + 2] = topoTrailWeight(elapsed - m.at, trail);
    });
    return list;
  };

  const pulsesOf = (frame: BackdropFrame): number[] => {
    const list = new Array<number>(TOPO_MAX_PULSES * 4).fill(0);
    if (clickEffect === "none" || frame.reduced) return list;
    frame.pointer.taps.slice(-TOPO_MAX_PULSES).forEach((tap, i) => {
      const age = frame.elapsed - tap.at;
      list[i * 4] = tap.x;
      list[i * 4 + 1] = tap.y;
      list[i * 4 + 2] = age;
      list[i * 4 + 3] = topoPulse(age) * mouseStrength * 1.5;
    });
    return list;
  };

  const lookOf = (frame: BackdropFrame): [number, number] => {
    const s = state.current;
    const { pointer } = frame;
    const on = !frame.reduced && pointer.inside;
    s.lookX = frame.reduced ? 0 : approach(s.lookX, on ? (pointer.x - 0.5) * parallax * LOOK_RANGE * 2 : 0, frame.dt, LOOK_TAU);
    s.lookY = frame.reduced ? 0 : approach(s.lookY, on ? (pointer.y - 0.5) * parallax * LOOK_RANGE : 0, frame.dt, LOOK_TAU);
    return [s.lookX, s.lookY];
  };

  const handle = useShaderBackdrop(
    {
      fragment: TOPO_FRAGMENT,
      uniforms: (frame) => {
        const flow = TOPO_DIRECTIONS[direction] ?? TOPO_DIRECTIONS.forward;
        const grow = topoIntro(frame.elapsed, !frame.reduced);
        const presence = frame.reduced ? 0 : frame.pointer.presence;
        return {
          u_color: frame.colors[0] ?? GREY,
          u_bg: frame.colors[1] ?? GREY,
          u_lines: Math.max(1, lineCount),
          u_width: lineWidth,
          u_major: majorLines,
          u_elev: Math.max(elevation * grow, 0.02),
          u_scale: scale,
          u_detail: detail,
          u_tilt: tilt,
          u_flow: [flow[0] * frame.time * FLOW_RATE, flow[1] * frame.time * FLOW_RATE],
          u_morph: morph,
          u_glow: glow,
          u_dof: depthOfField,
          u_fog: Math.max(0, Math.min(1, fog)),
          u_front: foreground,
          u_bright: brightness * grow,
          u_look: lookOf(frame),
          u_hover: [frame.pointer.x, frame.pointer.y, (TOPO_HOVER_SIGN[hoverEffect] ?? 0) * mouseStrength * presence, Math.max(mouseRadius, 0.05)],
          u_marks: { list: marksOf(frame), size: 4 },
          u_pulses: { list: pulsesOf(frame), size: 4 },
        };
      },
    },
    { ...options, colors: [color, backgroundColor] },
  );

  return (
    <BackdropShell handle={handle} fallback={fallbackGradient([backgroundColor, color])} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
