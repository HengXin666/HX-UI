"use client";

import { useEffect, useRef, useState, type CSSProperties, type JSX, type KeyboardEvent, type PointerEvent } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import type { SpringSpec } from "../../../craft/spring";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { springFromOmega } from "../../../motion/spring/fit";
import { stepSpringExact } from "../../../motion/spring/step";
import { clamp, smoothstep, snap } from "../math";
import { CRITICAL_SETTLE, DURATION_VAR, MS_PER_S, RANGE_DT_CAP_MS, toneVar, type RangeTone } from "../tokens";
import { keyStep, PERCENT } from "./keys";

/*
 * 行为规格参照 catalog/micro.md 的 WakeSlider 条目. 一排竖条组成的滑杆, 值头移动时竖条按速度隆起成尾迹.
 */

/** 头部跟随弹簧: 临界阻尼, omega = CRITICAL_SETTLE / glide. */
export const SWELL_SETTLE = CRITICAL_SETTLE;
/** 满振幅对应的速度 (百分比每秒). 规格写 320, 这里按轨道百分比计, 与像素宽度无关. */
export const SWELL_FULL_SPEED = 320;
/** 尾迹单侧最小半宽 (条数). */
export const SWELL_MIN_REACH = 1.5;
/** 振幅低于它且上一帧也低于它时不重绘. */
export const SWELL_FLAT = 0.002;
/** 速度平滑弹簧的阻尼比 (过阻尼, 不回弹), 即阻尼 = 2.5 omega. */
export const SWELL_SPEED_RATIO = 1.25;

/** 规格的 head / speed 两条弹簧换算到 stiffness / damping / mass. */
export function swellSprings(glide: number, smoothingMs: number): { head: SpringSpec; speed: SpringSpec } {
	const w0 = SWELL_SETTLE / Math.max(glide, Number.EPSILON);
	const wv = SWELL_SETTLE / Math.max(smoothingMs / MS_PER_S, Number.EPSILON);
	return {
		head: springFromOmega(w0),
		speed: springFromOmega(wv, SWELL_SPEED_RATIO),
	};
}

/** 速度到振幅. reduced 时恒为 0. */
export function swellAmplitude(velocity: number, sensitivity: number): number {
	return smoothstep(clamp((Math.abs(velocity) * sensitivity) / SWELL_FULL_SPEED, 0, 1));
}

/** 第 i 条相对头部的隆起权重. 尾随一侧拉长 (1 + skew), 迎面一侧缩短 (1 - skew). */
export function swellWeight(offset: number, direction: number, reach: number, skew: number): number {
	const trailing = direction === 0 ? false : Math.sign(offset) === -Math.sign(direction);
	const side = trailing ? reach * (1 + skew) : reach * (1 - skew);
	const r = Math.max(SWELL_MIN_REACH, side);
	return smoothstep(1 - Math.abs(offset) / r);
}

export interface SwellSliderProps {
	readonly value?: number;
	readonly defaultValue?: number;
	readonly onChange?: (value: number) => void;
	readonly min?: number;
	readonly max?: number;
	readonly step?: number;
	readonly bars?: number;
	readonly height?: number;
	readonly restHeight?: number;
	readonly gap?: number;
	readonly fillTone?: RangeTone;
	readonly trackTone?: RangeTone;
	/** 尾迹峰值的颜色. 不给时与 fillTone 相同. */
	readonly crestTone?: RangeTone;
	readonly sensitivity?: number;
	readonly reach?: number;
	readonly skew?: number;
	/** 头部跟随时长 (秒). */
	readonly glide?: number;
	/** 速度平滑时长 (毫秒). */
	readonly smoothing?: number;
	readonly showValue?: boolean;
	readonly formatValue?: (value: number) => string;
	readonly disabled?: boolean;
	readonly ariaLabel?: string;
	readonly className?: string;
}

const CREST_LEVEL = 0.5;

