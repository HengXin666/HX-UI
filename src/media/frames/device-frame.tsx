"use client";

import * as React from "react";
import { cn } from "../../primitives/utils";
import { DEVICE, DEVICE_RATIO, type DeviceFrameSlot, type DeviceKind, type SlotClassNames, type SlotStyles } from "../../constants/media";
import { mergeStyle, resolveSlots } from "../slots";

export type DeviceFrameProps = React.ComponentProps<"div"> & {
	/** 外框种类, 默认 phone. */
	device?: DeviceKind;
	/** 屏幕宽高比 (宽 / 高); 不传按设备取默认. */
	ratio?: number;
	classNames?: SlotClassNames<DeviceFrameSlot, { device: DeviceKind }>;
	styles?: SlotStyles<DeviceFrameSlot, { device: DeviceKind }>;
};

/** 每种设备的机身与屏幕类名: 机身厚度用内边距表达, 线条只有 1px 描边. */
const BODY: Record<DeviceKind, string> = {
	phone: "w-full rounded-4xl p-2",
	tablet: "w-full rounded-3xl p-3",
	laptop: "w-11/12 rounded-t-xl p-2",
};
const SCREEN: Record<DeviceKind, string> = {
	phone: "rounded-3xl",
	tablet: "rounded-xl",
	laptop: "rounded-sm",
};

/**
 * 设备外框, 供产品截图使用: children 是屏幕内容 (Image, Video 或任意节点), 铺满屏幕区域.
 * 纯装饰外壳, 不含任何图片地址. 颜色只用语义 token (机身 bg-muted, 描边 border-border, 屏幕 bg-background).
 * ref 指向根 div.
 *
 * .agents/notes/implemented/feature/2026-11-02-media-primitives.md
 */
export function DeviceFrame({
	device = DEVICE.phone, ratio, classNames, styles, className, style, children, ...props
}: DeviceFrameProps): React.JSX.Element {
	const slot = resolveSlots(classNames, styles, { device });
	const screenRatio = ratio ?? DEVICE_RATIO[device];
	return (
		<div
			{...props}
			data-slot="device-frame"
			data-device={device}
			className={cn("inline-flex w-full flex-col items-center", slot.className("root"), className)}
			style={mergeStyle(slot.style("root"), style)}
		>
			<div
				data-slot="device-frame-body"
				className={cn("relative border border-border bg-muted shadow-lg", BODY[device], slot.className("body"))}
				style={slot.style("body")}
			>
				<div
					data-slot="device-frame-screen"
					className={cn("relative overflow-hidden border border-border bg-background [&>*]:size-full", SCREEN[device], slot.className("screen"))}
					style={mergeStyle({ aspectRatio: String(screenRatio) }, slot.style("screen"))}
				>
					{children}
				</div>
				{device === DEVICE.phone && (
					<span
						aria-hidden="true"
						data-slot="device-frame-notch"
						className={cn("absolute top-3.5 left-1/2 h-5 w-1/4 -translate-x-1/2 rounded-full bg-muted", slot.className("notch"))}
						style={slot.style("notch")}
					/>
				)}
			</div>
			{device === DEVICE.laptop && (
				<span
					aria-hidden="true"
					data-slot="device-frame-base"
					className={cn("block h-3 w-full rounded-b-xl border border-border bg-muted", slot.className("base"))}
					style={slot.style("base")}
				/>
			)}
		</div>
	);
}
