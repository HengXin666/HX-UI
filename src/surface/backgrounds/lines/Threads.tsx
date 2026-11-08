// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Threads 条目, 实现为 HX 自有.
"use client";

import { useRef, type CSSProperties, type JSX } from "react";
import { approach, BackdropShell, fallbackGradient, splitCommon, useShaderBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import { THREADS_FOLLOW_TAU, THREADS_FRAGMENT, THREADS_MAX_LINES, THREADS_PRESENCE_TAU } from "./threads-shader";
import { clampCount, createFollowPointer, DEG, LINE_GREY, stepFollow } from "./tokens";

/** 条目默认速度 0.6, 作为本件 speed 的默认值. */
const DEFAULT_SPEED = 0.6;

export interface ThreadsProps extends BackdropCommonProps {
  /** 线色 (token 名或 CSS 颜色), 默认 foreground. */
  readonly color?: string;
  /** 外侧线渐变到的强调色, 默认 primary. */
  readonly accentColor?: string;
  /** 波动振幅, 默认 1.7. */
  readonly amplitude?: number;
  /** 线束张开的总宽 (画布短边比例), 默认 0.4. */
  readonly distance?: number;
  /** 线数, 1..128, 默认 90. */
  readonly lineCount?: number;
  /** 线粗倍率, 默认 0.6. */
  readonly thickness?: number;
  /** 外侧线的虚化倍率, 默认 1.3. */
  readonly softness?: number;
  /** 波数 (沿线的起伏频率), 默认 1.05. */
  readonly waves?: number;
  /** 汇聚点位置 (横向 0..1), 之前线束收拢, 默认 0.04. */
  readonly split?: number;
  /** 线与线之间的离散程度, 默认 0.5. */
  readonly fray?: number;
  /** 线束旋转 (度), 默认 25. */
  readonly angle?: number;
  /** 噪声种子, 默认 0. */
  readonly seed?: number;
  /** 指针拨开线束的强度, 0 关闭, 默认 0. */
  readonly parting?: number;
  /** 外侧线的透明收尾, 默认 0.85. */
  readonly taper?: number;
  /** 亮度倍率, 默认 1.4. */
  readonly brightness?: number;
  /** 左右两端淡出宽度 (横向比例), 默认 0. */
  readonly fade?: number;
  /** 宿主的混合模式. */
  readonly mixBlendMode?: CSSProperties["mixBlendMode"];
}

/**
 * 丝线: 一束从汇聚点散开的噪声曲线, 外侧更细更虚更淡, 慢慢起伏; parting 大于 0 时指针把线束拨开.
 * WebGL2 全屏片元; 减弱动效只画一帧, WebGL 不可用时铺渐变兜底.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
export function Threads(props: ThreadsProps): JSX.Element {
  const {
    color = "foreground", accentColor = "primary", amplitude = 1.7, distance = 0.4, lineCount = 90, thickness = 0.6, softness = 1.3, waves = 1.05,
    split = 0.04, fray = 0.5, angle = 25, seed = 0, parting = 0, taper = 0.85, brightness = 1.4, fade = 0, mixBlendMode, style, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const follow = useRef(createFollowPointer());
  const presence = useRef(0);
  const pointerOn = options.pointer !== false && parting > 0;

  const uniforms = (frame: BackdropFrame) => {
    const f = stepFollow(follow.current, frame, THREADS_FOLLOW_TAU, pointerOn);
    const target = pointerOn && frame.pointer.inside ? 1 : 0;
    presence.current = frame.still ? target : approach(presence.current, target, frame.dt, THREADS_PRESENCE_TAU);
    return {
      u_ink: frame.colors[0] ?? LINE_GREY,
      u_accent: frame.colors[1] ?? frame.colors[0] ?? LINE_GREY,
      u_count: clampCount(lineCount, THREADS_MAX_LINES),
      u_amp: amplitude,
      u_dist: distance,
      u_thick: thickness,
      u_soft: softness,
      u_waves: waves,
      u_split: split,
      u_fray: fray,
      u_angle: angle * DEG,
      u_seed: seed,
      u_part: [f.x, f.y, presence.current * parting],
      u_taper: taper,
      u_bright: brightness,
      u_fade: fade,
    };
  };

  const handle = useShaderBackdrop(
    { fragment: THREADS_FRAGMENT, uniforms },
    { ...options, pointer: pointerOn, speed: options.speed ?? DEFAULT_SPEED, colors: [color, accentColor] },
  );
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient([color, accentColor])} opacity={opacity} style={{ mixBlendMode, ...style }} {...rest}>
      {children}
    </BackdropShell>
  );
}
