/**
 * 聚焦视图: 一个副本的高画质画面 + 远程操作 + 地址栏 + 前进后退刷新 + 标签条.
 */

import {
	ArrowLeftIcon,
	ArrowRightIcon,
	KeyboardIcon,
	LayoutGridIcon,
	RefreshCwIcon,
	RotateCwIcon,
	SendIcon,
} from "lucide-react";
import { type JSX, type ReactNode, useEffect, useState } from "react";
import { Card } from "../layout/Card";
import { EmptyState } from "../layout/EmptyState";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { Switch } from "../primitives/switch";
import { cn } from "../primitives/utils";
import {
	LIVE_CLASS, LIVE_POLL_MS, LIVE_STATUS, LIVE_TABS_AFTER_ACTIVATE_MS, LIVE_UI,
} from "../constants/hxbrowser";
import { BrowserLiveEnvBadges, BrowserLiveStatus } from "./BrowserLiveTile";
import { type BrowserLiveLabels, resolveLabels } from "./core/labels";
import { LIVE_MSG, LIVE_PRESET, type LiveEnv, NAV_ACTION, type NavAction } from "./core/protocol";
import type { HxBrowserTransport } from "./core/transport";
import { useDocumentVisible, useHxBrowserLive } from "./hooks";
import { useLiveInput } from "./useLiveInput";

export interface BrowserLiveViewProps {
	env: LiveEnv;
	transport: HxBrowserTransport;
	/** 给了才显示返回平铺按钮. */
	onBack?: () => void;
	/** 额外暂停条件 (页面转入后台时已自动暂停). */
	paused?: boolean;
	/** 键盘捕获初始值. 默认 true. */
	defaultCaptureKeys?: boolean;
	/** 标签列表轮询间隔, 页面自己会开新标签. 默认 5000. */
	tabsPollMs?: number;
	/** 顶栏右侧的额外内容. */
	toolbarExtra?: ReactNode;
	labels?: Partial<BrowserLiveLabels>;
	className?: string;
}

const ICON = LIVE_CLASS.icon;
const ICON_BTN = LIVE_UI.iconSm;
const GHOST = LIVE_UI.ghost;
const BAR = cn(LIVE_CLASS.row, "border-b border-border p-2");

/**
 * 画面是 img 而不是 canvas: 帧本身是 JPEG, 输入坐标只需要图像的显示矩形, img 少一层.
 * 监听挂在紧贴图像的外层可聚焦容器上, 图像 pointer-events-none; 画面上不加水波纹.
 * 地址栏获得焦点期间不跟随页面 url, 否则正在输入的内容会被覆盖.
 */
