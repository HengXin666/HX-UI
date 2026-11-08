"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 AeroShards 条目, 实现为 HX 自有.
// ENGINE-GAP: 上游是 WebGPU 3D 实例化玻璃碎片 (约 1300 片) 加真折射, 深度排序遮挡与 4 级泛光; 内核只有 WebGL2 全屏片元, 本件在 JS 里积分至多 24 片 (FLOATS) 并以 uniform 数组传入, 片元逐片求平面剪影, 折射以磨边法线偏移取背景近似, 泛光只做一级宽光晕, 无片间投影与真实厚度.

import { useRef, type JSX } from "react";
import { BackdropShell, glowFallback, splitCommon, useShaderBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import {
  AERO, MARKER_STYLES, MATERIALS, makeShards, packShards, pulseShards, ringList, stepShards,
  type AeroShardsMarkers, type AeroShardsMaterial, type AeroShardsPlacement, type Shard,
} from "./aero-shards-field";
import { AERO_SHARDS_FRAGMENT } from "./aero-shards-shader";
import { follow, HALF, introProgress } from "./tokens";

export interface AeroShardsProps extends BackdropCommonProps {
  /** 碎片主色 (token 名或 CSS 颜色), 默认 primary. */
  readonly shardColor?: string;
  /** 强调色: 光晕, 点击环与色相混合, 默认 accent. */
  readonly accentColor?: string;
  /** 背景色, 默认 transparent (只画碎片与光晕). */
  readonly backgroundColor?: string;
  /** 高光与磨边用的墨色, 默认 foreground. */
  readonly inkColor?: string;
  /** 亮色模式: 背景压亮, 碎片偏暗. */
  readonly lightMode?: boolean;
  /** 摆位: full 铺满 / center 居中 / left 靠左 / right 靠右. */
  readonly placement?: AeroShardsPlacement;
  /** 材质: glass 清玻璃 / frosted 磨砂 / crystal 强折射. */
  readonly material?: AeroShardsMaterial;
  /** 碎片数, 默认 24, 上限 24 (FLOATS). */
  readonly count?: number;
  /** 碎片尺寸倍率, 默认 1. */
  readonly shardSize?: number;
  /** 铺开范围倍率, 默认 1. */
  readonly spread?: number;
  /** 自转倍率, 默认 1. */
  readonly twist?: number;
  /** 漂浮起伏倍率, 默认 1. */
  readonly billow?: number;
  /** 整体缩放, 默认 1. */
  readonly scale?: number;
  /** 景深强度 (离对焦距离越远越虚), 默认 0.75. */
  readonly depthOfField?: number;
  /** 光晕强度, 默认 0.35. */
  readonly glow?: number;
  /** 胶片颗粒, 默认 0.06. */
  readonly grain?: number;
  /** 暗角, 默认 0.3 (透明背景时不生效). */
  readonly vignette?: number;
  /** 入场: 3.4 秒错峰升起淡入, 默认 true. */
  readonly intro?: boolean;
  /** 指针排斥强度, 默认 0.6. */
  readonly mouseStrength?: number;
  /** 漂浮标记: plus 十字 / dots 双点 / none. */
  readonly markers?: AeroShardsMarkers;
  /** 点击推开碎片并放出光环, 默认 true. */
  readonly pulseOnClick?: boolean;
  /** 按住把碎片聚到指针处 (弹簧变软), 默认 true. */
  readonly holdToGather?: boolean;
  /** 指针带动镜头视差, 默认 0.5. */
  readonly parallax?: number;
}

interface Core {
  shards: Shard[];
  key: string;
  camX: number;
  camY: number;
  seen: number;
  clock: number;
}

const SEED = 4127;
const TRANSPARENT = "transparent";
/** 本库定: 视差最大横移 (世界单位), 镜头跟随 0.4s. */
const PARALLAX_REACH = 0.6;
const CAMERA_TAU = 0.4;

/**
 * 漂浮玻璃碎片: 一群带磨边的玻璃片在景深里缓缓漂浮自转, 横向移动时横滚; 指针排斥并带镜头视差, 点击把附近碎片推开并放出光环,
 * 按住时碎片顺着变软的弹簧聚到指针处, 松手散回. 背景上漂着十字或点状标记. 减弱动效时只画一帧.
 */
export function AeroShards(props: AeroShardsProps): JSX.Element {
  const {
    shardColor = "primary", accentColor = "accent", backgroundColor = TRANSPARENT, inkColor = "foreground", lightMode = false, placement = "full",
    material = "glass", count = AERO.floats, shardSize = 1, spread = 1, twist = 1, billow = 1, scale = 1, depthOfField = 0.75, glow = 0.35,
    grain = 0.06, vignette = 0.3, intro = true, mouseStrength = 0.6, markers = "plus", pulseOnClick = true, holdToGather = true, parallax = 0.5,
    ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const core = useRef<Core>({ shards: [], key: "", camX: 0, camY: 0, seen: -1, clock: 0 });
  const opaque = backgroundColor !== TRANSPARENT;
  const speed = options.speed ?? 1;

  const uniforms = (frame: BackdropFrame) => {
    const { width, height } = frame.fit;
    const aspect = height > 0 ? width / height : 1;
    const c = core.current;
    const key = `${count}|${spread}|${shardSize}|${placement}|${aspect.toFixed(3)}`;
    if (c.key !== key) {
      c.shards = makeShards({ count, aspect, spread, size: shardSize, placement, seed: SEED + Math.round(count) });
      c.key = key;
    }
    const p = frame.pointer;
    const live = !frame.reduced && frame.dt > 0;
    const zoom = Math.max(0.1, scale);
    const px = (p.x - HALF) * 2 * aspect / zoom;
    const py = (p.y - HALF) * 2 / zoom;
    if (live) {
      const f = follow(frame.dt, CAMERA_TAU);
      c.camX += ((p.x - HALF) * 2 * parallax * PARALLAX_REACH * p.presence - c.camX) * f;
      c.camY += ((p.y - HALF) * 2 * parallax * PARALLAX_REACH * HALF * p.presence - c.camY) * f;
      for (const tap of p.taps) {
        if (tap.at <= c.seen) continue;
        c.seen = tap.at;
        if (pulseOnClick) pulseShards(c.shards, (tap.x - HALF) * 2 * aspect / zoom, (tap.y - HALF) * 2 / zoom);
      }
      c.clock += frame.dt * speed;
      const hold = holdToGather && p.down && p.inside ? 1 : 0;
      stepShards(c.shards, frame.dt * speed, { time: c.clock, hold, px, py, presence: p.inside ? p.presence : 0, mouseStrength, billow, twist });
    }
    const packed = packShards(c.shards, { camX: c.camX, camY: c.camY, elapsed: frame.elapsed, intro });
    const sa = packed.a.map((v, i) => (i % 4 === 2 ? v : v * zoom));
    const col = frame.colors;
    const at = (i: number): [number, number, number] => {
      const v = col[i];
      return v ? [v[0], v[1], v[2]] : [HALF, HALF, HALF];
    };
    return {
      u_sa: { list: sa, size: 4 as const },
      u_sb: { list: packed.b, size: 4 as const },
      u_count: packed.count,
      u_rings: { list: pulseOnClick ? ringList(p.taps, frame.elapsed) : new Float32Array(AERO.maxRings * 4), size: 4 as const },
      u_shard: at(0),
      u_accent: at(1),
      u_ink: at(2),
      u_bg: at(3),
      u_bg_alpha: opaque ? 1 : 0,
      u_light: lightMode ? 1 : 0,
      u_material: [...(MATERIALS[material] ?? MATERIALS.glass)],
      u_dof: Math.max(0, depthOfField),
      u_glow: Math.max(0, glow),
      u_grain: Math.max(0, grain),
      u_vignette: Math.max(0, vignette),
      u_markers: MARKER_STYLES[markers] ?? MARKER_STYLES.plus,
      u_intro: introProgress(frame.elapsed, AERO.introSeconds * HALF, intro && !frame.reduced),
      u_cam: [c.camX, c.camY],
    };
  };

  const handle = useShaderBackdrop(
    { fragment: AERO_SHARDS_FRAGMENT, uniforms },
    { ...options, colors: [shardColor, accentColor, inkColor, opaque ? backgroundColor : "background"] },
  );
  return (
    <BackdropShell handle={handle} fallback={glowFallback(opaque ? backgroundColor : "background", shardColor)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
