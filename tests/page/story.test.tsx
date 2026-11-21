/**
 * 批 6: PageSpec 的 story / direction. 有 story 按拍渲染, 只有 sections 时行为不变, sections + direction 自动转拍.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DIRECTIONS, Page, definePage, section, sectionsToBeats, storyOf, validateBeats, type SectionOf } from "@src/page";
import type { DefaultSections } from "@src/page";

const funnel = section(
	"funnel",
	{
		id: "funnel",
		heading: { title: "转化漏斗" },
		label: "本月转化",
		stages: [
			{ id: "visit", label: "访问", value: 12486 },
			{ id: "pay", label: "支付", value: 1317 },
		],
	},
);

const flow: SectionOf<DefaultSections> = {
	type: "flow",
	key: "fulfil",
	props: { heading: { title: "履约流程" }, label: "履约", nodes: [{ id: "a", label: "下单" }], edges: [] },
};

describe("sectionsToBeats", () => {
	it("一个区块一拍, id 依次取 props.id, key, type-序号", () => {
		const bare: SectionOf<DefaultSections> = { ...flow, key: undefined };
		const beats = sectionsToBeats([funnel, flow, bare]);
		expect(beats.map((b) => b.id)).toEqual(["funnel", "fulfil", "flow-2"]);
		expect(beats.map((b) => b.lead)).toEqual(["funnel", "flow", "flow"]);
		expect(beats.every((b) => b.layout === "stack" && b.sections.length === 1)).toBe(true);
	});

	it("节奏轮转, 镜头取方向白名单第一张, 转出来的拍对每个方向都过校验", () => {
		const many = Array.from({ length: 7 }, (_, i) => ({ ...flow, key: `f${i}` }));
		for (const direction of Object.values(DIRECTIONS)) {
			const beats = sectionsToBeats(many, direction.name);
			expect(beats[0].shot).toBe(direction.shots[0]);
			expect(validateBeats(beats, direction)).toEqual([]);
		}
		expect(sectionsToBeats(many).map((b) => b.pace).slice(0, 4)).toEqual(["even", "fast", "slow", "even"]);
		expect(sectionsToBeats(many)[0].shot).toBe("craneRiseReveal");
	});
});

describe("storyOf", () => {
	it("story 优先, sections + direction 转拍, 只有 sections 返回 undefined", () => {
		const story = [{ id: "open", lead: "看漏斗", shot: "scanlineAnnotate" as const, layout: "split" as const, pace: "slow" as const, sections: [funnel] }];
		expect(storyOf(definePage({ sections: [flow], story }))).toBe(story);
		expect(storyOf(definePage({ sections: [flow], direction: "fintech" }))?.map((b) => b.id)).toEqual(["fulfil"]);
		expect(storyOf(definePage({ sections: [flow] }))).toBeUndefined();
	});
});

describe("Page 按拍渲染", () => {
	it("只有 sections: 旧行为, 没有拍", () => {
		const { container } = render(<Page spec={definePage({ sections: [funnel, flow] })} />);
		expect(container.querySelector("main")?.dataset.direction).toBeUndefined();
		expect(container.querySelector("[data-pace]")).toBeNull();
		expect(screen.getByRole("heading", { name: "转化漏斗" })).toBeTruthy();
	});

	it("story: 根写方向, 每拍一个舞台, 拍内渲染各自的区块", () => {
		const spec = definePage({
			direction: "fintech",
			story: [
				{ id: "open", lead: "看漏斗", shot: "scanlineAnnotate", layout: "split", pace: "slow", sections: [funnel] },
				{ id: "ops", lead: "看履约", shot: "craneRiseReveal", layout: "stack", pace: "fast", sections: [flow] },
			],
		});
		const { container } = render(<Page spec={spec} />);
		const root = container.querySelector("main");
		expect(root?.dataset.direction).toBe("fintech");
		expect(root?.dataset.beatIssues).toBe("0");
		const stages = Array.from(container.querySelectorAll("[data-pace]"));
		expect(stages.map((s) => s.id)).toEqual(["open", "ops"]);
		expect(stages[0].querySelector("#funnel")).toBeTruthy();
		expect(stages[1].textContent).toContain("履约流程");
		expect(container.querySelectorAll("main").length).toBe(1);
	});

	it("sections + direction: 自动一区块一拍", () => {
		const { container } = render(<Page spec={definePage({ direction: "devtool", sections: [funnel, flow] })} as="div" />);
		const stages = Array.from(container.querySelectorAll("[data-pace]"));
		expect(stages.map((s) => s.getAttribute("data-beat"))).toEqual(["cursorFlyover", "cursorFlyover"]);
		expect(container.firstElementChild?.getAttribute("data-direction")).toBe("devtool");
	});
});
