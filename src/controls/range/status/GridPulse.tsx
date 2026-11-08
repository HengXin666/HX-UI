"use client";

import { useEffect, useRef, useState, type CSSProperties, type JSX } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { prefersReducedMotion } from "../../../primitives/motion";
import { cn } from "../../../primitives/utils";
import { MS_PER_S } from "../motion";
import { playLoop } from "../use-frame-loop";
import { DURATION_VAR, MOVE_MS, RANGE_EASE, toneVar, type RangeTone } from "../tokens";
import { DEFAULT_GRID_PATTERN, GRID_MARKS, GRID_REDUCED_MS, gridLevels, type GridPattern, type GridSize } from "./grid-patterns";

/** 本文件内重复出现的字面量, 只写一次. */
const DONE = "done";

/*
 * 行为规格参照 catalog/micro.md 的 LatticeLoader 条目. 小点阵加文字的长任务状态: 进行中点阵按走法逐帧点亮并计时,
 * 完成显示对勾, 失败显示叉, 文字换成 "用时" 文案.
 */

export type GridStatus = "working" | "done" | "error";

/** 计时显示的刷新间隔 (毫秒). */
const TIMER_TICK_MS = 100;
/** 减弱动效呼吸的最暗不透明度. */
const BREATHE_LOW = 0.4;
/** 完成或失败后未点亮格子缩小到的比例. */
const MARK_IDLE_SCALE = 0.8;

/** 秒数格式化成 "3.2s". */
export function formatElapsed(seconds: number): string {
	return `${Math.max(0, seconds).toFixed(1)}s`;
}

export interface GridPulseProps {
	readonly label?: string;
	readonly doneLabel?: string;
	readonly errorLabel?: string;
	readonly status?: GridStatus;
	/** 不给时按 grid 取默认走法. */
	readonly pattern?: GridPattern;
	readonly grid?: GridSize;
	readonly shape?: "round" | "square";
	/** 不给时跟随文字色. */
	readonly tone?: RangeTone;
	readonly doneTone?: RangeTone;
	readonly errorTone?: RangeTone;
	readonly cellSize?: number;
	readonly gap?: number;
	readonly fontSize?: number;
	/** 每帧时长 (毫秒). */
	readonly step?: number;
	readonly idleOpacity?: number;
	readonly glow?: boolean;
	readonly glowTone?: RangeTone;
	readonly showTimer?: boolean;
	/** 外部给定的已用秒数. 不给时组件自己从进入 working 开始计. */
	readonly elapsed?: number;
	readonly className?: string;
	readonly style?: CSSProperties;
}

export function GridPulse({
	label = "Thinking",
	doneLabel = "Done in",
	errorLabel = "Failed after",
	status = "working",
	pattern,
	grid = 3,
	shape = "round",
	tone,
	doneTone = "success",
	errorTone = "destructive",
	cellSize = 6,
	gap = 2,
	fontSize = 14,
	step = 90,
	idleOpacity = 0.15,
	glow = false,
	glowTone,
	showTimer = true,
	elapsed,
	className,
	style,
}: GridPulseProps): JSX.Element {
	const reduced = useReducedMotion();
	const [frame, setFrame] = useState(0);
	const [own, setOwn] = useState(0);
	const started = useRef(0);
	const gridRef = useRef<HTMLDivElement>(null);
	const working = status === "working";
	const walk = pattern ?? DEFAULT_GRID_PATTERN[grid];

	useEffect(() => {
		if (!working || reduced || prefersReducedMotion()) return;
		const id = window.setInterval(() => setFrame((f) => f + 1), step);
		return () => window.clearInterval(id);
	}, [working, reduced, step]);

	useEffect(() => {
		if (!working || elapsed !== undefined) return;
		started.current = performance.now();
		setOwn(0);
		const id = window.setInterval(() => setOwn((performance.now() - started.current) / MS_PER_S), TIMER_TICK_MS);
		return () => window.clearInterval(id);
	}, [working, elapsed]);

	useEffect(() => {
		if (!working || !reduced) return;
		return playLoop(gridRef.current, [{ opacity: BREATHE_LOW }, { opacity: 1 }, { opacity: BREATHE_LOW }], {
			duration: GRID_REDUCED_MS,
			easing: RANGE_EASE.inOut,
		});
	}, [working, reduced]);

	const seconds = elapsed ?? own;
	const marks = status === DONE ? GRID_MARKS[grid].done : status === "error" ? GRID_MARKS[grid].error : [];
	const levels = working && !reduced ? gridLevels(grid, walk, frame) : [];
	const markTone = status === DONE ? doneTone : status === "error" ? errorTone : tone;
	const color = toneVar(markTone);
	const text = working ? label : `${status === DONE ? doneLabel : errorLabel} ${formatElapsed(seconds)}`;

	return (
		<div
			role="status"
			aria-live="polite"
			data-slot="grid-pulse"
			data-status={status}
			className={cn("inline-flex items-center gap-2", className)}
			style={{ fontSize, ...style }}
		>
			<div
				ref={gridRef}
				aria-hidden
				className="grid shrink-0"
				style={{
					gridTemplateColumns: `repeat(${grid}, ${cellSize}px)`,
					gap,
					filter: glow ? `drop-shadow(0 0 ${cellSize / 2}px ${toneVar(glowTone ?? markTone)})` : "none",
					transitionProperty: "filter",
					transitionDuration: DURATION_VAR.base,
					transitionTimingFunction: "ease",
				}}
			>
				{Array.from({ length: grid * grid }, (_, i) => {
					const lit = working ? (reduced ? 1 : (levels[i] ?? 0)) : marks.includes(i) ? 1 : 0;
					const opacity = idleOpacity + (1 - idleOpacity) * lit;
					return (
						<span
							key={i}
							className={shape === "round" ? "rounded-full" : "rounded-[1px]"}
							style={{
								width: cellSize,
								height: cellSize,
								backgroundColor: color,
								opacity,
								transform: !working && lit === 0 ? `scale(${MARK_IDLE_SCALE})` : "scale(1)",
								transitionProperty: "opacity, transform, background-color",
								transitionDuration: reduced ? "0ms" : `${MOVE_MS}ms, ${MOVE_MS}ms, ${DURATION_VAR.base}`,
								transitionTimingFunction: `${RANGE_EASE.out}, ${RANGE_EASE.out}, ease`,
							}}
						/>
					);
				})}
			</div>
			<span className="text-foreground">{text}</span>
			{showTimer && working ? (
				<span aria-hidden className="tabular-nums text-muted-foreground">
					{formatElapsed(seconds)}
				</span>
			) : null}
		</div>
	);
}
