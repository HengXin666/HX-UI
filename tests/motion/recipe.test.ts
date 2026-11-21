/**
 * src/motion/recipe: 第一批镜头配方守合同, 帧数与镜头卡一致, recipeAt 的分段与终态, 发牌间隔加速.
 */
import { describe, expect, it } from "vitest";
import {
	RECIPE_PHASE,
	SHOT_RECIPES,
	dealDelayChildren,
	dealOffset,
	dealOffsets,
	phaseAt,
	phaseSpan,
	recipeAt,
	recipeFrames,
	recipeMs,
	sampleRecipe,
	validateRecipe,
	type ShotRecipe,
} from "@src/motion";

describe("SHOT_RECIPES", () => {
	it("每张配方都守合同: 帧数为正整数, 末段静止, 幅度过阈值", () => {
		for (const recipe of Object.values(SHOT_RECIPES)) {
			expect(validateRecipe(recipe), recipe.id).toEqual([]);
		}
	});

	it("总帧数与镜头卡的时长行一致", () => {
		expect(recipeFrames(SHOT_RECIPES.spotlightHeroCard)).toBe(172);
		expect(recipeFrames(SHOT_RECIPES.craneRiseReveal)).toBe(165);
		expect(recipeFrames(SHOT_RECIPES.deckDeal)).toBe(150);
		expect(recipeFrames(SHOT_RECIPES.segmentedThumb)).toBe(110);
		expect(recipeFrames(SHOT_RECIPES.textAsMask)).toBe(165);
		expect(recipeFrames(SHOT_RECIPES.cursorFlyover)).toBe(240);
		expect(recipeFrames(SHOT_RECIPES.strokeSegmentBuild)).toBe(165);
		expect(recipeFrames(SHOT_RECIPES.scanlineAnnotate)).toBe(150);
	});

	it("关键帧落在卡上写的位置", () => {
		expect(phaseSpan(SHOT_RECIPES.spotlightHeroCard, 1)).toEqual([34, 142]);
		expect(phaseSpan(SHOT_RECIPES.deckDeal, 1)).toEqual([36, 101]);
		expect(phaseSpan(SHOT_RECIPES.deckDeal, 3)).toEqual([108, 150]);
		expect(phaseSpan(SHOT_RECIPES.strokeSegmentBuild, 1)).toEqual([105, 165]);
		expect(phaseSpan(SHOT_RECIPES.deckDeal, 9)).toBeUndefined();
	});

	it("30fps 换算毫秒", () => {
		expect(recipeMs(SHOT_RECIPES.deckDeal)).toBeCloseTo(5000, 6);
	});
});

describe("recipeAt", () => {
	const deck = SHOT_RECIPES.deckDeal;

	it("进度 0 在第一段起点, 进度 1 读到末段终态", () => {
		expect(recipeAt(deck, 0)).toMatchObject({ phase: RECIPE_PHASE.anticipate, index: 0, local: 0, eased: 0 });
		expect(recipeAt(deck, 1)).toMatchObject({ phase: RECIPE_PHASE.hold, index: 3, local: 1, eased: 1 });
	});

	it("越界进度被钳住", () => {
		expect(recipeAt(deck, -2)).toEqual(recipeAt(deck, 0));
		expect(recipeAt(deck, 9)).toEqual(recipeAt(deck, 1));
	});

	it("段边界归下一段, 段内缓动单调", () => {
		expect(recipeAt(deck, 36 / 150).phase).toBe(RECIPE_PHASE.enter);
		let last = -1;
		for (let frame = 36; frame < 101; frame += 1) {
			const { eased } = recipeAt(deck, frame / 150);
			expect(eased).toBeGreaterThanOrEqual(last);
			last = eased;
		}
	});

	it("sampleRecipe 按采样点读数并保留四位小数", () => {
		const samples = sampleRecipe(deck);
		expect(samples).toHaveLength(5);
		expect(samples[4]).toMatchObject({ phase: RECIPE_PHASE.hold, eased: 1 });
		for (const s of samples) expect(Number(s.eased.toFixed(4))).toBe(s.eased);
	});
});

describe("validateRecipe", () => {
	it("报出空配方, 非整数帧, 末段不是静止, 静止太短, 幅度不足", () => {
		const bad: ShotRecipe = {
			id: "bad",
			source: "x",
			summary: "x",
			phases: [
				{ name: RECIPE_PHASE.move, frames: 2.5, curve: "out" },
				{ name: RECIPE_PHASE.move, frames: 10, curve: "linear" },
			],
			amplitude: { px: 4, scale: 0.01 },
		};
		expect(validateRecipe(bad)).toHaveLength(4);
		const short: ShotRecipe = { ...bad, phases: [{ name: RECIPE_PHASE.hold, frames: 6, curve: "linear" }], amplitude: undefined };
		expect(validateRecipe(short)).toHaveLength(1);
		expect(validateRecipe({ ...bad, phases: [], amplitude: undefined })).toHaveLength(1);
	});
});

describe("dealOffsets", () => {
	it("间隔从首张到末张线性收紧", () => {
		const offsets = dealOffsets(5, 120, 40);
		expect(offsets[0]).toBe(0);
		expect(offsets[1]).toBe(120);
		expect(offsets[4]).toBeCloseTo(320, 6);
		const gaps = offsets.slice(1).map((at, i) => at - offsets[i]);
		for (let i = 1; i < gaps.length; i += 1) expect(gaps[i]).toBeLessThan(gaps[i - 1]);
	});

	it("一张和两张", () => {
		expect(dealOffsets(1, 120, 40)).toEqual([0]);
		expect(dealOffsets(2, 120, 40)).toEqual([0, 120]);
	});
});

describe("dealOffset / dealDelayChildren / phaseAt", () => {
	it("闭式 dealOffset 与 dealOffsets 逐项相等", () => {
		for (let count = 1; count <= 9; count += 1) {
			const offsets = dealOffsets(count, 120, 40);
			offsets.forEach((at, i) => expect(dealOffset(i, count, 120, 40)).toBeCloseTo(at, 9));
		}
	});

	it("dealDelayChildren 给秒, 叠在 delay 之后", () => {
		const delayOf = dealDelayChildren(0.2, 120, 40);
		expect(delayOf(0, 5)).toBeCloseTo(0.2, 9);
		expect(delayOf(1, 5)).toBeCloseTo(0.32, 9);
		expect(delayOf(4, 5)).toBeCloseTo(0.52, 9);
	});

	it("phaseAt: 段前 0, 段后 1, 段内单调", () => {
		const deck = SHOT_RECIPES.deckDeal;
		expect(phaseAt(deck, 1, 0)).toBe(0);
		expect(phaseAt(deck, 1, 36 / 150)).toBe(0);
		expect(phaseAt(deck, 1, 101 / 150)).toBe(1);
		expect(phaseAt(deck, 1, 1)).toBe(1);
		expect(phaseAt(deck, 9, 0.5)).toBe(1);
		const mid = phaseAt(deck, 1, 70 / 150);
		expect(mid).toBeGreaterThan(0);
		expect(mid).toBeLessThan(1);
	});
});
