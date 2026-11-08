// 行为规格参照 docs/research/catalog/textanimations.md 的 ScrollFloat, ScrollReveal, ScrollVelocity, CurvedLoop, TextLoop, CircularText 条目, 实现为 HX 自有.

/**
 * 滚动与循环意图 (src/surface/text/scroll) 的常数. 毫秒写 _MS, 秒写 _S, 像素写 _PX, 角度写 _DEG.
 * 每个数字在这里写一次, 组件只引用名字.
 */

/** 滚动浮起: 字间隔 30ms, 单元时长 1, 位移 120px, 纵向拉伸 2.3 倍; 透明度在单元进度 0.05 到 0.55 之间淡入. */
export const FLOAT_DEFAULTS = { stagger: 0.03, duration: 1, distance: 120, stretch: 2.3 } as const;
export const FLOAT_FADE = [0.05, 0.55] as const;
/** 滚动显影: 词间隔 50ms, 底透明度 0.1, 整体初始转角 3 度, 模糊 4px; 刮擦时单元跨度 0.5, 进场模式 0.8s. */
export const REVEAL_DEFAULTS = { stagger: 0.05, baseOpacity: 0.1, baseRotation: 3, blurStrength: 4, duration: 0.8 } as const;
export const SCRUB_SPAN = 0.5;
/** 整体转角回正的时长上限 (秒). */
export const REVEAL_ROTATE_MAX_S = 1.4;
/** 滚动区间: 元素顶边到视口底开始, 元素底边到视口这一比例处结束. */
export const SCROLL_RANGE = { start: 1, end: 0.4 } as const;

/** 路径滚动条带: 画布 1440 x 120; 弧形弯曲 400; 波长 960, 波幅 90. */
export const MARQUEE_VIEW = { width: 1440, height: 120 } as const;
export const MARQUEE_DEFAULTS = { speed: 2, curveAmount: 400, curviness: 90 } as const;
export const MARQUEE_WAVE_LENGTH = 960;
/** speed 为 1 时每秒走多少画布单位. */
export const MARQUEE_UNIT_PX_S = 60;
/** 甩出速度上限 (单位/秒) 与衰减时间常数 (秒). */
export const MARQUEE_MAX_FLING = 4000;
export const MARQUEE_FLING_TAU_S = 0.55;
/** 滚动加速: 滚动速率跟随的上升与回落快慢 (1/秒), 速度向目标靠拢的快慢. */
export const MARQUEE_SCROLL_RISE = 10;
export const MARQUEE_SCROLL_FALL = 2.4;
export const MARQUEE_VELOCITY_RATE = 3;
/** 拖拽速度估计里新样本的权重. */
export const MARQUEE_DRAG_BLEND = 0.5;
/** 量不到字宽时按每字这么多个字号估. */
export const MARQUEE_CHAR_EM = 0.6;
/** 一份文字至少重复几次, 保证路径上不出空档. */
export const MARQUEE_MIN_COPIES = 3;

/** 环形字: 一圈 20s, 直径 200px. 悬停时的速度倍数. */
export const ORBIT_DEFAULTS = { spinDuration: 20, size: 200 } as const;
export const ORBIT_HOVER_SPEED = { slowDown: 0.5, speedUp: 4, pause: 0, goBonkers: 20 } as const;
/** 速度倍数与悬停缩放的弹簧 (刚度, 阻尼). */
export const ORBIT_SPEED_SPRING = { stiffness: 60, damping: 18, mass: 1 } as const;
export const ORBIT_SCALE_SPRING = { stiffness: 300, damping: 20, mass: 1 } as const;
/** goBonkers 时的放大. */
export const ORBIT_BONKERS_SCALE = 0.8;
/** 甩出角速度上限 (度/秒) 与衰减时间常数 (秒). */
export const ORBIT_MAX_FLING = 1440;
export const ORBIT_FLING_TAU_S = 0.7;
export const FULL_TURN_DEG = 360;
