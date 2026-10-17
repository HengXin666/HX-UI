/**
 * 下游接入 hx-browser 的方式: 服务地址, 鉴权与可替换的 WebSocket / fetch 实现.
 * 组件不写死任何地址, 由使用方给 baseUrl (相对代理前缀或绝对地址).
 */

import { isString } from "../../constants";
import {
	HEADER_API_KEY,
	LIVE_ENVS_PATH,
	type LiveEnv,
	type LivePreset,
	liveSessionPath,
	QUERY_KEY,
	QUERY_PRESET,
} from "./protocol";

/** 与浏览器 WebSocket 兼容的最小构造签名, 便于注入 Node 实现或测试替身. */
export type WebSocketCtor = new (url: string) => WebSocket;
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface HxBrowserTransport {
	/**
	 * hx-browser 服务前缀. 例: "/hxbr" (经开发代理), "" (同源), "http://127.0.0.1:8325".
	 * 相对前缀按当前页面的 origin 解析成 ws(s) 地址.
	 */
	baseUrl: string;
	/**
	 * 服务端 api_key. WS 只能放查询串, 会出现在代理日志里; 更稳妥的做法是在代理上注入
	 * x-api-key 并且这里留空.
	 */
	apiKey?: string;
	/** 完全自定义 WS 地址 (例如经网关签名). 给了它 baseUrl 只用于 HTTP. */
	wsUrlBuilder?: (path: string, query: URLSearchParams) => string;
	WebSocketImpl?: WebSocketCtor;
	fetchImpl?: FetchLike;
	/** 解析相对 baseUrl 用的 origin, 默认 window.location.origin. */
	origin?: string;
}

const HTTPS = "https:";
const SECURE_WS = "wss:";
const PLAIN_WS = "ws:";

function currentOrigin(transport: HxBrowserTransport): string {
	if (isString(transport.origin)) return transport.origin;
	return (globalThis as { location?: Location }).location?.origin ?? "";
}

/** 单副本预览会话的完整 ws(s) 地址. */
export function liveSessionUrl(
	transport: HxBrowserTransport,
	envId: string,
	preset: LivePreset,
): string {
	const path = liveSessionPath(envId);
	const query = new URLSearchParams({ [QUERY_PRESET]: preset });
	if (transport.apiKey) query.set(QUERY_KEY, transport.apiKey);
	if (transport.wsUrlBuilder) return transport.wsUrlBuilder(path, query);
	const baseUrl = transport.baseUrl.replace(/\/+$/, "");
	const url = new URL(baseUrl + path, currentOrigin(transport));
	url.protocol = url.protocol === HTTPS ? SECURE_WS : PLAIN_WS;
	url.search = query.toString();
	return url.toString();
}

/** 在跑副本列表的 HTTP 地址 (相对 baseUrl 原样保留为相对地址). */
export function liveEnvsUrl(transport: HxBrowserTransport): string {
	return transport.baseUrl.replace(/\/+$/, "") + LIVE_ENVS_PATH;
}

interface Envelope {
	code?: number;
	msg?: string;
	data?: { envs?: LiveEnv[] };
}

/** 读一次在跑副本列表. 服务端非 0 code 或 HTTP 错误抛出带原文的 Error. */
export async function fetchLiveEnvs(
	transport: HxBrowserTransport,
	signal?: AbortSignal,
): Promise<LiveEnv[]> {
	const doFetch = transport.fetchImpl ?? fetch;
	const headers: Record<string, string> = {};
	if (transport.apiKey) headers[HEADER_API_KEY] = transport.apiKey;
	const res = await doFetch(liveEnvsUrl(transport), { headers, signal });
	let body: Envelope = {};
	try {
		body = (await res.json()) as Envelope;
	} catch {
		body = {};
	}
	if (!res.ok || body.code !== 0) {
		throw new Error(body.msg || `HTTP ${res.status}`);
	}
	return body.data?.envs ?? [];
}
