"use client";

import * as React from "react";
import { ImageOffIcon } from "lucide-react";
import { AspectRatio } from "../../primitives/aspect-ratio";
import { cn } from "../../primitives/utils";
import { useMergeRefs } from "../../hooks/dom/useMergeRefs";
import {
	DATA_URI_PREFIX, FETCH_PRIORITY_HIGH, IMAGE_FIT, IMAGE_PLACEHOLDER, IMAGE_STATUS, IMG_DECODING, IMG_LOADING, MEDIA_CLASSES, MEDIA_LABELS,
	type ImageFit, type ImageSlot, type ImageStatus, type SlotClassNames, type SlotStyles,
} from "../../constants/media";
import { composeEventHandlers, mergeStyle, resolveSlots } from "../slots";
import { useImageStatus } from "./use-image-status";

/** 尺寸二选一: 固定宽高 (防 CLS), 或只给宽高比由 AspectRatio 撑开. */
export type ImageSizing =
	| { width: number; height: number; ratio?: undefined }
	| { ratio: number; width?: number; height?: number };

export type ImageProps = Omit<React.ComponentProps<"img">, "width" | "height" | "placeholder" | "loading" | "src" | "alt"> &
	ImageSizing & {
		/** 图片地址, 由调用方传入; 组件内不写任何路径. */
		src: string;
		/** 替代文字. 装饰图传空字符串. */
		alt: string;
		/** 首屏关键图: loading 改为 eager 并加 fetchpriority="high". */
		priority?: boolean;
		/** 原生 loading, 默认 lazy; priority 为 true 时忽略. */
		loading?: (typeof IMG_LOADING)[keyof typeof IMG_LOADING];
		/** 占位: "color" 浅色底 (默认), "none" 不画, 其他字符串视为低清 data URI 做模糊占位. */
		placeholder?: string;
		/** 焦点裁切, 等同 CSS object-position, 例: "50% 20%". */
		objectPosition?: string;
		/** object-fit, 默认 cover. */
		fit?: ImageFit;
		/** 加载失败时的兜底内容; 不传则显示图标与读屏文字. */
		fallback?: React.ReactNode;
		/** 内置文案覆盖. */
		labels?: Partial<Pick<typeof MEDIA_LABELS, "imageError">>;
		classNames?: SlotClassNames<ImageSlot, { status: ImageStatus }>;
		styles?: SlotStyles<ImageSlot, { status: ImageStatus }>;
		/** 根节点内联样式 (等价 styles.root). */
		rootStyle?: React.CSSProperties;
		/** 根节点类名 (等价 classNames.root); className 作用在 img 上. */
		rootClassName?: string;
	};

/**
 * 响应式图片: srcSet / sizes 透传, 默认懒加载与异步解码, 占位, 焦点裁切, 加载淡入, 失败兜底.
 * 遵循 docs/architecture/component-contract.md: ref 作为普通 prop 落在原生 img 上, 每个节点带 data-slot.
 * 淡入只过渡 opacity, 时长令牌在 prefers-reduced-motion 下归零, 另加 motion-reduce:transition-none.
 *
 * .agents/notes/implemented/feature/2026-11-02-media-primitives.md
 */
export function Image({
	src, alt, srcSet, sizes, width, height, ratio, priority = false, loading = IMG_LOADING.lazy,
	placeholder = IMAGE_PLACEHOLDER.color, objectPosition, fit = IMAGE_FIT.cover, fallback, labels,
	classNames, styles, rootStyle, rootClassName, className, style, ref, onLoad, onError, ...props
}: ImageProps): React.JSX.Element {
	const { status, ref: statusRef, onLoad: markLoaded, onError: markError } = useImageStatus(src);
	const imgRef = useMergeRefs<HTMLImageElement>(statusRef, ref);
	const slot = resolveSlots(classNames, styles, { status });
	const blurUri = placeholder.startsWith(DATA_URI_PREFIX) ? placeholder : undefined;
	const errorText = labels?.imageError ?? MEDIA_LABELS.imageError;
	const failed = status === IMAGE_STATUS.error;
	const fixed = ratio === undefined;

	const rootClass = cn(
		"relative overflow-hidden",
		fixed ? "inline-block max-w-full align-middle" : "block size-full",
		placeholder === IMAGE_PLACEHOLDER.color && MEDIA_CLASSES.surface,
		slot.className("root"),
		rootClassName,
	);
	const rootInline = mergeStyle(
		fixed ? { aspectRatio: `${width} / ${height}`, width } : undefined,
		mergeStyle(slot.style("root"), rootStyle),
	);

	const body = (
		<>
			{blurUri && (
				<span
					aria-hidden="true"
					data-slot="image-placeholder"
					data-state={status}
					className={cn(
						MEDIA_CLASSES.fill,
						"scale-110 bg-cover bg-center blur-xl data-[state=loaded]:opacity-0 motion-reduce:scale-100",
						MEDIA_CLASSES.fadeIn,
						slot.className("placeholder"),
					)}
					style={mergeStyle({ backgroundImage: `url("${blurUri}")`, backgroundPosition: objectPosition }, slot.style("placeholder"))}
				/>
			)}
			{!failed && (
				<img
					{...props}
					ref={imgRef}
					src={src}
					srcSet={srcSet}
					sizes={sizes}
					alt={alt}
					width={width}
					height={height}
					loading={priority ? IMG_LOADING.eager : loading}
					fetchPriority={priority ? FETCH_PRIORITY_HIGH : props.fetchPriority}
					decoding={IMG_DECODING}
					onLoad={composeEventHandlers(onLoad, markLoaded)}
					onError={composeEventHandlers(onError, markError)}
					data-slot="image-img"
					data-state={status}
					className={cn(
						MEDIA_CLASSES.fill,
						"opacity-0 data-[state=loaded]:opacity-100",
						MEDIA_CLASSES.fadeIn,
						slot.className("img"),
						className,
					)}
					style={mergeStyle({ objectFit: fit, objectPosition }, mergeStyle(slot.style("img"), style))}
				/>
			)}
			{failed && (
				<span
					role="img"
					aria-label={alt || errorText}
					data-slot="image-fallback"
					className={cn(MEDIA_CLASSES.fill, "flex items-center justify-center text-muted-foreground", MEDIA_CLASSES.surface, slot.className("fallback"))}
					style={slot.style("fallback")}
				>
					{fallback ?? (
						<ImageOffIcon aria-hidden="true" data-slot="image-fallback-icon" className={cn(MEDIA_CLASSES.icon, slot.className("fallback-icon"))} />
					)}
				</span>
			)}
		</>
	);

	if (fixed) {
		return (
			<span data-slot="image" data-state={status} className={rootClass} style={rootInline}>
				{body}
			</span>
		);
	}
	return (
		<AspectRatio ratio={ratio} data-slot="image" data-state={status} className={rootClass} style={rootInline}>
			{body}
		</AspectRatio>
	);
}
