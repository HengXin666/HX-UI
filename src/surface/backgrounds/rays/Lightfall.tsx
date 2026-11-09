"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Lightfall 条目, 实现为 HX 自有.
// 已补 (2026-11-09): 规格的四级降采样模糊泛光 (BLOOM_LEVELS / DOWNSAMPLE / BLUR) 改走 ../bloom.ts 的离屏金字塔
// (场景离屏通道, 软膝亮部提取, 四级 13 点降采样, 上屏帐篷核上采样合成), 不再以峰值处解析增益近似; bloom prop 为泛光强度.
// 规格的 speed 与公共时钟倍率重名, 改名 fallSpeed; backgroundColor 不给时透明叠加 (规格默认的灰底交给使用方).

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { bloomPyramid } from "../bloom";
import { backdropOf, followStep, introProgress, paletteList, raysBloomFragment } from "./field";
import { dampFollow, LIGHTFALL, LIGHTFALL_SCENE, warpStep } from "./lightfall-shader";

export interface LightfallProps extends BackdropCommonProps {
  /** 光痕调色板 (最多 8 色): token 名或 CSS 颜色. */
  readonly colors?: readonly string[];
  /** 底色; 不给时透明叠加在任意底色上. */
  readonly backgroundColor?: string;
  /** 下落速度 (规格的 speed). */
  readonly fallSpeed?: number;
  /** 每列光痕条数 1..6. */
  readonly streakCount?: number;
  /** 光痕宽度. */
  readonly streakWidth?: number;
  /** 光痕拖尾长度. */
  readonly streakLength?: number;
  readonly glow?: number;
  /** 有光痕的列占比 0..1. */
  readonly density?: number;
  /** 闪烁幅度 0..1. */
  readonly twinkle?: number;
  /** 画面缩放, 越大光痕越密越细. */
  readonly zoom?: number;
  /** 调色板均色铺出的背景微光. */
  readonly backgroundGlow?: number;
  /** 光痕头部辉光. */
  readonly headGlow?: number;
  /** 层间纵深 0..1, 越大远层越暗越密. */
  readonly depth?: number;
  /** 泛光强度 (四级降采样模糊泛光叠回画面的比例). */
  readonly bloom?: number;
  /** 指针视差强度. */
  readonly mouseStrength?: number;
  /** 指针透镜半径 (短边为 1). */
  readonly mouseRadius?: number;
  /** 指针跟随时间常数 秒, 0 为立即到位. */
  readonly mouseDampening?: number;
  /** 指针透镜把光痕推开的强度. */
  readonly lens?: number;
  /** 按住指针时冲刺 (拉长光痕, 下落加速 9 倍). */
  readonly holdToWarp?: boolean;
  /** 是否播放 2.6 秒的自上而下揭开. */
  readonly intro?: boolean;
  /** 四边淡出宽度 0..1. */
  readonly fade?: number;
}

const DEFAULT_COLORS = ["foreground"] as const;

/**
 * 光瀑: 多层视差的竖向光痕自上而下落, 头亮尾长, 远层更暗更密. 指针带视差并在周围形成透镜把光痕推开,
 * 按住冲刺 (光痕拉长, 下落加速), 松开缓缓回落.
 */
export function Lightfall(props: LightfallProps): JSX.Element {
  const {
    colors = DEFAULT_COLORS, backgroundColor, fallSpeed = 0.3, streakCount = 2, streakWidth = 0.8, streakLength = 1, glow = 1, density = 0.6,
    twinkle = 0.3, zoom = 3, backgroundGlow = 0.1, headGlow = 0.6, depth = 0.5, bloom = 0.35, mouseStrength = 0.4, mouseRadius = 0.45,
    mouseDampening = 0.15, lens = 0.5, holdToWarp = true, intro = true, fade = 0, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const palette = (colors.length > 0 ? colors : DEFAULT_COLORS).slice(0, LIGHTFALL.maxColors);
  const state = useRef({ vx: 0, vy: 0, lx: 0, ly: 0, touch: 0, warp: 0, rush: 0 });

  const uniforms = (frame: BackdropFrame) => {
    const { pointer, dt, fit } = frame;
    const s = state.current;
    const aspect = fit.width / Math.max(1, fit.height);
    const short = Math.min(aspect, 1);
    const engaged = options.pointer !== false && pointer.inside;
    const px = ((pointer.x - 0.5) * aspect) / short;
    const py = (pointer.y - 0.5) / short;
    const follow = dampFollow(dt, mouseDampening);
    s.vx += ((engaged ? px * mouseStrength : 0) - s.vx) * follow;
    s.vy += ((engaged ? py * mouseStrength : 0) - s.vy) * follow;
    s.lx = followStep(s.lx, px, dt, LIGHTFALL.lensRate);
    s.ly = followStep(s.ly, py, dt, LIGHTFALL.lensRate);
    s.touch = followStep(s.touch, engaged ? 1 : 0, dt, engaged ? LIGHTFALL.touchIn : LIGHTFALL.touchOut);
    s.warp = warpStep(s.warp, holdToWarp && engaged && pointer.down, dt);
    s.rush += dt * (options.speed ?? 1) * LIGHTFALL.travelRate * fallSpeed * s.warp * LIGHTFALL.warpSpeed;
    return {
      u_colors: paletteList(frame.colors.slice(0, palette.length), LIGHTFALL.maxColors),
      u_color_count: palette.length,
      u_fade: fade,
      u_travel: frame.time * LIGHTFALL.travelRate * fallSpeed + s.rush,
      u_twinkle_clock: frame.time,
      u_streaks: Math.max(1, Math.min(6, Math.round(streakCount))),
      u_width: streakWidth,
      u_length: streakLength,
      u_glow: glow,
      u_density: density,
      u_twinkle: twinkle,
      u_zoom: zoom,
      u_bg_glow: backgroundGlow,
      u_head: headGlow,
      u_depth: depth,
      u_view: [s.vx, s.vy],
      u_lens: [s.lx, s.ly, mouseRadius, s.touch],
      u_lens_amount: lens,
      u_warp: s.warp,
      u_intro: introProgress(frame.elapsed, LIGHTFALL.introSeconds, intro),
    };
  };

  const pyramid = bloomPyramid({
    scene: LIGHTFALL_SCENE, sceneUniforms: uniforms, levels: LIGHTFALL.bloomLevels,
    threshold: LIGHTFALL.bloomThreshold, knee: LIGHTFALL.bloomKnee, strength: bloom * LIGHTFALL.bloomGain,
  });
  const handle = useShaderBackdrop(
    {
      fragment: raysBloomFragment(pyramid.compositeGlsl),
      passes: pyramid.passes,
      uniforms: (frame) => ({
        u_backdrop: backdropOf(frame.colors, palette.length, backgroundColor !== undefined),
        u_fade: fade,
        ...pyramid.uniforms,
      }),
    },
    { ...options, colors: backgroundColor === undefined ? palette : [...palette, backgroundColor] },
  );
  return (
    <BackdropShell handle={handle} fallback={glowFallback(backgroundColor ?? "background", palette[0])} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
