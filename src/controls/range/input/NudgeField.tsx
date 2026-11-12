"use client";

import { useEffect, useRef, useState, type CSSProperties, type JSX, type KeyboardEvent, type PointerEvent } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { springFromDuration } from "../../../motion/spring/fit";
import { stepSpringExact } from "../../../motion/spring/step";
import { clamp, decimalsOf, snap } from "../math";
import { DURATION_VAR, MS_PER_S, RANGE_DT_CAP_MS, RANGE_EASE, RANGE_FIT, toneVar, type RangeTone } from "../tokens";
import { KEY, keyStep, PERCENT } from "./keys";
import { NudgeDelta } from "./parts/NudgeDelta";
import { NUDGE_LEAN_PX, NUDGE_RETURN_BOUNCE, NUDGE_SIZES, nudgeMultiplier, rubberOffset, scrubTo, type NudgeSize } from "./parts/nudge-scrub";

export { NUDGE_DELTA_MS, NUDGE_LEAN_PX, NUDGE_RETURN_BOUNCE, NUDGE_SIZES, nudgeMultiplier, rubberOffset, type NudgeSize } from "./parts/nudge-scrub";

/*
 * 行为规格参照 catalog/micro.md 的 ScrubField 条目. 带标签的数值框: 按住标签左右拖动改值, 越界时橡皮筋, 松手弹回.
 */

/** 文本框里这些键留给光标移动, 不改值. */
const CARET_KEYS: ReadonlySet<string> = new Set([KEY.left, KEY.right, KEY.home, KEY.end]);

export interface NudgeFieldProps {
	readonly label?: string;
	readonly suffix?: string;
	readonly value?: number;
	readonly defaultValue?: number;
	readonly min?: number;
	readonly max?: number;
	readonly step?: number;
	readonly size?: NudgeSize;
	/** 每走一个 step 需要拖动的像素. */
	readonly sensitivity?: number;
	readonly rubberReach?: number;
	/** 松手回弹时长 (毫秒). */
	readonly returnDuration?: number;
	readonly coarseMultiplier?: number;
	readonly fineMultiplier?: number;
	readonly showDelta?: boolean;
	readonly showDirty?: boolean;
	readonly showFill?: boolean;
	readonly accentTone?: RangeTone;
	readonly chipTone?: RangeTone;
	readonly disabled?: boolean;
	readonly onChange?: (value: number) => void;
	readonly onCommit?: (value: number) => void;
	readonly className?: string;
}

