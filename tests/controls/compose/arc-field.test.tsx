/**
 * compose/input: ArcField (规格 CurvedInput). 曲线几何, 提交, 直排 / 曲线切换, 减弱动效.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ARC_DEG, ARC_SHADOWS, ArcField, arcAngle, arcMeanSag, arcOutline, arcSag, arcSlice } from "@src/controls/compose/input/ArcField";
import { mockReducedMotion } from "../choice/support";

describe("ArcField 几何", () => {
	it("规格常数", () => {
		expect(ARC_DEG).toBeCloseTo(57.2958, 3);
		expect(ARC_SHADOWS.sm).toEqual([5, 12, 0.3]);
		expect(ARC_SHADOWS.md).toEqual([10, 24, 0.4]);
		expect(ARC_SHADOWS.lg).toEqual([16, 40, 0.52]);
	});

	it("两端不垂, 中点垂 bend, 切线角左右对称", () => {
		expect(arcSag(0, 400, 28)).toBe(0);
		expect(arcSag(400, 400, 28)).toBe(0);
		expect(arcSag(200, 400, 28)).toBe(28);
		expect(arcAngle(200, 400, 28)).toBeCloseTo(0);
		expect(arcAngle(100, 400, 28)).toBeCloseTo(-arcAngle(300, 400, 28));
		expect(arcAngle(0, 400, 28)).toBeCloseTo(Math.atan((4 * 28) / 400) * ARC_DEG);
	});

	it("子段贝塞尔落在曲线上, 平均下垂在两端与峰值之间", () => {
		const d = arcSlice(0, 400, 32, 400, 28);
		expect(d).toBe("M0.00,32.00 Q200.00,88.00 400.00,32.00");
		const mean = arcMeanSag(0, 400, 400, 28);
		expect(mean).toBeCloseTo((28 * 2) / 3);
		expect(arcOutline(450, 64, 28, 18, 1).endsWith("Z")).toBe(true);
	});
});

describe("ArcField", () => {
	it("输入回调, Enter 与按钮都提交当前值", () => {
		mockReducedMotion(false);
		const onChange = vi.fn();
		const onSubmit = vi.fn();
		render(<ArcField onChange={onChange} onSubmit={onSubmit} />);
		const box = screen.getByRole("textbox", { name: "Enter your email" });
		fireEvent.change(box, { target: { value: "a@b.co" } });
		expect(onChange).toHaveBeenLastCalledWith("a@b.co");
		fireEvent.keyDown(box, { key: "Enter" });
		expect(onSubmit).toHaveBeenLastCalledWith("a@b.co");
		const button = screen.getByRole("button", { name: "Get Started" });
		expect(button).toHaveAttribute("type", "button");
		fireEvent.click(button);
		expect(onSubmit).toHaveBeenCalledTimes(2);
	});

	it("光标离开末尾时换直排, 失焦回到曲线", () => {
		mockReducedMotion(false);
		const { container } = render(<ArcField type="text" defaultValue="hello" />);
		const root = container.querySelector("[data-slot='arc-field']") as HTMLElement;
		const box = screen.getByRole("textbox") as HTMLInputElement;
		fireEvent.focus(box);
		expect(root.dataset.mode).toBe("arc");
		box.setSelectionRange(1, 1);
		fireEvent.select(box);
		expect(root.dataset.mode).toBe("straight");
		expect(box.style.color).toBe("var(--foreground)");
		fireEvent.blur(box);
		expect(root.dataset.mode).toBe("arc");
		expect(box.style.color).toBe("transparent");
	});

	it("读不到光标的 email 类型: 按下后换直排, 再输入回到曲线", () => {
		mockReducedMotion(false);
		const { container } = render(<ArcField />);
		const root = container.querySelector("[data-slot='arc-field']") as HTMLElement;
		const box = screen.getByRole("textbox");
		fireEvent.focus(box);
		fireEvent.pointerDown(box);
		expect(root.dataset.mode).toBe("straight");
		fireEvent.change(box, { target: { value: "x" } });
		expect(root.dataset.mode).toBe("arc");
	});

	it("减弱动效: 过渡为 none, 按下不缩放", () => {
		mockReducedMotion(true);
		render(<ArcField />);
		const button = screen.getByRole("button");
		fireEvent.pointerDown(button);
		expect(button.style.transition).toBe("none");
		expect(button.style.transform).toContain("scale(1)");
		expect(screen.getByRole("textbox").style.transition).toBe("none");
	});

	it("非减弱: 按下缩放, 过渡只列具体属性", () => {
		mockReducedMotion(false);
		render(<ArcField />);
		const button = screen.getByRole("button");
		fireEvent.pointerDown(button);
		expect(button.style.transform).toContain("scale(0.97)");
		expect(button.style.transition).not.toContain("all");
		fireEvent.pointerCancel(button);
		expect(button.style.transform).toContain("scale(1)");
	});

	it("buttonText 为 null 时不画按钮; disabled 不提交", () => {
		const onSubmit = vi.fn();
		render(<ArcField buttonText={null} disabled onSubmit={onSubmit} />);
		expect(screen.queryByRole("button")).toBeNull();
		fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
		expect(onSubmit).not.toHaveBeenCalled();
	});
});
