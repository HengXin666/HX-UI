// 行为规格参照 docs/research/catalog/components-1.md 的 Counter 条目, 实现为 HX 自有.
/**
 * TallyRoll 的纯逻辑: 本地化切字, 按位定键, 每位滚动的目标格与进度, 运动模糊量.
 * 位的合同 (宽 0.62em, 高 1.2em, 700ms, 错峰上限, 过冲 0.06 位) 取 src/craft, 本文件不另写数字.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-range.md
 */
import { digitEase } from "../../../craft/spring";
import { DIGIT_OVERSHOOT, DIGIT_STAGGER_CAP } from "../../../craft/tokens";
import { clamp } from "../math";

/** 一位十个格, 条带末尾补一个 0, 9 滚向 0 时中途不露空. */
export const TALLY_BASE = 10;
export const TALLY_STRIP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0] as const;
/** 规格默认 bounce 0.2 对应合同过冲上限 0.06 位; 更大的 bounce 也不越过上限. */
export const TALLY_BOUNCE_REF = 0.2;
/** 运动模糊的快门 (秒): 一帧内位移按这段时间折成纵向模糊. */
export const TALLY_SHUTTER_S = 1 / 120;
/** 模糊上限, 以一格高度的比例计, 再快也看得出是数字. */
export const TALLY_BLUR_CAP = 0.12;
/** 进入视口的比例, 达到才开始首次滚入. */
export const TALLY_INTRO_THRESHOLD = 0.5;

export type TallyDirection = "auto" | "up" | "down";

export type TallyGlyph =
	| { readonly kind: "digit"; readonly key: string; readonly digit: number; readonly order: number }
	| { readonly kind: "static"; readonly key: string; readonly char: string };

export interface TallyFormat {
	readonly locale?: string;
	readonly decimals?: number;
	readonly minDigits?: number;
	readonly format?: Intl.NumberFormatOptions;
}

