/**
 * choice/toggle: ChimeToggle, PlushSwitch, TallyCheck 的规格常数与换算, 交互回调, 减弱动效分支.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CHOICE_FIT } from "@src/controls/choice/tone";
import { springFromDuration as fitDuration } from "@src/motion";
import { CHIME_SIZES, CHIME_WARP, CHIME_WOBBLE, ChimeToggle, chimeFrames, chimePassOffset } from "@src/controls/choice/toggle/ChimeToggle";
import { PLUSH_MAX_STRETCH, PLUSH_TAP_SLOP, PlushSwitch, plushPositionSpring, plushStretchFor } from "@src/controls/choice/toggle/PlushSwitch";
import { TALLY_RULE_END, TALLY_SWELL, TALLY_VISUAL_DURATION, TallyCheck, tallySprings } from "@src/controls/choice/toggle/TallyCheck";
import { mockReducedMotion, spyAnimate } from "./support";

describe("ChimeToggle", () => {
	it("规格常数: 尺寸档, 扭曲指数, 轻晃", () => {
		expect(CHIME_SIZES.md).toEqual([44, 13.5, 16, 19, 9]);
		expect(CHIME_WARP).toBe(0.6);
		expect(CHIME_WOBBLE).toEqual({ amplitude: 0.4, passes: 3, duration: 420 });
		expect(chimePassOffset(1, 6)).toBeCloseTo(Math.pow(1 / 6, 0.6), 9);
	});

	it("摆动关键帧: 左右交替, 线性衰减, 末帧回 0, 落点递增", () => {
		const frames = chimeFrames(0, 17, 5, 1);
		expect(frames).toHaveLength(7);
		expect(frames[1].transform).toBe("rotate(17.00deg)");
		expect(frames[2].transform).toBe("rotate(-13.60deg)");
		expect(frames[6].transform).toBe("rotate(0deg)");
		const offsets = frames.map((f) => f.offset as number);
		for (let i = 1; i < offsets.length; i += 1) expect(offsets[i]).toBeGreaterThan(offsets[i - 1]);
	});

	it("中途重按从当前角度接上", () => {
		expect(chimeFrames(-6.5, 17, 5, 1)[0].transform).toBe("rotate(-6.5deg)");
	});

	it("点击切换 aria-pressed 并回调, 打开时播放摆动", async () => {
		mockReducedMotion(false);
		const animate = spyAnimate();
		const onPressedChange = vi.fn();
		render(<ChimeToggle onPressedChange={onPressedChange} />);
		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("type", "button");
		await userEvent.click(button);
		expect(button).toHaveAttribute("aria-pressed", "true");
		expect(onPressedChange).toHaveBeenCalledWith(true);
		expect(animate).toHaveBeenCalled();
	});

	it("减弱动效: 不摆动不放声波", async () => {
		mockReducedMotion(true);
		const animate = spyAnimate();
		render(<ChimeToggle />);
		await userEvent.click(screen.getByRole("button"));
		expect(animate).not.toHaveBeenCalled();
	});
});

describe("PlushSwitch", () => {
	it("speed 换成位置弹簧: 50 时刚度 170, 阻尼 21.5, 质量 0.9", () => {
		expect(plushPositionSpring(50)).toEqual({ stiffness: 170, damping: 21.5, mass: 0.9 });
		expect(plushPositionSpring(0).stiffness).toBeCloseTo(115, 9);
		expect(plushPositionSpring(200).stiffness).toBeCloseTo(225, 9);
	});

	it("拉伸: 600 px/s 取满, 总量不超过 0.4", () => {
		expect(plushStretchFor(300, 36)).toBeCloseTo(0.18, 9);
		expect(plushStretchFor(-600, 36)).toBeCloseTo(0.36, 9);
		expect(plushStretchFor(5000, 100)).toBe(PLUSH_MAX_STRETCH);
		expect(PLUSH_TAP_SLOP).toEqual({ fine: 4, coarse: 8 });
	});

	it("键盘与点击都切换, role=switch, 回调新值", async () => {
		const onChange = vi.fn();
		render(<PlushSwitch label="Wi-Fi" onChange={onChange} />);
		const sw = screen.getByRole("switch", { name: "Wi-Fi" });
		await userEvent.click(sw);
		expect(sw).toHaveAttribute("aria-checked", "true");
		sw.focus();
		await userEvent.keyboard(" ");
		expect(sw).toHaveAttribute("aria-checked", "false");
		expect(onChange.mock.calls).toEqual([[true], [false]]);
	});

	it("减弱动效: 拇指直接落到终点", () => {
		mockReducedMotion(true);
		const { container } = render(<PlushSwitch ariaLabel="x" />);
		const sw = screen.getByRole("switch");
		fireEvent.pointerDown(sw, { button: 0, clientX: 10 });
		fireEvent.pointerUp(sw, { clientX: 10 });
		const thumb = container.querySelector("[data-slot=plush-switch-thumb]") as HTMLElement;
		// 76 宽, 38 高, 留白 4: 拇指 30, 行程 38, 左边距 4 + 38 再减 1px 边框
		expect(thumb.style.left).toBe("41px");
		expect(sw).toHaveAttribute("aria-checked", "true");
	});
});

describe("TallyCheck", () => {
	it("规格常数与换算: 勾线弹簧比填充更早落定", () => {
		expect([TALLY_VISUAL_DURATION, TALLY_RULE_END, TALLY_SWELL]).toEqual([0.2, 0.84, 0.35]);
		const springs = tallySprings(0.2);
		expect(springs.fill).toEqual(fitDuration(0.2, 0.2, CHOICE_FIT));
		expect(springs.tick.stiffness).toBeGreaterThan(springs.fill.stiffness);
		expect(springs.strike).toEqual(fitDuration(0.2, 0, CHOICE_FIT));
	});

	it("点击切换 role=checkbox 并回调", async () => {
		const onChange = vi.fn();
		render(<TallyCheck label="Ship the build" onChange={onChange} />);
		const box = screen.getByRole("checkbox", { name: "Ship the build" });
		await userEvent.click(box);
		expect(box).toHaveAttribute("aria-checked", "true");
		expect(onChange).toHaveBeenCalledWith(true);
	});

	it("减弱动效: 删除线与勾线直接到终值", async () => {
		mockReducedMotion(true);
		const { container } = render(<TallyCheck label="Done" />);
		await userEvent.click(screen.getByRole("checkbox"));
		const rule = container.querySelector("span[aria-hidden].h-px") as HTMLElement;
		expect(rule.style.transform).toBe("scaleX(1)");
		expect(container.querySelector("path")?.getAttribute("stroke-dashoffset")).toBe("0");
	});
});
