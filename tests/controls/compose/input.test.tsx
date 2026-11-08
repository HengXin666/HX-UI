/**
 * compose/input: ComposerField (PromptBar), DictateButton (VoicePill). 纯函数与交互回调.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComposerField, composerHeight, stepFlow } from "../../../src/controls/compose/input/ComposerField";
import { DictateButton } from "../../../src/controls/compose/input/DictateButton";
import { barLevel, formatClock, micLevel, slideProgress } from "../../../src/controls/compose/input/voice-signal";
import { COMPOSER, DICTATE } from "../../../src/controls/compose/tokens";

describe("ComposerField", () => {
	it("高度按行长到 maxRows 为止", () => {
		expect(composerHeight(1, COMPOSER.maxRows)).toBe(COMPOSER.line + COMPOSER.edge * 2);
		expect(composerHeight(99, COMPOSER.maxRows)).toBe(composerHeight(COMPOSER.maxRows, COMPOSER.maxRows));
	});

	it("流光能量衰减, 流速追向 1 + energy * gain", () => {
		const next = stepFlow({ energy: 1, pulse: 1, speed: 1, phase: 0 }, 0.1);
		expect(next.energy).toBeLessThan(1);
		expect(next.pulse).toBeLessThan(next.energy);
		expect(next.speed).toBeGreaterThan(1);
	});

	it("Enter 提交去空白的文本, Shift+Enter 不提交; busy 时按键走 onStop", () => {
		const onSubmit = vi.fn();
		const { rerender } = render(<ComposerField defaultValue="  hi  " onSubmit={onSubmit} />);
		const box = screen.getByRole("textbox", { name: "Message" });
		fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
		expect(onSubmit).not.toHaveBeenCalled();
		fireEvent.keyDown(box, { key: "Enter" });
		expect(onSubmit).toHaveBeenCalledWith("hi", undefined);
		const onStop = vi.fn();
		rerender(<ComposerField defaultValue="x" busy onStop={onStop} />);
		fireEvent.click(screen.getByRole("button", { name: "Stop" }));
		expect(onStop).toHaveBeenCalledTimes(1);
	});
});

describe("DictateButton", () => {
	it("信号换算: 左滑取消, 条高下限, 频谱电平, 计时", () => {
		expect(slideProgress(-DICTATE.slideMin, DICTATE.cancelDistance)).toBe(0);
		expect(slideProgress(-DICTATE.cancelDistance * 2, DICTATE.cancelDistance)).toBe(1);
		expect(barLevel(0, 1, DICTATE.floor)).toBe(DICTATE.floor);
		expect(micLevel(new Uint8Array(DICTATE.micBins).fill(255))).toBe(1);
		expect(formatClock(65_000)).toBe("1:05");
	});

	it("回车开始, Esc 取消并回报 cancelled", () => {
		const onStart = vi.fn();
		const onStop = vi.fn();
		render(<DictateButton onStart={onStart} onStop={onStop} />);
		const button = screen.getByRole("button", { name: "Dictate" });
		expect(button).toHaveAttribute("type", "button");
		fireEvent.keyDown(button, { key: "Enter" });
		expect(onStart).toHaveBeenCalledTimes(1);
		expect(button).toHaveAttribute("aria-pressed", "true");
		fireEvent.keyDown(button, { key: "Escape" });
		expect(onStop).toHaveBeenCalledWith(expect.objectContaining({ cancelled: true }));
	});
});
