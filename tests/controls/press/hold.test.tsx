/**
 * hold 子族: HoldConfirm (HoldButton), GraceCommit (FuseButton), SwipeConfirm (SlideCommit).
 * 常数, 交互回调与减弱动效分支.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HOLD_DEFAULTS, HOLD_HIT_PAD, HOLD_PULSE_MS, HOLD_TAP_MS, HoldConfirm } from "@src/controls/press/hold/HoldConfirm";
import { GRACE_DEFAULTS, GRACE_FUSE_PX, GraceCommit } from "@src/controls/press/hold/GraceCommit";
import {
	SWIPE_DEFAULTS,
	SWIPE_MIN_PENDING,
	SWIPE_PAD,
	SWIPE_SQUASH_DIV,
	SWIPE_SQUASH_MAX,
	SWIPE_SWELL,
	SWIPE_TIMING,
	SwipeConfirm,
	swipeSquash,
} from "@src/controls/press/hold/SwipeConfirm";
import { PRESS_EASE_OUT, transitionOf } from "@src/controls/press/tokens";
import { mockReducedMotion, useFakeClock } from "./helpers";

afterEach(() => {
	vi.useRealTimers();
});

describe("HoldConfirm", () => {
	it("规格常数逐项落地", () => {
		expect(HOLD_TAP_MS).toBe(250);
		expect(HOLD_HIT_PAD).toBe(10);
		expect(HOLD_PULSE_MS).toBe(600);
		expect(HOLD_DEFAULTS).toEqual({ holdTime: 2000, releaseTime: 200, pressScale: 0.97, waveAmplitude: 6, resetAfter: 1200, radius: 14 });
		expect(PRESS_EASE_OUT).toBe("cubic-bezier(0.23, 1, 0.32, 1)");
	});

	it("轻点走 onTap, 按满 holdTime 走 onHold", () => {
		useFakeClock();
		const onTap = vi.fn();
		const onHold = vi.fn();
		render(<HoldConfirm onTap={onTap} onHold={onHold} holdTime={400} />);
		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("type", "button");
		fireEvent.pointerDown(button, { button: 0 });
		act(() => vi.advanceTimersByTime(100));
		fireEvent.pointerUp(button);
		expect(onTap).toHaveBeenCalledTimes(1);
		expect(onHold).not.toHaveBeenCalled();
		act(() => vi.advanceTimersByTime(500));
		fireEvent.pointerDown(button, { button: 0 });
		act(() => vi.advanceTimersByTime(600));
		expect(onHold).toHaveBeenCalledTimes(1);
		expect(button).toHaveAttribute("data-state", "done");
	});

	it("键盘按住 Space 同样能确认", () => {
		useFakeClock();
		const onHold = vi.fn();
		render(<HoldConfirm onHold={onHold} holdTime={300} />);
		const button = screen.getByRole("button");
		fireEvent.keyDown(button, { key: " " });
		act(() => vi.advanceTimersByTime(500));
		expect(onHold).toHaveBeenCalledTimes(1);
	});

	it("减弱动效: 按下不缩放, 过渡为 none", () => {
		const restore = mockReducedMotion(true);
		render(<HoldConfirm />);
		const button = screen.getByRole("button");
		fireEvent.pointerDown(button, { button: 0 });
		expect(button.style.transform).toBe("");
		expect(button.style.transition).toBe("none");
		restore();
	});

	it("transitionOf 只列具体属性, 减弱动效返回 none", () => {
		expect(transitionOf([["transform", 160, PRESS_EASE_OUT]], false)).toBe(`transform 160ms ${PRESS_EASE_OUT}`);
		expect(transitionOf([["opacity", 400, "ease", 200]], false)).toBe("opacity 400ms ease 200ms");
		expect(transitionOf([["transform", 160, PRESS_EASE_OUT]], true)).toBe("none");
	});
});

describe("GraceCommit", () => {
	it("规格常数: radius 22, undoWindow 4000, crossfade 200; 引线 1px", () => {
		expect(GRACE_DEFAULTS).toEqual({ radius: 22, undoWindow: 4000, crossfadeMs: 200 });
		expect(GRACE_FUSE_PX).toBe(1);
	});

	it("按下提交并点燃引线, 窗口内再按撤销", () => {
		const onCommit = vi.fn();
		const onUndo = vi.fn();
		const onPhaseChange = vi.fn();
		render(<GraceCommit onCommit={onCommit} onUndo={onUndo} onPhaseChange={onPhaseChange} />);
		const button = screen.getByRole("button");
		fireEvent.click(button);
		expect(onCommit).toHaveBeenCalledTimes(1);
		expect(button).toHaveAttribute("data-phase", "armed");
		fireEvent.click(button);
		expect(onUndo).toHaveBeenCalledTimes(1);
		expect(onPhaseChange.mock.calls.map((c) => c[0])).toEqual(["armed", "idle"]);
	});

	it("commitOn=end: 引线烧完才提交; 悬停暂停计时", () => {
		useFakeClock();
		const onCommit = vi.fn();
		const onFuseEnd = vi.fn();
		render(<GraceCommit commitOn="end" undoWindow={300} onCommit={onCommit} onFuseEnd={onFuseEnd} />);
		const button = screen.getByRole("button");
		fireEvent.click(button);
		fireEvent.pointerEnter(button);
		act(() => vi.advanceTimersByTime(600));
		expect(onCommit).not.toHaveBeenCalled();
		fireEvent.pointerLeave(button);
		act(() => vi.advanceTimersByTime(600));
		expect(onFuseEnd).toHaveBeenCalledTimes(1);
		expect(onCommit).toHaveBeenCalledTimes(1);
		expect(button).toHaveAttribute("data-phase", "idle");
	});

	it("减弱动效: 引线照常计时, 按下不缩放", () => {
		useFakeClock();
		const restore = mockReducedMotion(true);
		const onFuseEnd = vi.fn();
		render(<GraceCommit undoWindow={200} onFuseEnd={onFuseEnd} pauseOnHover={false} />);
		const button = screen.getByRole("button");
		fireEvent.pointerDown(button);
		expect(button.style.transform).toBe("");
		fireEvent.click(button);
		act(() => vi.advanceTimersByTime(400));
		expect(onFuseEnd).toHaveBeenCalledTimes(1);
		restore();
	});
});

describe("SwipeConfirm", () => {
	it("规格常数逐项落地", () => {
		expect([SWIPE_PAD, SWIPE_SQUASH_MAX, SWIPE_SQUASH_DIV, SWIPE_SWELL, SWIPE_MIN_PENDING]).toEqual([4, 0.08, 110, 1.03, 300]);
		expect(SWIPE_TIMING).toMatchObject({ reduceReturnMs: 200, shownMs: 200, shownDelayMs: 120, spinMs: 120, landingMs: 460, landingAt: 0.62, landingDelayMs: 100, shakeMs: 450, breatheMs: 1400 });
		expect(SWIPE_DEFAULTS).toEqual({ width: 280, height: 56, radius: 28, speed: 50, returnBounce: 0.38, landingDip: 0.026, holdMs: 1500 });
		expect(swipeSquash(110 * 4)).toBeCloseTo(0.04, 6);
		expect(swipeSquash(-100000)).toBe(SWIPE_SQUASH_MAX);
	});

	it("键盘 Enter 提交: 等待态至少 MIN_PENDING, 再停 holdMs 后 onDone", async () => {
		useFakeClock();
		const onConfirm = vi.fn();
		const onDone = vi.fn();
		const { container } = render(<SwipeConfirm onConfirm={onConfirm} onDone={onDone} holdMs={500} />);
		const thumb = screen.getByRole("button", { name: "Slide to pay" });
		fireEvent.keyDown(thumb, { key: "Enter" });
		expect(onConfirm).toHaveBeenCalledTimes(1);
		const track = container.querySelector("[data-slot=swipe-confirm]");
		expect(track).toHaveAttribute("data-state", "pending");
		await act(async () => vi.advanceTimersByTimeAsync(SWIPE_MIN_PENDING + 20));
		expect(track).toHaveAttribute("data-state", "done");
		await act(async () => vi.advanceTimersByTimeAsync(520));
		expect(onDone).toHaveBeenCalledTimes(1);
	});

	it("onConfirm 失败走 onError", async () => {
		useFakeClock();
		const onError = vi.fn();
		render(<SwipeConfirm onConfirm={() => Promise.reject(new Error("x"))} onError={onError} holdMs={100} />);
		fireEvent.keyDown(screen.getByRole("button"), { key: " " });
		await act(async () => vi.advanceTimersByTimeAsync(SWIPE_MIN_PENDING + 200));
		expect(onError).toHaveBeenCalledTimes(1);
	});

	it("减弱动效: 拖动不压扁, 拇指只平移", () => {
		const restore = mockReducedMotion(true);
		render(<SwipeConfirm />);
		const thumb = screen.getByRole("button");
		fireEvent.pointerDown(thumb, { button: 0, clientX: 0 });
		fireEvent.pointerMove(thumb, { clientX: 60 });
		expect(thumb.style.transform).toContain("translateX(60px)");
		expect(thumb.style.transform).toContain("scale(1, 1)");
		restore();
	});
});
