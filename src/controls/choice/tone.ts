import { cssCurve } from "../../motion/curves";

/**
 * choice 族共用的语义色名与规格曲线. 颜色 props 只收这些 token 名, 不收任意色值.
 */
export type ChoiceTone =
	| "primary"
	| "primary-foreground"
	| "foreground"
	| "background"
	| "muted"
	| "muted-foreground"
	| "secondary"
	| "secondary-foreground"
	| "accent"
	| "accent-foreground"
	| "card"
	| "popover"
	| "popover-foreground"
	| "border"
	| "warning"
	| "destructive"
	| "destructive-foreground"
	| "success";

/** token 名转成 CSS 变量引用. */
export function toneVar(tone: ChoiceTone): string {
	return "var(--" + tone + ")";
}

/** catalog 里各件 CSS 共用的 --*-ease-out. 与 craft EASE.out 控制点不同, 取 CURVE.outStrong. */
export const SPEC_EASE_OUT = cssCurve("outStrong");
/** 带过冲的弹出曲线 (BellToggle 徽标 280ms). */
export const SPEC_EASE_POP = cssCurve("backOut");
/** 分段摆动曲线 (BellToggle SEG_EASE). */
export const SPEC_EASE_SEGMENT = cssCurve("inOutQuart");
export const EASE_PLAIN = "ease";
/** 秒转毫秒. 规格里的弹簧时长是秒, CSS 与 WAAPI 用毫秒. */
export const MS_PER_S = 1000;
/** 本族 "时长 + bounce" 换算的口径: 落定包络取 (1 + x) e^(-zeta x), 时长下限 1e-9s. 积分一律用解析解 stepSpringExact. */
export const CHOICE_FIT = { envelope: "linear", minDurationS: 1e-9 } as const;

export function toMs(seconds: number): number {
	return seconds * MS_PER_S;
}
export const EASE_PLAIN_OUT = "ease-out";

/** 一段 CSS transition 声明: 属性 + 毫秒 + 曲线. 多段用逗号拼接. */
export function transition(property: string, ms: number, curve: string = EASE_PLAIN): string {
	return property + " " + ms + "ms " + curve;
}

export const PX = "px";
export const PROP_TRANSFORM = "transform";
export const PROP_OPACITY = "opacity";
export const PROP_BACKGROUND = "background-color";
export const PROP_COLOR = "color";
export const DEG = "deg";
