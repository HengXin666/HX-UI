/** 支持的网格边长. */

/** 本文件内重复出现的字面量, 只写一次. */
const TWO = 2;
export type GridSize = 3 | 4;
export type GridPattern = "orbit" | "sweep";

/** 每种边长的默认走法. 规格: 3 -> orbit, 4 -> sweep. */
export const DEFAULT_GRID_PATTERN: Record<GridSize, GridPattern> = { 3: "orbit", 4: "sweep" };

/**
 * 头部之后几格的亮度 (0 到 1, 叠在 idleOpacity 之上). 规格的三条关键帧 lattice-on-45 / 35 / 25
 * 在这里落成三级拖尾: 头格全亮, 其后依次 0.45, 0.35, 0.25.
 */
export const GRID_TRAIL = [1, 0.45, 0.35, 0.25] as const;

/** 减弱动效时整格同步呼吸的周期 (规格: 延迟归零, 时长 1400ms). */
export const GRID_REDUCED_MS = 1400;

function ring(n: number): number[] {
	const out: number[] = [];
	for (let c = 0; c < n; c += 1) out.push(c);
	for (let r = 1; r < n; r += 1) out.push(r * n + n - 1);
	for (let c = n - TWO; c >= 0; c -= 1) out.push((n - 1) * n + c);
	for (let r = n - TWO; r > 0; r -= 1) out.push(r * n);
	return out;
}

function diagonals(n: number): number[][] {
	const groups: number[][] = [];
	for (let d = 0; d <= TWO * (n - 1); d += 1) {
		const g: number[] = [];
		for (let r = 0; r < n; r += 1) {
			const c = d - r;
			if (c >= 0 && c < n) g.push(r * n + c);
		}
		groups.push(g);
	}
	return groups;
}

/**
 * 走法 = 依次点亮的格子组. orbit 沿外圈顺时针一格一组, sweep 按反对角线成组扫过.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-range.md
 */
export function gridGroups(size: GridSize, pattern: GridPattern): number[][] {
	return pattern === "orbit" ? ring(size).map((i) => [i]) : diagonals(size);
}

/** 第 frame 帧时每格的亮度 (0 到 1). */
export function gridLevels(size: GridSize, pattern: GridPattern, frame: number): number[] {
	const groups = gridGroups(size, pattern);
	const levels = new Array<number>(size * size).fill(0);
	const head = frame % groups.length;
	groups.forEach((cells, g) => {
		const behind = (head - g + groups.length) % groups.length;
		const level = GRID_TRAIL[behind] ?? 0;
		cells.forEach((i) => {
			levels[i] = level;
		});
	});
	return levels;
}

const ROW_SEP = "/";
const LIT = "x";

/** 把 "..x/x.x/.x." 这样的图样展开成点亮格子的下标. */
export function parseMark(art: string): number[] {
	return art
		.split(ROW_SEP)
		.join("")
		.split("")
		.flatMap((ch, i) => (ch === LIT ? [i] : []));
}

/** 完成与失败时点亮的格子: 对勾与叉. */
export const GRID_MARKS: Record<GridSize, { done: readonly number[]; error: readonly number[] }> = {
	3: { done: parseMark("..x/x.x/.x."), error: parseMark("x.x/.x./x.x") },
	4: { done: parseMark("..../...x/x.x./.x.."), error: parseMark("x..x/.xx./.xx./x..x") },
};
