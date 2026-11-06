"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../primitives/dialog";
import { cn } from "../../primitives/utils";
import { UI_CLASSES } from "../../constants";
import {
	IMG_DECODING, IMG_LOADING, MEDIA_LABELS,
	type LightboxSlot, type MediaLabels, type SlotClassNames, type SlotStyles,
} from "../../constants/media";
import { useMergeRefs } from "../../hooks/dom/useMergeRefs";
import { resolveSlots } from "../slots";
import { LightboxControls } from "./lightbox-controls";
import { useLightbox } from "./use-lightbox";
import type { LightboxIndexChange, MediaItem } from "./types";

export interface LightboxState {
	open: boolean;
	index: number | null;
	zoom: number;
}

export interface LightboxProps {
	items: MediaItem[];
	/** 当前序号, null 为关闭 (受控). */
	index?: number | null;
	/** 非受控初值. */
	defaultIndex?: number | null;
	/** 序号变化 (含关闭时的 null). */
	onIndexChange?: LightboxIndexChange;
	/** 首尾循环, 默认 true. */
	loop?: boolean;
	/** 关闭后的焦点去向; preventDefault 后自行聚焦 (例如画廊把焦点还给当前图对应的格子). */
	onCloseAutoFocus?: (event: Event) => void;
	labels?: Partial<MediaLabels>;
	classNames?: SlotClassNames<LightboxSlot, LightboxState>;
	styles?: SlotStyles<LightboxSlot, LightboxState>;
	className?: string;
	ref?: React.Ref<HTMLDivElement>;
}

/**
 * 全屏灯箱. 底座是 primitives/dialog (portal, 焦点陷阱, Esc 关闭, 焦点归还, 外部 inert 都由 radix 负责).
 * 左右方向键与按钮切换, 滚轮或按钮缩放 (换图回到 1 倍), 点击图片以外的空白处关闭.
 * ref 指向全屏面板 (dialog content). 缩放只过渡 scale, 时长令牌在减弱动效下归零.
 */
export function Lightbox({
	items, index, defaultIndex, onIndexChange, loop = true, onCloseAutoFocus, labels, classNames, styles, className, ref,
}: LightboxProps): React.JSX.Element {
	const box = useLightbox({ count: items.length, index, defaultIndex, onIndexChange, loop });
	const text: MediaLabels = { ...MEDIA_LABELS, ...labels };
	const slot = resolveSlots(classNames, styles, { open: box.open, index: box.current, zoom: box.zoom });
	const item = box.open && box.current !== null ? items[box.current] : undefined;
	const panelRef = React.useRef<HTMLDivElement>(null);
	const contentRef = useMergeRefs<HTMLDivElement>(panelRef, ref);

	const closeOnBackdrop = (event: React.MouseEvent<HTMLElement>): void => {
		if (event.target === event.currentTarget) box.close();
	};

	return (
		<Dialog open={box.open} onOpenChange={(next) => !next && box.close()}>
			<DialogContent
				ref={contentRef}
				data-slot="lightbox-content"
				showCloseButton={false}
				overlayClassName="bg-background/90"
				tabIndex={-1}
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					panelRef.current?.focus();
				}}
				onCloseAutoFocus={onCloseAutoFocus}
				onKeyDown={box.onKeyDown}
				onClick={closeOnBackdrop}
				className={cn(
					"top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 items-center justify-center gap-0 rounded-none border-0 bg-transparent p-0",
					slot.className("content"),
					className,
				)}
				style={slot.style("content")}
			>
				<DialogTitle data-slot="lightbox-title" className={cn(UI_CLASSES.srOnly, slot.className("title"))}>
					{item?.alt}
				</DialogTitle>
				<DialogDescription data-slot="lightbox-description" className={cn(UI_CLASSES.srOnly, slot.className("description"))}>
					{box.current !== null ? text.counter(box.current + 1, items.length) : null}
				</DialogDescription>
				<div
					data-slot="lightbox-stage"
					onClick={closeOnBackdrop}
					onWheel={box.onWheel}
					className={cn("flex size-full items-center justify-center overflow-hidden p-(--control-h-xl)", slot.className("stage"))}
					style={slot.style("stage")}
				>
					{item && (
						<img
							key={item.id ?? item.src}
							src={item.src}
							srcSet={item.srcSet}
							sizes="100vw"
							alt={item.alt}
							loading={IMG_LOADING.eager}
							decoding={IMG_DECODING}
							data-slot="lightbox-image"
							className={cn(
								"max-h-full max-w-full object-contain transition-[scale] duration-(--duration-base) ease-out select-none motion-reduce:transition-none",
								slot.className("image"),
							)}
							style={{ scale: String(box.zoom), ...slot.style("image") }}
						/>
					)}
				</div>
				<LightboxControls
					slot={slot}
					labels={text}
					position={(box.current ?? 0) + 1}
					total={items.length}
					zoom={box.zoom}
					canPrev={box.canPrev}
					canNext={box.canNext}
					onPrev={() => box.go(-1)}
					onNext={() => box.go(1)}
					onZoom={box.zoomBy}
				/>
			</DialogContent>
		</Dialog>
	);
}
