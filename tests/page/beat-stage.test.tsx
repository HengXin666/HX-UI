/**
 * src/page/BeatStage: 数据属性, 配方注入, controlled 进度, 越界使用 useBeat 报错.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SHOT_RECIPES } from "@src/motion";
import { BeatStage, useBeat, type Beat } from "@src/page";

const beat: Beat = { id: "lineup", lead: "四个配色一次发完", shot: "deckDeal", layout: "grid", pace: "fast" };

function Probe() {
	const { recipe, progress, beat: current } = useBeat();
	return <p data-testid="probe">{`${current.id}|${recipe === SHOT_RECIPES.deckDeal}|${progress.get()}`}</p>;
}

describe("BeatStage", () => {
	it("写出锚点与数据属性", () => {
		const { container } = render(<BeatStage beat={beat} direction="retail-pop"><span /></BeatStage>);
		const stage = container.querySelector("section");
		expect(stage?.id).toBe("lineup");
		expect(stage?.dataset).toMatchObject({ beat: "deckDeal", layout: "grid", pace: "fast", direction: "retail-pop" });
	});

	it("useBeat 拿到配方, controlled 进度原样传入", () => {
		render(<BeatStage beat={beat} driver="controlled" progress={0.4} as="div"><Probe /></BeatStage>);
		expect(screen.getByTestId("probe").textContent).toBe("lineup|true|0.4");
	});

	it("BeatStage 之外调用 useBeat 报错", () => {
		expect(() => render(<Probe />)).toThrow("useBeat");
	});
});
