"use client";

import * as React from "react";
import { cn } from "../../primitives/utils";
import { MEDIA_MODE, type MediaMode, type SlotClassNames, type SlotStyles, type ThemedImageSlot } from "../../constants/media";
import { mergeStyle, resolveSlots } from "../slots";
import { Image, type ImageProps } from "./image";

export type ThemedImageProps = Omit<ImageProps, "src" | "srcSet" | "classNames" | "styles"> & {
	/** 亮色主题下的图片地址. */
	lightSrc: string;
	/** 暗色主题下的图片地址. */
	darkSrc: string;
	lightSrcSet?: string;
	darkSrcSet?: string;
	/** 强制某一套图; 不传则跟随最近祖先的 data-mode. */
	mode?: MediaMode;
	classNames?: SlotClassNames<ThemedImageSlot, { mode: MediaMode | undefined }>;
	styles?: SlotStyles<ThemedImageSlot, { mode: MediaMode | undefined }>;
};

/**
 * 亮暗双图. 两张图同时渲染, 由 CSS 按祖先 data-mode 切换显示 (tokens.css 以暗色为默认, 所以暗图默认可见,
 * 祖先为 data-mode="light" 时换成亮图). 切换不经过 JS 与 effect, 首帧即正确, 没有闪烁;
 * 隐藏的那张是 display:none, 配合默认的 loading="lazy" 不会被下载 (priority 时两张都会预取).
 * 已知限制: 亮色作用域里再嵌套暗色作用域时以外层亮色为准, 需要时用 mode 强制.
 */
export function ThemedImage({
	lightSrc, darkSrc, lightSrcSet, darkSrcSet, mode, classNames, styles, rootClassName, rootStyle, ...imageProps
}: ThemedImageProps): React.JSX.Element {
	const slot = resolveSlots(classNames, styles, { mode });
	const showLight = mode !== MEDIA_MODE.dark;
	const showDark = mode !== MEDIA_MODE.light;
	return (
		<span
			data-slot="themed-image"
			data-forced-mode={mode}
			className={cn("contents", slot.className("root"), rootClassName)}
			style={mergeStyle(slot.style("root"), rootStyle)}
		>
			{showDark && (
				<span
					data-slot="themed-image-dark"
					className={cn("contents", mode === undefined && "in-data-[mode=light]:hidden", slot.className("dark"))}
					style={slot.style("dark")}
				>
					<Image {...(imageProps as ImageProps)} src={darkSrc} srcSet={darkSrcSet} />
				</span>
			)}
			{showLight && (
				<span
					data-slot="themed-image-light"
					className={cn(mode === undefined ? "hidden in-data-[mode=light]:contents" : "contents", slot.className("light"))}
					style={slot.style("light")}
				>
					<Image {...(imageProps as ImageProps)} src={lightSrc} srcSet={lightSrcSet} />
				</span>
			)}
		</span>
	);
}