export function BrowserLiveView({
	env,
	transport,
	onBack,
	paused = false,
	defaultCaptureKeys = true,
	tabsPollMs = LIVE_POLL_MS,
	toolbarExtra,
	labels,
	className,
}: BrowserLiveViewProps): JSX.Element {
	const L = resolveLabels(labels);
	const pageVisible = useDocumentVisible();
	const live = useHxBrowserLive({
		...transport,
		envId: env.id,
		preset: LIVE_PRESET.focus,
		enabled: env.supported,
		paused: paused || !pageVisible,
	});
	const { send } = live;
	const [surface, setSurface] = useState<HTMLDivElement | null>(null);
	const [capture, setCapture] = useState(defaultCaptureKeys);
	const [addr, setAddr] = useState("");
	const [editing, setEditing] = useState(false);
	const [text, setText] = useState("");
	useLiveInput(surface, send, capture);

	const url = live.meta?.url ?? "";
	useEffect(() => {
		if (!editing) setAddr(url);
	}, [url, editing]);

	useEffect(() => {
		if (!env.supported || tabsPollMs <= 0) return undefined;
		const t = window.setInterval(() => send({ type: LIVE_MSG.tabs }), tabsPollMs);
		return () => window.clearInterval(t);
	}, [send, tabsPollMs, env.supported]);

	const activate = (targetId: string): void => {
		send({ type: LIVE_MSG.activate, targetId });
		window.setTimeout(() => send({ type: LIVE_MSG.tabs }), LIVE_TABS_AFTER_ACTIVATE_MS);
	};
	const nav = (action: NavAction): void => {
		send({ type: LIVE_MSG.navigate, action });
	};

	if (!env.supported) {
		return (
			<Card variant={LIVE_UI.solid} className={cn("p-4", className)}>
				<EmptyState kind={LIVE_UI.denied} text={L.unsupported} hint={env.unsupported_reason} />
			</Card>
		);
	}

	const failed = live.status === LIVE_STATUS.failed;
	const stopped = failed || live.status === LIVE_STATUS.refused;
	return (
		<Card variant={LIVE_UI.solid} className={cn("flex min-w-0 flex-col overflow-hidden", className)}>
			<div className={BAR}>
				{onBack && (
					<Button size={LIVE_UI.sm} variant={GHOST} onClick={onBack} title={L.backToGrid}>
						<LayoutGridIcon className={ICON} />
						{L.backToGrid}
					</Button>
				)}
				<span className="text-sm font-medium">{env.name || env.id}</span>
				<BrowserLiveEnvBadges env={env} labels={L} />
				<BrowserLiveStatus status={live.status} labels={L} />
				<span className="ml-auto flex items-center gap-2">
					{toolbarExtra}
					<KeyboardIcon className={cn(ICON, LIVE_CLASS.mutedIcon)} />
					<span className={LIVE_CLASS.muted}>{L.captureKeys}</span>
					<Switch size={LIVE_UI.sm} checked={capture} onCheckedChange={setCapture} />
				</span>
			</div>

			<div className={BAR}>
				<Button size={ICON_BTN} variant={GHOST} title={L.back} onClick={() => nav(NAV_ACTION.back)}>
					<ArrowLeftIcon className={ICON} />
				</Button>
				<Button size={ICON_BTN} variant={GHOST} title={L.forward} onClick={() => nav(NAV_ACTION.forward)}>
					<ArrowRightIcon className={ICON} />
				</Button>
				<Button size={ICON_BTN} variant={GHOST} title={L.reload} onClick={() => nav(NAV_ACTION.reload)}>
					<RotateCwIcon className={ICON} />
				</Button>
				<form
					className="min-w-[16rem] flex-1"
					onSubmit={(e) => {
						e.preventDefault();
						if (addr.trim() !== "") send({ type: LIVE_MSG.navigate, url: addr.trim() });
						(document.activeElement as HTMLElement | null)?.blur();
					}}
				>
					<Input
						className={LIVE_CLASS.mono}
						value={addr}
						placeholder={L.addressPlaceholder}
						onFocus={() => setEditing(true)}
						onBlur={() => setEditing(false)}
						onChange={(e) => setAddr(e.target.value)}
					/>
				</form>
				<form
					className={LIVE_CLASS.inline}
					onSubmit={(e) => {
						e.preventDefault();
						if (text !== "") send({ type: LIVE_MSG.text, text });
						setText("");
					}}
				>
					<Input className={LIVE_CLASS.textInput} value={text} placeholder={L.sendTextPlaceholder} onChange={(e) => setText(e.target.value)} />
					<Button size={ICON_BTN} variant={GHOST} type="submit" title={L.sendText}>
						<SendIcon className={ICON} />
					</Button>
				</form>
			</div>

			{live.tabs.length > 0 && (
				<div className="flex gap-1 overflow-x-auto border-b border-border px-2 py-1.5">
					{live.tabs.map((t) => (
						<Button
							key={t.targetId}
							size={LIVE_UI.xs}
							variant={t.active ? LIVE_UI.secondary : GHOST}
							className="max-w-[14rem] shrink-0"
							title={t.url}
							onClick={() => activate(t.targetId)}
						>
							<span className={LIVE_CLASS.truncate}>{t.title || t.url || t.targetId}</span>
						</Button>
					))}
				</div>
			)}

			{live.error !== "" && <div className={cn("px-3 py-1.5", LIVE_CLASS.error)}>{live.error}</div>}

			<div className="min-h-[20rem] bg-muted/30">
				{live.frame === "" || stopped ? (
					<div className="flex flex-col items-center gap-2 p-4">
						<EmptyState
							kind={stopped ? LIVE_UI.error : LIVE_UI.loading}
							text={failed ? L.failed : stopped ? L.refused : L.waitingFirstFrame}
							hint={live.error || L.frameHint}
						/>
						{failed && (
							<Button size={LIVE_UI.sm} onClick={live.reconnect}>
								<RefreshCwIcon className={ICON} />
								{L.reconnect}
							</Button>
						)}
					</div>
				) : (
					<div
						ref={setSurface}
						role="application"
						tabIndex={0}
						aria-label={`${L.surface}: ${env.name || env.id}`}
						className="block w-full cursor-default outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						<img
							src={live.frame}
							alt={live.meta?.title || env.name}
							draggable={false}
							className="pointer-events-none block h-auto w-full select-none"
						/>
					</div>
				)}
			</div>
		</Card>
	);
}