/** 数字一律用拉丁数码, 条带只有 0 到 9; 分组符, 小数点, 符号, 货币都是静止槽. */
export function tallyFormatter({ locale = "en-US", decimals, minDigits = 1, format }: TallyFormat): Intl.NumberFormat {
	const fixed = decimals === undefined ? {} : { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
	return new Intl.NumberFormat(locale, { ...fixed, minimumIntegerDigits: clamp(Math.round(minDigits), 1, 21), ...format, numberingSystem: "latn" });
}

/**
 * 切成槽. 位的键是它右边还有几位 (个位与小数位跨值稳定), 静止槽的键是它右边还有几个字.
 * order 是从左数第几位, 错峰用: 高位先动.
 */
export function tallyGlyphs(value: number, formatter: Intl.NumberFormat): TallyGlyph[] {
	const chars = formatter.format(value).split("");
	const digits = chars.filter((c) => c >= "0" && c <= "9").length;
	let seen = 0;
	return chars.map((char, index) => {
		const fromRight = chars.length - 1 - index;
		if (char < "0" || char > "9") return { kind: "static", key: `s${fromRight}`, char };
		const order = seen;
		seen += 1;
		return { kind: "digit", key: `d${digits - 1 - order}`, digit: Number(char), order };
	});
}

/** 1 往上滚, -1 往下滚. auto 跟着值的增减走. */
export function tallyHeading(direction: TallyDirection, previous: number, next: number): 1 | -1 {
	if (direction === "up") return 1;
	if (direction === "down") return -1;
	return next >= previous ? 1 : -1;
}

/** 从当前 (可能是小数) 位置出发, 沿方向找到第一个显示 digit 的整数格. */
export function tallyTarget(position: number, digit: number, heading: 1 | -1): number {
	const laps = (position - digit) / TALLY_BASE;
	return digit + TALLY_BASE * (heading > 0 ? Math.ceil(laps) : Math.floor(laps));
}

/** 位置折回条带上的格 (0 到 10). */
export function tallyCell(position: number): number {
	return ((position % TALLY_BASE) + TALLY_BASE) % TALLY_BASE;
}

/** 反解时在 [0, 1] 上粗扫峰值的采样数, 峰值附近三分细化次数, 参数二分次数. */
const PEAK_SAMPLES = 400;
const REFINE_STEPS = 48;
const SOLVE_STEPS = 32;
const THIRD = 3;
/**
 * 缓存键按目标过冲量化: 0 到 DIGIT_OVERSHOOT 分 1000 档 (每档约 6e-5 位, 远低于一像素),
 * 缓存最多 1000 条, 连续变化的 bounce 不会让 Map 无限长.
 */
const GOAL_STEPS = 1000;
const solved = new Map<number, number>();

/** digitEase 在 [0, 1] 上越过 1 的最大量 (位). */
function peakOf(parameter: number): number {
	const at = (t: number): number => digitEase(t, parameter);
	let best = 1;
	for (let i = 2; i < PEAK_SAMPLES; i += 1) if (at(i / PEAK_SAMPLES) > at(best / PEAK_SAMPLES)) best = i;
	let lo = (best - 1) / PEAK_SAMPLES;
	let hi = (best + 1) / PEAK_SAMPLES;
	for (let i = 0; i < REFINE_STEPS; i += 1) {
		const a = lo + (hi - lo) / THIRD;
		const b = hi - (hi - lo) / THIRD;
		if (at(a) < at(b)) lo = a;
		else hi = b;
	}
	return Math.max(0, at((lo + hi) / 2) - 1);
}

/**
 * bounce 换成 digitEase 的参数. 目标过冲 (位) 按 bounce 线性取, 合同上限 DIGIT_OVERSHOOT.
 * digitEase 的参数是阻尼振荡的名义过冲, 尾段补偿项会把实际峰值再抬高 (参数 0.06 时峰值约 0.086),
 * 所以这里按实际峰值二分反解参数, 让终点前的最大越界恰为目标, 不超过 0.06 位.
 */
export function tallyOvershoot(bounce: number): number {
	const raw = Math.min(DIGIT_OVERSHOOT, (Math.max(0, bounce) / TALLY_BOUNCE_REF) * DIGIT_OVERSHOOT);
	const step = Math.round((raw / DIGIT_OVERSHOOT) * GOAL_STEPS);
	if (!(step > 0)) return 0;
	const goal = (step / GOAL_STEPS) * DIGIT_OVERSHOOT;
	const cached = solved.get(step);
	if (cached !== undefined) return cached;
	let lo = 0;
	let hi = goal;
	for (let i = 0; i < SOLVE_STEPS; i += 1) {
		const mid = (lo + hi) / 2;
		if (peakOf(mid) > goal) hi = mid;
		else lo = mid;
	}
	solved.set(step, lo);
	return lo;
}

/** 位间错峰 (ms): 不超过 stagger, 且总量不超过时长的 DIGIT_STAGGER_CAP. */
export function tallyGap(count: number, durationMs: number, staggerMs: number): number {
	if (count <= 1) return 0;
	return Math.max(0, Math.min(staggerMs, (durationMs * DIGIT_STAGGER_CAP) / (count - 1)));
}

export interface TallyRun {
	readonly from: number;
	readonly to: number;
	readonly start: number;
	readonly delay: number;
}

/** 某时刻的位置. 外层时钟线性, 曲线是 digitEase, t 为 1 时恰在整数格. */
export function tallyAt(run: TallyRun, now: number, durationMs: number, overshoot: number): { position: number; done: boolean } {
	const t = clamp((now - run.start - run.delay) / Math.max(1, durationMs), 0, 1);
	return { position: run.from + (run.to - run.from) * digitEase(t, overshoot), done: t >= 1 };
}

/** 纵向模糊 (px). speed 是格/秒, cellPx 是一格的像素高. */
export function tallyBlur(speed: number, cellPx: number): number {
	return Math.min(cellPx * TALLY_BLUR_CAP, Math.abs(speed) * cellPx * TALLY_SHUTTER_S);
}
