/**
 * 单副本预览连接的状态机 (不依赖 React): 建连, 收帧, 停流/续流, 按关闭码与退避重连.
 * React 钩子 useHxBrowserLive 只是把它的快照接到 state 上.
 */

import { LIVE_RETRY, LIVE_STATUS } from "../../constants/hxbrowser";
import {
	FRAME_DATA_URL_PREFIX,
	LIVE_EVT,
	LIVE_MSG,
	type LiveClientMessage,
	type LiveMeta,
	type LivePreset,
	type LiveTab,
	NO_RETRY_CLOSE_CODES,
	parseServerEvent,
} from "./protocol";
import { type HxBrowserTransport, liveSessionUrl } from "./transport";

/**
 * idle: 未启用 / connecting: 握手中 / live: 推流中 / paused: 已请求停流 /
 * reconnecting: 断开后等待重连 / refused: 服务端拒绝 (不重连) / failed: 重试用尽.
 */
export type LiveStatus = (typeof LIVE_STATUS)[keyof typeof LIVE_STATUS];

export interface LiveSnapshot {
	status: LiveStatus;
	/** 最新一帧的 data URL; 首帧前为空串. */
	frame: string;
	meta: LiveMeta | null;
	tabs: LiveTab[];
	/** 最近一条服务端错误原文 (非致命的也保留, 例如没有可后退的历史记录). */
	error: string;
	/** 连续失败次数; 连接稳定 stableMs 后才清零. */
	attempt: number;
}

export interface LiveRetryPolicy {
	baseMs: number;
	maxMs: number;
	maxAttempts: number;
	/** 连接保持打开多久才算稳定并清零失败计数. 服务端握手后才以 4502 关闭的情形靠它兜住. */
	stableMs: number;
}

export const DEFAULT_RETRY: LiveRetryPolicy = {
	baseMs: LIVE_RETRY.baseMs,
	maxMs: LIVE_RETRY.maxMs,
	maxAttempts: LIVE_RETRY.maxAttempts,
	stableMs: LIVE_RETRY.stableMs,
};

export interface LiveTimers {
	set: (fn: () => void, ms: number) => unknown;
	clear: (handle: unknown) => void;
}

const DEFAULT_TIMERS: LiveTimers = {
	set: (fn, ms) => globalThis.setTimeout(fn, ms),
	clear: (h) => globalThis.clearTimeout(h as ReturnType<typeof setTimeout>),
};

export interface LiveConnectionOptions {
	envId: string;
	preset: LivePreset;
	transport: HxBrowserTransport;
	paused?: boolean;
	retry?: Partial<LiveRetryPolicy>;
	timers?: LiveTimers;
	onChange: (snapshot: LiveSnapshot) => void;
}

const OPEN = 1;

/** 第 attempt 次重连前的等待: 指数退避并封顶. */
export function backoffDelay(policy: LiveRetryPolicy, attempt: number): number {
	return Math.min(policy.maxMs, policy.baseMs * LIVE_RETRY.exponent ** Math.max(0, attempt - 1));
}

export class LiveConnection {
	private readonly opts: LiveConnectionOptions;
	private readonly retry: LiveRetryPolicy;
	private readonly timers: LiveTimers;
	private ws: WebSocket | null = null;
	private retryTimer: unknown = null;
	private stableTimer: unknown = null;
	private disposed = false;
	private paused: boolean;
	private snap: LiveSnapshot = { status: LIVE_STATUS.idle, frame: "", meta: null, tabs: [], error: "", attempt: 0 };

	constructor(opts: LiveConnectionOptions) {
		this.opts = opts;
		this.retry = { ...DEFAULT_RETRY, ...opts.retry };
		this.timers = opts.timers ?? DEFAULT_TIMERS;
		this.paused = opts.paused === true;
	}

	get snapshot(): LiveSnapshot {
		return this.snap;
	}

	start(): void {
		this.disposed = false;
		this.open();
	}

	/** 手动重连 (refused / failed 之后由用户触发): 清零失败计数重新建连. */
	reconnect(): void {
		this.stop();
		this.snap = { ...this.snap, attempt: 0 };
		this.start();
	}

