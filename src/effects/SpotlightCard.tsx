"use client";

import { useCallback, useEffect, useRef, type ComponentPropsWithoutRef, type CSSProperties, type JSX, type PointerEvent } from "react";
import {
	EFFECT_DEFAULTS,
	EFFECT_HOST,
	EFFECT_LAYER,
	EFFECT_VAR,
	LOW_END_CORES,
	MEDIA_CHANGE_EVENT,
	MEDIA_FINE_HOVER,
	POINTER_MOUSE,
} from "../constants/effects";
import { MEDIA_REDUCED_MOTION } from "../constants";
import { prefersReducedMotion } from "../primitives/motion";
import { cn } from "../primitives/utils";

/** 是否值得跑指针跟随: 可悬停的精细指针, 未要求减弱动效, 且不是低核数设备. 无 matchMedia 时按否处理. */
function canTrackPointer(): boolean {
	const win = globalThis.window;
	if (!win?.matchMedia) return false;
	if (!win.matchMedia(MEDIA_FINE_HOVER).matches || prefersReducedMotion()) return false;
	const cores = win.navigator?.hardwareConcurrency;
	return cores === undefined || cores > LOW_END_CORES;
}

export interface SpotlightCardProps extends ComponentPropsWithoutRef<"div"> {
	/** 光斑直径 (px). */
	readonly size?: number;
}

/**
 * 指针跟随光斑卡片. 光斑是一层垫在内容下面的径向渐变, 圆心读 `--spot-x / --spot-y`.
 *
 * 性能取舍:
 * 1. 坐标不进 React state, 直接写元素的 CSS 变量, 指针移动不触发重渲染.
 * 2. 每帧最多写一次 (requestAnimationFrame 合并), 宿主矩形只在指针进入时读一次.
 * 3. 触屏, 触控笔, 不能悬停的设备, 减弱动效与低核数设备不跟随, 光斑保持隐藏;
 * 键盘聚焦时光斑在中心静态亮起, 不依赖指针.
 * 颜色全部在 effects.css 的 .hx-spotlight-glow 里, 这里不出现色值.
 *
 * .agents/notes/implemented/feature/2026-11-01-visual-effects.md
 */
export function SpotlightCard({
	size = EFFECT_DEFAULTS.spotSize,
	className,
	style,
	children,
	onPointerEnter,
	onPointerMove,
	onPointerLeave,
	...props
}: SpotlightCardProps): JSX.Element {
	const ref = useRef<HTMLDivElement>(null);
	const enabled = useRef(false);
	const frame = useRef(0);
	const origin = useRef({ left: 0, top: 0 });
	const point = useRef({ x: 0, y: 0 });

	useEffect(() => {
		const sync = (): void => {
			enabled.current = canTrackPointer();
		};
		sync();
		const queries = [MEDIA_FINE_HOVER, MEDIA_REDUCED_MOTION].map((query) => window.matchMedia?.(query));
		for (const media of queries) media?.addEventListener?.(MEDIA_CHANGE_EVENT, sync);
		return () => {
			for (const media of queries) media?.removeEventListener?.(MEDIA_CHANGE_EVENT, sync);
			cancelAnimationFrame(frame.current);
		};
	}, []);

	const flush = useCallback((): void => {
		frame.current = 0;
		const el = ref.current;
		if (!el) return;
		el.style.setProperty(EFFECT_VAR.spotX, `${point.current.x}px`);
		el.style.setProperty(EFFECT_VAR.spotY, `${point.current.y}px`);
	}, []);

	const handleEnter = (event: PointerEvent<HTMLDivElement>): void => {
		onPointerEnter?.(event);
		if (!enabled.current || event.pointerType !== POINTER_MOUSE) return;
		const rect = event.currentTarget.getBoundingClientRect();
		origin.current = { left: rect.left, top: rect.top };
		event.currentTarget.dataset.spot = "";
	};

	const handleMove = (event: PointerEvent<HTMLDivElement>): void => {
		onPointerMove?.(event);
		if (!enabled.current || event.pointerType !== POINTER_MOUSE) return;
		point.current = { x: event.clientX - origin.current.left, y: event.clientY - origin.current.top };
		if (frame.current === 0) frame.current = requestAnimationFrame(flush);
	};

	const handleLeave = (event: PointerEvent<HTMLDivElement>): void => {
		onPointerLeave?.(event);
		delete event.currentTarget.dataset.spot;
	};

	return (
		<div
			{...props}
			ref={ref}
			className={cn("hx-spotlight", EFFECT_HOST, className)}
			style={{ [EFFECT_VAR.spotSize]: `${size}px`, ...style } as CSSProperties}
			onPointerEnter={handleEnter}
			onPointerMove={handleMove}
			onPointerLeave={handleLeave}
		>
			<span aria-hidden className={cn(EFFECT_LAYER, "hx-spotlight-glow")} />
			{children}
		</div>
	);
}
