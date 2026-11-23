/**
 * Stage 的镜头数据: 一个镜头 (Shot) 就是一组相机参数, 运动 (StageMotion) 是镜头的关键帧.
 * 全是纯数据, 可以 JSON 存取, 也方便 AI 直接写.
 */

export interface Shot {
  /** 左右转, 度. 负数看到右侧面 */
  yaw: number;
  /** 俯仰, 度. 正数从上往下看 */
  pitch: number;
  /** 画面倾斜, 度 */
  roll: number;
  /** 推拉 (缩放), 1 为默认 */
  zoom: number;
  /** 平移, 占舞台宽度的比例. 正数把场景往右推, 也就是看左边 */
  x: number;
  /** 平移, 占舞台高度的比例. 正数把场景往下推, 也就是看上边 */
  y: number;
  /** 焦距: 透视距离 = lens × 舞台宽度. 小是广角 (透视强), 大是长焦 (更平) */
  lens: number;
  /** 景深焦点所在的深度, 配合屏幕的 depth 使用 */
  focus: number;
  /** 移轴: 上下边缘虚化的强度, 0–1 */
  tilt: number;
}

export const DEFAULT_SHOT: Shot = { yaw: 0, pitch: 0, roll: 0, zoom: 1, x: 0, y: 0, lens: 1.6, focus: 0, tilt: 0 };

export type ShotInput = Partial<Shot> | ShotName;

/** 内置镜头. 名字是英文 id, label 给界面用 */
export const SHOTS = {
  center: { label: "正面", shot: {} },
  turn: { label: "微转", shot: { yaw: -9, pitch: 4 } },
  hero: { label: "主视角", shot: { yaw: -18, pitch: 12, zoom: 0.94 } },
  low: { label: "低机位", shot: { yaw: 8, pitch: -14, y: -0.03 } },
  top: { label: "俯视", shot: { pitch: 36, zoom: 0.95 } },
  flatlay: { label: "平铺", shot: { pitch: 58, roll: -8, zoom: 1.02 } },
  side: { label: "侧面", shot: { yaw: -50, pitch: 6, zoom: 0.92, x: 0.03 } },
  dutch: { label: "荷兰角", shot: { yaw: -14, pitch: 8, roll: -8, zoom: 1.04 } },
  iso: { label: "等距", shot: { pitch: 54, roll: -40, zoom: 0.78 } },
  far: { label: "远景", shot: { yaw: -12, pitch: 8, zoom: 0.62 } },
  wide: { label: "广角", shot: { yaw: -32, pitch: 6, lens: 0.75, zoom: 0.86 } },
  tele: { label: "长焦", shot: { yaw: -32, pitch: 6, lens: 4.5 } },
  macro: { label: "特写", shot: { yaw: -12, pitch: 10, zoom: 2.3, x: 0.3, y: 0.22 } },
  topbar: { label: "顶栏", shot: { pitch: 18, zoom: 2, y: 0.46 } },
  leftEdge: { label: "左缘", shot: { yaw: 30, zoom: 1.55, x: 0.4 } },
  rightEdge: { label: "右缘", shot: { yaw: -30, zoom: 1.55, x: -0.4 } },
  corner: { label: "右下角", shot: { yaw: -20, pitch: -10, zoom: 1.9, x: -0.3, y: -0.22 } },
  tiltShift: { label: "移轴", shot: { yaw: -22, pitch: 32, zoom: 1.25, tilt: 0.8 } },
  rack: { label: "低角仰视", shot: { yaw: -6, pitch: -26, zoom: 0.9, y: -0.06, lens: 1.1 } },
} satisfies Record<string, { label: string; shot: Partial<Shot> }>;

export type ShotName = keyof typeof SHOTS;

export function resolveShot(s: ShotInput | undefined): Shot {
  if (!s) return { ...DEFAULT_SHOT };
  if (typeof s === "string") return { ...DEFAULT_SHOT, ...(SHOTS[s]?.shot ?? {}) };
  return { ...DEFAULT_SHOT, ...s };
}

export type StageEase = "linear" | "inOut" | "out" | "in" | "back";

export interface StageKeyframe {
  /** 在整段里的位置, 0–1 */
  at: number;
  shot: ShotInput;
  /** 从上一帧走到这一帧的缓动 */
  ease?: StageEase;
}

