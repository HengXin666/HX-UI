// NudgeField 拖动中右上角的增量提示: 带符号的差值, 出现时淡入并从 0.9 放大.
import type { JSX } from "react";
import { RANGE_EASE } from "../../tokens";
import { NUDGE_DELTA_MS } from "./nudge-scrub";

/** 增量提示出现前的缩放起点. */
const DELTA_FROM_SCALE = 0.9;

export function NudgeDelta({ delta, digits, reduced }: { delta: number | null; digits: number; reduced: boolean }): JSX.Element {
	return (
		<span
			aria-hidden
			className="pointer-events-none absolute right-2 top-0 text-[10px] tabular-nums text-muted-foreground"
			style={{
				opacity: delta ? 1 : 0,
				scale: delta ? 1 : DELTA_FROM_SCALE,
				transitionProperty: "opacity, scale",
				transitionDuration: reduced ? "0ms" : `${NUDGE_DELTA_MS}ms`,
				transitionTimingFunction: RANGE_EASE.out,
			}}
		>
			{delta && delta > 0 ? "+" : ""}
			{delta ? delta.toFixed(digits) : ""}
		</span>
	);
}
