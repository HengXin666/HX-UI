// ArcKnob 的圆弧几何: 极坐标点, SVG 圆弧路径, 指针位置到读数的换算.
import { clamp } from "../../motion";

const TWO = 2;
const HALF_TURN = 180;

/** 以正上方为 0 度, 顺时针为正的极坐标点. */
export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
	const rad = (deg * Math.PI) / HALF_TURN;
	return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
}

/** from 到 to (度) 的圆弧路径, 顺序无关; 零长时返回空串. */
export function arcPath(cx: number, cy: number, r: number, from: number, to: number): string {
	const [a, b] = from <= to ? [from, to] : [to, from];
	if (b - a <= 0) return "";
	const [x0, y0] = polar(cx, cy, r, a);
	const [x1, y1] = polar(cx, cy, r, b);
	const large = b - a > HALF_TURN ? 1 : 0;
	return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

/** 相对圆心的指针位置到 0..1 读数. 0 在缺口左端, 顺时针增大, 缺口内钳到较近的一端. */
export function angleToFraction(dx: number, dy: number, sweep: number): number {
	const deg = (Math.atan2(dx, -dy) * HALF_TURN) / Math.PI;
	return clamp((deg + sweep / TWO) / sweep, 0, 1);
}

/** 屏幕指针到读数: 先换到盘心坐标, 落在死区 (按实际渲染尺寸缩放) 内时返回 undefined. */
export function pointerToFraction(rect: DOMRect, clientX: number, clientY: number, size: number, sweep: number, deadPx: number): number | undefined {
	const dx = clientX - (rect.left + rect.width / TWO);
	const dy = clientY - (rect.top + rect.height / TWO);
	if (Math.hypot(dx, dy) < deadPx * (rect.width / size || 1)) return undefined;
	return angleToFraction(dx, dy, sweep);
}
