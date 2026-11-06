"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { BUTTON_TYPE } from "../../constants";
import { DialogClose } from "../../primitives/dialog";
import { cn } from "../../primitives/utils";
import { LIGHTBOX_ZOOM, MEDIA_CLASSES, type LightboxSlot, type MediaLabels } from "../../constants/media";
import type { SlotResolver } from "../slots";

interface ControlProps extends Omit<React.ComponentProps<"button">, "children" | "type" | "slot"> {
	slot: SlotResolver<LightboxSlot>;
	part: LightboxSlot;
	label: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

/** 灯箱里的一个圆形图标按钮; part 决定 data-slot. 其余属性 (含 DialogClose asChild 注入的 ref 与 onClick) 原样落到 button. */
function Control({ slot, part, label, icon: Icon, className, style, ...rest }: ControlProps): React.JSX.Element {
	return (
		<button
			{...rest}
			type={BUTTON_TYPE}
			aria-label={label}
			data-slot={`lightbox-${part}`}
			className={cn(MEDIA_CLASSES.iconButton, MEDIA_CLASSES.focusRing, slot.className(part), className)}
			style={{ ...slot.style(part), ...style }}
		>
			<Icon aria-hidden="true" data-slot="lightbox-control-icon" className={cn(MEDIA_CLASSES.icon, slot.className("control-icon"))} />
		</button>
	);
}

export interface LightboxControlsProps {
	slot: SlotResolver<LightboxSlot>;
	labels: MediaLabels;
	position: number;
	total: number;
	zoom: number;
	canPrev: boolean;
	canNext: boolean;
	onPrev: () => void;
	onNext: () => void;
	onZoom: (delta: number) => void;
}

/**
 * 灯箱的工具栏 (计数, 缩放, 关闭) 与左右切换按钮. 关闭按钮用 primitives/dialog 的 DialogClose,
 * 关闭与焦点归还交给 radix.
 */
export function LightboxControls({
	slot, labels, position, total, zoom, canPrev, canNext, onPrev, onNext, onZoom,
}: LightboxControlsProps): React.JSX.Element {
	return (
		<>
			<div
				data-slot="lightbox-toolbar"
				className={cn("absolute inset-x-0 top-0 flex items-center justify-end gap-2 p-3", slot.className("toolbar"))}
				style={slot.style("toolbar")}
			>
				<span
					aria-live="polite"
					data-slot="lightbox-counter"
					className={cn("me-auto text-sm text-muted-foreground tabular-nums", slot.className("counter"))}
					style={slot.style("counter")}
				>
					{labels.counter(position, total)}
				</span>
				<Control slot={slot} part="control" label={labels.zoomOut} icon={ZoomOutIcon} disabled={zoom <= LIGHTBOX_ZOOM.min} onClick={() => onZoom(-LIGHTBOX_ZOOM.step)} />
				<Control slot={slot} part="control" label={labels.zoomIn} icon={ZoomInIcon} disabled={zoom >= LIGHTBOX_ZOOM.max} onClick={() => onZoom(LIGHTBOX_ZOOM.step)} />
				<DialogClose asChild>
					<Control slot={slot} part="close-button" label={labels.close} icon={XIcon} />
				</DialogClose>
			</div>
			{total > 1 && (
				<>
					<Control
						slot={slot}
						part="prev-button"
						label={labels.previous}
						icon={ChevronLeftIcon}
						disabled={!canPrev}
						onClick={onPrev}
						className="absolute start-3 top-1/2 -translate-y-1/2"
					/>
					<Control
						slot={slot}
						part="next-button"
						label={labels.next}
						icon={ChevronRightIcon}
						disabled={!canNext}
						onClick={onNext}
						className="absolute end-3 top-1/2 -translate-y-1/2"
					/>
				</>
			)}
		</>
	);
}
