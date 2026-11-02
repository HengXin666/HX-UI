"use client";

import * as React from "react";
import { PauseIcon, PlayIcon } from "lucide-react";
import { BUTTON_TYPE } from "../constants";
import { cn } from "../primitives/utils";
import { useMergeRefs } from "../hooks/dom/useMergeRefs";
import { useReducedMotion } from "../hooks/browser/media/useReducedMotion";
import {
	MEDIA_CLASSES, MEDIA_LABELS, VIDEO_PRELOAD, VIDEO_STATE,
	type SlotClassNames, type SlotStyles, type VideoSlot, type VideoState,
} from "../constants/media";
import { composeEventHandlers, mergeStyle, resolveSlots } from "./slots";

/** 一个视频源: 地址, MIME 类型, 可选媒体查询 (例如竖屏用另一份). */
export interface VideoSource {
	src: string;
	type?: string;
	media?: string;
}

export type VideoProps = Omit<React.ComponentProps<"video">, "children" | "title" | "autoPlay" | "src"> & {
	/** 读屏名称, 落到 aria-label. 必填. */
	title: string;
	/** 多格式源, 按顺序由浏览器挑第一个可播的. */
	sources?: VideoSource[];
	/** 单一源; 与 sources 同时传时两者都会渲染, src 优先. */
	src?: string;
	/** 进入视口前与减弱动效时显示的封面. */
	poster?: string;
	/** 静音自动播放, 默认 true. 系统开启减弱动效时不自动播, 停在 poster. */
	autoPlay?: boolean;
	/** 显示暂停 / 播放按钮, 默认 true (WCAG 2.2.2: 自动播放超过 5 秒须可暂停). */
	showToggle?: boolean;
	labels?: Partial<Pick<typeof MEDIA_LABELS, "play" | "pause">>;
	classNames?: SlotClassNames<VideoSlot, { state: VideoState }>;
	styles?: SlotStyles<VideoSlot, { state: VideoState }>;
	rootClassName?: string;
	rootStyle?: React.CSSProperties;
};

/**
 * 背景 / 产品视频: 默认 muted + loop + playsInline 自动播放, 带 poster 与暂停按钮.
 * 自动播放由 effect 调用 play() 完成, 不写 autoplay 属性: 服务端无法得知减弱动效偏好,
 * 属性一旦渲染浏览器就会先播起来. 减弱动效时只预取元数据, 用户点按钮才播放.
 *
 * .agents/notes/implemented/feature/2026-11-02-media-primitives.md
 */
export function Video({
	title, sources, src, poster, autoPlay = true, muted = true, loop = true, playsInline = true, showToggle = true,
	preload, labels, classNames, styles, rootClassName, rootStyle, className, style, ref, onPlay, onPause, ...props
}: VideoProps): React.JSX.Element {
	const localRef = React.useRef<HTMLVideoElement>(null);
	const videoRef = useMergeRefs<HTMLVideoElement>(localRef, ref);
	const reduced = useReducedMotion();
	const [state, setState] = React.useState<VideoState>(VIDEO_STATE.paused);
	const slot = resolveSlots(classNames, styles, { state });
	const playing = state === VIDEO_STATE.playing;
	const text = { ...MEDIA_LABELS, ...labels };
	const shouldAutoPlay = autoPlay && !reduced;

	React.useEffect(() => {
		const node = localRef.current;
		if (!node) return;
		if (shouldAutoPlay) {
			node.play().catch(() => setState(VIDEO_STATE.paused));
		} else if (reduced) {
			node.pause();
		}
	}, [shouldAutoPlay, reduced]);

	const toggle = (): void => {
		const node = localRef.current;
		if (!node) return;
		if (node.paused) node.play().catch(() => setState(VIDEO_STATE.paused));
		else node.pause();
	};

	return (
		<div
			data-slot="video"
			data-state={state}
			className={cn("relative overflow-hidden", MEDIA_CLASSES.surface, slot.className("root"), rootClassName)}
			style={mergeStyle(slot.style("root"), rootStyle)}
		>
			<video
				{...props}
				ref={videoRef}
				src={src}
				poster={poster}
				muted={muted}
				loop={loop}
				playsInline={playsInline}
				preload={preload ?? (shouldAutoPlay ? VIDEO_PRELOAD.metadata : VIDEO_PRELOAD.none)}
				aria-label={title}
				onPlay={composeEventHandlers(onPlay, () => setState(VIDEO_STATE.playing))}
				onPause={composeEventHandlers(onPause, () => setState(VIDEO_STATE.paused))}
				data-slot="video-media"
				data-state={state}
				className={cn("block size-full object-cover", slot.className("media"), className)}
				style={mergeStyle(slot.style("media"), style)}
			>
				{sources?.map((source) => (
					<source key={`${source.src}${source.media ?? ""}`} src={source.src} type={source.type} media={source.media} />
				))}
			</video>
			{showToggle && (
				<button
					type={BUTTON_TYPE}
					onClick={toggle}
					aria-label={playing ? text.pause : text.play}
					data-slot="video-toggle"
					data-state={state}
					className={cn("absolute end-3 bottom-3", MEDIA_CLASSES.iconButton, MEDIA_CLASSES.focusRing, slot.className("toggle"))}
					style={slot.style("toggle")}
				>
					{playing ? (
						<PauseIcon aria-hidden="true" data-slot="video-toggle-icon" className={cn(MEDIA_CLASSES.icon, slot.className("toggle-icon"))} />
					) : (
						<PlayIcon aria-hidden="true" data-slot="video-toggle-icon" className={cn(MEDIA_CLASSES.icon, slot.className("toggle-icon"))} />
					)}
				</button>
			)}
		</div>
	);
}
