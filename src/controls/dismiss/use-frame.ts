"use client";

import { useCallback, useEffect, useRef } from "react";

const FIRST_FRAME_MS = 16;

/**
 * ENGINE-GAP: L1 没有可复用的 rAF 循环 (craft/use-press 把循环写死在自己里面).
 * tick 返回 true 继续, false 停下; wake 幂等, 循环停着时才重新排帧. 卸载时取消.
 */
export function useFrameLoop(tick: (dtMs: number, now: number) => boolean): { wake: () => void; stop: () => void } {
	const frame = useRef(0);
	const last = useRef(0);
	const latest = useRef(tick);
	latest.current = tick;

	const stop = useCallback((): void => {
		if (frame.current) cancelAnimationFrame(frame.current);
		frame.current = 0;
		last.current = 0;
	}, []);

	const run = useCallback((now: number): void => {
		const dt = last.current ? now - last.current : FIRST_FRAME_MS;
		last.current = now;
		if (latest.current(dt, now)) frame.current = requestAnimationFrame(run);
		else {
			frame.current = 0;
			last.current = 0;
		}
	}, []);

	const wake = useCallback((): void => {
		if (frame.current || typeof requestAnimationFrame === "undefined") return;
		frame.current = requestAnimationFrame(run);
	}, [run]);

	useEffect(() => stop, [stop]);
	return { wake, stop };
}
