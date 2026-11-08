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

/** catalog 里各件 CSS 共用的 --*-ease-out. 与 craft EASE.out 控制点不同, 按规格单列. */
export const SPEC_EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
/** 带过冲的弹出曲线 (BellToggle 徽标 280ms). */
export const SPEC_EASE_POP = "cubic-bezier(0.34, 1.56, 0.64, 1)";
/** 分段摆动曲线 (BellToggle SEG_EASE). */
export const SPEC_EASE_SEGMENT = "cubic-bezier(0.77, 0, 0.175, 1)";
export const EASE_PLAIN = "ease";
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
