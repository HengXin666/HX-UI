/**
 * choice/pick: GelRadio, ElasticSegment, DriftSelect 的规格常数与换算, 键盘与回调, 减弱动效分支.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DRIFT_GAP, DRIFT_MENU_GAP, DRIFT_PAD, DriftSelect, driftOffset } from "@src/controls/choice/pick/DriftSelect";
import {
	ELASTIC_DEADZONE,
	ELASTIC_DILATE,
	ELASTIC_HANDOFF,
	ELASTIC_SLOP,
	ELASTIC_SPRING_MOMENTUM,
	ElasticSegment,
	elasticRelease,
	elasticRubber,
	elasticTime,
} from "@src/controls/choice/pick/ElasticSegment";
import { GEL_SIZES, GEL_STAGGER_MS, GEL_STIFFNESS, GelRadio, gelPlan } from "@src/controls/choice/pick/GelRadio";
import { mockReducedMotion, spyAnimate } from "./support";

const ITEMS = [
	{ value: "day", label: "Day" },
	{ value: "week", label: "Week" },
	{ value: "month", label: "Month" },
];

describe("GelRadio", () => {
	it("规格常数与三层弹簧换算", () => {
		expect(GEL_SIZES.md).toEqual([36, 13, 16]);
		expect([GEL_STAGGER_MS, GEL_STIFFNESS]).toEqual([22, 580]);
		const plan = gelPlan(2, 580, 0.2, 22, false);
		expect(plan.delayS).toBeCloseTo(0.044, 9);
		const k = 580 * (1 - 0.12 * 2);
		expect(plan.layers[0].x.stiffness).toBeCloseTo(k, 9);
		expect(plan.layers[0].x.mass).toBeCloseTo(0.9, 9);
		expect(plan.layers[0].x.damping).toBeCloseTo(2 * Math.sqrt(k * 0.9) * 0.8, 9);
		expect(plan.layers[2].x.stiffness).toBeCloseTo(k * 1.48, 9);
		expect(plan.layers[2].x.damping).toBeCloseTo(2 * Math.sqrt(k * 1.48 * 0.7) * (1 - 0.8), 9);
		expect(plan.layers[1].squash.stiffness).toBeCloseTo(k * 0.86, 9);
		expect(plan.layers[2].squashDelayS).toBeCloseTo(0.044 + 0.1, 9);
		expect(gelPlan(5, 580, 0.2, 22, true).delayS).toBe(0);
		expect(gelPlan(5, 580, 0.2, 22, false).layers[0].x.stiffness).toBeCloseTo(580 * (1 - 0.36), 9);
	});

	it("方向键漫游即选中并回调", async () => {
		const onChange = vi.fn();
		render(<GelRadio items={ITEMS} ariaLabel="Range" onChange={onChange} />);
		const first = screen.getByRole("radio", { name: "Day" });
		expect(first).toHaveAttribute("aria-checked", "true");
		first.focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(screen.getByRole("radio", { name: "Week" })).toHaveAttribute("aria-checked", "true");
		expect(screen.getByRole("radio", { name: "Week" })).toHaveFocus();
		await userEvent.click(screen.getByRole("radio", { name: "Month" }));
		expect(onChange.mock.calls).toEqual([["week"], ["month"]]);
	});

	it("减弱动效: 选中块不带延迟直接到位", async () => {
		mockReducedMotion(true);
		const { container } = render(<GelRadio items={ITEMS} ariaLabel="Range" />);
		await userEvent.click(screen.getByRole("radio", { name: "Month" }));
		const layers = container.querySelectorAll("span[aria-hidden]");
		expect(layers).toHaveLength(3);
		layers.forEach((layer) => expect((layer as HTMLElement).style.transform).toContain("scaleY(1)"));
	});
});

describe("ElasticSegment", () => {
	it("规格常数与换算", () => {
		expect([ELASTIC_DILATE, ELASTIC_HANDOFF, ELASTIC_DEADZONE, ELASTIC_SLOP]).toEqual([0.19, 0.15, 4, 10]);
		expect(ELASTIC_SPRING_MOMENTUM).toEqual({ duration: 0.4, bounce: 0.2 });
		expect(elasticTime(0.3, 2)).toBeCloseTo(0.15, 9);
		expect(elasticRelease(5000)).toEqual({ velocity: 2000, flick: true });
		expect(elasticRelease(-111).flick).toBe(true);
		expect(elasticRelease(100).flick).toBe(false);
		expect(elasticRubber(-10, 0, 100)).toBeCloseTo(-5.5, 9);
		expect(elasticRubber(120, 0, 100)).toBeCloseTo(111, 9);
		expect(elasticRubber(50, 0, 100)).toBe(50);
	});

	it("点击与方向键切换并回调", async () => {
		const onChange = vi.fn();
		render(<ElasticSegment items={ITEMS} ariaLabel="View" onChange={onChange} />);
		await userEvent.click(screen.getByRole("radio", { name: "Week" }));
		expect(screen.getByRole("radio", { name: "Week" })).toHaveAttribute("aria-checked", "true");
		await userEvent.keyboard("{ArrowLeft}");
		expect(onChange.mock.calls).toEqual([["week"], ["day"]]);
	});

	it("减弱动效下仍可选中, 拇指直接落位", async () => {
		mockReducedMotion(true);
		render(<ElasticSegment items={ITEMS} ariaLabel="View" />);
		await userEvent.click(screen.getByRole("radio", { name: "Month" }));
		expect(screen.getByRole("radio", { name: "Month" })).toHaveAttribute("aria-checked", "true");
	});
});

describe("DriftSelect", () => {
	const OPTIONS = [
		{ value: "a", label: "Alpha", tag: "A" },
		{ value: "b", label: "Beta", tag: "B" },
		{ value: "c", label: "Gamma", disabled: true },
		{ value: "d", label: "Delta" },
	];

	it("规格常数与选项位置", () => {
		expect([DRIFT_PAD, DRIFT_GAP, DRIFT_MENU_GAP]).toEqual([4, 1, 6]);
		expect(driftOffset(2, 30)).toBe(4 + 2 * 31);
	});

	it("combobox 键盘: 打开, 跳过禁用项, Enter 选中并关闭", async () => {
		mockReducedMotion(false);
		spyAnimate();
		const onChange = vi.fn();
		render(<DriftSelect options={OPTIONS} onChange={onChange} />);
		const trigger = screen.getByRole("combobox", { name: "Select" });
		trigger.focus();
		await userEvent.keyboard("{ArrowDown}");
		expect(trigger).toHaveAttribute("aria-expanded", "true");
		expect(screen.getByRole("listbox")).toBeInTheDocument();
		await userEvent.keyboard("{ArrowDown}{ArrowDown}");
		expect(trigger.getAttribute("aria-activedescendant")).toContain("opt-3");
		await userEvent.keyboard("{Enter}");
		expect(onChange).toHaveBeenCalledWith("d");
		expect(trigger).toHaveAttribute("aria-expanded", "false");
		expect(trigger).toHaveTextContent("Delta");
	});

	it("Escape 关闭; 减弱动效时不播弹出与换字", async () => {
		mockReducedMotion(true);
		const animate = spyAnimate();
		render(<DriftSelect options={OPTIONS} defaultValue="a" />);
		const trigger = screen.getByRole("combobox");
		await userEvent.click(trigger);
		expect(screen.getByRole("listbox")).toBeInTheDocument();
		await userEvent.click(screen.getByRole("option", { name: /Beta/ }));
		expect(trigger).toHaveTextContent("Beta");
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
		await userEvent.click(trigger);
		await userEvent.keyboard("{Escape}");
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
		expect(animate).not.toHaveBeenCalled();
	});
});
