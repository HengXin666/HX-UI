/**
 * 批 8: 数据内核的比例尺. 纯函数, 不碰 DOM.
 */
import { describe, expect, it } from "vitest";
import { scaleBand, scaleLinear, scaleLog, scalePoint, scaleSqrt, scaleTime, timeInterval, timeTicks } from "@src/viz/data";

describe("连续比例尺", () => {
	it("linear: 端点映射, invert 往返, 零跨度落中点", () => {
		const s = scaleLinear([0, 10], [0, 200]);
		expect(s(0)).toBe(0);
		expect(s(10)).toBe(200);
		expect(s.invert(s(3.7))).toBeCloseTo(3.7);
		expect(scaleLinear([4, 4], [0, 100])(4)).toBe(50);
		expect(s.kind).toBe("linear");
	});

	it("linear: ticks 落在 nice 值上, nice 外扩且不改原比例尺", () => {
		const s = scaleLinear([3, 97], [0, 100]);
		expect(s.ticks(5)).toEqual([0, 20, 40, 60, 80, 100]);
		const n = s.nice(5);
		expect(n.domain()).toEqual([0, 100]);
		expect(s.domain()).toEqual([3, 97]);
	});

	it("sqrt: 面积比例, 负值按 0", () => {
		const s = scaleSqrt([0, 100], [0, 10]);
		expect(s(25)).toBeCloseTo(5);
		expect(s(-4)).toBe(0);
		expect(s.invert(5)).toBeCloseTo(25);
	});

	it("log: 十进制刻度, invert 往返, 非正定义域抛错", () => {
		const s = scaleLog([1, 1000], [0, 300]);
		expect(s(10)).toBeCloseTo(100);
		expect(s.ticks()).toEqual([1, 10, 100, 1000]);
		expect(s.invert(200)).toBeCloseTo(100);
		expect(scaleLog([3, 700], [0, 1]).nice().domain()).toEqual([1, 1000]);
		expect(() => scaleLog([0, 10], [0, 1])).toThrow(RangeError);
	});

	it("time: 按跨度选档, 跨日取日档, 跨年取月档, 刻度在 UTC 边界上", () => {
		expect(timeInterval(6 * 3_600_000, 6).unit).toBe("hour");
		const days = timeTicks([new Date(Date.UTC(2026, 10, 1, 6)), new Date(Date.UTC(2026, 10, 6, 6))], 5);
		expect(days.map((d) => d.toISOString().slice(0, 10))).toEqual(["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"]);
		const months = timeTicks([new Date(Date.UTC(2026, 0, 15)), new Date(Date.UTC(2026, 11, 20))], 4);
		expect(months.map((d) => d.toISOString().slice(0, 7))).toEqual(["2026-04", "2026-07", "2026-10"]);
		const s = scaleTime([new Date(Date.UTC(2026, 0, 1)), new Date(Date.UTC(2026, 0, 11))], [0, 100]);
		expect(s(new Date(Date.UTC(2026, 0, 6)))).toBeCloseTo(50);
		expect(s.invert(50).toISOString()).toBe("2026-01-06T00:00:00.000Z");
	});

	it("time: 多年跨度落在年初", () => {
		const years = timeTicks([new Date(Date.UTC(2019, 5, 1)), new Date(Date.UTC(2026, 5, 1))], 6);
		expect(years.every((d) => d.getUTCMonth() === 0 && d.getUTCDate() === 1)).toBe(true);
		expect(years[0].getUTCFullYear()).toBe(2020);
	});
});

describe("离散比例尺", () => {
	it("band: 带宽与留白, 未知键返回 undefined", () => {
		const s = scaleBand(["a", "b", "c", "d"], [0, 400], { paddingInner: 0, paddingOuter: 0 });
		expect(s.bandwidth()).toBe(100);
		expect(s("c")).toBe(200);
		expect(s("z")).toBeUndefined();
		const padded = scaleBand(["a", "b"], [0, 100]);
		expect(padded.bandwidth()).toBeLessThan(padded.step());
		expect(padded("a")!).toBeGreaterThan(0);
		expect(padded("b")! + padded.bandwidth()).toBeLessThan(100);
	});

	it("point: 宽度为 0, 无外留白时首尾贴边", () => {
		const s = scalePoint(["a", "b", "c"], [0, 100]);
		expect(s.bandwidth()).toBe(0);
		expect([s("a"), s("b"), s("c")]).toEqual([0, 50, 100]);
	});

	it("空键表不产生 NaN", () => {
		const s = scaleBand([], [0, 100]);
		expect(s.bandwidth()).toBe(0);
		expect(s.ticks()).toEqual([]);
	});
});
