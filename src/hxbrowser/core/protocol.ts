/**
 * hx-browser 实时预览协议: 线上消息类型的唯一定义处, 取值常量在 src/constants/hxbrowser.ts.
 * 字段名与服务端 (HX-Jungle services/hx-browser 的 live_protocol.py / api_live.py) 一一对应.
 * 不依赖 React 与 DOM, 任何前端或 Node 脚本都可只引本文件.
 */

import {
	FRAME_DATA_URL_PREFIX,
	HEADER_API_KEY,
	KEY_ACTION,
	LIVE_API_PREFIX,
	LIVE_CLOSE,
	LIVE_ENVS_PATH,
	LIVE_EVT,
	LIVE_MSG,
	LIVE_PATH_SEGMENT,
	LIVE_PRESET,
	MOUSE_ACTION,
	MOUSE_BUTTONS,
	NAV_ACTION,
	QUERY_KEY,
	QUERY_PRESET,
	URL_SLASH,
} from "../../constants/hxbrowser";
import { isString } from "../../constants";

export {
	FRAME_DATA_URL_PREFIX,
	HEADER_API_KEY,
	KEY_ACTION,
	LIVE_CLOSE,
	LIVE_ENVS_PATH,
	LIVE_EVT,
	LIVE_MSG,
	LIVE_PRESET,
	MOUSE_ACTION,
	MOUSE_BUTTONS,
	NAV_ACTION,
	QUERY_KEY,
	QUERY_PRESET,
};

/**
 * 单副本预览 WebSocket 的路径 (不含 base 与查询串).
 * 端点, 鉴权与关闭码语义见下面这篇 note; 取值在 src/constants/hxbrowser.ts.
 *
 * .agents/notes/implemented/feature/2026-10-17-hx-browser-live-view.md
 */
export function liveSessionPath(envId: string): string {
	return [LIVE_API_PREFIX, LIVE_PATH_SEGMENT.environments, encodeURIComponent(envId), LIVE_PATH_SEGMENT.live].join(URL_SLASH);
}

export type LivePreset = (typeof LIVE_PRESET)[keyof typeof LIVE_PRESET];
export type NavAction = (typeof NAV_ACTION)[keyof typeof NAV_ACTION];
export type MouseAction = (typeof MOUSE_ACTION)[keyof typeof MOUSE_ACTION];
export type MouseButtonName = (typeof MOUSE_BUTTONS)[number];
export type KeyAction = (typeof KEY_ACTION)[keyof typeof KEY_ACTION];

/** 服务端主动拒绝, 重连也没用的关闭码. */
export const NO_RETRY_CLOSE_CODES: ReadonlySet<number> = new Set([
	LIVE_CLOSE.unsupported,
	LIVE_CLOSE.auth,
	LIVE_CLOSE.notFound,
]);

/** 服务端 api_live._live_view 的形状. */
export interface LiveEnv {
	id: string;
	name: string;
	group: string;
	kernel: string;
	kernel_family: string;
	/** process | sandbox */
	isolation: string;
	/** auto | x11 | wayland */
	window_system: string;
	display: string;
	display_source: string;
	visible: boolean;
	running: boolean;
	supported: boolean;
	/** 不支持时服务端给的原文, 前端只展示不重判. */
	unsupported_reason: string;
}

export interface LiveTab {
	targetId: string;
	title: string;
	url: string;
	active: boolean;
}

export interface LiveMeta {
	url: string;
	title: string;
	pageWidth: number;
	pageHeight: number;
	streaming: boolean;
}

/* ── 服务端 -> 客户端事件 ── */

export interface LiveFrameEvent {
	type: typeof LIVE_EVT.frame;
	data: string;
	sessionId: number;
	pageWidth: number;
	pageHeight: number;
	offsetTop: number;
	scrollOffsetX: number;
	scrollOffsetY: number;
}
export interface LiveMetaEvent extends LiveMeta {
	type: typeof LIVE_EVT.meta;
}
export interface LiveTabsEvent {
	type: typeof LIVE_EVT.tabs;
	tabs: LiveTab[];
}
export interface LiveErrorEvent {
	type: typeof LIVE_EVT.error;
	message: string;
	/** fatal 之后服务端会关连接 (关闭码决定是否重连). */
	fatal: boolean;
}
export type LiveServerEvent =
	| LiveFrameEvent
	| LiveMetaEvent
	| LiveTabsEvent
	| LiveErrorEvent;

/* ── 客户端 -> 服务端消息 ── */

interface Modifiers {
	alt?: boolean;
	ctrl?: boolean;
	meta?: boolean;
	shift?: boolean;
}
export interface LiveMouseMessage extends Modifiers {
	type: typeof LIVE_MSG.mouse;
	action: MouseAction;
	/** 图像内像素坐标; 换算到页面 CSS 像素在服务端 (只认宽度比). */
	x: number;
	y: number;
	/** 图像显示宽度. */
	clientWidth: number;
	button?: MouseButtonName;
	/** move 时是否有按钮按住 (拖拽). */
	pressed?: boolean;
	clickCount?: number;
	deltaX?: number;
	deltaY?: number;
}
export interface LiveKeyMessage extends Modifiers {
	type: typeof LIVE_MSG.key;
	action: KeyAction;
	key: string;
	code: string;
	keyCode: number;
}
export interface LiveTextMessage {
	type: typeof LIVE_MSG.text;
	text: string;
}
export interface LiveNavigateMessage {
	type: typeof LIVE_MSG.navigate;
	action?: NavAction;
	url?: string;
}
export interface LiveQualityMessage {
	type: typeof LIVE_MSG.quality;
	preset: LivePreset;
}
export interface LiveFlowMessage {
	type: typeof LIVE_MSG.pause | typeof LIVE_MSG.resume | typeof LIVE_MSG.tabs;
}
export interface LiveActivateMessage {
	type: typeof LIVE_MSG.activate;
	targetId: string;
}
export type LiveClientMessage =
	| LiveMouseMessage
	| LiveKeyMessage
	| LiveTextMessage
	| LiveNavigateMessage
	| LiveQualityMessage
	| LiveFlowMessage
	| LiveActivateMessage;

/** 解析一条服务端事件; 非 JSON 或未知类型返回 null (不抛, 一条坏消息不该打断流). */
export function parseServerEvent(raw: unknown): LiveServerEvent | null {
	if (!isString(raw)) return null;
	let ev: unknown;
	try {
		ev = JSON.parse(raw);
	} catch {
		return null;
	}
	if (ev === null || Object(ev) !== ev) return null;
	const kind = (ev as { type?: unknown }).type;
	return Object.values(LIVE_EVT).includes(kind as never)
		? (ev as LiveServerEvent)
		: null;
}
