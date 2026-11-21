/**
 * 数据舞台 (`DataStage`) 与 Line / Bar 的默认值. 组件里不写魔法数, 只读这里.
 * .agents/notes/implemented/architecture/2026-11-19-omni-data-kernel.md
 */

/** 点数 (所有序列合计) 超过这个数时 auto 渲染改走 canvas: SVG 每点一个路径段, 两千点以上在中端机上拖慢重排. */
export const CANVAS_THRESHOLD = 2000;

export type StageRenderer = "auto" | "svg" | "canvas";

/** 绘图区内边距 (px). 左边留给竖轴标签, 下边留给横轴标签. */
export const STAGE_PADDING = { top: 12, right: 12, bottom: 28, left: 40 } as const;

export const STAGE_HEIGHT = 220;

/** 序列的色阶: 第一条用前景色, 第二条用主色, 之后用弱化前景色, 再多就循环. 只用主题变量, 不出紫蓝渐变. */
export const SERIES_TONES = ["text-foreground", "text-primary", "text-muted-foreground"] as const;

/** 面积填充透明度, 与 Trend 一致. */
export const AREA_OPACITY = "opacity-[0.06]";

/** 轴标签字号 (px) 与离轴间距. */
export const AXIS_TEXT = { size: 11, gap: 6 } as const;

/** 分组柱之间的内留白 (占组宽比例). */
export const GROUP_PADDING = 0.1;

/** 读数里多个序列之间的分隔. */
export const READOUT_SEPARATOR = " · ";

export type BarMode = "group" | "stack";
export type BarOrientation = "vertical" | "horizontal";

/** SVG 属性值: 图种的线, 字, 网格都用当前文字色, 颜色只由 SERIES_TONES 等类名决定. */
export const SVG_ATTR = { color: "currentColor", middle: "middle", end: "end", none: "none", nonScaling: "non-scaling-stroke" } as const;

/** 网格线透明度. */
export const GRID_OPACITY = 0.2;

/** 散点半径 (px): 无 size 时用 base; 有 size 时按面积 (sqrt) 映射到 [min, max], 人眼按面积读大小. */
export const SCATTER_RADIUS = { base: 3, min: 2, max: 12 } as const;

/** 堆叠面积每层的填充透明度: 层与层靠描边分界, 填充只做底色. */
export const STACK_FILL_OPACITY = 0.18;

export type StackOffset = "zero" | "expand";

/** 热力格: 格间留缝 (px) 与透明度区间. 下限不为 0, 最小值的格子也看得见. */
export const HEAT_CELL = { gap: 1, radius: 2, minOpacity: 0.08, maxOpacity: 1 } as const;

/** 散点填充透明度: 重叠处叠深, 能看出密度. */
export const SCATTER_FILL_OPACITY = 0.7;

/** Recharts 适配器的记录键: 横轴默认取 "name" (与 src/charts 的 xKey 默认一致), 单序列柱值取 "value". */
export const RECHARTS_KEY = { x: "name", value: "value" } as const;