export interface StageMotion {
  keyframes: StageKeyframe[];
  /** 整段时长, 秒 */
  duration: number;
  /** 循环: true 从头再来, "pingpong" 来回 */
  loop?: boolean | "pingpong";
  /** 开始前等多久, 秒 */
  delay?: number;
}

export type MotionInput = StageMotion | MotionName | "none";

const kf = (at: number, shot: ShotInput, ease: StageEase = "inOut"): StageKeyframe => ({ at, shot, ease });

/** 内置运镜 */
export const MOTIONS = {
  float: { label: "悬浮", motion: { duration: 6, loop: "pingpong", keyframes: [kf(0, { yaw: -12, pitch: 8, y: 0.012 }), kf(1, { yaw: -6, pitch: 4, y: -0.012 })] } },
  orbit: { label: "环绕", motion: { duration: 9, loop: "pingpong", keyframes: [kf(0, { yaw: -34, pitch: 12, zoom: 0.9 }), kf(1, { yaw: 34, pitch: 12, zoom: 0.9 })] } },
  pushIn: { label: "推近", motion: { duration: 3.4, keyframes: [kf(0, { yaw: -24, pitch: 18, zoom: 0.55 }), kf(1, "hero", "out")] } },
  glide: { label: "横移", motion: { duration: 7, loop: "pingpong", keyframes: [kf(0, { yaw: -18, pitch: 8, x: 0.07 }), kf(1, { yaw: -4, pitch: 4, x: -0.07 })] } },
  reveal: { label: "立起", motion: { duration: 2.8, keyframes: [kf(0, { pitch: 62, roll: -10, zoom: 0.8, y: 0.06 }), kf(1, "turn", "out")] } },
  tour: {
    label: "巡游",
    motion: {
      duration: 14,
      loop: true,
      keyframes: [kf(0, "hero"), kf(0.16, "hero"), kf(0.3, "macro"), kf(0.42, "macro"), kf(0.56, "topbar"), kf(0.66, "topbar"), kf(0.8, "rightEdge"), kf(0.88, "rightEdge"), kf(1, "hero")],
    },
  },
  focusPull: { label: "拉焦", motion: { duration: 6, loop: "pingpong", keyframes: [kf(0, { yaw: -24, pitch: 10, zoom: 0.9, focus: -1 }), kf(1, { yaw: -20, pitch: 8, zoom: 0.9, focus: 1 })] } },
} satisfies Record<string, { label: string; motion: StageMotion }>;

export type MotionName = keyof typeof MOTIONS;

export function resolveMotion(m: MotionInput | undefined): StageMotion | null {
  if (!m || m === "none") return null;
  if (typeof m === "string") return (MOTIONS[m]?.motion as StageMotion) ?? null;
  return m.keyframes?.length ? m : null;
}

const EASE: Record<StageEase, (t: number) => number> = {
  linear: (t) => t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 4),
  in: (t) => t * t * t,
  back: (t) => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};

const KEYS = Object.keys(DEFAULT_SHOT) as (keyof Shot)[];

export function mixShot(a: Shot, b: Shot, t: number): Shot {
  const o = { ...a };
  for (const k of KEYS) o[k] = a[k] + (b[k] - a[k]) * t;
  return o;
}

/** 按 0–1 的进度取一个镜头 */
export function sampleMotion(m: StageMotion, p: number): Shot {
  const ks = [...m.keyframes].sort((a, b) => a.at - b.at);
  if (p <= ks[0].at) return resolveShot(ks[0].shot);
  for (let i = 1; i < ks.length; i++) {
    if (p <= ks[i].at) {
      const a = ks[i - 1], b = ks[i];
      const span = b.at - a.at || 1;
      return mixShot(resolveShot(a.shot), resolveShot(b.shot), EASE[b.ease ?? "inOut"]((p - a.at) / span));
    }
  }
  return resolveShot(ks[ks.length - 1].shot);
}

/** 把经过的秒数换成进度, 处理延迟和循环. 返回 [进度, 是否结束] */
export function motionProgress(m: StageMotion, elapsed: number): [number, boolean] {
  const t = Math.max(0, elapsed - (m.delay ?? 0)) / Math.max(0.01, m.duration);
  if (!m.loop) return [Math.min(1, t), t >= 1];
  if (m.loop === "pingpong") { const c = t % 2; return [c <= 1 ? c : 2 - c, false]; }
  return [t % 1, false];
}
