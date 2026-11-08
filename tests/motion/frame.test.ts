/**
 * src/motion/frame: 按需帧循环的帧长, 唤醒, 停止, 回调内中断, 以及 React 外壳的 active 与页面隐藏.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FIRST_FRAME_MS, createFrameLoop, frameDelta, useFrameLoop, type FrameTick } from "@src/motion";
import { manualFrames } from "../controls/choice/support";

const FRAME_MS = 16;
const CAP_MS = 50;

function setHidden(value: boolean): void {
	Object.defineProperty(document, "hidden", { configurable: true, get: () => value });
}

afterEach(() => setHidden(false));

describe("frameDelta", () => {
	it("第一帧按 16ms, 之后取两帧间隔, 可选上限只钳后续帧", () => {
		expect(frameDelta(100, 0)).toBe(FIRST_FRAME_MS);
		expect(frameDelta(130, 100)).toBe(30);
		expect(frameDelta(400, 100, { maxDtMs: CAP_MS })).toBe(CAP_MS);
		expect(frameDelta(400, 0, { firstFrameMs: 20, maxDtMs: 10 })).toBe(20);
	});
});

describe("createFrameLoop", () => {
	it("tick 返回 false 停; wake 幂等; 停后再唤醒从第一帧重新计时", () => {
		const frames = manualFrames();
		const seen: number[] = [];
		let left = 3;
		const loop = createFrameLoop((dt) => {
			seen.push(dt);
			left -= 1;
			return left > 0;
		});
		loop.wake();
		loop.wake();
		frames.flush(5);
		expect(seen).toEqual([FIRST_FRAME_MS, FRAME_MS, FRAME_MS]);
		expect(loop.running()).toBe(false);
		left = 1;
		frames.flush(3);
		loop.wake();
		frames.flush(1, 40);
		expect(seen[seen.length - 1]).toBe(FIRST_FRAME_MS);
	});

	it("回调里 stop 后不再续排; 回调里 stop 再 wake 由新一轮接手", () => {
		const frames = manualFrames();
		let calls = 0;
		const loop: ReturnType<typeof createFrameLoop> = createFrameLoop(() => {
			calls += 1;
			loop.stop();
			if (calls === 1) loop.wake();
			return true;
		});
		loop.wake();
		frames.flush(4);
		expect(calls).toBe(2);
		expect(loop.running()).toBe(false);
	});

	it("start 换回调不重置时间; stop 取消排好的帧", () => {
		const frames = manualFrames();
		const a = vi.fn<FrameTick>(() => true);
		const b = vi.fn<FrameTick>(() => true);
		const loop = createFrameLoop(a, { maxDtMs: CAP_MS });
		loop.wake();
		frames.flush(1);
		loop.start(b);
		frames.flush(1, 80);
		expect(a).toHaveBeenCalledTimes(1);
		expect(b).toHaveBeenCalledWith(CAP_MS, expect.any(Number));
		loop.stop();
		expect(loop.running()).toBe(false);
	});
});

describe("useFrameLoop", () => {
	it("手动模式: 回调取最新一次渲染的, 卸载即停", () => {
		const frames = manualFrames();
		const seen: string[] = [];
		const { result, rerender, unmount } = renderHook(({ tag }) => useFrameLoop(() => {
			seen.push(tag);
			return true;
		}), { initialProps: { tag: "a" } });
		act(() => result.current.wake());
		frames.flush(1);
		rerender({ tag: "b" });
		frames.flush(1);
		expect(seen).toEqual(["a", "b"]);
		unmount();
		expect(result.current.running()).toBe(false);
	});

	it("active 自动起停, 页面隐藏时停帧, 回到前台接上", () => {
		const frames = manualFrames();
		const tick = vi.fn<FrameTick>(() => true);
		const { result, rerender } = renderHook(({ on }) => useFrameLoop(tick, { active: on, pauseWhenHidden: true }), { initialProps: { on: false } });
		act(() => result.current.wake());
		frames.flush(1);
		expect(tick).not.toHaveBeenCalled();
		rerender({ on: true });
		frames.flush(1);
		expect(tick).toHaveBeenCalledTimes(1);
		setHidden(true);
		frames.flush(2);
		expect(result.current.running()).toBe(false);
		setHidden(false);
		act(() => {
			document.dispatchEvent(new Event("visibilitychange"));
		});
		expect(result.current.running()).toBe(true);
		rerender({ on: false });
		expect(result.current.running()).toBe(false);
	});
});
