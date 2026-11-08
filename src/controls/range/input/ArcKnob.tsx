"use client";

import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type PointerEvent } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { clamp, pushSample, snap, velocityOf, type MotionSample } from "../motion";
import { toneVar, type RangeTone } from "../tokens";
import { useFrameLoop } from "../use-frame-loop";
import { keyStep } from "./keys";
import { arcPath, polar, pointerToFraction } from "./parts/arc-geometry";
import { KNOB_DEAD_PX, KNOB_DRAG_PX, KNOB_STALE_MS, KNOB_V_FLICK, KNOB_V_FULL, stepKnob, type KnobState } from "./parts/knob-physics";

export { angleToFraction } from "./parts/arc-geometry";
export { KNOB_DEAD_PX, KNOB_DECEL, KNOB_DRAG_PX, KNOB_STALE_MS, KNOB_TAU_FOLLOW, KNOB_TAU_V, KNOB_V_FLICK, KNOB_V_FULL, coastStep, knobSpring } from "./parts/knob-physics";

/** 本文件内重复出现的字面量, 只写一次. */
const TWO = 2;
const FOREGROUND = "foreground";
const IDLE = "idle";
const NONE = "none";
const ROUND = "round";

/*
 * 行为规格参照 catalog/micro.md 的 CometDial 条目. 圆弧刻度盘: 点按跳到该处 (带 tapBounce),
 * 拖动时读数指数跟随指针, 甩出后带惯性滑行再吸附; 读数头后面拖一条随速度伸缩的彗尾.
 */

/** 速度样本保留窗口. */
const SAMPLE_WINDOW_MS = 100;
const TAIL_OPACITY = 0.35;
const LABEL_RATIO = 0.06;
const VALUE_RATIO = 0.18;
const KNOB_RATIO = 0.6;

export interface ArcKnobProps {
	readonly value?: number;
	readonly defaultValue?: number;
	readonly min?: number;
	readonly max?: number;
	readonly step?: number;
	readonly unit?: string;
	readonly label?: string;
	readonly accentTone?: RangeTone;
	readonly inkTone?: RangeTone;
	readonly size?: number;
	/** 圆弧张角 (度). */
	readonly sweep?: number;
	readonly thickness?: number;
	readonly speed?: number;
	readonly tapBounce?: number;
	readonly flickBounce?: number;
	readonly momentum?: number;
	/** 彗尾满长 (度). */
	readonly cometReach?: number;
	readonly cometWidth?: number;
	readonly disabled?: boolean;
	readonly onChange?: (value: number) => void;
	readonly onChangeEnd?: (value: number) => void;
	readonly className?: string;
}

