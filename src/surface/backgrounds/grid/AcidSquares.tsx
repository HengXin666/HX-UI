"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 AcidSquares 条目, 实现为 HX 自有.
// ENGINE-GAP: 上游是实例化三维网格 (MESH 150 / 210 / 280 细分, uViewProj 投影), 内核只有全屏片元;
// 这里改成逐像素视线步进方柱高度场, quality 只换步进上限 (48 / 72 / 96), 柱高按格取样不做柱面内细分形变,
// 远处格子挤密时混向平均色代替网格 LOD; 柱子无底, 底面只作暗影.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import { clamp } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import {
  ACID_HOVER, ACID_LIGHTING, ACID_PULSE_ORIGINS, ACID_QUALITY, ACID_SHAPES, ACID_SQUARES, heightReach, introSwell, orbitCamera, revealFront,
  springStep, type AcidHover, type AcidLighting, type AcidPulseOrigin, type AcidQuality, type AcidShape, type Spring2,
} from "./acid-squares-motion";
import { ACID_SQUARES_FRAGMENT } from "./acid-squares-shader";
import { enumOf, follow, rgbAt, type Follower } from "./tokens";

export interface AcidSquaresProps extends BackdropCommonProps {
  /** 柱身底色, token 名或 CSS 颜色, 默认 muted. */
  readonly color?: string;
  /** 主光色, 默认 primary. */
  readonly accentColor?: string;
  /** 副光色 (分光打光的另一侧), 默认 accent. */
  readonly secondaryColor?: string;
  /** 瓦片大小倍率, 越大画面里格子越少, 默认 1. */
  readonly tileSize?: number;
  /** 柱间缝隙 (占格宽比例 0..0.8), 默认 0.12. */
  readonly gap?: number;
  /** 竖边圆角 0..1, 默认 0.25. */
  readonly roundness?: number;
  /** 顶边倒角柔和度 0..1, 默认 0.5. */
  readonly softness?: number;
  /** 柱顶隆起, 默认 0.3. */
  readonly bulge?: number;
  /** 相机绕竖轴旋转 (度), 默认 35. */
  readonly rotation?: number;
  /** 光泽 0..1: 高光锐度与菲涅尔强度, 默认 0.6. */
  readonly gloss?: number;
  /** 波幅, 默认 1. */
  readonly waves?: number;
  /** 波的空间频率倍率, 默认 1. */
  readonly waveScale?: number;
  /** 波的流动速度 (规格的 speed 与公共时钟倍率同名, 改名), 默认 0.6. */
  readonly waveSpeed?: number;
  /** 柱截面: square / circle. */
  readonly shape?: AcidShape;
  /** 外扩脉冲环强度, 0 关闭, 默认 1. */
  readonly pulse?: number;
  /** 脉冲环外扩速度 (每秒环数), 默认 0.45. */
  readonly pulseSpeed?: number;
  /** 脉冲环间距倍率, 默认 1. */
  readonly pulseSpacing?: number;
  /** 脉冲环宽度倍率, 默认 1. */
  readonly pulseWidth?: number;
  /** 脉冲起点: 场中心或指针. */
  readonly pulseOrigin?: AcidPulseOrigin;
  /** 整体亮度, 默认 1. */
  readonly brightness?: number;
  /** 打光: split 主副两色分光, mono 只用主光色. */
  readonly lighting?: AcidLighting;
  /** 俯仰 0..1 (0 贴地平视, 1 近乎俯视), 默认 0.7. */
  readonly tilt?: number;
  /** 缩放, 默认 1. */
  readonly zoom?: number;
  /** 透视深度 (眼距, 越大越接近平行投影), 默认 10. */
  readonly depth?: number;
  /** 悬停: press 压下 / lift 抬起 / none. */
  readonly hoverEffect?: AcidHover;
  /** 首帧起由中心逐格升起并回落隆起. */
  readonly intro?: boolean;
  /** 步进质量档 low / medium / high. */
  readonly quality?: AcidQuality;
}

/** 每帧跟随的运动状态. */
export interface AcidMotion {
  hover: Spring2;
  look: Spring2;
  presence: Follower;
}

export function makeAcidMotion(): AcidMotion {
  return { hover: { x: 0.5, y: 0.5, vx: 0, vy: 0 }, look: { x: 0, y: 0, vx: 0, vy: 0 }, presence: { value: 0 } };
}

