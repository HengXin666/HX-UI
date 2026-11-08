"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 MoltenMetal 条目, 实现为 HX 自有.
// ENGINE-GAP: 条目的 Canvas2D 拖尾预烘不做, 拖尾改为 16 个采样点直接进片元 uniform 数组.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import type { Rgb } from "../../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import { approach } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import {
  MOLTEN_BALANCE, MOLTEN_FOLLOW_TAU, MOLTEN_FRAGMENT, MOLTEN_MAX_COLORS, MOLTEN_MAX_FLARES, MOLTEN_PRESENCE_TAU, MOLTEN_SAMPLE_SECONDS, MOLTEN_TRAIL,
  moltenFlare, moltenReveal, moltenTrailWeight, type MoltenMode,
} from "./molten-metal-shader";

export interface MoltenMetalProps extends BackdropCommonProps {
  /** 金属调色板, 最多 6 色, token 名或 CSS 颜色. 默认 primary. */
  readonly colors?: readonly string[];
  /** 受热处的芯色, 默认 foreground. */
  readonly coreColor?: string;
  /** 底色, 默认 background. */
  readonly backgroundColor?: string;
  /** 透明底 (只画熔流), 默认 false. */
  readonly transparent?: boolean;
  /** 浅色模式: 以底色为主, 金属只做明暗. */
  readonly lightMode?: boolean;
  /** 图样缩放, 默认 4. */
  readonly scale?: number;
  /** 旋涡扭曲层数 1..6, 默认 3. */
  readonly detail?: number;
  /** 脊线辉光, 默认 1.6. */
  readonly glow?: number;
  /** 脊线粗细, 默认 1. */
  readonly thickness?: number;
  /** 旋涡强度, 默认 1. */
  readonly swirl?: number;
  /** 细碎扰动, 默认 0.2. */
  readonly turbulence?: number;
  /** 底雾, 默认 0.75. */
  readonly haze?: number;
  /** 亮度倍率, 默认 1.3. */
  readonly brightness?: number;
  /** 调色板取色偏置, 默认 molten. */
  readonly colorMode?: MoltenMode;
  /** 图样旋转 (度), 默认 0. */
  readonly rotation?: number;
  readonly offsetX?: number;
  readonly offsetY?: number;
  /** 整体漂移速度, 默认 0.3. */
  readonly drift?: number;
  /** 胶片颗粒, 默认 0.05. */
  readonly grain?: number;
  /** 出现时熔流从下往上漫开, 默认 true. */
  readonly intro?: boolean;
  /** 指针加热强度, 默认 0.5. */
  readonly mouseStrength?: number;
  /** 点击放出一团耀斑, 默认 true. */
  readonly flareOnClick?: boolean;
}

const DEFAULT_COLORS = ["primary"];
const DEFAULT_SPEED = 0.35;
const DEFAULT_SCALE = 4;
const DEFAULT_DETAIL = 3;
const DEFAULT_GLOW = 1.6;
const DEFAULT_TURBULENCE = 0.2;
const DEFAULT_HAZE = 0.75;
const DEFAULT_BRIGHTNESS = 1.3;
const DEFAULT_DRIFT = 0.3;
const DEFAULT_GRAIN = 0.05;
const DEFAULT_STRENGTH = 0.5;
/** scale prop 换算成片元里的平面单位. */
const SCALE_TO_PLANE = 0.75;
const GREY: Rgb = [0.5, 0.5, 0.5];

interface TrailPoint {
  readonly x: number;
  readonly y: number;
  readonly at: number;
}

interface MoltenState {
  trail: TrailPoint[];
  sampledAt: number;
  x: number;
  y: number;
  presence: number;
}

/**
 * 熔融金属: 旋涡扭曲的分形高度场, 脊线与屏幕导数法线出金属光泽, 沿调色板取色;
 * 指针拖尾 (16 点, 0.06 秒采样, 0.9 秒寿命) 与点击耀斑 (1.8 秒) 把金属烧到芯色. 减弱动效只画一帧, 不加热.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-fluid.md
 */
