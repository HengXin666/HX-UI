/**
 * 可视化层的时长, 幅度与类名. 组件只引用这里的名字, 不在 JSX 里另写秒数.
 * 时长单位为秒, 与 motion 的 transition 一致. 数字合同见 docs/research/craft.md.
 */

export const VIZ_TIME = {
  /** 柱子, 节点落位. 对应 thumb 267ms. */
  settle: 0.267,
  /** 折线描线与按位数字. 对应 digit 700ms. */
  draw: 0.7,
  /** 坐标轴重标. 值越过 domain 时网格 200ms 跟上, 线不重画. */
  rescale: 0.2,
  /** 冲击标记圈扩散消失. */
  ring: 0.4,
  /** 流程脉冲走完一条边的时间. */
  pulse: 1.6,
  /** 发牌错峰的首段与末段间隔. */
  dealFirst: 0.12,
  dealLast: 0.04,
} as const;

/** video-shotcraft 的演示按 30fps 写帧数, 这里换成秒. */
const FPS = 30;
const frames = (count: number): number => count / FPS;

/**
 * 镜头卡换算来的节拍 (秒). 出处:
 * shock / beat 来自 chart-live-moves 的 AxisRescaleShockV2 (SHOCK0 到 SHOCK1 14f, 到 BEAT 再停 18f): 先让轴坏一次, 再重标.
 * levelGap / sibling / lead / edge 来自 canvas-materialize-moves 的 DiagramCascadeBuild: 层间 22f, 兄弟 5f, 线比节点早 10f, 描线 16f.
 * sweep / gaugeStagger 来自 gauge-readout-moves 的 NeedleSweepSelftest: 去程 12f 甩满弧, 多表错峰 4f.
 * still 是三张卡共同的收尾: 落定后至少 36f 真静止, 不尾漂.
 */
export const VIZ_SHOT = {
  shock: frames(14),
  beat: frames(18),
  levelGap: frames(22),
  sibling: frames(5),
  lead: frames(10),
  edge: frames(16),
  sweep: frames(12),
  gaugeStagger: frames(4),
  still: frames(36),
} as const;

/**
 * 镜头卡里的弹簧. node: DiagramCascadeBuild 节点 (190 / 14). pop: TimelineTravel 弹卡 (160 / 11 / 0.9, 明显过冲).
 * needle: NeedleSweepSelftest 回程, 约 8 度过冲后落真值.
 */
export const VIZ_SPRING = {
  node: { stiffness: 190, damping: 14, mass: 1 },
  pop: { stiffness: 160, damping: 11, mass: 0.9 },
  needle: { stiffness: 200, damping: 15, mass: 1 },
} as const;

/** 流程脉冲在当前节点变化后走几趟就停, 之后真静止. */
export const VIZ_PULSE_PASSES = 2;

/** 视口露出比例, 到了再开拍. */
export const VIZ_VIEWPORT = 0.35;

/** 折线, 环形的画布 (SVG 用户单位). */
export const VIZ_BOX = { width: 320, height: 120, pad: 6, ring: 48 } as const;

/** 默认刻度数. nice 后的实际数目可能少一到两个. */
export const VIZ_TICKS = 4;

/** 坐标轴冲击的标记圈: 半径从 from 到 to, 透明度从 0.35 到 0. */
export const VIZ_PUNCH = { from: 3, to: 12, alpha: 0.35 } as const;

/** 流程脉冲在一条边上的可见长度 (pathLength 归一后的比例). */
export const VIZ_PULSE_DASH = "0.1 0.9";

/** 按下反馈的缩放, 与按钮合同的 0.97 同一档. */
export const VIZ_PRESS = 0.97;

export const VIZ_CLASS = {
  figure: "flex flex-col gap-3",
  caption: "text-xs font-medium text-muted-foreground",
  live: "min-h-5 text-sm tabular-nums text-foreground",
  plot: "relative w-full",
  grid: "pointer-events-none absolute inset-x-0 h-px bg-border",
  tick: "absolute -translate-y-1/2 pr-2 text-[11px] tabular-nums text-muted-foreground",
  focus: "outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring",
  node: "absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border px-3 py-1.5 text-sm font-medium whitespace-nowrap",
  nodeIdle: "border-border bg-card text-muted-foreground",
  nodeOn: "border-primary bg-card text-foreground",
  panel: "text-sm leading-relaxed text-muted-foreground",
} as const;

/** 当前项的 data-state. */
export const VIZ_STATE = { on: "active", off: "idle" } as const;
