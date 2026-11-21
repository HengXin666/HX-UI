/**
 * Stagger 的 rhythm: even 保持旧行为, deal 换成发牌式 delayChildren, 减弱动效全部归零; useRecipe / usePhase 跟随时钟.
 */
import { renderHook } from "@testing-library/react";
import { motionValue } from "motion/react";
import { describe, expect, it } from "vitest";
import { RECIPE_PHASE, SHOT_RECIPES, staggerTransition, usePhase, useRecipe } from "@src/motion";

describe("staggerTransition", () => {
	it("even: 恒定间隔加延迟", () => {
		expect(staggerTransition("even", 0.06, 0.1, false)).toEqual({ staggerChildren: 0.06, delayChildren: 0.1 });
	});

	it("deal: delayChildren 是按序号加速的函数, 不再写 staggerChildren", () => {
		const t = staggerTransition("deal", 0.06, 0, false) as { delayChildren: (i: number, total: number) => number; staggerChildren?: number };
		expect(t.staggerChildren).toBeUndefined();
		expect(t.delayChildren(0, 6)).toBe(0);
		const gaps = [1, 2, 3, 4, 5].map((i) => t.delayChildren(i, 6) - t.delayChildren(i - 1, 6));
		for (let i = 1; i < gaps.length; i += 1) expect(gaps[i]).toBeLessThan(gaps[i - 1]);
	});

	it("减弱动效: 两种节奏都归零", () => {
		expect(staggerTransition("deal", 0.06, 0.3, true)).toEqual({ staggerChildren: 0, delayChildren: 0 });
		expect(staggerTransition("even", 0.06, 0.3, true)).toEqual({ staggerChildren: 0, delayChildren: 0 });
	});
});

describe("useRecipe / usePhase", () => {
	it("跟随时钟进度给出段名与缓动值", async () => {
		const progress = motionValue(0);
		const { result } = renderHook(() => ({
			all: useRecipe(progress, SHOT_RECIPES.deckDeal),
			enter: usePhase(progress, SHOT_RECIPES.deckDeal, 1),
		}));
		expect(result.current.all.phase.get()).toBe(RECIPE_PHASE.anticipate);
		expect(result.current.enter.get()).toBe(0);
		progress.set(1);
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		expect(result.current.all.phase.get()).toBe(RECIPE_PHASE.hold);
		expect(result.current.all.eased.get()).toBe(1);
		expect(result.current.enter.get()).toBe(1);
	});
});
