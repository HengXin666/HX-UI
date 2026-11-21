/**
 * src/page/BeatPage 与 beat-layout: 方向写根, 每拍一个舞台, 版式样式, 校验回调.
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BeatPage, BeatStage, beatStyle, type Beat } from "@src/page";

const beats: Beat[] = [
	{ id: "hero", lead: "主角", shot: "spotlightHeroCard", layout: "split", pace: "slow" },
	{ id: "lineup", lead: "配色", shot: "deckDeal", layout: "grid", pace: "fast" },
];

describe("beatStyle", () => {
	it("版式定栅格, 节奏定留白, 只读 --dir-*", () => {
		const split = beatStyle("split", "slow");
		expect(split.display).toBe("grid");
		expect(String(split.gridTemplateColumns)).toContain("auto-fit");
		expect(split.gap).toBe("var(--dir-gutter)");
		expect(split.paddingBlock).toBe("var(--space-24)");
		expect(beatStyle("center", "cut")).toMatchObject({ maxInlineSize: "var(--dir-measure)", paddingBlock: "0" });
		expect(beatStyle("rail", "even").scrollSnapType).toBe("x mandatory");
	});

	it("每次返回新对象", () => {
		expect(beatStyle("grid", "even")).not.toBe(beatStyle("grid", "even"));
	});
});

describe("BeatStage 版式", () => {
	it("默认套样式, styled=false 只留调用方的 style", () => {
		const { container, rerender } = render(<BeatStage beat={beats[0]} style={{ color: "red" }}><i /></BeatStage>);
		const el = () => container.querySelector("section") as HTMLElement;
		expect(el().style.display).toBe("grid");
		expect(el().style.color).toBe("red");
		rerender(<BeatStage beat={beats[0]} styled={false} style={{ color: "red" }}><i /></BeatStage>);
		expect(el().style.display).toBe("");
	});
});

describe("BeatPage", () => {
	it("根节点写方向与问题数, 每拍一个 section", () => {
		const { container } = render(<BeatPage beats={beats} direction="retail-pop" render={(b) => <h2>{b.lead}</h2>} />);
		const root = container.querySelector("main");
		expect(root?.dataset.direction).toBe("retail-pop");
		expect(root?.dataset.beatIssues).toBe("0");
		expect(Array.from(container.querySelectorAll("section")).map((s) => s.id)).toEqual(["hero", "lineup"]);
	});

	it("有问题时回调并计数", () => {
		const onIssues = vi.fn();
		const { container } = render(<BeatPage beats={beats} direction="editorial" onIssues={onIssues} render={() => null} />);
		expect(onIssues).toHaveBeenCalledOnce();
		expect(onIssues.mock.calls[0][0].every((i: { code: string }) => i.code === "BEAT-SHOT")).toBe(true);
		expect(container.querySelector("main")?.dataset.beatIssues).toBe("2");
	});
});