export function MoltenMetal(props: MoltenMetalProps): JSX.Element {
  const {
    colors = DEFAULT_COLORS, coreColor = "foreground", backgroundColor = "background", transparent = false, lightMode = false, scale = DEFAULT_SCALE,
    detail = DEFAULT_DETAIL, glow = DEFAULT_GLOW, thickness = 1, swirl = 1, turbulence = DEFAULT_TURBULENCE, haze = DEFAULT_HAZE, brightness = DEFAULT_BRIGHTNESS,
    colorMode = "molten", rotation = 0, offsetX = 0, offsetY = 0, drift = DEFAULT_DRIFT, grain = DEFAULT_GRAIN, intro = true, mouseStrength = DEFAULT_STRENGTH,
    flareOnClick = true, speed = DEFAULT_SPEED, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon({ ...common, speed });
  const palette = (colors.length > 0 ? colors : DEFAULT_COLORS).slice(0, MOLTEN_MAX_COLORS);
  const state = useRef<MoltenState>({ trail: [], sampledAt: -1, x: 0.5, y: 0.5, presence: 0 });

  const trailOf = (frame: BackdropFrame): number[] => {
    const s = state.current;
    const { pointer, elapsed } = frame;
    if (frame.reduced) {
      s.trail = [];
      s.presence = 0;
    } else {
      s.presence = approach(s.presence, pointer.inside ? 1 : 0, frame.dt, MOLTEN_PRESENCE_TAU);
      s.x = approach(s.x, pointer.x, frame.dt, MOLTEN_FOLLOW_TAU);
      s.y = approach(s.y, pointer.y, frame.dt, MOLTEN_FOLLOW_TAU);
      if (pointer.inside && elapsed - s.sampledAt >= MOLTEN_SAMPLE_SECONDS) {
        s.sampledAt = elapsed;
        s.trail = [...s.trail, { x: pointer.x, y: pointer.y, at: elapsed }].slice(-MOLTEN_TRAIL);
      }
    }
    const list = new Array<number>(MOLTEN_TRAIL * 4).fill(0);
    s.trail.forEach((point, i) => {
      list[i * 4] = point.x;
      list[i * 4 + 1] = point.y;
      list[i * 4 + 2] = moltenTrailWeight(elapsed - point.at) * 0.6;
    });
    return list;
  };

  const flaresOf = (frame: BackdropFrame): number[] => {
    const list = new Array<number>(MOLTEN_MAX_FLARES * 4).fill(0);
    if (!flareOnClick || frame.reduced) return list;
    frame.pointer.taps.slice(-MOLTEN_MAX_FLARES).forEach((tap, i) => {
      const age = frame.elapsed - tap.at;
      list[i * 4] = tap.x;
      list[i * 4 + 1] = tap.y;
      list[i * 4 + 2] = age;
      list[i * 4 + 3] = moltenFlare(age);
    });
    return list;
  };

  const handle = useShaderBackdrop(
    {
      fragment: MOLTEN_FRAGMENT,
      uniforms: (frame) => {
        const ramp = palette.flatMap((_, i) => [...(frame.colors[i] ?? GREY)]);
        const trail = trailOf(frame);
        const s = state.current;
        return {
          u_colors: { list: [...ramp, ...new Array<number>((MOLTEN_MAX_COLORS - palette.length) * 3).fill(0)], size: 3 },
          u_color_count: palette.length,
          u_core: frame.colors[palette.length] ?? GREY,
          u_bg: frame.colors[palette.length + 1] ?? GREY,
          u_bg_alpha: transparent ? 0 : 1,
          u_scale: scale * SCALE_TO_PLANE,
          u_detail: Math.max(1, Math.min(6, Math.round(detail))),
          u_glow: glow,
          u_thick: thickness,
          u_swirl: swirl,
          u_turb: turbulence,
          u_haze: haze,
          u_bright: brightness,
          u_balance: MOLTEN_BALANCE[colorMode] ?? MOLTEN_BALANCE.molten,
          u_rotation: rotation,
          u_offset: [offsetX, offsetY],
          u_drift: drift,
          u_grain: grain,
          u_trail: { list: trail, size: 4 },
          u_flares: { list: flaresOf(frame), size: 4 },
          u_hot: [s.x, s.y, s.presence * 0.5, frame.reduced ? 0 : mouseStrength * 2],
          u_reveal: [0, moltenReveal(frame.elapsed, intro && !frame.reduced)],
          u_light: lightMode,
        };
      },
    },
    { ...options, colors: [...palette, coreColor, backgroundColor] },
  );

  return (
    <BackdropShell handle={handle} fallback={glowFallback(backgroundColor, palette[0] ?? "primary")} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
