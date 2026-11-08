// RipStub 的撕口几何: 撕开边的锯齿 clip-path, 打孔缝的位置, 两端半圆缺口的位置.
import type { CSSProperties } from "react";
import { RIP } from "../../../tokens";

const TWO = 2;
const TEETH = 14;
const PERCENT = 100;
const FULL = "100%";
const ZERO = "0%";

/** 撕开边缘的锯齿: start 是存根一侧, end 是票身一侧. amount 为 0 时不裁. */
export function jagged(amount: number, edge: "start" | "end", vertical: boolean): string | undefined {
	if (amount <= 0) return undefined;
	const depth = amount * RIP.holeSize;
	const start = edge === "start";
	const points: string[] = [];
	for (let i = 0; i <= TEETH; i += 1) {
		const along = (i / TEETH) * PERCENT;
		const cut = i % TWO === 0 ? 0 : depth;
		const at = start ? `${cut}px` : `calc(${FULL} - ${cut}px)`;
		points.push(vertical ? `${along}% ${at}` : `${at} ${along}%`);
	}
	const far = start ? FULL : ZERO;
	const tail = vertical ? [`${FULL} ${far}`, `${ZERO} ${far}`] : [`${far} ${FULL}`, `${far} ${ZERO}`];
	return `polygon(${[...points, ...tail].join(", ")})`;
}

/** 打孔缝: 票身与存根交界处的一条零宽带. */
export function ripSeam(bodySize: number, vertical: boolean): CSSProperties {
	return vertical ? { top: bodySize, left: 0, right: 0, height: 0 } : { left: bodySize, top: 0, bottom: 0, width: 0 };
}

/** 缝两端的半圆缺口, a 在左/上, b 在右/下. */
export function ripNotch(end: "a" | "b", bodySize: number, notchSize: number, vertical: boolean): CSSProperties {
	const base: CSSProperties = { width: notchSize, height: notchSize };
	const off = -notchSize / TWO;
	if (vertical) return { ...base, top: bodySize + off, [end === "a" ? "left" : "right"]: off };
	return { ...base, left: bodySize + off, [end === "a" ? "top" : "bottom"]: off };
}
