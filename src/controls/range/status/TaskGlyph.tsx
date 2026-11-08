"use client";

import { useEffect, useRef, type CSSProperties, type JSX } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { prefersReducedMotion } from "../../../primitives/motion";
import { cn } from "../../../primitives/utils";
import { SpringChannels } from "../channels";
import { springFromDuration } from "../motion";
import { DURATION_VAR, MOVE_MS, RANGE_EASE, toneVar, type RangeTone } from "../tokens";
import { playLoop, useFrameLoop } from "../use-frame-loop";

/** 本文件内重复出现的字面量, 只写一次. */
const PENDING = "pending";
const TWO = 2;
const DONE = "done";
const ERROR = "error";
const SCALE_KEY = "s";
const CURRENT_COLOR = "currentColor";
const ROUND = "round";

/*
 * 行为规格参照 catalog/micro.md 的 StatusMark 条目. 任务行前的状态图标: 待办是呼吸的虚线圈, 进行中是转动的弧
 * (给 progress 时是定量弧), 完成画对勾并给文字划线, 失败画叉.
 */

export type TaskStatus = "pending" | "working" | "done" | "error";

/** 状态切换时图标的缩放弹簧 { duration: 0.3, bounce: 0 } 与起点. */
export const GLYPH_UI_SPRING_S = 0.3;
export const GLYPH_UI_FROM = 0.85;
/** 弧长变化 (定量进度, 圈到弧) 的时长与曲线: 300ms, ease-in-out (0.77, 0, 0.175, 1). */
export const GLYPH_MORPH_MS = 300;
/** 待办虚线圈每段的实线占比. */
export const GLYPH_IDLE_DASH = 0.3;
/** 对勾 / 叉开画前的延迟, 划线额外的基础延迟 (毫秒). */
export const GLYPH_CHECK_DELAY_MS = 120;
export const GLYPH_STRIKE_BASE_MS = 120;
/** 划线展开时长与收回时长 (毫秒). */
export const GLYPH_STRIKE_MS = 280;
/** 待办呼吸周期 (毫秒). */
export const GLYPH_BREATHE_MS = 1400;
/** 图标路径 (24 视口). */
export const GLYPH_CHECK = "M7.5 12.25 10.5 15.25 16.75 8.75";
export const GLYPH_CROSS = "M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5";

/** 读屏念的状态词. 界面文案可由 statusText 覆盖. */
export const GLYPH_STATUS_TEXT: Record<TaskStatus, string> = {
	pending: "Pending",
	working: "In progress",
	done: "Done",
	error: "Failed",
};

const VIEW = 24;
const BREATHE_LOW = 0.45;

/** 虚线圈的 dasharray: 周长分成 dashes 段, 每段实线占 IDLE_DASH. */
export function idleDashArray(circumference: number, dashes: number): string {
	const seg = circumference / Math.max(1, dashes);
	return `${seg * GLYPH_IDLE_DASH} ${seg * (1 - GLYPH_IDLE_DASH)}`;
}

export interface TaskGlyphProps {
	readonly status?: TaskStatus;
	/** 0 到 1. 给了且处于 working 时画定量弧, 不转. */
	readonly progress?: number;
	readonly label?: string;
	/** 不给时跟随文字色. */
	readonly tone?: RangeTone;
	readonly doneTone?: RangeTone;
	readonly errorTone?: RangeTone;
	readonly size?: number;
	readonly strokeWidth?: number;
	readonly dashes?: number;
	readonly fontSize?: number;
	/** 转一圈的毫秒. */
	readonly spinDuration?: number;
	/** 转动弧占周长的比例. */
	readonly arcLength?: number;
	/** 对勾 / 叉的绘制时长 (毫秒). */
	readonly drawDuration?: number;
	readonly fillOpacity?: number;
	readonly strike?: boolean;
	/** 划线在对勾之后再等的毫秒. */
	readonly strikeDelay?: number;
	readonly statusText?: Partial<Record<TaskStatus, string>>;
	readonly className?: string;
	readonly style?: CSSProperties;
}

