"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 PrismaticBurst 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格的四级降采样模糊泛光 (BLOOM_LEVELS / DOWNSAMPLE / BLUR) 以峰值处的解析增益 (glow) 近似;
// mixBlendMode 交给使用方的 className. 规格的 speed 与公共时钟倍率重名, 改名 burstSpeed.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { followStep, introProgress, paletteList, qualityDpr } from "./field";
import { burstPhaseStep, burstScale, PRISMATIC_BURST, PRISMATIC_BURST_FRAGMENT, type BurstAnimation, type BurstQuality } from "./prismatic-burst-shader";

export interface PrismaticBurstProps extends BackdropCommonProps {
  /** 调色板 (最多 8 色): token 名或 CSS 颜色; 不给时用连续光谱. */
  readonly colors?: readonly string[];
  readonly intensity?: number;
  /** 相位推进速度 (规格的 speed). */
  readonly burstSpeed?: number;
  /** rotate 绕视轴自转, rotate3d 三轴翻滚, hover 朝向跟指针. */
  readonly animationType?: BurstAnimation;
  /** 噪声弯折光束的强度. */
  readonly distort?: number;
  /** 光束梳齿数, 0 为不规则自然光束. */
  readonly rayCount?: number;
  /** 光束宽度系数. */
  readonly rayWidth?: number;
  readonly zoom?: number;
  /** 沿半径扭转. */
  readonly twist?: number;
  /** 光束纹理沿时间流动的附加速度. */
  readonly flow?: number;
  /** 中心压暗 0..1. */
  readonly centerFade?: number;
  /** 颗粒 0..1. */
  readonly grain?: number;
  /** 峰值处的泛光增益. */
  readonly glow?: number;
  /** 中心偏移 (短边为 1). */
  readonly offset?: { readonly x?: number; readonly y?: number };
  /** 指针牵动朝向与加速的强度. */
  readonly mouseStrength?: number;
  /** 朝向跟手的时间常数 秒. */
  readonly hoverDampness?: number;
  /** 点击处外扩光环并给相位一记冲量. */
  readonly clickBurst?: boolean;
  /** 是否播放 2.4 秒的星形前沿揭开. */
  readonly intro?: boolean;
  /** 四边淡出宽度 0..1. */
  readonly fade?: number;
  /** 渲染比例档位. */
  readonly quality?: BurstQuality;
  /** 显式渲染比例, 覆盖 quality. */
  readonly resolution?: number;
}

const ROTATE_RATE = 0.35;

/**
 * 棱光迸发: 体积步进的放射光束自中心迸出, 沿半径按光谱或调色板着色, 可扭转与噪声弯折. 三种转动方式,
 * 指针在场时朝向偏向指针并加速, 点击处外扩一圈光环 (寿命 1.5s, 最多 4 个) 并给相位一记冲量.
 */
export function PrismaticBurst(props: PrismaticBurstProps): JSX.Element {
  const {
    colors, intensity = 2, burstSpeed = 0.5, animationType = "rotate3d", distort = 0, rayCount = 0, rayWidth = 1, zoom = 1, twist = 0, flow = 0,
    centerFade = 1, grain = 0.8, glow = 0, offset, mouseStrength = 0.5, hoverDampness = 0.25, clickBurst = true, intro = true, fade = 0,
    quality = "high", resolution, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const palette = (colors ?? []).slice(0, PRISMATIC_BURST.maxColors);
  const state = useRef({ extra: 0, kick: 0, seen: 0, yaw: 0, pitch: 0, touch: 0 });

  const uniforms = (frame: BackdropFrame) => {
    const { pointer, dt } = frame;
    const s = state.current;
    const engaged = options.pointer !== false && pointer.inside;
    const latest = pointer.taps.length > 0 ? Math.max(...pointer.taps.map((tap) => tap.at)) : 0;
    if (clickBurst && latest > s.seen) s.kick += PRISMATIC_BURST.kick;
    s.seen = Math.max(s.seen, latest);
    s.kick = followStep(s.kick, 0, dt, PRISMATIC_BURST.kickDecay);
    s.touch = followStep(s.touch, engaged ? 1 : 0, dt, 1 / Math.max(hoverDampness, 0.01));
    const aimX = engaged ? (pointer.x - 0.5) * 2 * mouseStrength : 0;
    const aimY = engaged ? (pointer.y - 0.5) * 2 * mouseStrength : 0;
    s.yaw = followStep(s.yaw, aimX, dt, 1 / Math.max(hoverDampness, 0.01));
    s.pitch = followStep(s.pitch, aimY, dt, 1 / Math.max(hoverDampness, 0.01));
    const step = dt * (options.speed ?? 1);
    // 基础推进 dt * burstSpeed 已在 frame.time 里 (减弱动效时也成立), 这里只累加跟手加速与点击冲量.
    s.extra = burstPhaseStep(s.extra, step, burstSpeed, s.touch * mouseStrength, s.kick) - step * burstSpeed;
    const phase = frame.time * burstSpeed + s.extra;
    const mode = PRISMATIC_BURST.animations[animationType] ?? PRISMATIC_BURST.animations.rotate3d;
    const tumble = mode === PRISMATIC_BURST.animations.rotate3d ? 1 : 0;
    const spin = mode === PRISMATIC_BURST.animations.hover ? 0 : phase * ROTATE_RATE;
    const reach = mode === PRISMATIC_BURST.animations.hover ? 1 : 0.4;
    return {
      u_colors: paletteList(frame.colors, PRISMATIC_BURST.maxColors),
      u_color_count: palette.length,
      u_fade: fade,
      u_backdrop: [0, 0, 0, 0],
      u_phase: phase,
      u_intensity: intensity,
      u_orient: [s.yaw * reach + tumble * Math.sin(phase * 0.5) * 0.6, -s.pitch * reach + tumble * Math.sin(phase * 0.37 + 1) * 0.5, spin],
      u_distort: distort,
      u_ray_count: Math.max(0, Math.round(rayCount)),
      u_ray_width: rayWidth,
      u_zoom: zoom,
      u_twist: twist,
      u_flow: flow,
      u_center_fade: centerFade,
      u_grain: grain,
      u_glow: glow,
      u_offset: [offset?.x ?? 0, offset?.y ?? 0],
      u_intro: introProgress(frame.elapsed, PRISMATIC_BURST.introSeconds, intro),
      u_burst_on: clickBurst ? 1 : 0,
    };
  };

  const handle = useShaderBackdrop(
    { fragment: PRISMATIC_BURST_FRAGMENT, uniforms },
    { ...options, colors: palette, dpr: qualityDpr(options.dpr, burstScale(quality, resolution)) },
  );
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(palette.length > 0 ? palette : ["primary", "accent", "accent-2"])} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
