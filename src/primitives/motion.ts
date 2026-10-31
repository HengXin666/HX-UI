import { MEDIA_REDUCED_MOTION } from "../constants";
import { layoutDelta } from "./motion-math";

/**
 * 系统是否要求减弱动效. 只在浏览器里有意义; 服务端渲染或测试环境缺 matchMedia 时按未开启处理.
 * JS 驱动的动效 (轮播滚动时长, 平滑滚动, 布局位移) 用它判断; CSS 动效由时长令牌在媒体查询里归零.
 */
export function prefersReducedMotion(): boolean {
	return globalThis.window?.matchMedia?.(MEDIA_REDUCED_MOTION).matches === true;
}

/** 上一帧的视口坐标. 只保留位移要用的两边, 避免把整份 DOMRect 存进状态. */
export interface LayoutBox {
	readonly left: number;
	readonly top: number;
}

const LAYOUT_MS = 460;
const LAYOUT_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** 读元素当前视口位置. 调用方应在布局已经落到新位置之后再读. */
export function readLayout(el: HTMLElement): LayoutBox {
	const rect = el.getBoundingClientRect();
	return { left: rect.left, top: rect.top };
}

/**
 * 从上一帧的位置滑到当前布局.
 *
 * 元素必须已经在新位置上. 位移量是上一帧矩形减现在的矩形, 所以运动相对的是
 * 它自己的上一次几何, 不是一个写死的关键帧. 减弱动效或没有上一帧时什么都不做.
 */
export function playLayout(el: HTMLElement, previous: LayoutBox | undefined): void {
	if (!previous || prefersReducedMotion()) return;
	const next = el.getBoundingClientRect();
	const delta = layoutDelta({ x: previous.left, y: previous.top }, { x: next.left, y: next.top });
	if (delta.x === 0 && delta.y === 0) return;
	el.animate?.(
		[{ transform: `translate(${delta.x}px, ${delta.y}px)` }, { transform: "translate(0px, 0px)" }],
		{ duration: LAYOUT_MS, easing: LAYOUT_EASE },
	);
}
