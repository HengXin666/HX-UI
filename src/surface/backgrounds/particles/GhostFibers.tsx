"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 GhostFibers 条目, 实现为 HX 自有.
// ENGINE-GAP: 上游把每根纤维画成实例化的点 / 段 (点精灵); 内核只有全屏片元, 无实例化与点精灵, 本件在片元里解析求最近纤维 (折叠处纤维挤密改按覆盖率出亮度), 每像素只取最近一根, 失焦纤维之间不互相叠盘; 规格 BLOOM_LEVELS 5 收到共用金字塔上限 4 级.
// 已补 (2026-11-09): 泛光改走 ../bloom.ts 的离屏金字塔 (场景离屏写色调压缩前的线性光, 软膝亮部提取阈值 0.775 / 膝 0.425 对应规格 smoothstep(0.35, 1.2, peak),
// 四级降采样, 上屏加泛光后再压缩色调, 强度 0.9); 散景按规格把失焦 (smoothstep(0.25, 0.7, blur)) 的点 / 段混成半径 1.25 倍线宽的圆盘, 盘边略亮 (0.94 + 0.08 smoothstep(0.55, 0.95, rho)), 景深仍以加宽线宽近似.

import { useRef, type JSX } from "react";
import { BackdropShell, glowFallback, splitCommon, useShaderBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import { bloomPyramid } from "../bloom";
import { FIBERS, FIBERS_FRAGMENT, fibersComposite, makeFiberState, stepFibers, type FiberGradient, type FiberHover, type FiberStyle } from "./ghost-fibers-shader";
import { DEG, introProgress } from "./tokens";

export interface GhostFibersProps extends BackdropCommonProps {
  /** 纤维主色, 默认 primary. */
  readonly glowColor?: string;
  /** 纤维亮芯色, 默认 foreground. */
  readonly lineColor?: string;
  /** 渐变另一端的颜色, 默认 accent. */
  readonly secondaryColor?: string;
  /** 两色怎么分布: depth 按前后 / along 沿带 / across 横跨带. */
  readonly gradient?: FiberGradient;
  /** 整体缩放, 默认 1. */
  readonly scale?: number;
  /** 纤维带整体倾角 (度), 默认 18. */
  readonly rotation?: number;
  /** 纤维带滚转速度 (圈 / 秒), 默认 0.15. */
  readonly rollSpeed?: number;
  /** 纤维带层数 1..4, 默认 3. */
  readonly layers?: number;
  /** 带身起伏的波数, 默认 1. */
  readonly waves?: number;
  /** 沿带扭转的圈数, 默认 1.2. */
  readonly twist?: number;
  /** 每层纤维根数, 默认 72, 上限 256. */
  readonly threads?: number;
  /** 带宽, 默认 0.7. */
  readonly volume?: number;
  /** 层间距, 默认 1. */
  readonly spread?: number;
  /** 点 / 段的密度, 默认 1. */
  readonly density?: number;
  /** 纤维粗细, 默认 1. */
  readonly thickness?: number;
  /** 点 / 段沿纤维流动的速度, 默认 0.4. */
  readonly flow?: number;
  /** 纤维画法: dots 点 / dashes 段 / lines 实线. */
  readonly fiberStyle?: FiberStyle;
  /** 露出带的两端 0..1, 0 为两端出画. */
  readonly tips?: number;
  /** 折叠处的光晕, 默认 1. */
  readonly foldGlow?: number;
  /** 近大远小的透视强度, 默认 0.65. */
  readonly perspective?: number;
  /** 景深模糊, 默认 0.85. */
  readonly depthOfField?: number;
  /** 合焦深度 (-1..1), 默认 0. */
  readonly focusDepth?: number;
  /** 周围漂浮的光尘, 默认 0.5. */
  readonly particles?: number;
  /** 悬停效果: focus 提亮 / part 拨开 / none. */
  readonly hoverEffect?: FiberHover;
  /** 入场 2.6s 自左向右显出, 默认 true. */
  readonly intro?: boolean;
}

const COLOR_DEFAULTS = { glow: "primary", line: "foreground", second: "accent" } as const;
const BACKGROUND_TOKEN = "background";
/** 颜色都解析不了时的中灰. */
const HALF_GREY = 0.5;

/**
 * 幽灵纤维: 几层扭转起伏的纤维带在画面里缓慢滚转, 每层由几十根细纤维组成, 折叠处纤维挤在一起发亮;
 * 纤维上的点或段沿带流动, 失焦处散成圆盘, 周围漂着光尘, 指针处提亮或把纤维拨开, 入场自左向右显出; 亮部经降采样金字塔泛光. 减弱动效时只画一帧.
 */
export function GhostFibers(props: GhostFibersProps): JSX.Element {
  const {
    glowColor = COLOR_DEFAULTS.glow, lineColor = COLOR_DEFAULTS.line, secondaryColor = COLOR_DEFAULTS.second, gradient = "depth", scale = 1, rotation = 18,
    rollSpeed = 0.15, layers = 3, waves = 1, twist = 1.2, threads = 72, volume = 0.7, spread = 1, density = 1, thickness = 1, flow = 0.4, fiberStyle = "dots",
    tips = 0, foldGlow = 1, perspective = 0.65, depthOfField = 0.85, focusDepth = 0, particles = 0.5, hoverEffect = "focus", intro = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const state = useRef(makeFiberState());
  const speed = options.speed ?? 1;

  const uniforms = (frame: BackdropFrame) => {
    const s = state.current;
    const p = frame.pointer;
    stepFibers(s, frame.dt * speed, flow, rollSpeed, p.x, p.y, p.inside);
    const [glow, line, second] = [frame.colors[0], frame.colors[1], frame.colors[2]];
    const tint3 = (c: readonly number[] | undefined, alt: readonly number[] | undefined): [number, number, number] => {
      const v = c ?? alt;
      return v ? [v[0], v[1], v[2]] : [HALF_GREY, HALF_GREY, HALF_GREY];
    };
    return {
      u_layers: Math.max(1, Math.min(FIBERS.maxLayers, Math.round(layers))),
      u_threads: Math.max(2, Math.min(FIBERS.maxThreads, Math.round(threads))),
      u_waves: waves,
      u_twist: twist,
      u_roll: frame.reduced ? 0 : s.roll,
      u_flow: frame.reduced ? 0 : s.flow,
      u_scale: scale,
      u_rot: rotation * DEG,
      u_volume: volume,
      u_spread: spread,
      u_density: density,
      u_thick: thickness,
      u_style: FIBERS.styles[fiberStyle] ?? 0,
      u_tips: tips,
      u_fold: foldGlow,
      u_persp: perspective,
      u_dof: depthOfField,
      u_focus: focusDepth,
      u_particles: particles,
      u_intro: introProgress(frame.elapsed, FIBERS.introSeconds, intro),
      u_effect: FIBERS.hovers[hoverEffect] ?? 0,
      u_grad: FIBERS.gradients[gradient] ?? 0,
      u_wave_t: frame.time * FIBERS.waveRate,
      u_hover: [s.hx, s.hy, s.presence],
      u_glow: tint3(glow, undefined),
      u_line: tint3(line, glow),
      u_second: tint3(second, glow),
    };
  };

  const pyramid = bloomPyramid({
    scene: FIBERS_FRAGMENT, sceneUniforms: uniforms, levels: FIBERS.bloomLevels,
    threshold: FIBERS.bloomThreshold, knee: FIBERS.bloomKnee, strength: FIBERS.bloomStrength,
  });
  const handle = useShaderBackdrop(
    { fragment: fibersComposite(pyramid.compositeGlsl), passes: pyramid.passes, uniforms: () => pyramid.uniforms },
    { ...options, colors: [glowColor, lineColor, secondaryColor] },
  );
  return (
    <BackdropShell handle={handle} fallback={glowFallback(BACKGROUND_TOKEN, glowColor)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}

