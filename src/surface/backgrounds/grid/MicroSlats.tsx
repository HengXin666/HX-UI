"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 MicroSlats 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格的 PIXEL_BUDGET 4.5e6 要按 CSS 面积定画布像素比 (min(dpr, 2, sqrt(BUDGET / 面积))); useShaderBackdrop 在渲染时展开 options, dpr 在 measure 时已是定值, 这里由内核 dpr 上限 2 与 maxEdge 2400 代替 (宽屏比预算紧, 近方形且长边超 2121 设备像素时超预算).
// 已补 (2026-11-09): 流体格恰 FLUID_SIZE 96 格 (五个通道的 PassSpec.scale 为 getter, 每次 resize 按画布设备像素长边取 96 / 长边). 规格的 canvas2d 逐帧绘制条目未写画什么, 百叶由上屏片元直接画出, 不另起 2D 层.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { cssColorOf } from "../../backdrop/kernel/color";
import type { PassSpec } from "../../backdrop/kernel/shader";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import {
  createSlatFluidDrive, inkKeep, MICRO_SLATS_FLUID, SLAT_CURL_PASS, SLAT_DIVERGENCE_PASS, SLAT_INK_PASS, SLAT_PRESSURE_PASS, SLAT_VELOCITY_PASS,
  slatFluidScale, stepSlatFluid, type SlatSplats,
} from "./micro-slats-fluid";
import { MICRO_SLATS, MICRO_SLATS_FRAGMENT, resolveSwell, type SwellPresetName } from "./micro-slats-shader";
import { cssAngleDir, DEG, introProgress, rgbAt } from "./tokens";

export interface MicroSlatsProps extends BackdropCommonProps {
  /** 浪况预设: swell / chop / storm / glass, 默认 swell. 下面的浪况项显式给出时覆盖预设. */
  readonly preset?: SwellPresetName;
  /** 百叶主色, token 名或 CSS 颜色, 默认 primary. */
  readonly color?: string;
  /** 浪峰闪光与墨迹点亮的颜色, 默认 foreground. */
  readonly glintColor?: string;
  /** 底色, 默认 background. */
  readonly backgroundColor?: string;
  /** 单片宽 (CSS 像素), 默认 10. */
  readonly slatWidth?: number;
  /** 单片高 (CSS 像素), 默认 25. */
  readonly slatHeight?: number;
  /** 片间距 (CSS 像素), 默认 3. */
  readonly gap?: number;
  /** 圆角 0..1 (相对短边一半), 默认 0.75. */
  readonly roundness?: number;
  /** 波长缩放, 越大浪越宽. */
  readonly scale?: number;
  /** 浪速倍率 (规格的 speed 与公共时钟倍率同名, 改名). */
  readonly waveSpeed?: number;
  /** 浪向 (度, CSS 角: 0 朝上, 90 朝右). */
  readonly direction?: number;
  /** 碎浪 0..1, 越大浪峰越尖. */
  readonly chop?: number;
  /** 沿浪向的拉伸, 越大浪线越长. */
  readonly stretch?: number;
  /** 浪峰闪光强度. */
  readonly glint?: number;
  /** 明暗对比 (浪高的幂). */
  readonly contrast?: number;
  /** 透视后仰 0..1. */
  readonly perspective?: number;
  /** 远处与四边入雾 0..1. */
  readonly fog?: number;
  /** 指针搅动流体, 默认 true. */
  readonly interactive?: boolean;
  /** 指针推力倍率, 默认 1. */
  readonly cursorStrength?: number;
  /** 指针影响直径 (CSS 像素), 默认 40. */
  readonly cursorSize?: number;
  /** 涡量约束 0..1, 越大越打旋, 默认 0. */
  readonly swirl?: number;
  /** 墨迹拖尾 (秒), 默认 1.4. */
  readonly trail?: number;
  /** 百叶斜切, -1..1, 默认 0. */
  readonly lean?: number;
  /** 首帧起由下往上揭开, 默认 true. */
  readonly intro?: boolean;
  /** 入场时长 (秒), 下限 0.2, 默认 1.8. */
  readonly introDuration?: number;
}

const NO_SPLATS: SlatSplats = { splats: new Float32Array(4 * (1 + MICRO_SLATS_FLUID.splashJets)), ink: new Float32Array(1 + MICRO_SLATS_FLUID.splashJets), count: 0, radius: 1 };
/** 入场波前从 0 走到这里时画面全部揭开 (片间错落 0.15 加波前宽 0.35 之外留余量). */
const FRONT_END = 1.6;

/** WebGL 不可用时的静态竖百叶. */
export function slatsFallback(color: string, background: string, width: number, gap: number): string {
  const ink = `color-mix(in srgb, ${cssColorOf(color)} 45%, ${cssColorOf(background)})`;
  const w = Math.max(1, width);
  return `repeating-linear-gradient(90deg, ${ink} 0 ${w}px, transparent ${w}px ${w + Math.max(0, gap)}px), ${cssColorOf(background)}`;
}

