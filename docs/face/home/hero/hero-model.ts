/**
 * 首屏舞台的参数模型: 代码窗里的每个数字, 预设的五档, 都是这一份数据.
 * 背景是库里的 MeshGradient + Beam + Grain, 代码窗显示的就是驱动背景的那段 JSX.
 */

export const PARAM = {
  intensity: "intensity",
  angle: "angle",
  x: "x",
  width: "width",
  glow: "glow",
  grain: "grain",
} as const;

export type ParamKey = (typeof PARAM)[keyof typeof PARAM];

export interface HeroParams {
  /** 三个语义令牌名, MeshGradient 一团光一个; Beam 取第二个. */
  readonly colors: readonly [string, string, string];
  readonly intensity: number;
  readonly angle: number;
  readonly x: number;
  readonly width: number;
  readonly glow: number;
  readonly grain: number;
}

export interface ParamSpec {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  /** 拖动时每走这么多像素改一个 step. */
  readonly px: number;
}

const FINE = 0.05;
const GRAIN_STEP = 0.01;
const PX_FINE = 4;
const PX_COARSE = 2;

export const SPEC: Record<ParamKey, ParamSpec> = {
  intensity: { min: 0.2, max: 1, step: FINE, px: PX_FINE },
  angle: { min: -60, max: 60, step: 1, px: PX_COARSE },
  x: { min: 0, max: 100, step: 1, px: PX_COARSE },
  width: { min: 80, max: 520, step: 10, px: PX_COARSE },
  glow: { min: 0, max: 1, step: FINE, px: PX_FINE },
  grain: { min: 0, max: 0.4, step: GRAIN_STEP, px: PX_FINE },
};

/** 把值夹进范围并按 step 取整, 小数位跟 step 走, 代码窗里不会出现 0.30000000000000004. */
export function snap(key: ParamKey, value: number): number {
  const { min, max, step } = SPEC[key];
  const digits = step < 1 ? String(step).split(".")[1]?.length ?? 0 : 0;
  const stepped = Math.round(Math.min(max, Math.max(min, value)) / step) * step;
  return Number(stepped.toFixed(digits));
}

export interface Preset {
  readonly id: string;
  readonly label: string;
  readonly params: HeroParams;
}

export const PRESETS: readonly Preset[] = [
  { id: "ocean", label: "夜海", params: { colors: ["info", "accent-2", "link"], intensity: 0.8, angle: -12, x: 30, width: 360, glow: 0.6, grain: 0.12 } },
  { id: "dune", label: "沙丘", params: { colors: ["warning", "destructive", "warning"], intensity: 0.75, angle: 24, x: 70, width: 260, glow: 0.5, grain: 0.16 } },
  { id: "dusk", label: "暮色", params: { colors: ["primary", "destructive", "link"], intensity: 0.9, angle: -20, x: 40, width: 320, glow: 0.65, grain: 0.12 } },
  { id: "silk", label: "丝绸", params: { colors: ["muted-foreground", "foreground", "input"], intensity: 0.85, angle: 18, x: 62, width: 300, glow: 0.45, grain: 0.14 } },
  { id: "aurora", label: "极光", params: { colors: ["success", "accent-2", "info"], intensity: 0.85, angle: 10, x: 55, width: 400, glow: 0.6, grain: 0.1 } },
];

/** 首屏打开时选中的预设: 和实拍一样落在灰阶那一档. */
export const START_PRESET = "silk";

/** 预设行右侧的两项摘要. */
export function presetMeta(params: HeroParams): string {
  return `intensity ${params.intensity} \u00b7 angle ${params.angle}`;
}
