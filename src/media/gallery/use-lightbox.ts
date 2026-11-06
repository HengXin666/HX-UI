/**
 * 灯箱状态: 当前序号 (受控 / 非受控), 缩放倍数, 左右切换与滚轮缩放.
 */
import { useCallback, useState, type KeyboardEvent, type WheelEvent } from "react";
import { useControllableState } from "../../hooks/state/useControllableState";
import { LIGHTBOX_ZOOM, MEDIA_KEY } from "../../constants/media";
import { clamp } from "../slots";
import type { LightboxIndexChange } from "./types";

export interface UseLightboxOptions {
	count: number;
	index?: number | null;
	defaultIndex?: number | null;
	onIndexChange?: LightboxIndexChange;
	loop: boolean;
}

/**
 * 序号为 null 时灯箱关闭. 缩放与序号绑定存储, 换图自动回到 1 倍, 不需要 effect.
 */
export function useLightbox({ count, index, defaultIndex, onIndexChange, loop }: UseLightboxOptions) {
	const [current, setCurrent] = useControllableState<number | null>({
		value: index,
		defaultValue: defaultIndex ?? null,
		onChange: onIndexChange,
	});
	const [zoomEntry, setZoomEntry] = useState<{ at: number | null; value: number }>({ at: null, value: LIGHTBOX_ZOOM.min });
	const zoom = zoomEntry.at === current ? zoomEntry.value : LIGHTBOX_ZOOM.min;
	const open = current !== null && current >= 0 && current < count;

	const go = useCallback(
		(delta: number) => {
			if (current === null || count === 0) return;
			const next = current + delta;
			if (loop) setCurrent((next + count) % count);
			else if (next >= 0 && next < count) setCurrent(next);
		},
		[count, current, loop, setCurrent],
	);
	const zoomBy = useCallback(
		(delta: number) => setZoomEntry({ at: current, value: clamp(zoom + delta, LIGHTBOX_ZOOM.min, LIGHTBOX_ZOOM.max) }),
		[current, zoom],
	);
	const close = useCallback(() => setCurrent(null), [setCurrent]);

	const onKeyDown = useCallback(
		(event: KeyboardEvent<HTMLElement>) => {
			if (event.defaultPrevented) return;
			if (event.key === MEDIA_KEY.left) go(-1);
			else if (event.key === MEDIA_KEY.right) go(1);
			else return;
			event.preventDefault();
		},
		[go],
	);
	const onWheel = useCallback(
		(event: WheelEvent<HTMLElement>) => zoomBy(event.deltaY < 0 ? LIGHTBOX_ZOOM.wheelStep : -LIGHTBOX_ZOOM.wheelStep),
		[zoomBy],
	);

	const canPrev = loop ? count > 1 : current !== null && current > 0;
	const canNext = loop ? count > 1 : current !== null && current < count - 1;
	return { current, open, zoom, go, zoomBy, close, onKeyDown, onWheel, canPrev, canNext };
}
