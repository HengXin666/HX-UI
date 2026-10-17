/**
 * 平铺墙里的一块瓦片, 以及瓦片与聚焦视图共用的状态点和副本身份徽章.
 */

import { MonitorOffIcon } from "lucide-react";
import type { JSX } from "react";
import {
	LIVE_CLASS, LIVE_PRESET, LIVE_STATUS, LIVE_UI, NATIVE_BUTTON, PROCESS, SANDBOX, WAYLAND,
} from "../constants/hxbrowser";
import { Badge } from "../layout/Badge";
import { Card } from "../layout/Card";
import { EmptyState } from "../layout/EmptyState";
import { StateDot, type StateTone } from "../layout/StateDot";
import { cn } from "../primitives/utils";
import type { LiveStatus } from "./core/connection";
import { type BrowserLiveLabels, DEFAULT_LIVE_LABELS, resolveLabels } from "./core/labels";
import type { LiveEnv } from "./core/protocol";
import type { HxBrowserTransport } from "./core/transport";
import { useDocumentVisible, useElementInView, useHxBrowserLive } from "./hooks";

const STATUS_TONE: Record<LiveStatus, StateTone> = {
	idle: LIVE_UI.idle,
	connecting: LIVE_UI.busy,
	live: LIVE_UI.ok,
	paused: LIVE_UI.idle,
	reconnecting: LIVE_UI.warn,
	refused: LIVE_UI.error,
	failed: LIVE_UI.error,
};

export interface BrowserLiveStatusProps {
	status: LiveStatus;
	labels?: BrowserLiveLabels;
	className?: string;
}

/** 状态点 + 文字. */
export function BrowserLiveStatus({ status, labels = DEFAULT_LIVE_LABELS, className }: BrowserLiveStatusProps): JSX.Element {
	const text = labels.status[status];
	return (
		<span className={cn("inline-flex items-center gap-1.5", LIVE_CLASS.muted, className)}>
			<StateDot tone={STATUS_TONE[status]} label={text} pulse={status === LIVE_STATUS.connecting} />
			{text}
		</span>
	);
}

export interface BrowserLiveEnvBadgesProps {
	env: LiveEnv;
	labels?: BrowserLiveLabels;
}

/** 内核 / 隔离档 / 显示来源 / Wayland. 值是服务端原文, 只翻译已知的隔离档名. */
export function BrowserLiveEnvBadges({ env, labels = DEFAULT_LIVE_LABELS }: BrowserLiveEnvBadgesProps): JSX.Element {
	const sandbox = env.isolation === SANDBOX;
	const isolation = sandbox ? labels.sandbox : env.isolation === PROCESS ? labels.process : env.isolation;
	return (
		<span className="flex flex-wrap items-center gap-1">
			<Badge variant={LIVE_UI.secondary}>{env.kernel || env.kernel_family}</Badge>
			{env.isolation !== "" && <Badge variant={sandbox ? LIVE_UI.success : LIVE_UI.secondary}>{isolation}</Badge>}
			{env.display_source !== "" && <Badge variant={LIVE_UI.secondary}>{env.display_source}</Badge>}
			{env.window_system === WAYLAND && <Badge variant={LIVE_UI.warning}>Wayland</Badge>}
		</span>
	);
}

export interface BrowserLiveTileProps {
	env: LiveEnv;
	transport: HxBrowserTransport;
	/** 点击瓦片 (只对支持预览的副本触发). 不给则瓦片不可点. */
	onOpen?: (envId: string) => void;
	labels?: Partial<BrowserLiveLabels>;
	className?: string;
}

/**
 * 小画面上的点击坐标误差大, 误触会改动真实账号的页面, 所以瓦片不转发任何输入.
 * 滚出视口或页面转入后台时暂停推流. 画面 object-contain: 视口比例与 16:9 不一致时
 * 留边而不裁切, 瓦片要反映完整页面状态.
 */
export function BrowserLiveTile({ env, transport, onOpen, labels, className }: BrowserLiveTileProps): JSX.Element {
	const L = resolveLabels(labels);
	const [ref, inView] = useElementInView<HTMLButtonElement>();
	const pageVisible = useDocumentVisible();
	const live = useHxBrowserLive({
		...transport,
		envId: env.id,
		preset: LIVE_PRESET.grid,
		enabled: env.supported,
		paused: !inView || !pageVisible,
	});
	const clickable = env.supported && onOpen !== undefined;

	return (
		<Card variant={LIVE_UI.solid} interactive={clickable} className={cn("flex min-w-0 flex-col overflow-hidden", className)}>
			<button
				type={NATIVE_BUTTON}
				ref={ref}
				onClick={() => onOpen?.(env.id)}
				disabled={!clickable}
				title={env.supported ? L.openFocus : env.unsupported_reason}
				className="relative block aspect-video w-full overflow-hidden bg-muted/40 text-left disabled:cursor-default"
			>
				{!env.supported ? (
					<EmptyState compact kind={LIVE_UI.denied} text={L.unsupported} hint={env.unsupported_reason} />
				) : live.frame !== "" ? (
					<img src={live.frame} alt={env.name} draggable={false} className="h-full w-full object-contain" />
				) : (
					<span className={cn("flex h-full items-center justify-center", LIVE_CLASS.mutedIcon)}>
						<MonitorOffIcon className="size-6" />
					</span>
				)}
			</button>
			<div className="flex flex-col gap-1.5 p-2.5">
				<div className="flex items-center justify-between gap-2">
					<span className={cn(LIVE_CLASS.truncate, "text-sm font-medium")} title={env.id}>
						{env.name || env.id}
					</span>
					{env.supported && <BrowserLiveStatus status={live.status} labels={L} />}
				</div>
				<BrowserLiveEnvBadges env={env} labels={L} />
				<span className={cn(LIVE_CLASS.truncate, LIVE_CLASS.mono, LIVE_CLASS.muted)} title={live.meta?.url ?? ""}>
					{live.meta?.url || LIVE_UI.placeholder}
				</span>
				{live.error !== "" && <span className={cn(LIVE_CLASS.truncate, LIVE_CLASS.error)}>{live.error}</span>}
			</div>
		</Card>
	);
}