export function NudgeField({
	label = "Radius",
	suffix = "px",
	value,
	defaultValue = 24,
	min = 0,
	max = 100,
	step = 1,
	size = "md",
	sensitivity = 2,
	rubberReach = 8,
	returnDuration = 300,
	coarseMultiplier = 10,
	fineMultiplier = 0.1,
	showDelta = true,
	showDirty = false,
	showFill = true,
	accentTone = "foreground",
	chipTone = "muted",
	disabled = false,
	onChange,
	onCommit,
	className,
}: NudgeFieldProps): JSX.Element {
	const reduced = useReducedMotion();
	const [inner, setInner] = useState(defaultValue);
	const current = value ?? inner;
	const [draft, setDraft] = useState<string | null>(null);
	const [dragDir, setDragDir] = useState(0);
	const [delta, setDelta] = useState<number | null>(null);
	const drag = useRef<{ x: number; start: number; last: number } | null>(null);
	const offset = useRef({ x: 0, v: 0 });
	const chip = useRef<HTMLDivElement>(null);
	const loop = useFrameLoop();
	const dims = NUDGE_SIZES[size];
	const span = max > min ? max - min : 1;
	const fineStep = step * fineMultiplier;
	const digits = Math.max(decimalsOf(step), decimalsOf(fineStep));

	const writeOffset = (x: number): void => {
		offset.current.x = x;
		if (chip.current) chip.current.style.transform = `translate3d(${x}px, 0, 0)`;
	};

	useEffect(() => () => loop.stop(), [loop]);

	const emit = (next: number): number => {
		const bounded = snap(next, min, max, fineStep);
		if (bounded !== current) {
			if (value === undefined) setInner(bounded);
			onChange?.(bounded);
		}
		return bounded;
	};

	const springBack = (): void => {
		if (reduced) {
			loop.stop();
			writeOffset(0);
			offset.current.v = 0;
			return;
		}
		const spring = springFromDuration(returnDuration / MS_PER_S, NUDGE_RETURN_BOUNCE, RANGE_FIT);
		loop.start((dt) => {
			const s = stepSpringExact(offset.current.x, offset.current.v, 0, spring, dt, RANGE_DT_CAP_MS);
			offset.current.v = s.velocity;
			writeOffset(s.current);
			return !s.resting;
		});
	};

	const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
		if (disabled || event.button !== 0) return;
		event.preventDefault();
		event.currentTarget.setPointerCapture?.(event.pointerId);
		loop.stop();
		drag.current = { x: event.clientX - offset.current.x, start: current, last: current };
		setDelta(0);
	};

	const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
		const d = drag.current;
		if (!d) return;
		const mult = nudgeMultiplier(event.shiftKey, event.altKey, coarseMultiplier, fineMultiplier);
		const dx = event.clientX - d.x;
		const { raw, overflowPx } = scrubTo(d.start, dx, sensitivity, step, mult, min, max);
		const bounded = emit(raw);
		d.last = bounded;
		setDragDir(Math.sign(dx));
		setDelta(bounded - d.start);
		writeOffset(reduced ? 0 : rubberOffset(overflowPx, rubberReach));
	};

	const endDrag = (): void => {
		const d = drag.current;
		if (!d) return;
		drag.current = null;
		setDragDir(0);
		setDelta(null);
		springBack();
		onCommit?.(d.last);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
		if (disabled) return;
		if (event.key === KEY.enter) {
			event.currentTarget.blur();
			return;
		}
		if (event.key === KEY.escape) {
			setDraft(null);
			return;
		}
		if (CARET_KEYS.has(event.key)) return;
		const mult = nudgeMultiplier(event.shiftKey, event.altKey, coarseMultiplier, fineMultiplier);
		const next = keyStep(event.key, current, min, max, step, mult);
		if (next === undefined) return;
		event.preventDefault();
		setDraft(null);
		onCommit?.(emit(next));
	};

	const commitDraft = (): void => {
		if (draft === null) return;
		const parsed = Number.parseFloat(draft);
		setDraft(null);
		if (Number.isFinite(parsed)) onCommit?.(emit(parsed));
	};

	const fill = clamp(((current - min) / span) * PERCENT, 0, PERCENT);
	const dirty = showDirty && current !== defaultValue;
	const shown = current.toFixed(digits);
	const motionStyle = (property: string, duration: string): CSSProperties => ({
		transitionProperty: property,
		transitionDuration: duration,
		transitionTimingFunction: RANGE_EASE.out,
	});

	return (
		<div
			ref={chip}
			data-slot="nudge-field"
			data-disabled={disabled || undefined}
			className={cn(
				"relative inline-flex w-48 items-center gap-2 overflow-hidden rounded-md border border-border px-2 focus-within:border-ring data-[disabled]:opacity-50",
				className,
			)}
			style={{ height: dims.height, fontSize: dims.font, backgroundColor: toneVar(chipTone) }}
		>
			{showFill ? (
				<span
					aria-hidden
					className="pointer-events-none absolute inset-y-0 left-0 opacity-10"
					style={{ width: `${fill}%`, backgroundColor: toneVar(accentTone) }}
				/>
			) : null}
			<div
				aria-hidden
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={endDrag}
				onPointerCancel={endDrag}
				className="relative flex cursor-ew-resize touch-none select-none items-center gap-1 text-muted-foreground"
				style={{ ...motionStyle("transform, color", DURATION_VAR.fast), transform: `translateX(${dragDir * NUDGE_LEAN_PX}px)`, color: dragDir ? toneVar(accentTone) : undefined }}
			>
				{label}
				{dirty ? <span className="size-1.5 rounded-full" style={{ backgroundColor: toneVar(accentTone) }} /> : null}
			</div>
			<input
				type="text"
				role="spinbutton"
				inputMode="decimal"
				aria-label={label}
				aria-valuemin={min}
				aria-valuemax={max}
				aria-valuenow={current}
				aria-valuetext={suffix ? `${shown} ${suffix}` : shown}
				disabled={disabled}
				value={draft ?? shown}
				onChange={(event) => setDraft(event.currentTarget.value)}
				onBlur={commitDraft}
				onKeyDown={onKeyDown}
				className="relative min-w-0 flex-1 bg-transparent text-right tabular-nums text-foreground outline-none"
			/>
			{suffix ? <span className="relative text-muted-foreground">{suffix}</span> : null}
			{showDelta ? <NudgeDelta delta={delta} digits={digits} reduced={reduced} /> : null}
		</div>
	);
}
