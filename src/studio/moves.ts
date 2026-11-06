import { TILE_LAYOUT } from "../constants/blocks-commerce-v107";
import { MOTION_TIMING, ROTATE_TRIGGER } from "../constants/motion";
import {
  F035,
  F042,
  F045,
  F062,
  F098,
  F102,
  F104,
  F106,
  F107,
  F26,
  GAP,
  N2,
  N8,
  N10,
  N12,
  N16,
  N18,
  N22,
  N28,
  N32,
  N120,
  N3,
  N36,
  PATH_L,
  PATH_M,
} from "./num";

/**
 * 镜头语言的节拍, 运镜与景深. 组件只读这些取值, 不在 JSX 里另写时长.
 *
 * 时长故意长于 --duration-*: 那组令牌服务控件微交互.
 * 镜头弧线要对着读完, 开场主体约三秒, 落定后停住.
 *
 * .agents/notes/implemented/feature/2026-11-06-studio-shot-language.md
 */
export const SHOT_MOVE = {
  hold: "hold",
  dolly: "dolly",
  rise: "rise",
  pan: "pan",
  glide: "glide",
} as const;

export const SHOT_PACE = {
  even: TILE_LAYOUT.even,
  deal: "deal",
} as const;

export const SHOT_DEPTH = {
  back: "back",
  subject: "subject",
  front: "front",
} as const;

export const SHOT_DRIVE = {
  view: "view",
  scroll: ROTATE_TRIGGER.scroll,
} as const;

export const SHOT_DURATION_KIND = {
  beat: "beat",
  arc: "arc",
  emphasized: MOTION_TIMING.emphasized,
} as const;

export type ShotMove = (typeof SHOT_MOVE)[keyof typeof SHOT_MOVE];
export type ShotPace = (typeof SHOT_PACE)[keyof typeof SHOT_PACE];
export type ShotDepth = (typeof SHOT_DEPTH)[keyof typeof SHOT_DEPTH];
export type ShotDrive = (typeof SHOT_DRIVE)[keyof typeof SHOT_DRIVE];
export type ShotDurationKind = (typeof SHOT_DURATION_KIND)[keyof typeof SHOT_DURATION_KIND];

/** 一拍 (秒). 均匀编排用它做间隔. */
export const SHOT_BEAT_S = F042;

/** 开场主体弧线 (秒). 推近, 停住, 让人读完一句标题. */
export const SHOT_ARC_S = F26;

/** 发牌节奏的最短间隔占一拍的比例. 后段加速, 但不挤到看不清. */
export const SHOT_DEAL_FLOOR = F035;

/** 视口露出比例, 到了再开拍. */
export const SHOT_VIEWPORT_AMOUNT = F045;

/** 镜头变换原点: 略低于几何中心, 推近时主体留在画面上三分之一. */
export const SHOT_ORIGIN = "50% 42%";

/** 滚动镜头的进度采样点: 入画, 正中落幅, 出画. */
export const SHOT_SCROLL_RANGE = [0, F062, 1] as const;

export interface ShotFrame {
  opacity: number;
  x?: number;
  y?: number;
  scale?: number;
  rotateY?: number;
}

/** 入画. 位移只走 transform, 不改布局. */
export const SHOT_HIDDEN: Record<ShotMove, ShotFrame> = {
  hold: { opacity: 0 },
  dolly: { opacity: 0, scale: F106, y: N12 },
  rise: { opacity: 0, y: N18 },
  pan: { opacity: 0, x: N32 },
  glide: { opacity: 0, rotateY: -N8 - 1, scale: F098, y: N8 },
};

/** 落幅. 侧向机位最后回到正视, 文字保持可读 (shotcraft Q6). */
export const SHOT_SHOWN: Record<ShotMove, ShotFrame> = {
  hold: { opacity: 1 },
  dolly: { opacity: 1, scale: 1, y: 0 },
  rise: { opacity: 1, y: 0 },
  pan: { opacity: 1, x: 0 },
  glide: { opacity: 1, rotateY: 0, scale: 1, y: 0 },
};

/** 哪种运镜用多长. dolly / glide 走完整弧线, 其余走强调时长或一拍. */
export const SHOT_DURATION: Record<ShotMove, ShotDurationKind> = {
  hold: SHOT_DURATION_KIND.beat,
  dolly: SHOT_DURATION_KIND.arc,
  rise: SHOT_DURATION_KIND.emphasized,
  pan: SHOT_DURATION_KIND.emphasized,
  glide: SHOT_DURATION_KIND.arc,
};

/** 景深层在滚动进度 0 与 1 的纵向位移 (px). 主体几乎不动, 背景让出深度. */
export const SHOT_DEPTH_FROM: Record<ShotDepth, number> = {
  back: N36,
  subject: N8,
  front: -N12 - N2,
};

export const SHOT_DEPTH_TO: Record<ShotDepth, number> = {
  back: -N22,
  subject: 0,
  front: N16,
};

/** 入场景深: 各层从这里落到 0. 主体行程最短. */
export const SHOT_DEPTH_ENTER: Record<ShotDepth, ShotFrame> = {
  back: { opacity: 0, y: N28, scale: F104 },
  subject: { opacity: 0, y: N10, scale: F102 },
  front: { opacity: 0, y: -N12, scale: F098 },
};

export const SHOT_DEPTH_REST: ShotFrame = { opacity: 1, y: 0, scale: 1 };

/** 滚动推近的缩放. 两端略大于 1, 正中落成 1, 没有来回抖动. */
export const SHOT_DOLLY_SCALE = [F107, 1, 1] as const;

/** 透视距离. 只给 glide, 不把整页做成 3D 场景. */
export const SHOT_PERSPECTIVE = "880px";

/** 折线画布. */
export const SPARK_BOX = { width: N120, height: N36, pad: N3 } as const;

/**
 * 子项入场延迟 (秒).
 * even: 等间隔.
 * deal: 间隔逐项变短 (shotcraft R2, 发牌加速), 末项仍留出 SHOT_DEAL_FLOOR.
 */
export function dealDelay(index: number, count: number, pace: ShotPace): number {
  if (count <= 1 || index <= 0) return 0;
  if (pace === SHOT_PACE.even) return index * SHOT_BEAT_S;
  let elapsed = 0;
  for (let step = 0; step < index; step += 1) {
    const remaining = 1 - step / count;
    elapsed += SHOT_BEAT_S * Math.max(remaining, SHOT_DEAL_FLOOR);
  }
  return elapsed;
}

/** 把一组数值收成一条折线的 d. 点数不足时返回空串, 调用方不画. */
export function sparkPath(values: readonly number[]): string {
  if (values.length < N2) return "";
  let min = values[0] ?? 0;
  let max = min;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const span = max - min || 1;
  const innerW = SPARK_BOX.width - SPARK_BOX.pad * N2;
  const innerH = SPARK_BOX.height - SPARK_BOX.pad * N2;
  return values
    .map((value, index) => {
      const x = SPARK_BOX.pad + (index / (values.length - 1)) * innerW;
      const y = SPARK_BOX.pad + (1 - (value - min) / span) * innerH;
      return `${index === 0 ? PATH_M : PATH_L}${x.toFixed(N2)}${GAP}${y.toFixed(N2)}`;
    })
    .join(GAP);
}