export function TaskGlyph({
	status = PENDING,
	progress,
	label,
	tone,
	doneTone = "success",
	errorTone = "destructive",
	size = 20,
	strokeWidth = TWO,
	dashes = 8,
	fontSize = 14,
	spinDuration = 1100,
	arcLength = 0.68,
	drawDuration = 240,
	fillOpacity = 0.06,
	strike = true,
	strikeDelay = 60,
	statusText,
	className,
	style,
}: TaskGlyphProps): JSX.Element {
	const reduced = useReducedMotion();
	const ring = useRef<SVGCircleElement>(null);
	const icon = useRef<SVGSVGElement>(null);
	const channels = useRef(new SpringChannels());
	const loop = useFrameLoop();
	const r = (VIEW - strokeWidth) / TWO;
	const circumference = TWO * Math.PI * r;
	const spinning = status === "working" && progress === undefined;
	const settled = status === DONE || status === ERROR;
	const color = toneVar(status === DONE ? doneTone : status === ERROR ? errorTone : tone);
	const instant = reduced ? "0ms" : undefined;

	useEffect(() => {
		if (!spinning || reduced || prefersReducedMotion()) return;
		return playLoop(ring.current, [{ strokeDashoffset: 0 }, { strokeDashoffset: -circumference }], {
			duration: spinDuration,
			easing: "linear",
		});
	}, [spinning, reduced, spinDuration, circumference]);

	useEffect(() => {
		if (status !== PENDING || reduced || prefersReducedMotion()) return;
		return playLoop(icon.current, [{ opacity: 1 }, { opacity: BREATHE_LOW }, { opacity: 1 }], {
			duration: GLYPH_BREATHE_MS,
			easing: RANGE_EASE.inOut,
		});
	}, [status, reduced]);

	useEffect(() => {
		const spring = springFromDuration(GLYPH_UI_SPRING_S, 0);
		const ch = channels.current;
		const write = (): void => {
			if (icon.current) icon.current.style.transform = `scale(${ch.value(SCALE_KEY, 1)})`;
		};
		if (reduced || prefersReducedMotion()) {
			ch.jump(SCALE_KEY, 1, spring);
			write();
			return;
		}
		ch.aim(SCALE_KEY, 1, spring, performance.now(), 0, Math.min(ch.value(SCALE_KEY, 1), GLYPH_UI_FROM));
		loop.start((dt, now) => {
			const busy = ch.step(dt, now);
			write();
			return busy;
		});
	}, [status, reduced]);

	const dashArray =
		status === PENDING
			? idleDashArray(circumference, dashes)
			: status === "working"
				? `${circumference * (progress === undefined ? arcLength : Math.min(1, Math.max(0, progress)))} ${circumference}`
				: `${circumference} 0`;
	const markPath = status === ERROR ? GLYPH_CROSS : GLYPH_CHECK;
	const strikeDelayMs = GLYPH_STRIKE_BASE_MS + strikeDelay;
	const struck = strike && status === DONE;

	return (
		<span
			role="status"
			data-slot="task-glyph"
			data-status={status}
			className={cn("inline-flex items-center gap-2", className)}
			style={{ fontSize, ...style }}
		>
			<svg
				ref={icon}
				aria-hidden
				width={size}
				height={size}
				viewBox={`0 0 ${VIEW} ${VIEW}`}
				className="shrink-0"
				style={{ color, transitionProperty: "color", transitionDuration: instant ?? DURATION_VAR.base, transitionTimingFunction: "ease" }}
			>
				<circle
					ref={ring}
					cx={VIEW / TWO}
					cy={VIEW / TWO}
					r={r}
					fill={CURRENT_COLOR}
					stroke={CURRENT_COLOR}
					strokeWidth={strokeWidth}
					strokeLinecap={status === PENDING ? "butt" : ROUND}
					strokeDasharray={dashArray}
					transform={`rotate(-90 ${VIEW / TWO} ${VIEW / TWO})`}
					style={{
						fillOpacity: settled ? fillOpacity : 0,
						transitionProperty: "fill-opacity, stroke-dasharray",
						transitionDuration: instant ?? `${DURATION_VAR.base}, ${GLYPH_MORPH_MS}ms`,
						transitionTimingFunction: `ease, ${RANGE_EASE.inOut}`,
					}}
				/>
				<path
					d={markPath}
					fill="none"
					stroke={CURRENT_COLOR}
					strokeWidth={strokeWidth}
					strokeLinecap={ROUND}
					strokeLinejoin={ROUND}
					pathLength={1}
					strokeDasharray={1}
					style={{
						strokeDashoffset: settled ? 0 : 1,
						opacity: settled ? 1 : 0,
						transitionProperty: "stroke-dashoffset, opacity",
						transitionDuration: instant ?? `${settled ? drawDuration : MOVE_MS}ms, 0ms`,
						transitionDelay: instant ?? `${settled ? GLYPH_CHECK_DELAY_MS : 0}ms, ${settled ? 0 : MOVE_MS}ms`,
						transitionTimingFunction: RANGE_EASE.out,
					}}
				/>
			</svg>
			<span className="relative">
				<span className="sr-only">{`${statusText?.[status] ?? GLYPH_STATUS_TEXT[status]}: `}</span>
				<span className={cn(struck ? "text-muted-foreground" : "text-foreground")}>{label}</span>
				{strike && label ? (
					<span
						aria-hidden
						className="absolute inset-x-0 top-1/2 h-px origin-left"
						style={{
							backgroundColor: CURRENT_COLOR,
							transform: `scaleX(${struck ? 1 : 0})`,
							transitionProperty: "transform",
							transitionDuration: instant ?? `${struck ? GLYPH_STRIKE_MS : MOVE_MS}ms`,
							transitionDelay: instant ?? `${struck ? strikeDelayMs : 0}ms`,
							transitionTimingFunction: RANGE_EASE.out,
						}}
					/>
				) : null}
			</span>
		</span>
	);
}
