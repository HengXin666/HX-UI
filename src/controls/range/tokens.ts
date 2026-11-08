/**
 * range 族共用的曲线, 时长和语义色. 每个数字只写一次, 组件引用名字.
 * 时长用 tokens.css 的 --duration-* 令牌, 它们在减弱动效媒体查询里归零.
 */

/*
 * ENGINE-GAP: craft EASE 没有这两条曲线. out 是规格的 ease-out (0.23, 1, 0.32, 1),
 * inOut 是规格的 ease-in-out (0.77, 0, 0.175, 1). 并入 L1 时应加进 src/craft/tokens.ts 的 EASE.
 */
export const RANGE_EASE = {
	out: "cubic-bezier(0.23, 1, 0.32, 1)",
	inOut: "cubic-bezier(0.77, 0, 0.175, 1)",
} as const;
/** 同一条 inOut 的数组形式, 给 JS 侧插值用. */
export const RANGE_EASE_IN_OUT_POINTS = [0.77, 0, 0.175, 1] as const;

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
