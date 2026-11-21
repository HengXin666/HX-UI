/**
 * src/page/beat: 拍的校验. 主角, 重复 id, 节奏三连, 居中三连, 方向白名单, 图片 alt, 重效果预算.
 */
import { describe, expect, it } from "vitest";
import { SHOT_RECIPES } from "@src/motion";
import { DIRECTIONS, defineBeats, validateBeats, type Beat } from "@src/page";

const codes = (beats: readonly Beat[], direction?: (typeof DIRECTIONS)[keyof typeof DIRECTIONS]) => validateBeats(beats, direction).map((i) => i.code);

const good = defineBeats([
	{ id: "hero", lead: "新款耳机在聚光下浮起", shot: "spotlightHeroCard", layout: "split", pace: "slow", media: [{ src: "hero.jpg", alt: "耳机" }] },
	{ id: "lineup", lead: "四个配色一次发完", shot: "deckDeal", layout: "grid", pace: "fast" },
	{ id: "detail", lead: "翻面看材质", shot: "cardFlipReveal", layout: "center", pace: "slow" },
	{ id: "buy", lead: "价格一锤定音", shot: "crashZoomPunch", layout: "bleed", pace: "cut" },
]);

describe("validateBeats", () => {
	it("合规的一页没有问题", () => {
		expect(validateBeats(good, DIRECTIONS["retail-pop"])).toEqual([]);
	});

	it("所有方向的白名单都是真实存在的配方", () => {
		for (const direction of Object.values(DIRECTIONS)) {
			for (const shot of direction.shots) expect(SHOT_RECIPES[shot], `${direction.name}/${shot}`).toBeDefined();
		}
	});

	it("空页, 缺主角, 重复 id", () => {
		expect(codes([])).toEqual(["BEAT-EMPTY"]);
		const bad = [good[0], { ...good[1], id: "hero", lead: "  " }];
		expect(codes(bad)).toEqual(["BEAT-ID", "BEAT-LEAD"]);
	});

	it("节奏三连, 两连不报", () => {
		const two = good.map((b, i) => ({ ...b, pace: i < 2 ? ("even" as const) : b.pace }));
		expect(codes(two)).not.toContain("BEAT-PACE");
		const three = good.map((b, i) => ({ ...b, pace: i < 3 ? ("even" as const) : b.pace }));
		const issue = validateBeats(three).find((i) => i.code === "BEAT-PACE");
		expect(issue?.beat).toBe("detail");
	});

	it("居中三连", () => {
		const centered = good.map((b, i) => ({ ...b, layout: i > 0 ? ("center" as const) : b.layout }));
		expect(codes(centered)).toContain("BEAT-CENTER");
	});

	it("方向不收的镜头", () => {
		expect(codes(good, DIRECTIONS.editorial)).toContain("BEAT-SHOT");
	});

	it("图片缺 alt, 装饰图放行", () => {
		const noAlt = [{ ...good[0], media: [{ src: "a.jpg" }, { src: "b.jpg", alt: "", decorative: true }] }];
		expect(validateBeats(noAlt).filter((i) => i.code === "BEAT-ALT")).toHaveLength(1);
	});

	it("重效果超预算", () => {
		const heavy = good.map((b) => ({ ...b, heavy: 1 }));
		expect(codes(heavy)).toContain("BEAT-HEAVY");
		expect(codes([{ ...good[0], heavy: 1 }], DIRECTIONS.editorial)).toContain("BEAT-HEAVY");
		expect(codes([{ ...good[0], heavy: 1 }], DIRECTIONS.devtool)).not.toContain("BEAT-HEAVY");
	});
});