/**
 * 微百叶: 满屏圆角小百叶由一片方向浪面点亮 (四种浪况预设, 尖化浪峰, 浪向拉伸与慢摆, 浪峰闪光),
 * 可后仰成透视地面并斜切, 远处入雾; 指针在一张小流体场 (涡量, 散度, 16 次压力迭代, 墨迹) 里推流留墨,
 * 墨迹点亮百叶, 流速推移浪面, 点击喷出三道射流; 入场由下往上揭开. 减弱动效时内核只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-grid.md
 */
export function MicroSlats(props: MicroSlatsProps): JSX.Element {
  const {
    preset = "swell", color = "primary", glintColor = "foreground", backgroundColor = "background", slatWidth = 10, slatHeight = 25, gap = 3, roundness = 0.75,
    scale, waveSpeed, direction, chop, stretch, glint, contrast, perspective, fog, interactive = true, cursorStrength = 1, cursorSize = 40, swirl = 0, trail = 1.4,
    lean = 0, intro = true, introDuration = 1.8, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const drive = useRef(createSlatFluidDrive());
  const splats = useRef<SlatSplats>(NO_SPLATS);
  const swell = resolveSwell(preset, { scale, speed: waveSpeed, direction, chop, stretch, glint, contrast, perspective, fog });
  // 内核先把 canvas.width / height 设成 fit 再调 resize(fit), getter 读画布即这次 resize 的尺寸.
  const sized = (pass: Omit<PassSpec, "scale">): PassSpec => ({
    ...pass,
    get scale() {
      const canvas = handle.canvasRef.current;
      return slatFluidScale(canvas?.width ?? 0, canvas?.height ?? 0);
    },
  });
  const splatUniforms = () => {
    const f = splats.current;
    return { u_splats: { list: f.splats, size: 4 as const }, u_splat_count: f.count, u_radius: f.radius };
  };

  const uniforms = (frame: BackdropFrame) => ({
    u_color: rgbAt(frame.colors, 0),
    u_glint_color: rgbAt(frame.colors, 1),
    u_bg: rgbAt(frame.colors, 2),
    u_slat: [Math.max(1, slatWidth), Math.max(1, slatHeight)] as const,
    u_gap: Math.max(0, gap),
    u_round: Math.min(Math.max(roundness, 0), 1),
    u_scale: swell.scale,
    u_wave_speed: swell.speed,
    u_dir: cssAngleDir(swell.direction),
    u_chop: Math.min(Math.max(swell.chop, 0), 1),
    u_stretch: swell.stretch,
    u_glint: swell.glint,
    u_contrast: swell.contrast,
    u_tilt: Math.min(Math.max(swell.perspective, 0), 1) * MICRO_SLATS.maxTilt * DEG,
    u_fog: Math.min(Math.max(swell.fog, 0), 1),
    u_lean: Math.min(Math.max(lean, -1), 1),
    u_ink_gain: 1,
    u_front: introProgress(frame.elapsed, Math.max(0.2, introDuration), intro) * FRONT_END,
  });

  const handle = useShaderBackdrop(
    {
      fragment: MICRO_SLATS_FRAGMENT,
      uniforms,
      passes: [
        sized({ name: "u_curl", fragment: SLAT_CURL_PASS }),
        sized({
          name: "u_vel",
          fragment: SLAT_VELOCITY_PASS,
          uniforms: (frame) => {
            splats.current = stepSlatFluid(drive.current, frame, { interactive, strength: Math.max(0, cursorStrength), size: Math.max(1, cursorSize) });
            const keep = frame.dt > 0 ? Math.exp(-frame.dt * MICRO_SLATS_FLUID.drag) : 1;
            return { ...splatUniforms(), u_dt: frame.dt, u_swirl: Math.max(0, swirl) * MICRO_SLATS_FLUID.swirlGain, u_keep_v: keep };
          },
        }),
        sized({ name: "u_div", fragment: SLAT_DIVERGENCE_PASS }),
        sized({ name: "u_press", fragment: SLAT_PRESSURE_PASS, iterations: MICRO_SLATS_FLUID.pressureSteps }),
        sized({
          name: "u_ink",
          fragment: SLAT_INK_PASS,
          uniforms: (frame) => ({ ...splatUniforms(), u_splat_ink: { list: splats.current.ink, size: 1 as const }, u_dt: frame.dt, u_keep: inkKeep(trail, frame.dt) }),
        }),
      ],
    },
    { ...options, colors: [color, glintColor, backgroundColor] },
  );

  return (
    <BackdropShell handle={handle} fallback={slatsFallback(color, backgroundColor, slatWidth, gap)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
