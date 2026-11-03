/**
 * 媒体原语 (src/media/) 与其文档页共用的取值: slot 元组, 默认文案, 缩放档位, 设备比例与复用类名.
 * 组件里不出现任何 URL 或路径: 图片与视频地址全部由 props 传入.
 */
import type { CSSProperties } from "react";

/**
 * 每个媒体组件的 slot 元组 (component-contract 第 4 节). data-slot = `<组件名>-<slot>`, root 即组件名.
 *
 * .agents/notes/implemented/feature/2026-11-02-media-primitives.md
 */
export const IMAGE_SLOTS = ["root", "placeholder", "img", "fallback", "fallback-icon"] as const;
export const THEMED_IMAGE_SLOTS = ["root", "light", "dark"] as const;
export const VIDEO_SLOTS = ["root", "media", "toggle", "toggle-icon"] as const;
export const GALLERY_SLOTS = ["root", "item", "trigger", "image", "caption"] as const;
export const LIGHTBOX_SLOTS = [
	"content", "stage", "image", "title", "description", "counter", "toolbar", "control", "control-icon", "close-button", "prev-button", "next-button",
] as const;
export const DEVICE_FRAME_SLOTS = ["root", "body", "screen", "notch", "base"] as const;
export const BROWSER_FRAME_SLOTS = ["root", "toolbar", "controls", "control", "address", "address-icon", "address-text", "actions", "content"] as const;
export const PRODUCT_MOCK_FRAME_SLOTS = ["root", "stage", "fade", "content"] as const;

export type ImageSlot = (typeof IMAGE_SLOTS)[number];
export type ThemedImageSlot = (typeof THEMED_IMAGE_SLOTS)[number];
export type VideoSlot = (typeof VIDEO_SLOTS)[number];
export type GallerySlot = (typeof GALLERY_SLOTS)[number];
export type LightboxSlot = (typeof LIGHTBOX_SLOTS)[number];
export type DeviceFrameSlot = (typeof DEVICE_FRAME_SLOTS)[number];
export type BrowserFrameSlot = (typeof BROWSER_FRAME_SLOTS)[number];
export type ProductMockFrameSlot = (typeof PRODUCT_MOCK_FRAME_SLOTS)[number];

/** classNames / styles 的类型 (契约 4.1): 对象, 或按公开状态计算的函数. */
export type SlotClassNames<S extends string, State = void> =
	| Partial<Record<S, string>>
	| ((state: State) => Partial<Record<S, string>>);
export type SlotStyles<S extends string, State = void> =
	| Partial<Record<S, CSSProperties>>
	| ((state: State) => Partial<Record<S, CSSProperties>>);

/** 图片加载状态, 落到 data-state. */
export const IMAGE_STATUS = { loading: "loading", loaded: "loaded", error: "error" } as const;
export type ImageStatus = (typeof IMAGE_STATUS)[keyof typeof IMAGE_STATUS];

/** 视频播放状态, 落到 data-state. */
export const VIDEO_STATE = { playing: "playing", paused: "paused" } as const;
export type VideoState = (typeof VIDEO_STATE)[keyof typeof VIDEO_STATE];

/** 原生属性取值. */
export const IMG_LOADING = { lazy: "lazy", eager: "eager" } as const;
export const IMG_DECODING = "async";
export const FETCH_PRIORITY_HIGH = "high";
export const VIDEO_PRELOAD = { none: "none", metadata: "metadata" } as const;
export const DATA_URI_PREFIX = "data:";

/** 占位: "color" 为浅色底, "none" 不画, 其余字符串视为低清 data URI. */
export const IMAGE_PLACEHOLDER = { color: "color", none: "none" } as const;

/** 裁切方式, 对应 object-fit. */
export const IMAGE_FIT = { cover: "cover", contain: "contain" } as const;
export type ImageFit = (typeof IMAGE_FIT)[keyof typeof IMAGE_FIT];

/** 主题模式 (与 provider 的 data-mode 同值). */
export const MEDIA_MODE = { light: "light", dark: "dark" } as const;
export type MediaMode = (typeof MEDIA_MODE)[keyof typeof MEDIA_MODE];

