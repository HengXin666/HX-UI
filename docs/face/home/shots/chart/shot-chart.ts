import { FRAME_MS, ease, phase } from "../../../../../src/craft";

/**
 * 镜 6 图表, 来自 chart-live-moves 的 AxisRescaleShockV2 (docs/research/shots/part-2.md), 帧号原样换成毫秒:
 * 画线 14f 到 56f (467 到 1867), 预警 50f (1667), 尖峰冲出天花板 62f 到 76f (2067 到 2533),
 * 停拍到 94f (3133), 重标到 108f (3600) 完成, 冲击圈 106f (3533) 起, 全片 168f, 落定后至少 1200ms 真静止.
 * 重标走 out: 前 200ms 已走完九成多, 网格在 200ms 内到新刻度, 线跟着同一条曲线压回框内, 不重画.
 */
const f = (frames: number): number => frames * FRAME_MS;
export const DRAW_AT = f(14);
export const DRAW_END = f(56);
export const WARN_AT = f(50);
export const SHOCK_AT = f(62);
export const SHOCK_END = f(76);
export const BEAT_AT = f(94);
export const RESCALE_END = f(108);
export const MARK_AT = f(106);
export const CHART_END_MS = f(168);
const WARN_MS = 200;
const MARK_MS = 400;
/** 原片冲出天花板 226px, 绘图区高 540px: 越过天花板 42% 个绘图区高. */
export const SHOCK_OVER = 226 / 540;

/** 十二个月的值, 最后一个月冲出旧天花板. 原片 DATA 原样. */
export const SERIES = [22, 30, 26, 38, 35, 47, 44, 58, 55, 66, 72, 340] as const;
export const OLD_TOP = 100;
export const NEW_TOP = 400;
export const OLD_TICKS = [25, 50, 75, 100] as const;
export const NEW_TICKS = [100, 200, 300, 400] as const;

export interface ChartPose {
  /** 已画出的折线长度比例 (前十一个点). */
  readonly draw: number;
  /** 末段从十一月伸到十二月的比例. */
  readonly reach: number;
  /** 天花板预警线的不透明度. */
  readonly warn: number;
  /** 末点的纵向位置, 绘图区高的比例: 0 是天花板, 1 是基线, 负数是冲出画框. */
  readonly lastY: number;
  /** 当前纵轴上限. */
  readonly top: number;
  /** 旧刻度到新刻度的交接进度. */
  readonly relabel: number;
  /** 冲击圈: 半径进度与透明度. */
  readonly mark: number;
}

export function chartPose(ms: number): ChartPose {
  const draw = ease("out", phase(ms, DRAW_AT, DRAW_END - DRAW_AT));
  const warn = ease("out", phase(ms, WARN_AT, WARN_MS));
  const base = 1 - SERIES[SERIES.length - 2] / OLD_TOP;
  const reach = ease("out", phase(ms, SHOCK_AT, SHOCK_END - SHOCK_AT));
  const shocked = base + (-SHOCK_OVER - base) * reach;
  const relabel = ease("out", phase(ms, BEAT_AT, RESCALE_END - BEAT_AT));
  const top = OLD_TOP + (NEW_TOP - OLD_TOP) * relabel;
  const landed = 1 - SERIES[SERIES.length - 1] / NEW_TOP;
  const lastY = shocked + (landed - shocked) * relabel;
  const mark = ease("out", phase(ms, MARK_AT, MARK_MS));
  return { draw, reach, warn: warn * (1 - relabel), lastY, top, relabel, mark };
}
