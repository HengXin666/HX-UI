"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Hyperspeed 条目, 实现为 HX 自有.
// 已补 (2026-11-09): 泛光走 ../bloom.ts 离屏金字塔 (阈值 0.6 / 膝 0.5, 强度 glow * 1.5, 泛光峰值并入覆盖率); 车灯带外宽高斯光晕减半 (0.08 到 0.04), 只作近处光晕. 规格无景深 / 散景, 不加.
// ENGINE-GAP (仍做不了, 需内核实例化 / 顶点缓冲): 上游是实例化车灯 / 灯杆网格; 这里片元里路面求交算光带, 灯杆与尘线逐个投影, 车灯贴在路面上而非离地.

import { useRef, type JSX } from "react";
import { BackdropShell, glowFallback, splitCommon, useShaderBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import { bloomPyramid } from "../bloom";
import { CURVE_KIND, HYPERSPEED, HYPERSPEED_FRAGMENT, hyperspeedComposite, makeHyperspeedState, stepHyperspeed, type HyperspeedCurve } from "./hyperspeed-shader";
import { DEG, HALF, paletteUniform } from "./tokens";

export interface HyperspeedProps extends BackdropCommonProps {
  /** 弯道形状: straight / winding / turbulent. */
  readonly curve?: HyperspeedCurve;
  /** 弯道强度倍率, 默认 1. */
  readonly curvature?: number;
  /** 按住时的加速倍数, 默认 3. */
  readonly boost?: number;
  /** 竖直视场 (度), 默认 90. */
  readonly fov?: number;
  /** 加速时的视场 (度), 默认 130. */
  readonly boostFov?: number;
  /** 每侧车道数 1..6, 默认 3. */
  readonly lanes?: number;
  /** 每侧路宽 (世界单位), 默认 10. */
  readonly roadWidth?: number;
  /** 中央隔离带宽, 默认 2. */
  readonly medianWidth?: number;
  /** 车流密度 (每侧可见车数), 默认 40. */
  readonly density?: number;
  /** 光带长度倍率, 默认 1. */
  readonly trailLength?: number;
  /** 车灯粗细倍率, 默认 1. */
  readonly lightSize?: number;
  /** 每侧可见灯杆数 0..80, 默认 20. */
  readonly poles?: number;
  /** 灯杆高度倍率, 默认 1. */
  readonly poleHeight?: number;
  /** 尘线条数, 默认 100, 0 关闭. */
  readonly dust?: number;
  /** 光晕与泛光强度, 默认 0.6. */
  readonly glow?: number;
  /** 湿路面反光强度, 默认 0.5. */
  readonly reflections?: number;
  /** 指针左右带动镜头横移的幅度 0..1, 默认 0.35. */
  readonly steer?: number;
  /** 同向车尾灯颜色 (token 名或 CSS 颜色), 最多 8 个. */
  readonly tailColors?: readonly string[];
  /** 对向车头灯颜色, 最多 8 个. */
  readonly headColors?: readonly string[];
  /** 灯杆灯色, 最多 8 个. */
  readonly poleColors?: readonly string[];
  /** 路面颜色, 默认 muted. */
  readonly roadColor?: string;
  /** 路面不透明度, 默认 0.1. */
  readonly roadOpacity?: number;
  /** 车道线与尘线颜色, 默认 muted-foreground. */
  readonly lineColor?: string;
}

const DEFAULT_TAILS = ["destructive", "primary"] as const;
const DEFAULT_HEADS = ["foreground", "accent"] as const;
const DEFAULT_POLES = ["accent"] as const;

/**
 * 夜间公路光速背景: 镜头沿弯道前行, 对向车头灯与同向车尾灯拖成光带, 两侧灯杆后掠, 尘线从消失点放射.
 * 按住加速: 速度一阶升到 (1 + boost) 倍 (升 0.28s, 落 0.85s), 视场按弹簧 (90 / 13) 拉到 boostFov; 指针左右带动镜头横移.
 * 场景在离屏通道里画, 亮部经四级降采样金字塔泛光后上屏合成. 减弱动效时只画一帧.
 */
export function Hyperspeed(props: HyperspeedProps): JSX.Element {
  const {
    curve = "winding", curvature = 1, boost = 3, fov = 90, boostFov = 130, lanes = 3, roadWidth = 10, medianWidth = 2, density = 40,
    trailLength = 1, lightSize = 1, poles = 20, poleHeight = 1, dust = 100, glow = 0.6, reflections = 0.5, steer = 0.35,
    tailColors = DEFAULT_TAILS, headColors = DEFAULT_HEADS, poleColors = DEFAULT_POLES, roadColor = "muted", roadOpacity = 0.1,
    lineColor = "muted-foreground", ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const state = useRef(makeHyperspeedState(fov));
  const heads = headColors.slice(0, HYPERSPEED.maxColors);
  const tails = tailColors.slice(0, HYPERSPEED.maxColors);
  const lamps = poleColors.slice(0, HYPERSPEED.maxColors);
  const speed = options.speed ?? 1;

  const uniforms = (frame: BackdropFrame) => {
    const s = state.current;
    const p = frame.pointer;
    const cruise = HYPERSPEED.cruise * speed;
    if (frame.reduced) {
      s.travel = frame.time * HYPERSPEED.cruise;
      s.fov = fov;
    } else {
      const down = p.down && p.inside;
      const steerTarget = (p.x - HALF) * 2 * steer * roadWidth * HALF * p.presence;
      stepHyperspeed(s, frame.dt, { wanted: down ? boost : 0, fovTarget: down ? boostFov : fov, steerTarget, cruise });
    }
    const c = frame.colors;
    const at = (i: number): [number, number, number] => {
      const v = c[i];
      return v ? [v[0], v[1], v[2]] : [HALF, HALF, HALF];
    };
    const base = heads.length + tails.length + lamps.length;
    return {
      u_travel: s.travel,
      u_focal: 1 / Math.tan(Math.min(170, Math.max(10, s.fov)) * DEG * HALF),
      u_cam_x: s.steer,
      u_boost: s.boost,
      u_curve_kind: CURVE_KIND[curve] ?? 1,
      u_curvature: curvature,
      u_lanes: Math.max(1, Math.min(HYPERSPEED.maxLanes, Math.round(lanes))),
      u_road_w: roadWidth,
      u_median: medianWidth,
      u_density: density,
      u_trail: trailLength,
      u_light_size: lightSize,
      u_poles: Math.max(0, Math.min(HYPERSPEED.maxPoles, Math.round(poles))),
      u_pole_h: poleHeight,
      u_dust: Math.max(0, Math.round(dust)),
      u_glow: glow,
      u_reflect: reflections,
      u_road_alpha: roadOpacity,
      u_head_count: Math.max(1, heads.length),
      u_tail_count: Math.max(1, tails.length),
      u_pole_count: Math.max(1, lamps.length),
      u_heads: paletteUniform(c.slice(0, heads.length), HYPERSPEED.maxColors),
      u_tails: paletteUniform(c.slice(heads.length, heads.length + tails.length), HYPERSPEED.maxColors),
      u_pole_colors: paletteUniform(c.slice(heads.length + tails.length, base), HYPERSPEED.maxColors),
      u_road: at(base),
      u_line: at(base + 1),
    };
  };

  const pyramid = bloomPyramid({
    scene: HYPERSPEED_FRAGMENT, sceneUniforms: uniforms, levels: HYPERSPEED.bloomLevels,
    threshold: HYPERSPEED.bloomThreshold, knee: HYPERSPEED.bloomKnee, strength: Math.max(0, glow) * HYPERSPEED.bloomGain,
  });
  const handle = useShaderBackdrop(
    { fragment: hyperspeedComposite(pyramid.compositeGlsl), passes: pyramid.passes, uniforms: () => pyramid.uniforms },
    { ...options, colors: [...heads, ...tails, ...lamps, roadColor, lineColor] },
  );
  return (
    <BackdropShell handle={handle} fallback={glowFallback("background", tails[0] ?? "primary")} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
