import type { JSX } from "react";
import { PROP_TRANSFORM, SPEC_EASE_OUT, transition } from "../../tone";
import { DRIFT_MS } from "./drift-spec";

const FLIP = 180;
const CHEVRON_PX = 14;

/** 触发器右侧的折角箭头: 打开时翻转 180 度, 减弱动效时直接翻. */
export function DriftChevron({ open, reduced }: { readonly open: boolean; readonly reduced: boolean }): JSX.Element {
	return (
		<svg
			aria-hidden
			viewBox="0 0 16 16"
			width={CHEVRON_PX}
			height={CHEVRON_PX}
			fill="none"
			stroke="currentColor"
			strokeWidth={1}
			style={{ transform: "rotate(" + (open ? FLIP : 0) + "deg)", transition: transition(PROP_TRANSFORM, reduced ? 0 : DRIFT_MS.chevron, SPEC_EASE_OUT) }}
		>
			<path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}
