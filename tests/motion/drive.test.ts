/**
 * src/motion/drive: 弹簧轴, 命名通道, 自带帧循环的驱动与两个 React 外壳. 换目标保留位置与速度, 延迟起步, 减弱动效直接落定.
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	SpringChannels,
	SpringDriver,
	makeAxis,
	snapAxis,
	springFromDuration,
	stepAxis,
	stepSpringExact,
	useDrivenValue,
	useSpringChannels,
} from "@src/motion";
import { manualFrames } from "../controls/choice/support";

const FRAME_MS = 16;
const SETTLE_FRAMES = 200;
const GLIDE = springFromDuration(0.3, 0);
const FAR = 100;
const DELAY_MS = 40;

describe("SpringDriver", () => {
	it("中途换目标时保留位置与速度, 不跳回起点", () => {
		const frames = manualFrames();
		const driver = new SpringDriver(0, () => {}, stepSpringExact);
		driver.to(FAR, GLIDE);
		frames.flush(6);
		const mid = driver.value;
		const velocity = driver.velocity;
		expect(mid).toBeGreaterThan(0);
		expect(velocity).toBeGreaterThan(0);
		driver.to(0, GLIDE);
		expect(driver.velocity).toBe(velocity);
		expect(driver.value).toBe(mid);
		frames.flush(1);
		expect(driver.value).toBeGreaterThan(mid * 0.5);
		frames.flush(SETTLE_FRAMES);
		expect(driver.value).toBe(0);
		expect(driver.moving).toBe(false);
	});

	it("jump 直接落值并停表", () => {
		const frames = manualFrames();
		const driver = new SpringDriver(0, () => {});
		driver.to(FAR, GLIDE);
		frames.flush(2);
		driver.jump(10);
		expect(driver.value).toBe(10);
		expect(driver.velocity).toBe(0);
		expect(driver.moving).toBe(false);
	});

	it("delayMs 内不动; onRest 里再起一段能接着跑", () => {
		const frames = manualFrames();
		const driver = new SpringDriver(0, () => {}, stepSpringExact);
		const back = vi.fn(() => driver.to(0, GLIDE));
		driver.to(1, GLIDE, { delayMs: DELAY_MS, onRest: back });
		frames.flush(2);
		expect(driver.value).toBe(0);
		expect(driver.moving).toBe(true);
		frames.flush(SETTLE_FRAMES);
		expect(back).toHaveBeenCalledTimes(1);
		expect(driver.goal).toBe(0);
		expect(driver.value).toBe(0);
	});
});

describe("SpringChannels", () => {
	it("延迟通道在等待时算忙但不动; from 起步清速度, velocity 覆盖速度", () => {
		const ch = new SpringChannels(stepSpringExact);
		ch.jump("a", 0, GLIDE);
		ch.aim("a", 1, GLIDE, { now: 0, delayMs: DELAY_MS });
		expect(ch.step(FRAME_MS, FRAME_MS)).toBe(true);
		expect(ch.value("a")).toBe(0);
		ch.step(FRAME_MS, DELAY_MS + FRAME_MS);
		expect(ch.value("a")).toBeGreaterThan(0);
		ch.aim("a", 1, GLIDE, { from: 0 });
		expect(ch.velocity("a")).toBe(0);
		ch.aim("a", 0, GLIDE, { velocity: -3 });
		expect(ch.velocity("a")).toBe(-3);
		expect(ch.value("missing", 7)).toBe(7);
	});

	it("step 报的是本帧开始时是否忙, active 报推进后是否还没落定", () => {
		const ch = new SpringChannels();
		ch.jump("a", 1 - 1e-5, GLIDE);
		ch.aim("a", 1, GLIDE);
		expect(ch.step(FRAME_MS, 0)).toBe(true);
		expect(ch.active()).toBe(false);
		expect(ch.step(FRAME_MS, 0)).toBe(false);
	});

	it("retune 只换弹簧, 位置与速度不动", () => {
		const ch = new SpringChannels();
		ch.jump("a", 0, GLIDE);
		ch.aim("a", 1, GLIDE, { velocity: 2 });
		ch.retune("a", springFromDuration(0.6, 0));
		expect(ch.velocity("a")).toBe(2);
		expect(ch.value("a")).toBe(0);
	});
});

describe("Axis", () => {
	it("stepAxis 写回位置与速度, snapAxis 落定清速度", () => {
		const axis = makeAxis();
		axis.target = 1;
		const step = stepAxis(axis, GLIDE, FRAME_MS);
		expect(axis.current).toBe(step.current);
		expect(axis.velocity).toBeGreaterThan(0);
		snapAxis(axis, 0.5);
		expect(axis).toEqual({ current: 0.5, velocity: 0, target: 0.5 });
	});
});

describe("useSpringChannels", () => {
	it("每帧把全部当前值交给 render, 落定后停帧; reduced 时 to 直接落到目标", () => {
		const frames = manualFrames();
		const render = vi.fn();
		const specs = { x: GLIDE, y: GLIDE };
		const { result, rerender } = renderHook(({ reduced }) => useSpringChannels({ x: 0, y: 0 }, specs, render, reduced), { initialProps: { reduced: false } });
		act(() => result.current.to("x", 1, 2));
		expect(result.current.velocity("x")).toBe(2);
		frames.flush(SETTLE_FRAMES);
		expect(result.current.get("x")).toBe(1);
		expect(render).toHaveBeenLastCalledWith({ x: 1, y: 0 });
		const calls = render.mock.calls.length;
		frames.flush(2);
		expect(render.mock.calls.length).toBe(calls);
		rerender({ reduced: true });
		act(() => result.current.to("y", FAR));
		expect(render).toHaveBeenLastCalledWith({ x: 1, y: FAR });
		act(() => result.current.jump("x", 0));
		expect(result.current.get("x")).toBe(0);
	});
});

describe("useDrivenValue", () => {
	it("弹簧落定回调一次; 补间可暂停; reduced 时直接落定", () => {
		const frames = manualFrames();
		const settle = vi.fn();
		const { result, rerender } = renderHook(({ reduced }) => useDrivenValue(0, reduced, settle), { initialProps: { reduced: false } });
		act(() => result.current.spring(1, GLIDE));
		act(() => frames.flush(SETTLE_FRAMES));
		expect(result.current.read()).toBe(1);
		expect(settle).toHaveBeenCalledWith(1);
		act(() => result.current.tween(0, FRAME_MS * 4));
		act(() => frames.flush(1));
		const mid = result.current.read();
		act(() => result.current.pause(true));
		act(() => frames.flush(4));
		expect(result.current.read()).toBe(mid);
		act(() => result.current.pause(false));
		act(() => frames.flush(4));
		expect(result.current.read()).toBe(0);
		rerender({ reduced: true });
		act(() => result.current.spring(FAR, GLIDE));
		expect(result.current.read()).toBe(FAR);
		expect(settle).toHaveBeenLastCalledWith(FAR);
	});
});