export function ArcKnob({
	value,
	defaultValue = 62,
	min = 0,
	max = 100,
	step = 1,
	unit = "%",
	label = "Level",
	accentTone = FOREGROUND,
	inkTone = FOREGROUND,
	size = 250,
	sweep = 320,
	thickness = 5,
	speed = 25,
	tapBounce = 0.2,
	flickBounce = 0.1,
	momentum = 1,
	cometReach = 180,
	cometWidth = 12,
	disabled = false,
	onChange,
	onChangeEnd,
	className,
}: ArcKnobProps): JSX.Element {
	const reduced = useReducedMotion();
	const range = max > min ? max - min : 1;
	const toFraction = (v: number): number => clamp((v - min) / range, 0, 1);
	const [inner, setInner] = useState(() => snap(defaultValue, min, max, step));
	const current = value ?? inner;
	const loop = useFrameLoop();
	const state = useRef<KnobState>({ r: toFraction(current), v: 0, tail: 0, rPrev: toFraction(current), target: toFraction(current), mode: IDLE, bounce: tapBounce });
	const gesture = useRef<{ x: number; y: number; dragged: boolean; hist: MotionSample[] } | null>(null);
	const svg = useRef<SVGSVGElement>(null);
	const fillRef = useRef<SVGPathElement>(null);
	const tailRef = useRef<SVGPathElement>(null);
	const headRef = useRef<SVGCircleElement>(null);
	const textRef = useRef<SVGTextElement>(null);
	const lastEmit = useRef(current);
	const c = size / TWO;
	const radius = c - Math.max(thickness, cometWidth);
	const start = -sweep / TWO;

	const valueOf = (r: number): number => snap(min + r * range, min, max, step);

	const emit = (r: number): number => {
		const next = valueOf(r);
		if (next !== lastEmit.current) {
			lastEmit.current = next;
			if (value === undefined) setInner(next);
			onChange?.(next);
		}
		return next;
	};

	const paint = (): void => {
		const s = state.current;
		const head = start + s.r * sweep;
		fillRef.current?.setAttribute("d", arcPath(c, c, radius, start, head));
		const tailDeg = cometReach * clamp(Math.abs(s.tail) / KNOB_V_FULL, 0, 1) * -Math.sign(s.tail);
		tailRef.current?.setAttribute("d", arcPath(c, c, radius, head, clamp(head + tailDeg, start, start + sweep)));
		const [hx, hy] = polar(c, c, radius, head);
		headRef.current?.setAttribute("cx", String(hx));
		headRef.current?.setAttribute("cy", String(hy));
		if (textRef.current) textRef.current.textContent = `${valueOf(s.r)}${unit}`;
	};

	const tick = (dtMs: number): boolean => {
		const quiet = stepKnob(state.current, dtMs, { speed, momentum, flickBounce, snapFraction: (r) => toFraction(valueOf(r)) });
		emit(state.current.r);
		paint();
		return !quiet;
	};

	const go = (target: number, bounce: number): void => {
		const s = state.current;
		s.target = clamp(target, 0, 1);
		if (reduced) {
			Object.assign(s, { r: s.target, rPrev: s.target, v: 0, tail: 0, mode: IDLE });
			loop.stop();
			emit(s.r);
			paint();
			return;
		}
		s.bounce = bounce;
		s.mode = "spring";
		loop.start(tick);
	};

	useEffect(() => {
		if (value === undefined || value === lastEmit.current) return;
		lastEmit.current = value;
		go(toFraction(value), tapBounce);
	});

	useEffect(paint);

	const pointerFraction = (event: PointerEvent<SVGSVGElement>): number | undefined => {
		return pointerToFraction(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY, size, sweep, KNOB_DEAD_PX);
	};

	const onPointerDown = (event: PointerEvent<SVGSVGElement>): void => {
		if (disabled || event.button !== 0) return;
		event.currentTarget.setPointerCapture?.(event.pointerId);
		svg.current?.focus();
		gesture.current = { x: event.clientX, y: event.clientY, dragged: false, hist: [] };
	};

	const onPointerMove = (event: PointerEvent<SVGSVGElement>): void => {
		const g = gesture.current;
		if (!g) return;
		if (!g.dragged && Math.hypot(event.clientX - g.x, event.clientY - g.y) < KNOB_DRAG_PX) return;
		g.dragged = true;
		const at = pointerFraction(event);
		if (at === undefined) return;
		g.hist = pushSample(g.hist, { t: event.timeStamp, v: at }, SAMPLE_WINDOW_MS);
		const s = state.current;
		s.target = at;
		if (reduced) {
			go(at, tapBounce);
			return;
		}
		s.mode = "follow";
		loop.start(tick);
	};

	const onPointerEnd = (event: PointerEvent<SVGSVGElement>): void => {
		const g = gesture.current;
		if (!g) return;
		gesture.current = null;
		const s = state.current;
		if (!g.dragged) {
			const at = pointerFraction(event);
			if (at !== undefined) go(toFraction(valueOf(at)), tapBounce);
		} else {
			const v = event.type === "pointercancel" ? 0 : velocityOf(g.hist, event.timeStamp, KNOB_STALE_MS);
			if (!reduced && Math.abs(v) > KNOB_V_FLICK) {
				s.v = clamp(v, -KNOB_V_FULL, KNOB_V_FULL);
				s.mode = "coast";
				loop.start(tick);
			} else go(toFraction(valueOf(s.target)), flickBounce);
		}
		onChangeEnd?.(valueOf(s.target));
	};

	const onKeyDown = (event: KeyboardEvent<SVGSVGElement>): void => {
		if (disabled) return;
		const next = keyStep(event.key, valueOf(state.current.target), min, max, step);
		if (next === undefined) return;
		event.preventDefault();
		go(toFraction(next), tapBounce);
		onChangeEnd?.(next);
	};

	const trackWidth = Math.max(1, thickness);
	return (
		<svg
			ref={svg}
			role="slider"
			tabIndex={disabled ? -1 : 0}
			aria-label={label}
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={current}
			aria-valuetext={`${current}${unit}`}
			aria-disabled={disabled || undefined}
			data-slot="arc-knob"
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerEnd}
			onPointerCancel={onPointerEnd}
			onKeyDown={onKeyDown}
			className={cn("touch-none select-none rounded-full outline-none focus-visible:ring-1 focus-visible:ring-ring aria-disabled:opacity-50", className)}
		>
			<path d={arcPath(c, c, radius, start, start + sweep)} fill={NONE} stroke={toneVar("input")} strokeWidth={trackWidth} strokeLinecap={ROUND} />
			<path ref={tailRef} fill={NONE} stroke={toneVar(accentTone)} strokeOpacity={TAIL_OPACITY} strokeWidth={cometWidth} strokeLinecap={ROUND} />
			<path ref={fillRef} fill={NONE} stroke={toneVar(accentTone)} strokeWidth={trackWidth} strokeLinecap={ROUND} />
			<circle ref={headRef} r={trackWidth * KNOB_RATIO + trackWidth / TWO} fill={toneVar(inkTone)} />
			<text ref={textRef} x={c} y={c} textAnchor="middle" dominantBaseline="central" fill={toneVar(inkTone)} fontSize={size * VALUE_RATIO} className="tabular-nums" />
			<text x={c} y={c + size * VALUE_RATIO} textAnchor="middle" fill={toneVar(FOREGROUND)} fillOpacity={TAIL_OPACITY * TWO} fontSize={size * LABEL_RATIO}>
				{label}
			</text>
		</svg>
	);
}
