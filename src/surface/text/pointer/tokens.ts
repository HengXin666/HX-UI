// 行为规格参照 docs/research/catalog/textanimations.md 的 DepthText, EchoText, TechText, TextCursor 条目, 实现为 HX 自有.

/**
 * 指针意图 (src/surface/text/pointer) 的常数. 毫秒写 _MS, 秒写 _S, 像素写 _PX, 角度写 _DEG.
 * 每个数字在这里写一次, 组件只引用名字.
 */

/** 叠层厚字: 层数上限 64, 入场 1200ms, 推深弹簧 260 / 17, 按下再推 0.25, 漂浮跟随比例 0.7. */
export const EXTRUDE_MAX_LAYERS = 64;
export const EXTRUDE_INTRO_MS = 1200;
export const EXTRUDE_PUSH_SPRING = { stiffness: 260, damping: 17, mass: 1 } as const;
export const EXTRUDE_PRESS_EXTRA = 0.25;
export const EXTRUDE_FLOAT_EASE = 0.7;
/** 叠层厚字的 props 默认值: 34 层, 层距 2.4px, 倾角 7.5 度, 平滑 0.14, 透视 900px, 自转 0.35 rad/s, 字重 900. */
export const EXTRUDE_DEFAULTS = {
  layers: 34,
  depth: 2.4,
  tilt: 7.5,
  smoothing: 0.14,
  perspective: 900,
  orbitSpeed: 0.35,
  hoverPush: 0,
  fontSize: "clamp(3rem, 10vw, 8rem)",
  fontWeight: 900,
} as const;
/** smoothing 是每 60Hz 帧的跟随比例, 换成与帧率无关的指数时按这个帧率折算. */
export const EXTRUDE_REF_HZ = 60;
/** 自转时纵向倾角相对横向的比例与相位倍数 (画出一条横向的 8 字). */
export const EXTRUDE_ORBIT_PITCH = 0.5;
export const EXTRUDE_ORBIT_PITCH_RATE = 2;
/** 渐变深度: 最深一层保留的不透明度 (百分比), 由前往后线性降到它. */
export const EXTRUDE_FADE_FLOOR = 35;
/** 漂浮: 上浮幅度相对总厚度的比例, 与一个周期 (秒). */
export const EXTRUDE_FLOAT_SHARE = 0.25;
export const EXTRUDE_FLOAT_PERIOD_S = 3.2;
/** 投影: 纵向偏移与模糊 (em), 投影色在深度色里的占比 (百分比). */
export const EXTRUDE_SHADOW = { y: 0.08, blur: 0.24, mix: 45 } as const;
/** 描边线宽 (px). */
export const EXTRUDE_OUTLINE_PX = 1;
/** 倾角与推深的静止阈值: 都小于它时帧循环停下, 等指针唤醒. */
export const EXTRUDE_REST = 0.001;

/** 残影字: 漂移一周 7200ms, 指针停下 2600ms 后回到漂移, 点击爆开每层 1100ms, 层间隔 80ms. */
export const WAKE_DRIFT_PERIOD_MS = 7200;
export const WAKE_DRIFT_IDLE_MS = 2600;
export const WAKE_BURST_LIFE_MS = 1100;
export const WAKE_BURST_GAP_MS = 80;
/** 残影字的 props 默认值: 12 层, 拖尾 0.24, 偏移 36px, 不透明度 0.72, 模糊 3px, 指针半径 320px, 回位 900ms, 字重 800. */
export const WAKE_DEFAULTS = {
  echoes: 12,
  lag: 0.24,
  offset: 36,
  fade: 0.72,
  blur: 3,
  echoScale: 1,
  cursorRadius: 320,
  duration: 900,
  fontSize: "clamp(3rem, 10vw, 8rem)",
  fontWeight: 800,
} as const;
/** 层数上限. */
export const WAKE_MAX_ECHOES = 32;
/** 漂移时偏移方向左右摆动的最大角度 (弧度). */
export const WAKE_DRIFT_SWAY = 0.6;
/** 回位时长换成一阶跟随时间常数: 时长内走完约 95%. */
export const WAKE_SETTLE_SHARE = 3;
/** 点击爆开时偏移最多放大到的倍数增量. */
export const WAKE_BURST_PUSH = 1.5;

/** 制图字: 回弹刚度 320, 弹性 0.4 时阻尼按 2√k (1 - 0.96 x 弹性); 入场延迟 0.15s; 点击踢开向两侧每格衰减 0.62; 描边亮度分 8 档. */
export const DRAFT_SPRING = 320;
export const DRAFT_BOUNCE_SHARE = 0.96;
export const DRAFT_INTRO_DELAY_S = 0.15;
export const DRAFT_KICK_DECAY = 0.62;
export const DRAFT_FALLOFF_STEPS = 8;
/** 制图字的 props 默认值: 感应半径 200px, 柔度 0.7, 虚线 4 / 2, 线宽 1.5, 弹性 0.4, 速度 1, 字重 600. */
export const DRAFT_DEFAULTS = {
  reach: 200,
  softness: 0.7,
  dashLength: 4,
  dashGap: 2,
  strokeWidth: 1.5,
  bounce: 0.4,
  speed: 1,
  fontSize: "clamp(3rem, 12vw, 9rem)",
  fontWeight: 600,
} as const;
/** 跟随时间常数 (秒): 拖动跟手 0.03, 选框位置 0.08, 选框显隐 0.1, 描边 0.09, 辅助线 0.14. */
export const DRAFT_TAU_S = { grab: 0.03, glide: 0.08, frame: 0.1, outline: 0.09, guide: 0.14 } as const;
/** 打字入场每格时长 (秒, speed 为 1 时). */
export const DRAFT_TYPE_STEP_S = 0.06;
/** 点击踢开的初速度 (px/s, 向上) 与判定为点击的最大位移 (px). */
export const DRAFT_KICK_PX_S = 520;
export const DRAFT_CLICK_SLOP_PX = 3;
/** 选框比字形外扩 (px). */
export const DRAFT_FRAME_PAD_PX = 4;

/** 盖章光标: 帧长上限 0.05s, 收尾缩小系数 0.55 (shrink 的规格值域上限), 移除间隔下限 5ms. */
export const STAMP_MAX_DT_S = 0.05;
export const STAMP_MIN_REMOVAL_S = 0.005;
/** 盖章光标的 props 默认值: 间距 88px, 最多 7 个, 退场 0.5s, 停下后每 30ms 收一个, 缩小 0.5, 淡出 0.6, 平滑 0.3, 字号 28px, 字重 600. */
export const STAMP_DEFAULTS = {
  spacing: 88,
  maxPoints: 7,
  exitDuration: 0.5,
  removalInterval: 30,
  shrink: 0.5,
  fade: 0.6,
  smoothing: 0.3,
  fontSize: 28,
  fontWeight: 600,
} as const;
/** smoothing 换成一阶跟随时间常数 (秒) 的系数: tau = smoothing x 它. */
export const STAMP_SMOOTH_TAU_S = 0.1;
/** 弹出时长 (秒) 与漂浮幅度 (px), 漂浮角速度 (rad/s). */
export const STAMP_POP_S = 0.18;
export const STAMP_FLOAT_PX = 4;
export const STAMP_FLOAT_RATE = 2.2;
/** 指针停下多久 (秒) 后开始逐个收章. */
export const STAMP_IDLE_S = 0.12;
