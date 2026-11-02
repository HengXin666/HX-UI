"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import { cn } from "../../primitives/utils";
import { useControllableState } from "../../hooks/state/useControllableState";
import {
	GALLERY_COLS_VAR, GALLERY_DEFAULTS, MEDIA_CLASSES, MEDIA_KEY,
	type GallerySlot, type MediaLabels, type SlotClassNames, type SlotStyles,
} from "../../constants/media";
import { Image } from "../image/image";
import { clamp, mergeStyle, resolveSlots } from "../slots";
import { Lightbox, type LightboxProps } from "./lightbox";
import type { LightboxIndexChange, MediaItem } from "./types";

export type GalleryProps = Omit<React.ComponentProps<"ul">, "children"> & {
	items: MediaItem[];
	/** 列数 1 到 6, 默认 3. 窄屏 (sm 以下) 统一两列以内. */
	columns?: number;
	/** 每格宽高比 (宽 / 高), 默认 4 / 3. */
	ratio?: number;
	/** 点击格子打开灯箱, 默认 true. */
	lightbox?: boolean;
	/** 灯箱当前序号, null 为关闭 (受控). */
	index?: number | null;
	defaultIndex?: number | null;
	onIndexChange?: LightboxIndexChange;
	/** 格子被激活 (点击, Enter, Space). */
	onItemClick?: (item: MediaItem, details: { index: number }) => void;
	labels?: Partial<MediaLabels>;
	lightboxProps?: Pick<LightboxProps, "loop" | "classNames" | "styles">;
	classNames?: SlotClassNames<GallerySlot, { columns: number }>;
	styles?: SlotStyles<GallerySlot, { columns: number }>;
};

/**
 * 多图网格. 每格是真实的 button, Tab 可达; 方向键在格子间移动焦点, Home / End 到首尾.
 * 开启灯箱时点击打开全屏查看, 关闭后焦点回到当前图所在的格子 (而不只是最初点击的那格).
 * ref 指向根 ul.
 *
 * .agents/notes/implemented/feature/2026-11-02-media-primitives.md
 */
export function Gallery({
	items, columns = GALLERY_DEFAULTS.columns, ratio = GALLERY_DEFAULTS.ratio, lightbox = true, index, defaultIndex, onIndexChange,
	onItemClick, labels, lightboxProps, classNames, styles, className, style, ...props
}: GalleryProps): React.JSX.Element {
	const cols = clamp(Math.round(columns), GALLERY_DEFAULTS.minColumns, GALLERY_DEFAULTS.maxColumns);
	const slot = resolveSlots(classNames, styles, { columns: cols });
	const [current, setCurrent] = useControllableState<number | null>({ value: index, defaultValue: defaultIndex ?? null, onChange: onIndexChange });
	const triggers = React.useRef<(HTMLButtonElement | null)[]>([]);
	const lastIndex = React.useRef(0);
	if (current !== null) lastIndex.current = current;

	const focusAt = (at: number): void => triggers.current[clamp(at, 0, items.length - 1)]?.focus();

	const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, at: number): void => {
		const moves: Record<string, number> = {
			[MEDIA_KEY.left]: at - 1,
			[MEDIA_KEY.right]: at + 1,
			[MEDIA_KEY.up]: at - cols,
			[MEDIA_KEY.down]: at + cols,
			[MEDIA_KEY.home]: 0,
			[MEDIA_KEY.end]: items.length - 1,
		};
		const target = moves[event.key];
		if (target === undefined) return;
		event.preventDefault();
		focusAt(target);
	};

	return (
		<>
			<ul
				{...props}
				data-slot="gallery"
				className={cn(
					"grid list-none grid-cols-[repeat(min(var(--hx-gallery-cols),2),minmax(0,1fr))] gap-2 p-0 sm:grid-cols-[repeat(var(--hx-gallery-cols),minmax(0,1fr))]",
					slot.className("root"),
					className,
				)}
				style={mergeStyle({ [GALLERY_COLS_VAR]: String(cols) } as React.CSSProperties, mergeStyle(slot.style("root"), style))}
			>
				{items.map((item, at) => (
					<li key={item.id ?? item.src} data-slot="gallery-item" className={cn("flex flex-col gap-1", slot.className("item"))} style={slot.style("item")}>
						<button
							type={BUTTON_TYPE}
							ref={(node) => {
								triggers.current[at] = node;
							}}
							onClick={() => {
								onItemClick?.(item, { index: at });
								if (lightbox) setCurrent(at);
							}}
							onKeyDown={(event) => onKeyDown(event, at)}
							aria-haspopup={lightbox ? "dialog" : undefined}
							data-slot="gallery-trigger"
							className={cn("block w-full cursor-zoom-in overflow-hidden rounded-(--radius-md)", MEDIA_CLASSES.focusRing, slot.className("trigger"))}
							style={slot.style("trigger")}
						>
							<Image
								src={item.thumbSrc ?? item.src}
								srcSet={item.thumbSrcSet ?? item.srcSet}
								sizes={item.sizes}
								alt={item.alt}
								ratio={ratio}
								placeholder={item.placeholder}
								objectPosition={item.objectPosition}
								classNames={{ root: slot.className("image") }}
							/>
						</button>
						{item.caption && (
							<span data-slot="gallery-caption" className={cn("text-xs text-muted-foreground", slot.className("caption"))} style={slot.style("caption")}>
								{item.caption}
							</span>
						)}
					</li>
				))}
			</ul>
			{lightbox && (
				<Lightbox
					{...lightboxProps}
					items={items}
					index={current}
					onIndexChange={setCurrent}
					labels={labels}
					onCloseAutoFocus={(event) => {
						event.preventDefault();
						focusAt(lastIndex.current);
					}}
				/>
			)}
		</>
	);
}
