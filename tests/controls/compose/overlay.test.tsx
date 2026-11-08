/**
 * compose/overlay: CueTip (WarmTooltip), ForkMenu (BranchedMenu), TurnCard (FlipCard).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CueTip, isWarm, leanFor, resetCueWarmth } from "../../../src/controls/compose/overlay/CueTip";
import { ForkMenu, activeTop, branchPath } from "../../../src/controls/compose/overlay/ForkMenu";
import { TurnCard, nearestFace, settleTurn, showsBack, velocityOf } from "../../../src/controls/compose/overlay/TurnCard";
import { CUE, FORK, TURN } from "../../../src/controls/compose/tokens";

afterEach(() => {
	resetCueWarmth();
	vi.useRealTimers();
});

describe("CueTip", () => {
	it("规格常数", () => {
		expect(CUE.leanSpring).toEqual({ stiffness: 260, damping: 22, mass: 0.4 });
		expect([CUE.delayMs, CUE.warmWindowMs, CUE.travelMs, CUE.graceMs, CUE.holdSlop]).toEqual([400, 300, 320, 80, 10]);
	});

	it("热窗口判定与倾斜钳制", () => {
		expect(isWarm(1000, 800, 300)).toBe(true);
		expect(isWarm(1200, 800, 300)).toBe(false);
		expect(leanFor(CUE.fullLeanSpeed * 3, 6, "top")).toBe(6);
		expect(leanFor(-CUE.fullLeanSpeed * 3, 6, "bottom")).toBe(6);
	});

	it("冷启动等 delay 弹出, 收起后热窗口内立即弹出", () => {
		vi.useFakeTimers();
		render(
			<>
				<CueTip content="One" delay={400}>
					<button type="button">a</button>
				</CueTip>
				<CueTip content="Two" delay={400}>
					<button type="button">b</button>
				</CueTip>
			</>,
		);
		const [a, b] = screen.getAllByRole("button");
		fireEvent.focus(a as HTMLElement);
		expect(screen.getAllByRole("tooltip", { hidden: true })[0]?.parentElement).toHaveAttribute("data-state", "closed");
		act(() => vi.advanceTimersByTime(400));
		expect(screen.getAllByRole("tooltip", { hidden: true })[0]?.parentElement).toHaveAttribute("data-state", "open");
		fireEvent.blur(a as HTMLElement);
		act(() => vi.advanceTimersByTime(CUE.graceMs));
		fireEvent.focus(b as HTMLElement);
		const second = screen.getAllByRole("tooltip", { hidden: true })[1];
		expect(second?.parentElement).toHaveAttribute("data-state", "open");
		expect(second).toHaveAttribute("data-warm", "true");
	});

	it("Esc 收起, disabled 不弹", () => {
		vi.useFakeTimers();
		const onOpenChange = vi.fn();
		const { rerender } = render(
			<CueTip content="Tip" delay={0} onOpenChange={onOpenChange}>
				<button type="button">t</button>
			</CueTip>,
		);
		fireEvent.focus(screen.getByRole("button"));
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		fireEvent.keyDown(window, { key: "Escape" });
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		rerender(
			<CueTip content="Tip" delay={0} disabled onOpenChange={onOpenChange}>
				<button type="button">t</button>
			</CueTip>,
		);
		onOpenChange.mockClear();
		fireEvent.focus(screen.getByRole("button"));
		expect(onOpenChange).not.toHaveBeenCalled();
	});
});

describe("ForkMenu", () => {
	const items = [
		{ id: "g1", label: "Files", children: [{ id: "a", label: "A" }, { id: "b", label: "B" }] },
		{ id: "g2", label: "Search" },
	];

	it("规格常数, 1px 线", () => {
		expect([FORK.pad, FORK.mark, FORK.width, FORK.rowHeight, FORK.indent, FORK.trunk, FORK.radius]).toEqual([6, 16, 240, 36, 40, 14, 10]);
		expect([FORK.drawMs, FORK.foldMs, FORK.slideMs]).toEqual([400, 300, 220]);
		expect(FORK.lineWidth).toBe(1);
	});

	it("分支路径从主干拐到文字前, 高亮位置随展开计算", () => {
		expect(branchPath(0, 36, 14, 40, 10)).toBe("M 14 0 V 8 Q 14 18 24 18 H 34");
		expect(activeTop(items, 0, "b", 36)).toBe(72);
		expect(activeTop(items, -1, "g2", 36)).toBe(36);
		expect(activeTop(items, -1, "b", 36)).toBeNull();
	});

	it("点组标题折叠展开, 点子项回调选中", () => {
		const onToggle = vi.fn();
		const onSelect = vi.fn();
		render(<ForkMenu items={items} onToggle={onToggle} onSelect={onSelect} />);
		const group = screen.getByRole("button", { name: "Files" });
		expect(group).toHaveAttribute("aria-expanded", "true");
		fireEvent.click(screen.getByRole("button", { name: "B" }));
		expect(onSelect).toHaveBeenCalledWith("b");
		expect(screen.getByRole("button", { name: "B" })).toHaveAttribute("aria-current", "true");
		fireEvent.click(group);
		expect(onToggle).toHaveBeenLastCalledWith(-1);
		expect(group).toHaveAttribute("aria-expanded", "false");
	});
});

describe("TurnCard", () => {
	it("规格常数", () => {
		expect(TURN.tiltSpring).toEqual({ stiffness: 240, damping: 24, mass: 0.6 });
		expect([TURN.stiffness, TURN.damping, TURN.fling, TURN.historyMs, TURN.perspective]).toEqual([170, 20, 0.16, 90, 1100]);
		expect(TURN.slop).toEqual({ fine: 4, coarse: 8 });
	});

	it("甩出吸到最近半圈, 翻面走最近的一侧", () => {
		expect(settleTurn(60, 0)).toBe(0);
		expect(settleTurn(60, 1000)).toBe(180);
		expect(showsBack(180)).toBe(true);
		expect(showsBack(-180)).toBe(true);
		expect(showsBack(360)).toBe(false);
		expect(nearestFace(170, false)).toBe(0);
		expect(nearestFace(200, false)).toBe(360);
		expect(nearestFace(0, true)).toBe(180);
		expect(velocityOf([{ t: 0, turn: 0 }, { t: 50, turn: 50 }], 60)).toBe(1000);
		expect(velocityOf([{ t: 0, turn: 0 }], 500)).toBe(0);
	});

	it("点击与回车翻面并回调; 受控时以 flipped 为准", () => {
		const onFlipChange = vi.fn();
		const { rerender } = render(<TurnCard front="F" back="B" label="card" onFlipChange={onFlipChange} />);
		const card = screen.getByRole("button", { name: "card" });
		fireEvent.pointerDown(card, { button: 0, pointerId: 1 });
		fireEvent.pointerUp(card, { pointerId: 1 });
		expect(onFlipChange).toHaveBeenLastCalledWith(true);
		expect(card).toHaveAttribute("aria-pressed", "true");
		fireEvent.keyDown(card, { key: "Enter" });
		expect(onFlipChange).toHaveBeenLastCalledWith(false);
		rerender(<TurnCard front="F" back="B" label="card" flipped onFlipChange={onFlipChange} />);
		expect(card).toHaveAttribute("aria-pressed", "true");
	});
});
