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
	meshLayers: "--hx-mesh-layers",
	grainOpacity: "--hx-grain-opacity",
	lightBeamX: "--hx-light-beam-x",
	lightBeamY: "--hx-light-beam-y",
	lightBeamAngle: "--hx-light-beam-angle",
	lightBeamWidth: "--hx-light-beam-width",
	lightBeamColor: "--hx-light-beam-color",
	/** 边缘淡出长度令牌: MaskFade 的 length 写到元素上, 不传时读主题里的 --mask-fade. */
	maskFade: "--mask-fade",
	gradientBorder: "--hx-gradient-border",
} as const;

/** 默认值. 时长单位秒, 尺寸单位 px. */
export const EFFECT_DEFAULTS = {
	spotSize: 320,
	beamDurationS: 6,
	marqueeRepeat: 2,
	backdropSize: 24,
	/** MeshGradient 强度 0..1, 映射到每个光团的令牌混入比例. */
	meshIntensity: 0.6,
	grainOpacity: 0.12,
	/** Beam 光束: 角度 (deg), 原点位置 (%), 光束宽度 (px), 强度 0..1. */
	lightBeamAngle: 18,
	lightBeamX: 50,
	lightBeamY: 0,
	lightBeamWidth: 180,
	lightBeamIntensity: 0.7,
	/** GridLines: 格距 (px), 每隔几格放一个十字准星 (0 关闭), 准星单臂长 (px). */
	gridLinesSize: 32,
	gridCrossEvery: 4,
	gridCrossArm: 5,
	gradientBorderAngle: 135,
} as const;

/**
 * 令牌名到 CSS 的拼接规则 (src/effects/effect-color.ts 使用). 调用方只传语义令牌名
 * ("primary", "accent-2", "--success" 均可), 名字不合法时回退到 primary, 永远不会产出字面色值.
 */
export const EFFECT_TOKEN_FALLBACK = "primary";
export const EFFECT_TOKEN_PATTERN = /^[a-z][a-z0-9-]*$/;
/** 百分比上限, 强度与混入比例都先夹到 [0, 100]. */
export const PERCENT_MAX = 100;
/** 径向光团从中心到透明的终止位置. */
export const EFFECT_GLOW_STOP = "70%";

/** MeshGradient 默认三色: 主色, 青色辅色, 成功绿 (supabase 式暗底绿光). */
export const MESH_DEFAULT_TOKENS = ["primary", "accent-2", "success"] as const;
/** 光团混入比例上限 (%), 乘以 intensity 得到每团的 color-mix 比例. */
export const MESH_MAX_MIX = 60;
/** 光团的位置与半径 (%), 颜色多于位置时循环取用. */
export const MESH_STOPS = [
	{ x: 18, y: 22, rx: 45, ry: 50 },
	{ x: 82, y: 18, rx: 40, ry: 45 },
	{ x: 62, y: 84, rx: 50, ry: 45 },
	{ x: 10, y: 86, rx: 35, ry: 40 },
	{ x: 48, y: 46, rx: 30, ry: 35 },
] as const;

/** Grain 与下层的混合方式. */
export const GRAIN_BLEND = {
	normal: "normal",
	overlay: "overlay",
	softLight: "soft-light",
	multiply: "multiply",
	screen: "screen",
} as const;
export type GrainBlend = (typeof GRAIN_BLEND)[keyof typeof GRAIN_BLEND];

/** MaskFade 的淡出方向: 单边, 水平两边 (x), 垂直两边 (y), 径向四周. */
export const MASK_FADE_DIRECTION = {
	top: "top",
	bottom: "bottom",
	left: "left",
	right: "right",
	x: "x",
	y: "y",
	radial: "radial",
} as const;
export type MaskFadeDirection = (typeof MASK_FADE_DIRECTION)[keyof typeof MASK_FADE_DIRECTION];

/** GradientBorder 默认渐变: 主色到青色, 与 --gradient-brand 同向. */
export const GRADIENT_BORDER_DEFAULT_TOKENS = ["primary", "accent-2"] as const;

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
	meshTokens: ["primary", "accent-2", "success", "warning"],
	meshIntensityStrong: 0.85,
	grainOpacityStrong: 0.2,
	beamAngleLeft: -24,
	beamAngleRight: 24,
	beamLeftX: 30,
	beamRightX: 70,
	maskFadeLength: "4rem",
	gradientBorderTokens: ["success", "accent-2", "primary"],
	stageTall: "flex h-56 w-full items-center justify-center rounded-xl border border-border",
	maskList: "grid w-full gap-1 p-4",
	maskRows: 12,
} as const;
