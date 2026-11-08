"use client";

import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type PointerEvent } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { MS_PER_S, clamp } from "../motion";
import { QUICK_FADE_MS, toneVar, type RangeTone } from "../tokens";
import { useFrameLoop } from "../use-frame-loop";
import { TANK_BIG, TANK_STEP, stepTank, surfacePath, type TankState } from "./tank-sim";

/** 本文件内重复出现的字面量, 只写一次. */
const FOREGROUND = "foreground";

/*
 * 行为规格参照 catalog/micro.md 的 SloshGauge 条目. 玻璃容器里的液位计: 值变了液位滑过去, 液面随液位速度倾斜晃荡后静止.
 */

const FULL = 100;
const TICK_OPACITY = 0.3;

export interface TankGaugeProps {
	/** 0 到 100. */
	readonly value?: number;
	readonly defaultValue?: number;
	readonly onChange?: (value: number) => void;
	/** 为 true 时可拖动与键盘改值 (role=slider), 否则是只读的 role=meter. */
	readonly interactive?: boolean;
	readonly showValue?: boolean;
	readonly disabled?: boolean;
	readonly liquidTone?: RangeTone;
	readonly glassTone?: RangeTone;
	readonly width?: number;
	readonly height?: number;
	readonly radius?: number;
	readonly ticks?: number;
	/** 液面晃动的阻尼比, 越小晃得越久. */
	readonly viscosity?: number;
	/** 液面倾斜的幅度系数. */
	readonly tilt?: number;
	/** 浪尖幅度系数. */
	readonly splash?: number;
	readonly unit?: string;
	readonly ariaLabel?: string;
	readonly className?: string;
}

export function TankGauge({
	value,
	defaultValue = 60,
	onChange,
	interactive = false,
	showValue = true,
	disabled = false,
	liquidTone = FOREGROUND,
	glassTone = "muted",
	width = 88,
	height = 180,
	radius = 20,
	ticks = 4,
	viscosity = 0.15,
	tilt = 0.45,
	splash = 0.42,
	unit = "%",
	ariaLabel = "Level",
	className,
}: TankGaugeProps): JSX.Element {
	const reduced = useReducedMotion();
	const [inner, setInner] = useState(() => clamp(defaultValue, 0, FULL));
	const current = clamp(value ?? inner, 0, FULL);
	const sim = useRef<TankState>({ level: current, levelV: 0, tilt: 0, tiltV: 0 });
	const path = useRef<SVGPathElement>(null);
	const dragging = useRef(false);
	const loop = useFrameLoop();
	const live = interactive && !disabled;

	const paint = (): void => {
		path.current?.setAttribute("d", surfacePath(width, height, sim.current, splash));
	};

	useEffect(() => {
		if (reduced) {
			loop.stop();
			sim.current = { level: current, levelV: 0, tilt: 0, tiltV: 0 };
			paint();
			return;
		}
		loop.start((dt) => {
			const rest = stepTank(sim.current, current, dt / MS_PER_S, { viscosity, tilt, height });
			paint();
			return !rest;
		});
	}, [current, reduced, viscosity, tilt, splash, width, height]);

	const set = (next: number): void => {
		const v = Math.round(clamp(next, 0, FULL));
		if (v === current) return;
		if (value === undefined) setInner(v);
		onChange?.(v);
	};

	const fromPointer = (event: PointerEvent<HTMLDivElement>): void => {
		const rect = event.currentTarget.getBoundingClientRect();
		if (rect.height <= 0) return;
		set((1 - (event.clientY - rect.top) / rect.height) * FULL);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		if (!live) return;
		const map: Record<string, number> = {
			ArrowUp: current + TANK_STEP,
			ArrowRight: current + TANK_STEP,
			ArrowDown: current - TANK_STEP,
			ArrowLeft: current - TANK_STEP,
			PageUp: current + TANK_BIG,
			PageDown: current - TANK_BIG,
			Home: 0,
			End: FULL,
		};
		const next = map[event.key];
		if (next === undefined) return;
		event.preventDefault();
		set(next);
	};

	const text = `${Math.round(current)}${unit}`;
	return (
		<div
			role={interactive ? "slider" : "meter"}
			tabIndex={live ? 0 : undefined}
			aria-label={ariaLabel}
			aria-valuemin={0}
			aria-valuemax={FULL}
			aria-valuenow={Math.round(current)}
			aria-valuetext={text}
			aria-disabled={disabled || undefined}
			data-slot="tank-gauge"
			onKeyDown={onKeyDown}
			onPointerDown={(event) => {
				if (!live || event.button !== 0) return;
				event.currentTarget.setPointerCapture?.(event.pointerId);
				dragging.current = true;
				fromPointer(event);
			}}
			onPointerMove={(event) => {
				if (dragging.current) fromPointer(event);
			}}
			onPointerUp={() => {
				dragging.current = false;
			}}
			onPointerCancel={() => {
				dragging.current = false;
			}}
			className={cn(
				"relative inline-block touch-none select-none overflow-hidden border border-border outline-none focus-visible:border-ring",
				live && "cursor-ns-resize",
				disabled && "opacity-50",
				className,
			)}
			style={{ width, height, borderRadius: radius, backgroundColor: toneVar(glassTone) }}
		>
			<svg aria-hidden width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute inset-0">
				<path ref={path} d={surfacePath(width, height, sim.current, splash)} fill={toneVar(liquidTone)} />
				{Array.from({ length: ticks }, (_, i) => {
					const y = (height * (i + 1)) / (ticks + 1);
					return <line key={i} x1={0} x2={width / 4} y1={y} y2={y} stroke={toneVar(FOREGROUND)} strokeOpacity={TICK_OPACITY} strokeWidth={1} />;
				})}
			</svg>
			<span
				aria-hidden
				className="absolute inset-x-0 top-2 text-center text-xs font-medium tabular-nums"
				style={{
					color: toneVar(FOREGROUND),
					opacity: showValue ? 1 : 0,
					transitionProperty: "opacity",
					transitionDuration: reduced ? "0ms" : `${QUICK_FADE_MS}ms`,
					transitionTimingFunction: "ease",
				}}
			>
				{text}
			</span>
		</div>
	);
}
