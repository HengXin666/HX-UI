"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 GridScan 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import { clamp, smoothstep } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { GRID_SCAN, GRID_SCAN_FRAGMENT, SCAN_LINE_STYLES, type ScanLineStyle } from "./grid-scan-shader";
import { enumOf, follow, introProgress, rgbAt, type Follower } from "./tokens";

/** 扫描方向: 由近及远, 由远及近, 来回. */
export type ScanDirection = "forward" | "backward" | "pingpong";
/** 点击效果: 外扩环, 从头重扫, 无. */
export type ScanClickEffect = "ping" | "scan" | "none";

export interface GridScanProps extends BackdropCommonProps {
  /** 网格线色, token 名或 CSS 颜色, 默认 border. */
  readonly linesColor?: string;
  /** 扫描光色, 默认 primary. */
  readonly scanColor?: string;
  /** 隧道一个截面高里的格数, 默认 8. */
  readonly cells?: number;
  /** 线宽 (CSS 像素), 默认 1. */
  readonly lineThickness?: number;
  /** 线型: solid / dashed / dotted. */
  readonly lineStyle?: ScanLineStyle;
  /** 隧道深度 (以半高计), 默认 3. */
  readonly depth?: number;
  /** 向深处淡出的程度, 默认 0.6. */
  readonly depthFade?: number;
  /** 指针带动眼位的视差强度, 默认 1. */
  readonly parallax?: number;
  /** 网格交点上的闪烁点. */
  readonly points?: boolean;
  /** 地面对扫描光的反光, 默认 0.35. */
  readonly reflection?: number;
  /** 随深度变暗的程度, 默认 0.7. */
  readonly shading?: number;
  readonly scanDirection?: ScanDirection;
  /** 一次扫描时长 (秒), 钳到 0.3..20, 默认 2.4. */
  readonly scanDuration?: number;
  /** 两次扫描之间的停顿 (秒), 钳到 0..30, 默认 1.6. */
  readonly scanDelay?: number;
  /** 扫描光带宽度倍率, 默认 1. */
  readonly scanWidth?: number;
  /** 拖尾长度 (深度单位), 默认 0.5. */
  readonly trail?: number;
  /** 光晕强度, 默认 0.6. */
  readonly glow?: number;
  /** 自动循环扫描; 关闭时只在点击 (clickEffect 为 scan) 后扫一次. */
  readonly autoScan?: boolean;
  readonly clickEffect?: ScanClickEffect;
}

/** 扫描状态: 扫描起点 (场时钟) 与已处理到的最近一次点击时刻. */
export interface ScanClock {
  origin: number | null;
  seenTap: number;
}

/**
 * 当前扫描面: 返回 [深度位置, 光带不透明度, 方向]; 不在扫描中时不透明度为 0.
 * 光带从入口外一个带宽处进, 到尽头外一个带宽处出, 起止各 8% 淡入淡出.
 *
 * @param since 距扫描起点的秒数 (场时钟); 负数或 null 表示未开始.
 * @param o 时长, 停顿, 方向, 是否循环, 深度, 带宽.
 */
export function scanPlane(
  since: number | null,
  o: { duration: number; delay: number; direction: ScanDirection; auto: boolean; depth: number; width: number },
): readonly [number, number, number] {
  const duration = clamp(o.duration, 0.3, 20);
  const cycle = duration + clamp(o.delay, 0, 30);
  if (since === null || since < 0 || (!o.auto && since > duration)) return [0, 0, 1];
  const round = o.auto ? Math.floor(since / cycle) : 0;
  const phase = o.auto ? since - round * cycle : since;
  if (phase > duration) return [0, 0, 1];
  const t = phase / duration;
  const back = o.direction === "backward" || (o.direction === "pingpong" && round % 2 === 1);
  const edge = 0.12 * o.width;
  const along = -edge + (o.depth + 2 * edge) * t;
  const alpha = smoothstep(0, 0.08, t) * (1 - smoothstep(0.92, 1, t));
  return back ? [o.depth - along, alpha, -1] : [along, alpha, 1];
}

