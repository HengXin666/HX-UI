import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { stepSpring } from "../../../src/craft/spring";
import { overshootOf, projectFlick, springFromFeel } from "../../../src/controls/dismiss/feel";
import { DrawerRow } from "../../../src/controls/dismiss/swipe/DrawerRow";
import { FlickNotice } from "../../../src/controls/dismiss/swipe/FlickNotice";
import { noticeDismissed, noticeDrag, noticeTimings, rowDrag, rowRelease } from "../../../src/controls/dismiss/swipe/swipe-math";
import { NOTICE, ROW } from "../../../src/controls/dismiss/tokens";
import { setReducedMotion, simulate } from "./reduced";

afterEach(() => {
	setReducedMotion(false);
	vi.useRealTimers();
});

describe("springFromFeel (duration + bounce -> stiffness / damping / mass)", () => {
	it("SPRING_UI 0.3s bounce 0 is critically damped: no overshoot, settles near its duration", () => {
		const spec = springFromFeel(ROW.closeDurationS, ROW.closeBounce);
		expect(spec.mass).toBe(1);
		expect(spec.stiffness).toBeCloseTo((2 * Math.PI / (0.3 * 1.2)) ** 2, 6);
		expect(spec.damping).toBeCloseTo(2 * Math.sqrt(spec.stiffness), 6);
		expect(overshootOf(spec)).toBe(0);
		const run = simulate((c, v, dt) => stepSpring(c, v, 1, spec, dt), 0);
		expect(run.peak).toBeLessThanOrEqual(1);
		expect(run.ms).toBeLessThan(1000);
	});

	it("open snap 0.4s with snapBounce 0.2 keeps zeta 0.8 and the analytic overshoot", () => {
		const spec = springFromFeel(ROW.openDurationS, ROW.snapBounce);
		const zeta = spec.damping / (2 * Math.sqrt(spec.stiffness));
		expect(zeta).toBeCloseTo(0.8, 6);
		const run = simulate((c, v, dt) => stepSpring(c, v, 1, spec, dt), 0, 8);
		// stepSpring 的半隐式积分在 8ms 步长下多吃掉一点能量, 过冲落在解析值的一半到 1.1 倍之间
		expect(run.peak - 1).toBeGreaterThan(overshootOf(spec) * 0.5);
		expect(run.peak - 1).toBeLessThan(overshootOf(spec) * 1.1);
	});
});

describe("DrawerRow math", () => {
	it("projects with DECEL 0.998 and clamps to VMAX before deciding", () => {
		expect(projectFlick(0, 1000, ROW.decel)).toBeCloseTo(499, 0);
		expect(rowRelease(10, 99999, 80, 300, { commitAt: ROW.commitAt, fullSwipe: true })).toBe("commit");
		expect(rowRelease(10, 99999, 80, 300, { commitAt: ROW.commitAt, fullSwipe: false })).toBe("open");
		expect(rowRelease(70, -ROW.flickPxS - 1, 80, 300, { commitAt: 0.6, fullSwipe: false })).toBe("close");
		expect(rowRelease(50, 0, 80, 300, { commitAt: 0.6, fullSwipe: false })).toBe("open");
	});

	it("drags 1:1 inside the drawer and with resistance past it", () => {
		expect(rowDrag(40, 80, 0.55, true)).toBe(40);
		expect(rowDrag(180, 80, 0.55, true)).toBeCloseTo(80 + 100 * 0.55, 6);
		expect(rowDrag(-100, 80, 0.55, true)).toBeLessThan(0);
	});
});

describe("DrawerRow", () => {
	it("opens from the keyboard and runs an action", () => {
		setReducedMotion(true);
		const onOpenChange = vi.fn();
		const onAction = vi.fn();
		render(
			<DrawerRow label="Inbox row" onOpenChange={onOpenChange} onAction={onAction}>
				Hello
			</DrawerRow>,
		);
		const row = screen.getByRole("group", { name: "Inbox row" });
		fireEvent.keyDown(row, { key: "ArrowLeft" });
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		const del = screen.getByRole("button", { name: "Delete" });
		expect(del).toHaveAttribute("tabindex", "0");
		fireEvent.click(del);
		expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: "delete" }));
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	it("commits on Delete immediately when motion is reduced", () => {
		setReducedMotion(true);
		const onCommit = vi.fn();
		render(<DrawerRow onCommit={onCommit}>Row</DrawerRow>);
		fireEvent.keyDown(screen.getByRole("group"), { key: "Delete" });
		expect(onCommit).toHaveBeenCalledTimes(1);
	});
});

describe("FlickNotice math", () => {
	it("derives exit timing from slideMs and resists upward drags to RESIST_PX", () => {
		expect(noticeTimings(NOTICE.slideMs)).toEqual({ enter: 400, enterFade: 240, exit: 280, exitFade: 200 });
		expect(noticeDrag(-1000)).toBeGreaterThan(-NOTICE.resistPx);
		expect(noticeDrag(30)).toBe(30);
		expect(noticeDismissed(41, 0, NOTICE.swipeDistance)).toBe(true);
		expect(noticeDismissed(5, 120, NOTICE.swipeDistance)).toBe(true);
		expect(noticeDismissed(5, 100, NOTICE.swipeDistance)).toBe(false);
	});
});

describe("FlickNotice", () => {
	it("closes with Escape and reports the reason after the exit, instantly when reduced", async () => {
		setReducedMotion(true);
		vi.useFakeTimers();
		const onClose = vi.fn();
		render(<FlickNotice title="Saved" duration={0} onClose={onClose} />);
		const status = screen.getByRole("status");
		expect(status).toHaveTextContent("Saved");
		fireEvent.keyDown(status, { key: "Escape" });
		await act(async () => {
			vi.advanceTimersByTime(1);
		});
		expect(onClose).toHaveBeenCalledWith("escape");
	});

	it("runs the action and closes with reason action", async () => {
		setReducedMotion(true);
		vi.useFakeTimers();
		const onAction = vi.fn();
		const onClose = vi.fn();
		render(<FlickNotice actionLabel="Undo" onAction={onAction} onClose={onClose} duration={0} />);
		fireEvent.click(screen.getByRole("button", { name: "Undo" }));
		await act(async () => {
			vi.advanceTimersByTime(1);
		});
		expect(onAction).toHaveBeenCalledTimes(1);
		expect(onClose).toHaveBeenCalledWith("action");
	});
});
