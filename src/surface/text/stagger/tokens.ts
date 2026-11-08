// 行为规格参照 docs/research/catalog/textanimations.md 的 BlurText, FoldText, MaskedHeading, StrokeText, TrueFocus, FallingText 条目, 实现为 HX 自有.

/**
 * 错峰入场意图 (src/surface/text/stagger) 的常数. 秒写 _S, 像素写 _PX, 角度写 _DEG.
 * 每个数字在这里写一次, 组件只引用名字.
 */

/*
 * ENGINE-GAP: craft/tokens 的 EASE 没有 power3.out 与 expo.out 这类命名曲线, 规格里的这几条先用 ease("out") 近似.
 */

/** StaggerText 四种入场的默认参数. step 为相邻名次间隔, duration 为单个单元的时长, 都是秒. */
export const STAGGER_PRESETS = {
  /** 模糊入场: 间隔 200ms, 每段 0.35s 共两段 (经模糊中点), 模糊 10px, 位移 50px. */
  blur: { step: 0.2, duration: 0.7, blur: 10, distance: 50, by: "word" },
  /** 上浮入场: 间隔 50ms, 1.25s, 位移 40px. */
  rise: { step: 0.05, duration: 1.25, blur: 0, distance: 40, by: "char" },
  /** 折页入场: 间隔 45ms, 0.65s, 折角 92 度, 透视 700px. */
  fold: { step: 0.045, duration: 0.65, blur: 0, distance: 0, by: "char" },
  /** 遮罩上升: 词间隔 90ms, 1.1s; 词内字母间隔取词间隔的 0.35. */
  mask: { step: 0.09, duration: 1.1, blur: 0, distance: 0, by: "word" },
} as const;

export const FOLD_ANGLE_DEG = 92;
export const FOLD_PERSPECTIVE_PX = 700;
/** 遮罩上升里字母相对词的间隔比例. */
export const MASK_LETTER_SHARE = 0.35;
/** 模糊入场在中点的位移, 相对 distance 的比例 (反向, 轻微越过终点). */
export const BLUR_MID_OVERSHOOT = 0.1;
/** 透明度在单元进度的这一段内淡入 (折页). */
export const FOLD_FADE_END = 0.3;
/** 遮罩上升的起始位移 (单元自身高度的百分比). */
export const MASK_FROM_PERCENT = 110;
/** 循环之间停在终点的默认时长 (秒). */
export const LOOP_DELAY_S = 2;

/** 描边书写: 描边时长 1.6s, 填色延迟 0.2s, 字间隔 50ms, 线宽 1.4. */
export const TRACE_DEFAULTS = { drawDuration: 1.6, fillDelay: 0.2, stagger: 0.05, strokeWidth: 1.4, dashLength: 10 } as const;
/** 描边虚线长度按字号估的系数: 一个字形轮廓约是字号的这么多倍. */
export const TRACE_OUTLINE_EM = 4;
/** 填色时长相对描边时长的比例. */
export const TRACE_FILL_SHARE = 0.5;

/** 焦点框: 可感时长 0.5s, 弹性 0.38, 模糊 5px, 停留 1s, 角标 16px, 框与词的间距 10px. */
export const FOCUS_DEFAULTS = { animationDuration: 0.5, bounce: 0.38, blurAmount: 5, pauseBetweenAnimations: 1, cornerSize: 16, unfocusedOpacity: 1, focusScale: 1 } as const;
export const FOCUS_FRAME_GAP_PX = 10;
/** 非焦点词的滤镜过渡 (秒). */
export const FOCUS_FILTER_S = 0.3;

/** 坠落: 弹性 0.2, 横向散开 0.5, 间隔 30ms, 重力 1. */
export const DROP_DEFAULTS = { bounciness: 0.2, scatter: 0.5, stagger: 0.03, gravity: 1, restoreDelay: 0 } as const;
/** 重力为 1 时落地的时长 (秒). */
export const DROP_FALL_S = 0.9;
/** 散开的横向幅度上限, 相对容器半宽. */
export const DROP_SCATTER_SHARE = 0.5;
/** 落地后的最大倾角 (度). */
export const DROP_TILT_DEG = 12;
