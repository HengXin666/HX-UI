/**
 * hx-browser 实时预览的 React 钩子: 单副本流, 在跑副本列表, 页面与视口可见性.
 * 协议与重连逻辑在 core/, 这里只把它们接到 React 生命周期上.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
	LiveConnection,
	type LiveRetryPolicy,
	type LiveSnapshot,
} from "./core/connection";
import { DOM_EVENT, LIVE_POLL_MS, LIVE_STATUS } from "../constants/hxbrowser";
import type { LiveClientMessage, LiveEnv, LivePreset } from "./core/protocol";
import { fetchLiveEnvs, type HxBrowserTransport } from "./core/transport";

export interface UseHxBrowserLiveOptions extends HxBrowserTransport {
	envId: string;
	preset: LivePreset;
	/** 暂停 = 让服务端停推帧, 连接保持. 不可见的瓦片与后台标签页应暂停. */
	paused?: boolean;
	/** false 时不建连 (不支持的内核 / 未运行). 默认 true. */
	enabled?: boolean;
	retry?: Partial<LiveRetryPolicy>;
}

export interface HxBrowserLive extends LiveSnapshot {
	send: (msg: LiveClientMessage) => boolean;
	/** 重试用尽或被拒绝后手动重连. */
	reconnect: () => void;
}

const IDLE: LiveSnapshot = { status: LIVE_STATUS.idle, frame: "", meta: null, tabs: [], error: "", attempt: 0 };

/**
 * 一条副本预览连接. envId / preset / baseUrl / apiKey 变化会重建连接;
 * WebSocketImpl 与 wsUrlBuilder 取最新值但不触发重建 (避免内联函数每次渲染重连).
 */
export function useHxBrowserLive(options: UseHxBrowserLiveOptions): HxBrowserLive {
	const { envId, preset, paused = false, enabled = true, baseUrl, apiKey, origin } = options;
	const [snap, setSnap] = useState<LiveSnapshot>(IDLE);
	const connRef = useRef<LiveConnection | null>(null);
	const latest = useRef(options);
	latest.current = options;
	const pausedRef = useRef(paused);
	pausedRef.current = paused;

	useEffect(() => {
		if (!enabled) {
			setSnap(IDLE);
			return undefined;
		}
		const o = latest.current;
		const conn = new LiveConnection({
			envId,
			preset,
			paused: pausedRef.current,
			retry: o.retry,
			transport: { baseUrl, apiKey, origin, wsUrlBuilder: o.wsUrlBuilder, WebSocketImpl: o.WebSocketImpl },
			onChange: setSnap,
		});
		connRef.current = conn;
		conn.start();
		return () => {
			conn.stop();
			if (connRef.current === conn) connRef.current = null;
		};
	}, [envId, preset, enabled, baseUrl, apiKey, origin]);

	useEffect(() => {
		connRef.current?.setPaused(paused);
	}, [paused]);

	const send = useCallback((msg: LiveClientMessage) => connRef.current?.send(msg) ?? false, []);
	const reconnect = useCallback(() => connRef.current?.reconnect(), []);
	return { ...snap, send, reconnect };
}

export interface UseHxBrowserLiveEnvsOptions extends HxBrowserTransport {
	/** 轮询间隔: 副本会在本页之外被启停. 0 = 不轮询. 默认 5000. */
	pollMs?: number;
	enabled?: boolean;
}

export interface HxBrowserLiveEnvs {
	envs: LiveEnv[];
	error: string;
	loading: boolean;
	/** 至少成功读到过一次列表. 用来区分列表为空与还没读到. */
	loaded: boolean;
	reload: () => void;
}

/** 在跑副本列表. 读失败时保留上一次成功的列表并给出错误原文. */
export function useHxBrowserLiveEnvs(options: UseHxBrowserLiveEnvsOptions): HxBrowserLiveEnvs {
	const { baseUrl, apiKey, pollMs = LIVE_POLL_MS, enabled = true } = options;
	const [envs, setEnvs] = useState<LiveEnv[]>([]);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const [loaded, setLoaded] = useState(false);
	const latest = useRef(options);
	latest.current = options;
	const inflight = useRef<AbortController | null>(null);

	// A changed transport must not expose the previous service's environments while loading.
	useEffect(() => {
		setEnvs([]);
		setError("");
		setLoaded(false);
		setLoading(true);
	}, [baseUrl, apiKey]);

	const reload = useCallback(() => {
		inflight.current?.abort();
		const ctl = new AbortController();
		inflight.current = ctl;
		const o = latest.current;
		fetchLiveEnvs({ baseUrl, apiKey, fetchImpl: o.fetchImpl }, ctl.signal)
			.then((list) => {
				if (ctl.signal.aborted) return;
				setEnvs(list);
				setError("");
				setLoaded(true);
			})
			.catch((e: unknown) => {
				if (ctl.signal.aborted) return;
				setError(e instanceof Error ? e.message : String(e));
			})
			.finally(() => {
				if (!ctl.signal.aborted) setLoading(false);
			});
	}, [baseUrl, apiKey]);

	useEffect(() => {
		if (!enabled) return undefined;
		reload();
		const t = pollMs > 0 ? window.setInterval(reload, pollMs) : 0;
		return () => {
			if (t) window.clearInterval(t);
			inflight.current?.abort();
		};
	}, [reload, pollMs, enabled]);

	return { envs, error, loading, loaded, reload };
}

/** 页面是否在前台. 切到其他浏览器标签页时为 false, 用于停流. */
export function useDocumentVisible(): boolean {
	const [visible, setVisible] = useState(() => (globalThis as { document?: Document }).document?.hidden !== true);
	useEffect(() => {
		const onChange = () => setVisible(!document.hidden);
		document.addEventListener(DOM_EVENT.visibility, onChange);
		return () => document.removeEventListener(DOM_EVENT.visibility, onChange);
	}, []);
	return visible;
}

/** 元素是否在视口内. 回调 ref 写法, 元素挂上或换掉时自动重挂观察器. */
export function useElementInView<T extends HTMLElement>(): [(el: T | null) => void, boolean] {
	const [el, setEl] = useState<T | null>(null);
	const [inView, setInView] = useState(true);
	useEffect(() => {
		if (!el || !("IntersectionObserver" in globalThis)) return undefined;
		const io = new IntersectionObserver((entries) => setInView(entries.some((x) => x.isIntersecting)));
		io.observe(el);
		return () => io.disconnect();
	}, [el]);
	return [setEl, inView];
}