/**
 * 隧道扫描网格: 视线与贴合画面的隧道四壁求交, 壁上画实线 / 虚线 / 点线网格与交点闪烁,
 * 一道扫描光面沿深度推进并留拖尾, 地面反光, 指针带动眼位做视差并照亮所指壁面, 点击打出外扩环或重扫.
 * 入场时网格由近到远亮起 (2.2 秒).
 * 规格的 enableWebcam / showPreview / modelsPath (人脸追踪, 要从 CDN 拉模型) 与 enableGyro 不做,
 * ENGINE-GAP: 内核指针只有 pointer 事件, 没有 deviceorientation.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-grid.md
 */
export function GridScan(props: GridScanProps): JSX.Element {
  const {
    linesColor = "border", scanColor = "primary", cells = 8, lineThickness = 1, lineStyle = "solid", depth = 3, depthFade = 0.6, parallax = 1,
    points = true, reflection = 0.35, shading = 0.7, scanDirection = "forward", scanDuration = 2.4, scanDelay = 1.6, scanWidth = 1, trail = 0.5,
    glow = 0.6, autoScan = true, clickEffect = "ping", ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const eyeX = useRef<Follower>({ value: 0 });
  const eyeY = useRef<Follower>({ value: 0 });
  const hover = useRef<Follower>({ value: 0 });
  const clock = useRef<ScanClock>({ origin: autoScan ? 0 : null, seenTap: Number.NEGATIVE_INFINITY });

  const uniforms = (frame: BackdropFrame) => {
    const p = frame.pointer;
    const lean = p.inside ? parallax * 0.35 : 0;
    follow(eyeX.current, -(p.x - 0.5) * 2 * lean * (frame.fit.width / Math.max(frame.fit.height, 1)), frame.dt, GRID_SCAN.eyeTau);
    follow(eyeY.current, -(p.y - 0.5) * 2 * lean, frame.dt, GRID_SCAN.eyeTau);
    follow(hover.current, p.inside ? 1 : 0, frame.dt, GRID_SCAN.hoverTau);
    const latest = p.taps[p.taps.length - 1];
    const c = clock.current;
    if (latest && latest.at > c.seenTap) {
      c.seenTap = latest.at;
      if (clickEffect === "scan") c.origin = frame.time;
    }
    if (autoScan && c.origin === null) c.origin = frame.time;
    const [scanZ, scanAlpha, scanDir] = scanPlane(c.origin === null ? null : frame.time - c.origin, {
      duration: scanDuration, delay: scanDelay, direction: scanDirection, auto: autoScan, depth, width: scanWidth,
    });
    return {
      u_lines: rgbAt(frame.colors, 0),
      u_scan: rgbAt(frame.colors, 1),
      u_eye: [eyeX.current.value, eyeY.current.value],
      u_depth: Math.max(0.5, depth),
      u_cells: Math.max(1, cells),
      u_thick: Math.max(0.25, lineThickness) * frame.fit.scale,
      u_style: enumOf(SCAN_LINE_STYLES, lineStyle),
      u_depth_fade: depthFade,
      u_points: points ? 1 : 0,
      u_reflection: reflection,
      u_shading: shading,
      u_scan_z: scanZ,
      u_scan_alpha: scanAlpha,
      u_scan_dir: scanDir,
      u_scan_width: scanWidth,
      u_trail: trail,
      u_glow: glow,
      u_reveal: introProgress(frame.elapsed, GRID_SCAN.introSeconds, true) * (depth + 0.4),
      u_hover: hover.current.value,
      u_ping: clickEffect === "ping" ? 1 : 0,
    };
  };

  const handle = useShaderBackdrop({ fragment: GRID_SCAN_FRAGMENT, uniforms }, { ...options, colors: [linesColor, scanColor] });
  return (
    <BackdropShell handle={handle} fallback={glowFallback("background", scanColor)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
