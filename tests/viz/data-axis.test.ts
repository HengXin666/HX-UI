/**
 * 批 8: 坐标轴刻度, 标签抽稀, 越界重标, 格式化.
 */
import { describe, expect, it } from "vitest";
import { axisRescale, axisTicks, formatNumber, formatTime, scaleBand, scaleLinear, scaleTime, thinTicks } from "@src/viz/data";

describe("axisTicks", () => {
	it("数值轴: px 单调, 标签走 Intl", () => {
		const ticks = axisTicks(scaleLinear([0, 10000], [0, 600]), { locale: "en-US" });
		expect(ticks.map((t) => t.label)).toContain("10,000");
		expect(ticks.every((t, i) => i === 0 || t.px > ticks[i - 1].px)).toBe(true);
	});

	it("类目轴: 刻度在带中线, 自定义格式生效", () => {
		const s = scaleBand(["一月", "二月"], [0, 200], { paddingInner: 0, paddingOuter: 0 });
		const ticks = axisTicks(s, { format: (k) => `${k}!` });
		expect(ticks).toEqual([
			{ value: "一月", px: 50, label: "一月!" },
			{ value: "二月", px: 150, label: "二月!" },
		]);
	});

	it("时间轴: 标签按档格式化", () => {
		const s = scaleTime([new Date(Date.UTC(2026, 10, 1)), new Date(Date.UTC(2026, 10, 5))], [0, 800]);
		const ticks = axisTicks(s, { locale: "en-US", count: 4 });
		expect(ticks[0].label).toBe("Nov 1");
	});

	it("太挤时隔一取一, 至少保留首尾", () => {
		const crowded = axisTicks(scaleLinear([0, 1_000_000], [0, 60]), { count: 10, locale: "en-US" });
		expect(crowded.length).toBeLessThanOrEqual(2);
		const raw = Array.from({ length: 9 }, (_, i) => ({ value: i, px: i * 10, label: "12345" }));
		const thin = thinTicks(raw);
		expect(thin.length).toBeLessThan(raw.length);
		expect(thin[0].value).toBe(0);
	});
});

describe("axisRescale", () => {
	it("未越界返回原域引用, 越界外扩并标记 shocked", () => {
		const base = [0, 100] as const;
		const same = axisRescale(base, [10, 90]);
		expect(same.shocked).toBe(false);
		expect(same.domain).toBe(base);
		const grown = axisRescale(base, [10, 260]);
		expect(grown.shocked).toBe(true);
		expect(grown.domain[1]).toBeGreaterThanOrEqual(260);
	});
});

describe("format", () => {
	it("compact, percent, currency; currency 缺币种抛错", () => {
		expect(formatNumber(12_500, { style: "compact", locale: "en-US" })).toBe("12.5K");
		expect(formatNumber(0.256, { style: "percent", locale: "en-US", digits: 1 })).toBe("25.6%");
		expect(formatNumber(699, { style: "currency", currency: "USD", locale: "en-US" })).toBe("$699.00");
		expect(() => formatNumber(1, { style: "currency" })).toThrow(RangeError);
	});

	it("时间按 UTC 格式化, 与运行时区无关", () => {
		expect(formatTime(new Date(Date.UTC(2026, 0, 1, 23, 30)), "minute", "en-GB")).toBe("23:30");
		expect(formatTime(new Date(Date.UTC(2026, 2, 1)), "month", "en-US")).toBe("Mar 2026");
	});
});
