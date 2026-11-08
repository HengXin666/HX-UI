"use client";

import { useEffect, useRef } from "react";

/** 第一帧没有上一帧时间, 按 60Hz 一帧计. */
export const FIRST_FRAME_MS = 16;

/** 返回 true 继续下一帧, false 停. 参数是毫秒间隔与当前时间戳. */
export type FrameTick = (dtMs: number, now: number) => boolean;

export interface FrameLoop {
	/** 开始或换掉每帧回调. 正在跑时只换回调, 不重置时间, 状态由调用方的 ref 保留, 中途改目标不跳变. */
	readonly start: (tick: FrameTick) => void;
	readonly stop: () => void;
	readonly running: () => boolean;
}

/*
 * ENGINE-GAP: 通用的按需 rAF 驱动. craft 的 usePress 与 Follow 各自内联一份循环, L1 没有可复用的帧循环 hook.
 * 卸载时一定取消.
 */
export function useFrameLoop(): FrameLoop {
	const frame = useRef(0);
	const last = useRef(0);
	const tick = useRef<FrameTick | null>(null);
	const api = useRef<FrameLoop | null>(null);

	if (!api.current) {
		const loop = (now: number): void => {
			const dt = last.current ? now - last.current : FIRST_FRAME_MS;
			last.current = now;
			const keep = tick.current?.(dt, now) ?? false;
			frame.current = keep ? requestAnimationFrame(loop) : 0;
			if (!keep) last.current = 0;
		};
		api.current = {
			start: (next) => {
				tick.current = next;
				if (frame.current) return;
				last.current = 0;
				frame.current = requestAnimationFrame(loop);
			},
			stop: () => {
				if (frame.current) cancelAnimationFrame(frame.current);
				frame.current = 0;
				last.current = 0;
			},
			running: () => frame.current !== 0,
		};
	}

	useEffect(() => () => api.current?.stop(), []);
	return api.current;
}

/** 无限循环的 Web Animations 片段 (转圈, 呼吸). 返回取消函数; 取消时吞掉 finished 的中止拒绝. 环境没有 animate 时什么都不做. */
export function playLoop(el: Element | null | undefined, frames: Keyframe[], options: KeyframeAnimationOptions): () => void {
	const animation = el?.animate?.(frames, { iterations: Infinity, ...options });
	animation?.finished.catch(() => undefined);
	return () => animation?.cancel();
}
