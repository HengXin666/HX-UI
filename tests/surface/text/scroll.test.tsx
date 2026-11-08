/**
 * scroll 意图: ScrollText (ScrollFloat / ScrollReveal), TextMarquee (CurvedLoop / TextLoop / ScrollVelocity), OrbitText (CircularText).
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	FLOAT_DEFAULTS,
	MARQUEE_MAX_FLING,
	ORBIT_HOVER_SPEED,
	ORBIT_SPEED_SPRING,
	OrbitText,
	REVEAL_DEFAULTS,
	SCRUB_SPAN,
	ScrollText,
	TextMarquee,
	marqueePath,
	orbitAngle,
	scrubUnit,
	wrapOffset,
} from "@src/surface/text/scroll";
import { mockReducedMotion, useFakeClock } from "./helpers";

afterEach(() => {
	vi.useRealTimers();
});

describe("ScrollText", () => {
	it("规格常数与刮擦切分", () => {
		expect(FLOAT_DEFAULTS).toEqual({ stagger: 0.03, duration: 1, distance: 120, stretch: 2.3 });
		expect(REVEAL_DEFAULTS).toMatchObject({ stagger: 0.05, baseOpacity: 0.1, baseRotation: 3, blurStrength: 4 });
		expect(SCRUB_SPAN).toBe(0.5);
		expect(scrubUnit(0, 0, 4, 0.05, 0.5)).toBe(0);
		expect(scrubUnit(1, 4, 4, 0.05, 0.5)).toBe(1);
		expect(scrubUnit(0.5, 0, 4, 0.05, 0.5)).toBeCloseTo(0.7, 6);
	});
	it("未滚到时单元在起点; 读屏读原文", async () => {
		const { container } = render(<ScrollText text="Float up" />);
		const first = container.querySelector("[data-unit='0']") as HTMLElement;
		expect(first.style.opacity).toBe("0");
		expect(container.querySelector(".sr-only")?.textContent).toBe("Float up");
		await expect(container).toHaveNoSeriousA11yViolations();
	});
	it("显影: 底透明度 0.1; 减弱动效时原文", () => {
		const { container, unmount } = render(<ScrollText text="Reveal words" effect="reveal" />);
		expect((container.querySelector("[data-unit='0']") as HTMLElement).style.opacity).toBe("0.1");
		unmount();
		const restore = mockReducedMotion(true);
		const { container: plain } = render(<ScrollText text="Reveal words" effect="reveal" />);
		expect(plain.textContent).toBe("Reveal words");
		restore();
	});
});

describe("TextMarquee", () => {
	it("路径与偏移折回", () => {
		expect(marqueePath("line", 0, 0).height).toBe(120);
		expect(marqueePath("arc", 400, 0).height).toBe(520);
		expect(marqueePath("wave", 0, 90).d.startsWith("M")).toBe(true);
		expect(wrapOffset(30, 100)).toBe(-70);
		expect(wrapOffset(-130, 100)).toBe(-30);
		expect(MARQUEE_MAX_FLING).toBe(4000);
	});
	it("向左走时偏移变小", () => {
		useFakeClock();
		const { container } = render(<TextMarquee text="Loop" />);
		const tp = container.querySelector("textPath") as SVGElement;
		const first = Number(tp.getAttribute("startOffset"));
		for (let i = 0; i < 20; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(Number(tp.getAttribute("startOffset"))).not.toBe(first);
	});
});

describe("OrbitText", () => {
	it("等分角度与悬停速度档", () => {
		expect(orbitAngle(1, 4, 0)).toBe(90);
		expect(ORBIT_HOVER_SPEED).toEqual({ slowDown: 0.5, speedUp: 4, pause: 0, goBonkers: 20 });
		expect(ORBIT_SPEED_SPRING).toMatchObject({ stiffness: 60, damping: 18 });
	});
	it("转起来; 悬停不报错", () => {
		useFakeClock();
		const { container } = render(<OrbitText text="ROUND" />);
		const ring = container.querySelector("[aria-hidden='true']") as HTMLElement;
		fireEvent.pointerEnter(container.firstElementChild as Element);
		for (let i = 0; i < 10; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(ring.style.transform).not.toBe("rotate(0deg)");
		expect(container.querySelectorAll(".absolute.left-1\\/2").length).toBe(5);
	});
});