export function SwellSlider({
	value,
	defaultValue = 50,
	onChange,
	min = 0,
	max = 100,
	step = 1,
	bars = 32,
	height = 56,
	restHeight = 12,
	gap = 4,
	fillTone = "foreground",
	trackTone = "input",
	crestTone,
	sensitivity = 1,
	reach = 6,
	skew = 0.6,
	glide = 0.3,
	smoothing = 100,
	showValue = false,
	formatValue,
	disabled = false,
	ariaLabel = "Value",
	className,
}: SwellSliderProps): JSX.Element {
	const reduced = useReducedMotion();
	const [inner, setInner] = useState(() => snap(defaultValue, min, max, step));
	const current = value ?? inner;
	const span = max > min ? max - min : 1;
	const percentOf = (v: number): number => ((v - min) / span) * PERCENT;
	const loop = useFrameLoop();
	const barsRef = useRef<Array<HTMLSpanElement | null>>([]);
	const head = useRef({ x: percentOf(current), v: 0 });
	const speed = useRef({ x: 0, v: 0 });
	const lastAmp = useRef(0);
	const dragging = useRef(false);
	const [active, setActive] = useState(false);
	const springs = swellSprings(glide, smoothing);

	const paint = (force = false): void => {
		const amp = reduced ? 0 : swellAmplitude(speed.current.x, sensitivity);
		const flat = !force && amp < SWELL_FLAT && lastAmp.current < SWELL_FLAT;
		lastAmp.current = amp;
		if (flat) return;
		const headBar = (head.current.x / PERCENT) * bars;
		const direction = Math.sign(head.current.v);
		const rise = height - restHeight;
		barsRef.current.forEach((bar, i) => {
			if (!bar) return;
			const weight = swellWeight(i + CREST_LEVEL - headBar, direction, reach, skew) * amp;
			const filled = i + CREST_LEVEL <= headBar;
			const crest = weight > CREST_LEVEL && crestTone !== undefined;
			bar.style.transform = `scaleY(${(restHeight + rise * weight) / height})`;
			bar.style.backgroundColor = crest ? toneVar(crestTone) : toneVar(filled ? fillTone : trackTone);
		});
	};

	const settle = (): void => {
		const target = percentOf(current);
		if (reduced) {
			head.current = { x: target, v: 0 };
			speed.current = { x: 0, v: 0 };
			loop.stop();
			paint(true);
			return;
		}
		loop.start((dt) => {
			const h = stepSpringExact(head.current.x, head.current.v, target, springs.head, dt, RANGE_DT_CAP_MS);
			head.current = { x: h.current, v: h.velocity };
			const s = stepSpringExact(speed.current.x, speed.current.v, h.velocity, springs.speed, dt, RANGE_DT_CAP_MS);
			speed.current = { x: s.current, v: s.velocity };
			paint(true);
			return !(h.resting && Math.abs(speed.current.x) < SWELL_FLAT);
		});
	};

	useEffect(settle, [current, reduced, glide, smoothing, bars, fillTone, trackTone, crestTone]);

	const commit = (raw: number): void => {
		const next = snap(raw, min, max, step);
		if (next === current) return;
		if (value === undefined) setInner(next);
		onChange?.(next);
	};

	const fromPointer = (event: PointerEvent<HTMLDivElement>): void => {
		const rect = event.currentTarget.getBoundingClientRect();
		if (rect.width <= 0) return;
		commit(min + clamp((event.clientX - rect.left) / rect.width, 0, 1) * span);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		if (disabled) return;
		const next = keyStep(event.key, current, min, max, step);
		if (next === undefined) return;
		event.preventDefault();
		commit(next);
	};

	const label = formatValue ? formatValue(current) : String(current);
	const rowStyle: CSSProperties = { height, gap };

	return (
		<div data-slot="swell-slider" className={cn("inline-flex w-full flex-col gap-2", className)}>
			<div
				role="slider"
				tabIndex={disabled ? -1 : 0}
				aria-label={ariaLabel}
				aria-valuemin={min}
				aria-valuemax={max}
				aria-valuenow={current}
				aria-valuetext={label}
				aria-disabled={disabled || undefined}
				data-active={active || undefined}
				onKeyDown={onKeyDown}
				onPointerDown={(event) => {
					if (disabled || event.button !== 0) return;
					event.currentTarget.setPointerCapture?.(event.pointerId);
					dragging.current = true;
					setActive(true);
					fromPointer(event);
				}}
				onPointerMove={(event) => {
					if (dragging.current) fromPointer(event);
				}}
				onPointerUp={() => {
					dragging.current = false;
					setActive(false);
				}}
				onPointerCancel={() => {
					dragging.current = false;
					setActive(false);
				}}
				className="flex w-full cursor-pointer touch-none select-none items-center rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-ring aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
				style={rowStyle}
			>
				{Array.from({ length: bars }, (_, i) => (
					<span
						key={i}
						ref={(node) => {
							barsRef.current[i] = node;
						}}
						aria-hidden
						className="h-full flex-1 origin-center rounded-full"
						style={{
							transform: `scaleY(${restHeight / height})`,
							backgroundColor: toneVar(i + CREST_LEVEL <= (percentOf(current) / PERCENT) * bars ? fillTone : trackTone),
							transitionProperty: "background-color",
							transitionDuration: active ? "0ms" : DURATION_VAR.fast,
							transitionTimingFunction: "ease",
						}}
					/>
				))}
			</div>
			{showValue ? <output className="text-xs tabular-nums text-muted-foreground">{label}</output> : null}
		</div>
	);
}