/** 设备外框种类与屏幕宽高比 (宽 / 高). */
export const DEVICE = { phone: "phone", tablet: "tablet", laptop: "laptop" } as const;
export type DeviceKind = (typeof DEVICE)[keyof typeof DEVICE];
export const DEVICE_RATIO: Record<DeviceKind, number> = { phone: 9 / 19.5, tablet: 3 / 4, laptop: 16 / 10 };

/** 产品界面容器的渐隐边: 顶 / 底 / 不渐隐 (top, bottom 与 MaskFade 的 direction 同值). */
export const PRODUCT_MOCK_FADE = { top: "top", bottom: "bottom", none: "none" } as const;
export type ProductMockFade = (typeof PRODUCT_MOCK_FADE)[keyof typeof PRODUCT_MOCK_FADE];

/**
 * 产品界面容器默认值: 倾斜角 (deg, 绕 X 轴, 正值顶边远离观者), 透视距离 (px), 缩放, 截图宽高比 (宽 / 高),
 * 倾斜角上下限. 档位取自 linear / vercel 首屏截图的观感: 小角度 + 远透视, 只给纵深不制造畸变.
 */
export const PRODUCT_MOCK_DEFAULT = { tilt: 8, perspective: 2000, scale: 1, ratio: 16 / 10, minTilt: -45, maxTilt: 45 } as const;

/** 画廊默认列数与比例, 列数上下限. */
export const GALLERY_DEFAULTS = { columns: 3, ratio: 4 / 3, minColumns: 1, maxColumns: 6 } as const;
/** 画廊写到根上的列数 CSS 变量. */
export const GALLERY_COLS_VAR = "--hx-gallery-cols";

/** 灯箱缩放: 下限, 上限, 按钮步长, 滚轮步长. */
export const LIGHTBOX_ZOOM = { min: 1, max: 4, step: 0.5, wheelStep: 0.25 } as const;

/** 键名. */
export const MEDIA_KEY = { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown", home: "Home", end: "End" } as const;

/** 默认文案 (可由 labels prop 覆盖), 不在组件里写死英文. */
export const MEDIA_LABELS = {
	play: "播放",
	pause: "暂停",
	close: "关闭",
	previous: "上一张",
	next: "下一张",
	zoomIn: "放大",
	zoomOut: "缩小",
	imageError: "图片加载失败",
	counter: (index: number, total: number): string => `${index} / ${total}`,
};
export type MediaLabels = typeof MEDIA_LABELS;

/** 复用三次以上的类名. */
export const MEDIA_CLASSES = {
	/** 子元素铺满宿主. */
	fill: "absolute inset-0 size-full",
	/** 无边框可聚焦部件的 1px 焦点环 (契约 8.2). */
	focusRing: "focus-visible:outline-1 focus-visible:outline-ring focus-visible:outline-offset-2",
	/** 叠在媒体上的圆形图标按钮. */
	iconButton:
		"inline-flex size-(--control-h-md) items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-sm transition-colors duration-(--duration-fast) hover:bg-background disabled:cursor-not-allowed disabled:opacity-50",
	/** 按钮里的图标尺寸. */
	icon: "size-4",
	/** 淡入: 只过渡 opacity, 时长令牌在减弱动效下归零, 另写 motion-reduce 兜底. */
	fadeIn: "transition-opacity duration-(--duration-slow) ease-out motion-reduce:transition-none",
	/** 浅色占位底. */
	surface: "bg-muted",
} as const;

/** 文档页示例的取值. */
export const MEDIA_DOC = {
	widths: [480, 960],
	placeholderWidth: 16,
	demoHeight: 360,
	demoWidth: 640,
	frameWidthClass: "w-full max-w-xs",
	stageClass: "grid w-full gap-4 md:grid-cols-2",
	fieldClass: "h-(--control-h-md) w-full rounded-(--radius-md) border border-border bg-background px-3 text-sm text-foreground",
} as const;
