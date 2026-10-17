/**
 * hx-browser 实时预览模块 (src/hxbrowser) 的字面量: 协议取值与组件里复用的类名 / 变体名.
 * 协议取值与服务端 HX-Jungle services/hx-browser 的 live_protocol.py / api_live.py 一一对应.
 */

/**
 * 预览协议的线上取值. 类型与文档在 src/hxbrowser/core/protocol.ts, 字面量按 PROJECT-CONST-DUP 落在这里.
 *
 * .agents/notes/implemented/feature/2026-10-17-hx-browser-live-view.md
 */
export const LIVE_API_PREFIX = "/api/v1";
export const LIVE_ENVS_PATH = "/api/v1/live/envs";
export const LIVE_PATH_SEGMENT = { environments: "environments", live: "live" } as const;
export const URL_SLASH = "/";

export const QUERY_KEY = "key";
export const QUERY_PRESET = "preset";
export const HEADER_API_KEY = "x-api-key";

/** 客户端 -> 服务端 */
export const LIVE_MSG = {
	mouse: "mouse",
	key: "key",
	text: "text",
	navigate: "navigate",
	quality: "quality",
	pause: "pause",
	resume: "resume",
	tabs: "tabs",
	activate: "activate",
} as const;

/** 服务端 -> 客户端 */
export const LIVE_EVT = {
	frame: "frame",
	meta: "meta",
	tabs: "tabs",
	error: "error",
} as const;

export const LIVE_PRESET = { grid: "grid", focus: "focus" } as const;

/** RFC 6455 私有段: 前三个是服务端主动拒绝, 4502 是上游 CDP 失败或断开. */
export const LIVE_CLOSE = {
	unsupported: 4400,
	auth: 4401,
	notFound: 4404,
	upstream: 4502,
} as const;

export const NAV_ACTION = { back: "back", forward: "forward", reload: "reload" } as const;
export const MOUSE_ACTION = { move: "move", down: "down", up: "up", wheel: "wheel" } as const;
export const MOUSE_BUTTONS = ["left", "middle", "right"] as const;
export const KEY_ACTION = { down: "down", up: "up" } as const;

export const FRAME_DATA_URL_PREFIX = "data:image/jpeg;base64,";

/** 连接状态取值 (LiveStatus). */
export const LIVE_STATUS = {
	idle: "idle",
	connecting: "connecting",
	live: "live",
	paused: "paused",
	reconnecting: "reconnecting",
	refused: "refused",
	failed: "failed",
} as const;

/** 重连默认值: 1.5s 起指数退避, 封顶 20s, 5 次; 连接稳定 5s 后清零失败计数. */
export const LIVE_RETRY = { baseMs: 1500, maxMs: 20000, maxAttempts: 5, stableMs: 5000, exponent: 2 } as const;

/** 副本列表与标签列表的默认轮询间隔. */
export const LIVE_POLL_MS = 5000;
export const LIVE_TABS_AFTER_ACTIVATE_MS = 600;

/** 原生 DOM 事件名. */
export const DOM_EVENT = {
	mousedown: "mousedown",
	mouseup: "mouseup",
	mousemove: "mousemove",
	wheel: "wheel",
	contextmenu: "contextmenu",
	keydown: "keydown",
	keyup: "keyup",
	paste: "paste",
	blur: "blur",
	visibility: "visibilitychange",
} as const;
export const CLIPBOARD_TEXT = "text";
export const PASTE_KEY = "v";
export const NATIVE_BUTTON = "button";

/** 组件用到的库内变体名 (Badge / Card / EmptyState / StateDot / Button). */
export const LIVE_UI = {
	solid: "solid",
	secondary: "secondary",
	success: "success",
	warning: "warning",
	danger: "danger",
	ghost: "ghost",
	sm: "sm",
	xs: "xs",
	iconSm: "icon-sm",
	denied: "denied",
	empty: "empty",
	loading: "loading",
	error: "error",
	ok: "ok",
	warn: "warn",
	busy: "busy",
	idle: "idle",
	placeholder: "-",
} as const;

/** 组件里复用的类名组合. */
export const LIVE_CLASS = {
	icon: "size-3.5",
	muted: "text-xs text-muted-foreground",
	mutedIcon: "text-muted-foreground",
	mono: "font-mono",
	row: "flex flex-wrap items-center gap-2",
	inline: "flex items-center gap-1",
	textInput: "w-44",
	truncate: "truncate",
	error: "text-xs text-danger-fg",
} as const;

/** 分段控件的两个视图. */
export const LIVE_VIEW = { grid: "grid", focus: "focus" } as const;
export const SANDBOX = "sandbox";
export const PROCESS = "process";
export const WAYLAND = "wayland";