/**
 * 推进悬停点 (弹簧 90 / 19 追指针), 视角 (弹簧 30 / 11 随指针轻偏) 与悬停在场 (tau 0.35 / 0.6).
 *
 * @param m 原地修改的运动状态.
 * @param frame 帧长与指针.
 * @param interactive 是否响应悬停.
 */
export function stepAcidMotion(m: AcidMotion, frame: Pick<BackdropFrame, "dt" | "pointer">, interactive: boolean): AcidMotion {
  const { dt, pointer: p } = frame;
  const engaged = interactive && p.inside;
  const S = ACID_SQUARES;
  springStep(m.hover, p.x, p.y, dt, S.hoverStiffness, S.hoverDamping);
  springStep(m.look, engaged ? (p.x - 0.5) * 0.12 : 0, engaged ? (p.y - 0.5) * 0.12 : 0, dt, S.lookStiffness, S.lookDamping);
  follow(m.presence, engaged ? 1 : 0, dt, S.hoverRise, S.hoverFall);
  return m;
}

/**
 * 酸性方柱阵列: 方 / 圆截面的柱子排满地面, 三列正弦波起伏, 外扩脉冲环与点击涟漪推高柱顶,
 * 悬停处按下或抬起, 两盏绕场缓转的点光分光着色并带菲涅尔与光泽高光, 远处淡出;
 * 入场由中心逐格升起 (2.6 秒) 并从隆起回落 (3 秒).
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-grid.md
 */
export function AcidSquares(props: AcidSquaresProps): JSX.Element {
  const {
    color = "muted", accentColor = "primary", secondaryColor = "accent", tileSize = 1, gap = 0.12, roundness = 0.25, softness = 0.5, bulge = 0.3,
    rotation = 35, gloss = 0.6, waves = 1, waveScale = 1, waveSpeed = 0.6, shape = "square", pulse = 1, pulseSpeed = 0.45, pulseSpacing = 1,
    pulseWidth = 1, pulseOrigin = "center", brightness = 1, lighting = "split", tilt = 0.7, zoom = 1, depth = 10, hoverEffect = "press",
    intro = true, quality = "medium", ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const motion = useRef<AcidMotion>(makeAcidMotion());

  const uniforms = (frame: BackdropFrame) => {
    const m = stepAcidMotion(motion.current, frame, hoverEffect !== "none");
    const cam = orbitCamera({ rotation, tilt, zoom, tileSize, depth, look: [m.look.x, m.look.y] });
    const swell = introSwell(frame.elapsed, intro);
    const [front, done] = revealFront(frame.elapsed, intro);
    const aspect = frame.fit.width / Math.max(frame.fit.height, 1);
    const reach = cam.viewHalf * Math.max(aspect, 1);
    return {
      u_base: rgbAt(frame.colors, 0),
      u_accent: rgbAt(frame.colors, 1),
      u_second: rgbAt(frame.colors, 2),
      u_eye: cam.eye,
      u_fwd: cam.forward,
      u_right: cam.right,
      u_up: cam.up,
      u_focal: cam.focal,
      u_half: 0.5 * (1 - clamp(gap, 0, 0.8)),
      u_round: clamp(roundness, 0, 1),
      u_soft: clamp(softness, 0, 1),
      u_bulge: bulge,
      u_shape: enumOf(ACID_SHAPES, shape),
      u_gloss: clamp(gloss, 0, 1),
      u_wave: [waves, Math.max(0.05, waveScale), frame.time * waveSpeed, heightReach({ waves, pulse, bulge, swell, hover: hoverEffect !== "none" })],
      u_pulse: [pulse, Math.max(0.1, pulseSpacing), Math.max(0.1, pulseWidth), frame.time * pulseSpeed],
      u_pulse_origin: enumOf(ACID_PULSE_ORIGINS, pulseOrigin),
      u_hover: [m.hover.x, m.hover.y, m.presence.value, enumOf(ACID_HOVER, hoverEffect)],
      u_reveal: [front, done, swell, frame.time * ACID_SQUARES.lightRate],
      u_range: [reach * 1.1, reach * 2.2],
      u_bright: Math.max(0, brightness),
      u_mono: enumOf(ACID_LIGHTING, lighting),
      u_steps: ACID_QUALITY[quality] ?? ACID_QUALITY.medium,
    };
  };

  const handle = useShaderBackdrop({ fragment: ACID_SQUARES_FRAGMENT, uniforms }, { ...options, colors: [color, accentColor, secondaryColor] });
  return (
    <BackdropShell handle={handle} fallback={glowFallback(color, accentColor)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
