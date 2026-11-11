/**
 * range 族共用的曲线, 时长和语义色. 每个数字只写一次, 组件引用名字.
 * 时长用 tokens.css 的 --duration-* 令牌, 它们在减弱动效媒体查询里归零.
 */

import { CURVE, cssCurve } from "../../motion/curves";

/** 规格的 ease-out 与 ease-in-out, 取公共曲线表 CURVE (outStrong, inOutQuart). */
export const RANGE_EASE = {
	out: cssCurve("outStrong"),
	inOut: cssCurve("inOutQuart"),
} as const;
/** 同一条 inOut 的数组形式, 给 JS 侧插值用. */
export const RANGE_EASE_IN_OUT_POINTS = CURVE.inOutQuart;

/** 120ms / 200ms / 300ms 三档直接取库里的时长令牌. */
export const DURATION_VAR = {
	fast: "var(--duration-fast)",
	base: "var(--duration-base)",
	slow: "var(--duration-slow)",
} as const;

/** 语义色. 颜色类 props 只收这些名字, 不收任意色值. */
export type RangeTone = "foreground" | "primary" | "success" | "warning" | "destructive" | "muted" | "input" | "background";

export const TONE_VAR: Record<RangeTone, string> = {
	foreground: "var(--foreground)",
	primary: "var(--primary)",
	success: "var(--success)",
	warning: "var(--warning)",
	destructive: "var(--destructive)",
	muted: "var(--muted)",
	input: "var(--input)",
	background: "var(--background)",
};

/** 未给 tone 时跟随文字色, 等价于规格里的 currentColor. */
export const CURRENT_COLOR = "currentColor";

export function toneVar(tone: RangeTone | undefined): string {
	return tone ? TONE_VAR[tone] : CURRENT_COLOR;
}

/** 1px 线, 唯一允许的线宽. */
export const HAIRLINE_PX = 1;
export const FADE_MS = 200;
export const FAST_MS = 120;
export const MOVE_MS = 160;
export const QUICK_FADE_MS = 150;

export const MS_PER_S = 1000;
/** 帧间隔上限 (秒), 切后台回来不让积分一步飞出去. 本族的解析弹簧也用它. */
export const DT_CAP_S = 0.05;
export const RANGE_DT_CAP_MS = DT_CAP_S * MS_PER_S;
/** bounce 上限, 再高阻尼比趋零, 弹簧停不下来. */
export const MAX_BOUNCE = 0.9;
/** 本族 "时长 + bounce" 换算的口径: 阻尼比不低于 1 - MAX_BOUNCE, 其余取 src/motion 默认. */
export const RANGE_FIT = { minDampingRatio: 1 - MAX_BOUNCE } as const;
/** 刻度盘写法 (刚度 + bounce) 先把 bounce 钳进这个区间. */
export const RANGE_BOUNCE_RANGE = [0, MAX_BOUNCE] as const;
/** 临界阻尼下 (1 + x) e^-x = 0.001 的根, 即 omega * T. 规格里写作 9.23. */
export const CRITICAL_SETTLE = 9.23;