	/** 永久关闭; 之后的关闭事件不再触发重连. */
	stop(): void {
		this.disposed = true;
		this.clearTimers();
		const ws = this.ws;
		this.ws = null;
		ws?.close();
	}

	/** 只在连接打开时发送; 断线期间的输入直接丢弃, 不排队 (排队的点击在重连后落下是危险的). */
	send(msg: LiveClientMessage): boolean {
		const ws = this.ws;
		if (!ws || ws.readyState !== OPEN) return false;
		ws.send(JSON.stringify(msg));
		return true;
	}

	setPaused(paused: boolean): void {
		if (this.paused === paused) return;
		this.paused = paused;
		if (this.send({ type: paused ? LIVE_MSG.pause : LIVE_MSG.resume })) {
			this.update({ status: paused ? LIVE_STATUS.paused : LIVE_STATUS.live });
		}
	}

	private update(patch: Partial<LiveSnapshot>): void {
		this.snap = { ...this.snap, ...patch };
		this.opts.onChange(this.snap);
	}

	private clearSession(): void {
		this.snap = { ...this.snap, frame: "", meta: null, tabs: [] };
		this.opts.onChange(this.snap);
	}

	private clearTimers(): void {
		if (this.retryTimer !== null) this.timers.clear(this.retryTimer);
		if (this.stableTimer !== null) this.timers.clear(this.stableTimer);
		this.retryTimer = null;
		this.stableTimer = null;
	}

	private open(): void {
		const { transport, envId, preset } = this.opts;
		const Impl = transport.WebSocketImpl ?? WebSocket;
		this.clearSession();
		this.update({ status: LIVE_STATUS.connecting });
		const ws = new Impl(liveSessionUrl(transport, envId, preset));
		this.ws = ws;
		ws.onopen = () => this.onOpen(ws);
		ws.onmessage = (e: MessageEvent) => this.onMessage(ws, e.data);
		ws.onclose = (e: CloseEvent) => this.onClose(ws, e.code);
	}

	private onOpen(ws: WebSocket): void {
		if (ws !== this.ws) return;
		// 服务端每条新连接默认在推流; 当前应暂停就立刻补一条 pause.
		if (this.paused) ws.send(JSON.stringify({ type: LIVE_MSG.pause }));
		ws.send(JSON.stringify({ type: LIVE_MSG.tabs }));
		this.update({ status: this.paused ? LIVE_STATUS.paused : LIVE_STATUS.live, error: "" });
		this.stableTimer = this.timers.set(() => {
			this.stableTimer = null;
			if (ws === this.ws && ws.readyState === OPEN) this.update({ attempt: 0 });
		}, this.retry.stableMs);
	}

	private onMessage(ws: WebSocket, data: unknown): void {
		if (ws !== this.ws) return;
		const ev = parseServerEvent(data);
		if (ev === null) return;
		if (ev.type === LIVE_EVT.frame) {
			this.update({ frame: FRAME_DATA_URL_PREFIX + ev.data });
		} else if (ev.type === LIVE_EVT.meta) {
			const { type: _t, ...meta } = ev;
			this.update({ meta });
		} else if (ev.type === LIVE_EVT.tabs) {
			this.update({ tabs: ev.tabs });
		} else {
			this.update({ error: String(ev.message) });
		}
	}

	private onClose(ws: WebSocket, code: number): void {
		if (ws !== this.ws) return;
		this.ws = null;
		this.clearTimers();
		this.clearSession();
		if (this.disposed) return;
		if (NO_RETRY_CLOSE_CODES.has(code)) {
			this.update({ status: LIVE_STATUS.refused });
			return;
		}
		const attempt = this.snap.attempt + 1;
		if (attempt > this.retry.maxAttempts) {
			this.update({ status: LIVE_STATUS.failed, attempt });
			return;
		}
		this.update({ status: LIVE_STATUS.reconnecting, attempt });
		this.retryTimer = this.timers.set(() => {
			this.retryTimer = null;
			if (!this.disposed) this.open();
		}, backoffDelay(this.retry, attempt));
	}
}
