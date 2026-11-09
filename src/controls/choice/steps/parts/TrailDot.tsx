import { useEffect, useRef, type JSX } from "react";
import { FOCUS_RING } from "../../../../craft/tokens";
import { prefersReducedMotion } from "../../../../primitives/motion";
import { cn } from "../../../../primitives/utils";
import { PROP_BACKGROUND, PROP_COLOR, PROP_TRANSFORM, toneVar, transition, type ChoiceTone } from "../../tone";
import { TRAIL_ACTIVE_SCALE, TRAIL_DEFAULTS, TRAIL_EASE_SETTLE, TRAIL_EASE_SPRING, TRAIL_MS, type TrailState } from "./trail-spec";

const CHECK_BOX = 16;
const CHECK_PX = 14;

interface TrailDotTones {
	readonly activeTone: ChoiceTone;
	readonly activeTextTone: ChoiceTone;
	readonly idleTone: ChoiceTone;
	readonly idleTextTone: ChoiceTone;
}

interface TrailDotProps {
	readonly index: number;
	readonly state: TrailState;
	readonly clickable: boolean;
	readonly reduced: boolean;
	readonly onSelect: () => void;
	readonly tones: TrailDotTones;
}

/** 一个指示点: 完成时画勾 (pathLength 描出), 当前步放大, 其余显示序号. */
export function TrailDot({ index, state, clickable, reduced, onSelect, tones }: TrailDotProps): JSX.Element {
	const lit = state !== "idle";
	const ms = (n: number): number => (reduced ? 0 : n);
	return (
		<button
			type="button"
			data-slot="step-trail-dot"
			data-state={state}
			aria-label={`Step ${index}`}
			aria-current={state === "active" ? "step" : undefined}
			disabled={!clickable}
			onClick={onSelect}
			className={cn("inline-flex shrink-0 items-center justify-center rounded-full border border-border text-sm font-medium tabular-nums disabled:cursor-default", FOCUS_RING)}
			style={{
				width: TRAIL_DEFAULTS.dot,
				height: TRAIL_DEFAULTS.dot,
				backgroundColor: toneVar(lit ? tones.activeTone : tones.idleTone),
				color: toneVar(lit ? tones.activeTextTone : tones.idleTextTone),
				transform: `scale(${state === "active" && !reduced ? TRAIL_ACTIVE_SCALE : 1})`,
				transition: [
					transition(PROP_BACKGROUND, ms(TRAIL_MS.dot)),
					transition(PROP_COLOR, ms(TRAIL_MS.label)),
					transition(PROP_TRANSFORM, ms(TRAIL_MS.dotScale), TRAIL_EASE_SPRING),
				].join(", "),
			}}
		>
			{state === "complete" ? (
				<TrailCheck reduced={reduced} />
			) : (
				<span className={cn(state === "active" && "font-semibold")}>{index}</span>
			)}
		</button>
	);
}

/**
 * 完成勾: 挂上时用 pathLength 从 1 描到 0; 减弱动效直接画全.
 * useReducedMotion 首帧还没读到媒体查询 (恒为 false), 挂上即完成的勾会在这一帧被描画;
 * 所以描画前再同步问一次 prefersReducedMotion, 两者任一为真都不描.
 */
function TrailCheck({ reduced }: { readonly reduced: boolean }): JSX.Element {
	const path = useRef<SVGPathElement>(null);
	useEffect(() => {
		if (reduced || prefersReducedMotion()) return;
		path.current?.animate?.([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: TRAIL_MS.check, easing: TRAIL_EASE_SETTLE });
	}, [reduced]);
	return (
		<svg aria-hidden data-slot="step-trail-check" viewBox={`0 0 ${CHECK_BOX} ${CHECK_BOX}`} width={CHECK_PX} height={CHECK_PX} fill="none" stroke="currentColor" strokeWidth={1}>
			<path ref={path} d="M3.5 8.5l3 3 6-7" pathLength={1} strokeDasharray={1} strokeDashoffset={0} strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}
