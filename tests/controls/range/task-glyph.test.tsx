/**
 * TaskGlyph: 规格常数与 UI 弹簧换算, 各状态的弧与划线, 转圈与呼吸只在非减弱动效时启动.
 */
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	GLYPH_BREATHE_MS,
	GLYPH_CHECK,
	GLYPH_CHECK_DELAY_MS,
	GLYPH_CROSS,
	GLYPH_IDLE_DASH,
	GLYPH_MORPH_MS,
	GLYPH_STRIKE_BASE_MS,
	GLYPH_STRIKE_MS,
	GLYPH_UI_SPRING_S,
	TaskGlyph,
	idleDashArray,
} from "@src/controls/range/status/TaskGlyph";
import { springFromDuration } from "@src/controls/range/motion";
import { mockReducedMotion, simulate } from "./helpers";

describe("TaskGlyph 常数", () => {
	it("落地规格常数", () => {
		expect([GLYPH_CHECK_DELAY_MS, GLYPH_STRIKE_BASE_MS, GLYPH_STRIKE_MS, GLYPH_BREATHE_MS, GLYPH_MORPH_MS]).toEqual([120, 120, 280, 1400, 300]);
		expect(GLYPH_IDLE_DASH).toBe(0.3);
		expect(GLYPH_CHECK).toBe("M7.5 12.25 10.5 15.25 16.75 8.75");
		expect(GLYPH_CROSS).toBe("M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5");
	});

	it("UI 弹簧 0.3s / bounce 0 换算后不过冲, 0.3s 内落定", () => {
		const run = simulate(springFromDuration(GLYPH_UI_SPRING_S, 0));
		expect(run.peak).toBeLessThanOrEqual(1.001);
		expect(run.settleMs).toBeLessThanOrEqual(320);
	});

	it("虚线圈: 每段实线占 0.3", () => {
		expect(idleDashArray(80, 8)).toBe("3 7");
	});
});

describe("TaskGlyph", () => {
	it("done 时划线展开, 延迟 = 120 + strikeDelay; 读屏念状态", () => {
		const { container } = render(<TaskGlyph status="done" label="写测试" strikeDelay={60} />);
		const line = container.querySelector(".origin-left") as HTMLElement;
		expect(line.style.transform).toBe("scaleX(1)");
		expect(line.style.transitionDelay).toBe("180ms");
		expect(screen.getByRole("status")).toHaveTextContent("Done: 写测试");
	});

	it("working + progress: 定量弧按比例", () => {
		const { container } = render(<TaskGlyph status="working" progress={0.5} />);
		const circle = container.querySelector("circle") as SVGCircleElement;
		const [arc, total] = (circle.getAttribute("stroke-dasharray") ?? "").split(" ").map(Number);
		expect(arc / total).toBeCloseTo(0.5, 6);
	});

	it("转圈只在非减弱动效时启动", async () => {
		const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel: () => {} }) as unknown as Animation);
		Object.defineProperty(Element.prototype, "animate", { value: animate, configurable: true, writable: true });
		render(<TaskGlyph status="working" />);
		await act(async () => {});
		expect(animate).toHaveBeenCalled();
		animate.mockClear();
		mockReducedMotion(true);
		render(<TaskGlyph status="working" />);
		await act(async () => {});
		expect(animate).not.toHaveBeenCalled();
	});
});
