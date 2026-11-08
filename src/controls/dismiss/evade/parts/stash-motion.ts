// StashFolder 纸片的 CSS 动效: 开合时长, 每张纸片的变换与分阶段过渡串.
import { DISMISS_EASE_OUT, STASH } from "../../tokens";
import type { ChipSlot } from "../evade-math";

/** 规格没给 --ff-open / --ff-close 的值, 取与弹出动画同长的 320ms. */
export const STASH_OPEN_MS = STASH.popMs;
export const STASH_CLOSE_MS = STASH.popMs;

/** 打开时飞到槽位, 收起时落回文件夹口. */
export function chipTransform(slot: ChipSlot, open: boolean): string {
	return open ? `translate3d(-50%, ${slot.y}px, 0) translateX(${slot.x}px) rotate(${slot.angle}deg)` : "translate3d(-50%, 24px, 0)";
}

/** 漂移物理接管后只过渡透明度与缩放; 否则位移按开合曲线与错开延迟走. */
export function chipTransition(live: boolean, open: boolean, curve: string, delay: number, fadeDelay: number): string {
	const scale = `scale ${STASH.fadeMs}ms ${DISMISS_EASE_OUT}`;
	if (live) return `opacity ${STASH.fadeMs}ms ease, ${scale}`;
	const move = open ? `transform ${STASH_OPEN_MS}ms ${curve} ${delay}ms` : `transform ${STASH_CLOSE_MS}ms ${DISMISS_EASE_OUT} ${delay}ms`;
	return `${move}, opacity ${STASH.fadeMs}ms ease ${fadeDelay}ms, ${scale}`;
}
