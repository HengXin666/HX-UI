/**
 * 所有在跑 hx-browser 副本的平铺墙, 点任一块进入可操作的聚焦视图.
 */

import { RefreshCwIcon } from "lucide-react";
import { type JSX, type ReactNode, useEffect, useState } from "react";
import { Alert, AlertDescription } from "../primitives/alert";
import { Button } from "../primitives/button";
import { cn } from "../primitives/utils";
import { EmptyState } from "../layout/EmptyState";
import { PageHeader } from "../layout/PageHeader";
import { SegmentedControl } from "../layout/SegmentedControl";
import { LIVE_CLASS, LIVE_UI, LIVE_VIEW } from "../constants/hxbrowser";
import { findFocused, focusedGone, pickFocusTarget } from "./core/focus";
import { type BrowserLiveLabels, resolveLabels } from "./core/labels";
import type { HxBrowserTransport } from "./core/transport";
import { useHxBrowserLiveEnvs } from "./hooks";
import { BrowserLiveTile } from "./BrowserLiveTile";
import { BrowserLiveView } from "./BrowserLiveView";

type WallView = (typeof LIVE_VIEW)[keyof typeof LIVE_VIEW];
const GRID: WallView = LIVE_VIEW.grid;
const FOCUS: WallView = LIVE_VIEW.focus;

export interface BrowserLiveWallProps {
	transport: HxBrowserTransport;
	/** 页头标题; 不给则不渲染页头, 只渲染工具条. */
	title?: ReactNode;
	/** 在跑副本列表的轮询间隔. 默认 5000. */
	pollMs?: number;
	/** 工具条右侧的额外内容. */
	toolbarExtra?: ReactNode;
	/** 聚焦的副本变化 (null = 回到平铺), 便于使用方同步到路由. */
	onFocusChange?: (envId: string | null) => void;
	labels?: Partial<BrowserLiveLabels>;
	className?: string;
}

/**
 * 两种视图两档画质: 平铺每块一条低画质流, 聚焦只开一条高画质流且平铺整体卸载.
 *
 * 远程输入安全: 聚焦中的副本从列表消失 (在别处被停掉) 时回到平铺并提示, 绝不自动换成
 * 另一个副本, 否则用户接下来的点击和按键会落到另一个真实账号的浏览器上.
 * 只有用户在分段控件上主动点聚焦时, 才会选第一个支持预览的副本.
 *
 * .agents/notes/implemented/feature/2026-10-17-hx-browser-live-view.md
 */
export function BrowserLiveWall({
	transport,
	title,
	pollMs,
	toolbarExtra,
	onFocusChange,
	labels,
	className,
}: BrowserLiveWallProps): JSX.Element {
	const L = resolveLabels(labels);
	const { envs, error, loading, loaded, reload } = useHxBrowserLiveEnvs({ ...transport, pollMs });
	const [view, setView] = useState<WallView>(GRID);
	const [focusId, setFocusId] = useState("");
	const [notice, setNotice] = useState("");

	const focused = view === FOCUS ? findFocused(envs, focusId) : null;

	useEffect(() => {
		if (view !== FOCUS || !focusedGone(envs, focusId, loaded, error)) return;
		setView(GRID);
		setFocusId("");
		setNotice(L.focusedGone);
		onFocusChange?.(null);
	}, [view, focusId, envs, loaded, error, L.focusedGone, onFocusChange]);

	const open = (id: string): void => {
		setNotice("");
		setFocusId(id);
		setView(FOCUS);
		onFocusChange?.(id);
	};
	const back = (): void => {
		setView(GRID);
		onFocusChange?.(null);
	};
	const pick = (next: WallView | ((prev: WallView) => WallView)): void => {
		const v = next instanceof Function ? next(view) : next;
		if (v === GRID) return back();
		const target = pickFocusTarget(envs, focusId);
		if (target) open(target.id);
	};

	const toolbar = (
		<div className={LIVE_CLASS.row}>
			<SegmentedControl
				items={[
					{ key: GRID, label: L.grid },
					{ key: FOCUS, label: L.focus },
				]}
				value={focused ? FOCUS : GRID}
				onChange={pick}
			/>
			<Button size={LIVE_UI.sm} variant={LIVE_UI.ghost} onClick={reload}>
				<RefreshCwIcon className={LIVE_CLASS.icon} />
				{L.refresh}
			</Button>
			<span className={LIVE_CLASS.muted}>
				{L.envCount(envs.length)} · {L.wallHint}
			</span>
			{toolbarExtra}
		</div>
	);

	return (
		<div className={cn("flex flex-col gap-3", className)}>
			{title !== undefined ? <PageHeader title={title} right={toolbar} /> : toolbar}
			{notice !== "" && (
				<Alert variant={LIVE_UI.warning}>
					<AlertDescription>{notice}</AlertDescription>
				</Alert>
			)}
			{error !== "" && (
				<Alert variant={LIVE_UI.danger}>
					<AlertDescription>
						{L.listError}: {error}
					</AlertDescription>
				</Alert>
			)}
			{envs.length === 0 ? (
				<EmptyState
					kind={loading ? LIVE_UI.loading : LIVE_UI.empty}
					text={loading ? L.loadingEnvs : L.noEnvs}
					hint={L.noEnvsHint}
				/>
			) : focused ? (
				<BrowserLiveView key={focused.id} env={focused} transport={transport} onBack={back} labels={labels} />
			) : (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-3">
					{envs.map((env) => (
						<BrowserLiveTile key={env.id} env={env} transport={transport} onOpen={open} labels={labels} />
					))}
				</div>
			)}
		</div>
	);
}
