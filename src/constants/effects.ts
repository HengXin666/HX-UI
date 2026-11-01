/**
 * 视觉效果件 (src/effects/) 与其文档页共用的取值: 变体名, CSS 变量名, 默认尺寸与类名.
 * 颜色不在这里: 光晕, 渐变与底纹全部写在 src/effects.css, 组件只拼类名与 CSS 变量.
 */

/**
 * Backdrop 的底纹种类: 网格线, 点阵, 极光.
 *
 * .agents/notes/implemented/feature/2026-11-01-visual-effects.md
 */
export const BACKDROP_VARIANT = {
	grid: "grid",
	dots: "dots",
	aurora: "aurora",
} as const;
export type BackdropVariant = (typeof BACKDROP_VARIANT)[keyof typeof BACKDROP_VARIANT];

/** BorderBeam 流光取色: 主色或辅色, 具体色值由 effects.css 按 data-tone 决定. */
export const BEAM_TONE = {
	primary: "primary",
	accent: "accent",
} as const;
export type BeamTone = (typeof BEAM_TONE)[keyof typeof BEAM_TONE];

/** GlassPanel 的模糊档与染色. */
export const GLASS_BLUR = { sm: "sm", md: "md", lg: "lg" } as const;
export const GLASS_TINT = { neutral: "neutral", primary: "primary" } as const;

/** 组件写到元素上, effects.css 读取的 CSS 变量名. */
export const EFFECT_VAR = {
	spotX: "--spot-x",
	spotY: "--spot-y",
	spotSize: "--spot-size",
	beamDuration: "--hx-beam-duration",
	beamDelay: "--hx-beam-delay",
	marqueeDuration: "--hx-marquee-duration",
	marqueeGap: "--hx-marquee-gap",
	backdropSize: "--hx-backdrop-size",
} as const;

/** 默认值. 时长单位秒, 尺寸单位 px. */
export const EFFECT_DEFAULTS = {
	spotSize: 320,
	beamDurationS: 6,
	marqueeRepeat: 2,
	backdropSize: 24,
} as const;

/** 跑马灯至少两份: 一份原件加一份无缝衔接的复制件. */
export const MARQUEE_MIN_REPEAT = 2;

/** 指针光斑只在 "可悬停 + 精细指针" 的设备上跟随; 触屏与触控笔不跑. */
export const MEDIA_FINE_HOVER = "(hover: hover) and (pointer: fine)";
/** 媒体查询变化事件名. */
export const MEDIA_CHANGE_EVENT = "change";
/** 只响应鼠标指针 (PointerEvent.pointerType). */
export const POINTER_MOUSE = "mouse";
/** 逻辑核数不超过它视为低性能设备, 光斑退化为静态. */
export const LOW_END_CORES = 2;

/** 叠在宿主上的装饰层: 不接收指针, 跟随宿主圆角. */
export const EFFECT_LAYER = "pointer-events-none absolute inset-0 rounded-[inherit]";
/** 承载装饰层的宿主: 定位上下文 + 独立层叠上下文, 装饰层用负 z-index 垫在内容下面. */
export const EFFECT_HOST = "relative isolate overflow-hidden";

/** 文档页示例用的类名与文案. */
export const EFFECTS_DOC = {
	tile: "flex h-36 w-56 flex-col justify-end gap-1 rounded-xl border border-border bg-card p-4",
	tileTitle: "text-sm font-medium text-foreground",
	tileText: "text-xs text-muted-foreground",
	stage: "flex h-48 w-full items-center justify-center rounded-xl border border-border",
	chip: "rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground",
	chips: ["React 19", "Tailwind 4", "Radix", "Motion 12", "cva", "Vite", "TypeScript"],
	spotItems: [
		{ title: "指针光斑", text: "鼠标移入看光斑跟随" },
		{ title: "触屏静止", text: "粗指针设备不注册跟随" },
		{ title: "键盘可见", text: "Tab 聚焦时光斑居中常亮" },
	],
	marqueeSeconds: 24,
	gridSize: 20,
} as const;
