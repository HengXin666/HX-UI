/**
 * pointer 族 (DOM 件): Attract (Magnet), LockOnCursor (TargetCursor),
 * PhotoWake (ImageTrail), SheenCard (GlareHover). 规格常数, 纯函数, 渲染与减弱动效分支.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Attract, attractPull, attractSpring, outsideDistance } from "@src/surface/pointer/Attract";
import { LockOnCursor, foldQuarter, lockBox } from "@src/surface/pointer/LockOnCursor";
import { PhotoWake, wakePhase, wakeSlots } from "@src/surface/pointer/PhotoWake";
import { SheenCard, bandCenter, streakGradient, sweepMs } from "@src/surface/pointer/SheenCard";
import { ATTRACT, LOCK, SHEEN, WAKE, clamp, cosineEase, seeded, smoothstep } from "@src/surface/pointer/tokens";
import { TONE_CLASS, TONE_TOKEN } from "@src/surface/pointer/tone";
import { locate, makePointer } from "@src/surface/pointer/track";
import { mockReducedMotion, pointer, stubRect, useFakeClock } from "../helpers";

afterEach(() => {
	vi.useRealTimers();
});

describe("族内共用", () => {
	it("色调只映射到语义类与 token 名", () => {
		for (const cls of Object.values(TONE_CLASS)) expect(cls).toMatch(/^text-[a-z-]+$/);
		expect(TONE_TOKEN.muted).toBe("muted-foreground");
	});

	it("smoothstep, clamp, seeded", () => {
		expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 6);
		expect(smoothstep(1, 0, 0.25)).toBeCloseTo(1 - smoothstep(0, 1, 0.25), 6);
		expect(clamp(5, 0, 1)).toBe(1);
		const a = seeded(7);
		const b = seeded(7);
		for (let i = 0; i < 10; i += 1) expect(a()).toBe(b());
	});

	it("locate 换算宿主坐标并平滑速度", () => {
		const p = makePointer();
		const rect = { left: 10, top: 20, width: 100, height: 50 };
		expect(locate(p, rect, 20, 30, 0)).toBe(true);
		expect(p.x).toBe(10);
		locate(p, rect, 30, 30, 16);
		expect(p.vx).toBeGreaterThan(0);
		expect(locate(p, rect, 500, 30, 32)).toBe(false);
	});
});

describe("Attract", () => {
	it("默认弹簧与下限", () => {
		expect(ATTRACT.spring).toEqual({ stiffness: 170, damping: 16, mass: 1 });
		expect(attractSpring({ stiffness: 0, damping: -1, mass: 0 })).toEqual({ stiffness: 1, damping: 0, mass: 0.01 });
	});

	it("吸力: padding 前半满吸, 到 padding 落到 0", () => {
		const rect = { left: 0, top: 0, width: 100, height: 100 };
		expect(outsideDistance(rect, 50, 50)).toBe(0);
		expect(outsideDistance(rect, 130, 140)).toBe(50);
		expect(attractPull(0, 100)).toBe(1);
		expect(attractPull(50, 100)).toBe(1);
		expect(attractPull(100, 100)).toBe(0);
		expect(attractPull(75, 100)).toBeCloseTo(0.5, 6);
		expect(attractPull(5, 0)).toBe(0);
	});

	it("减弱动效: 指针靠近时直接落到偏移, 离开即归位, 回调激活变化", () => {
		const restore = mockReducedMotion(true);
		const onActiveChange = vi.fn();
		const { container } = render(<Attract onActiveChange={onActiveChange}>pull</Attract>);
		const host = container.querySelector("[data-slot=attract]") as HTMLElement;
		stubRect(host, { left: 0, top: 0, width: 100, height: 100 });
		act(() => pointer("pointermove", 90, 50));
		const inner = host.firstElementChild as HTMLElement;
		expect(inner.style.transform).toContain("translate3d(20px, 0px, 0)");
		expect(onActiveChange).toHaveBeenLastCalledWith(true);
		act(() => pointer("pointermove", 900, 900));
		expect(inner.style.transform).toContain("translate3d(0px, 0px, 0)");
		expect(onActiveChange).toHaveBeenLastCalledWith(false);
		restore();
	});
});

describe("LockOnCursor", () => {
	it("弹簧常数与自转折回", () => {
		expect(LOCK.presence).toEqual({ stiffness: 260, damping: 32, mass: 1 });
		expect(LOCK.press).toEqual({ stiffness: 900, damping: 40, mass: 1 });
		expect(foldQuarter(100)).toBeCloseTo(10, 6);
		expect(foldQuarter(-50)).toBeCloseTo(40, 6);
	});

	it("方框: 自由态居中于指针, 锁定态外扩 padding", () => {
		expect(lockBox(5, 6, 36, null, 1, 6, 0)).toEqual({ cx: 5, cy: 6, w: 36, h: 36 });
		const box = lockBox(0, 0, 36, { x: 10, y: 10, w: 20, h: 10 }, 1, 6, 0);
		expect(box).toEqual({ cx: 20, cy: 15, w: 32, h: 22 });
	});

	it("四个 1px 角标, 默认隐藏系统光标", () => {
		const { container } = render(<LockOnCursor>x</LockOnCursor>);
		expect(container.firstElementChild?.className).toContain("cursor-none");
		const corners = container.querySelectorAll(".border-current");
		expect(corners).toHaveLength(4);
		for (const c of corners) expect(c.className).not.toMatch(/border-[lrtb]-[2-9]/);
	});
});

describe("PhotoWake", () => {
	it("规格常数与进度函数可回放", () => {
		expect([WAKE.inS, WAKE.outS, WAKE.driftOutS, WAKE.threshold]).toEqual([0.4, 0.4, 0.9, 80]);
		const o = { lifetime: 0.4, drift: 0, appearScale: 1, zoom: 1, exitScale: 0.2 };
		expect(wakePhase(0, o)?.opacity).toBe(0);
		expect(wakePhase(0.4, o)?.opacity).toBeCloseTo(1, 6);
		expect(wakePhase(0.8, o)).toBeNull();
		expect(wakePhase(0.79, o)?.scale).toBeLessThan(0.3);
		expect(wakeSlots(2)).toBe(8);
		expect(wakeSlots(6)).toBe(12);
	});

	it("所有槽初始 visibility hidden (防闪)", () => {
		const { container } = render(<PhotoWake items={["a.png", "b.png"]}>x</PhotoWake>);
		const imgs = container.querySelectorAll("img");
		expect(imgs).toHaveLength(8);
		for (const img of imgs) expect(img.style.visibility).toBe("hidden");
	});
});

describe("SheenCard", () => {
	it("扫光时长按剩余行程, 下限 120", () => {
		expect(sweepMs(0, 1, 650)).toBe(650);
		expect(sweepMs(0.6, 0, 650)).toBeCloseTo(390, 6);
		expect(sweepMs(0.99, 1, 650)).toBe(SHEEN.minSweepMs);
		expect(cosineEase(0.5)).toBeCloseTo(0.5, 6);
		expect(bandCenter(0, 30)).toBe(-30);
		expect(bandCenter(1, 30)).toBe(130);
		expect(streakGradient(0.5, -45, 30, 0.6, 0.5)).toContain("currentColor 50%");
	});

	it("悬停开扫, 离开时从当前进度倒扫", () => {
		useFakeClock();
		const { container } = render(<SheenCard>card</SheenCard>);
		const card = container.firstElementChild as HTMLElement;
		const layer = card.querySelector("span") as HTMLElement;
		expect(layer.style.opacity).toBe("0");
		fireEvent.pointerEnter(card);
		act(() => vi.advanceTimersByTime(200));
		expect(layer.style.opacity).toBe("1");
		fireEvent.pointerLeave(card);
		act(() => vi.advanceTimersByTime(1000));
		expect(layer.style.opacity).toBe("0");
	});

	it("减弱动效: 不扫", () => {
		const restore = mockReducedMotion(true);
		const { container } = render(<SheenCard>card</SheenCard>);
		const card = container.firstElementChild as HTMLElement;
		fireEvent.pointerEnter(card);
		expect((card.querySelector("span") as HTMLElement).style.opacity).toBe("0");
		restore();
	});
});
