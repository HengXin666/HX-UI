// PinCells 的一格: 底色与边框状态, 通过态漫上来的底色层, 落下的字符, 闪烁光标.
import type { JSX } from "react";
import { DURATION_VAR, RANGE_EASE, toneVar, type RangeTone } from "../../tokens";

const MASK_CHAR = "\u2022";
const ZERO_MS = "0ms";

interface PinSlotProps {
	readonly char: string | undefined;
	readonly glyphRef: (node: HTMLSpanElement | null) => void;
	readonly mask: boolean;
	readonly success: boolean;
	readonly danger: boolean;
	/** 带焦点环 (当前输入格). */
	readonly ringed: boolean;
	readonly showCaret: boolean;
	readonly reduced: boolean;
	readonly washMs: number;
	readonly washDelay: number;
	readonly size: number;
	readonly radius: number;
	readonly accentTone: RangeTone;
	readonly inkTone: RangeTone;
	readonly slotTone: RangeTone;
	readonly digitTone: RangeTone;
	readonly dangerTone: RangeTone;
}

export function PinSlot(props: PinSlotProps): JSX.Element {
	const { char, glyphRef, mask, success, danger, ringed, showCaret, reduced, washMs, washDelay, size, radius, accentTone, inkTone, slotTone, digitTone, dangerTone } = props;
	return (
		<div
			aria-hidden
			className="relative flex items-center justify-center overflow-hidden border text-lg font-medium tabular-nums"
			style={{
				width: size,
				height: size,
				borderRadius: radius,
				backgroundColor: toneVar(slotTone),
				borderColor: danger ? toneVar(dangerTone) : ringed ? "var(--ring)" : "transparent",
				color: danger ? toneVar(dangerTone) : toneVar(inkTone),
				transitionProperty: "background-color, border-color, color",
				transitionDuration: DURATION_VAR.base,
				transitionTimingFunction: "ease",
			}}
		>
			<span
				className="absolute inset-0"
				style={{
					backgroundColor: toneVar(accentTone),
					opacity: success ? 1 : 0,
					transitionProperty: "opacity",
					transitionDuration: reduced ? ZERO_MS : `${washMs}ms`,
					transitionDelay: reduced ? ZERO_MS : `${washDelay}ms`,
					transitionTimingFunction: RANGE_EASE.out,
				}}
			/>
			<span ref={glyphRef} className="relative" style={{ color: success ? toneVar(digitTone) : undefined }}>
				{char === undefined ? "" : mask ? MASK_CHAR : char}
			</span>
			{showCaret ? <span className="absolute h-1/2 w-px animate-pulse motion-reduce:animate-none" style={{ backgroundColor: toneVar(inkTone) }} /> : null}
		</div>
	);
}
