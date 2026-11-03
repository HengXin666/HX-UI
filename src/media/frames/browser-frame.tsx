"use client";

import * as React from "react";
import { LockIcon } from "lucide-react";
import { cn } from "../../primitives/utils";
import { type BrowserFrameSlot, type SlotClassNames, type SlotStyles } from "../../constants/media";
import { mergeStyle, resolveSlots } from "../slots";

export type BrowserFrameProps = Omit<React.ComponentProps<"div">, "title"> & {
	/** 地址栏里显示的文字 (只展示, 不发起导航). 不传则地址栏留空. */
	address?: React.ReactNode;
	/** 地址栏前显示锁形图标, 默认 true. */
	secure?: boolean;
	/** 隐藏地址栏; 同时关掉 showControls 且无 actions 时整条工具栏不渲染, 只剩描边窗口. 默认 false. */
	hideAddressBar?: boolean;
	/** 左上角三个窗口按钮圆点, 默认 true. */
	showControls?: boolean;
	/** 工具栏右侧的自定义内容. */
	actions?: React.ReactNode;
	/** 内容区宽高比 (宽 / 高); 不传则由内容撑开. */
	ratio?: number;
	classNames?: SlotClassNames<BrowserFrameSlot>;
	styles?: SlotStyles<BrowserFrameSlot>;
};

/** 窗口按钮圆点的语义色: 关闭, 最小化, 全屏. */
const DOTS = ["bg-danger", "bg-warning", "bg-success"] as const;

/**
 * 浏览器外框, 供产品截图使用: 工具栏 (窗口按钮 + 地址栏 + 自定义操作) 加内容区.
 * 结构参考 src/hxbrowser 的标签页外壳, 但不依赖它的任何会话或输入逻辑. 地址只是展示文本, 由 props 传入.
 * ref 指向根 div.
 *
 * .agents/notes/implemented/feature/2026-11-02-media-primitives.md
 */
export function BrowserFrame({
	address, secure = true, hideAddressBar = false, showControls = true, actions, ratio, classNames, styles, className, style, children, ...props
}: BrowserFrameProps): React.JSX.Element {
	const slot = resolveSlots(classNames, styles, undefined);
	const toolbar = showControls || actions !== undefined || !hideAddressBar;
	return (
		<div
			{...props}
			data-slot="browser-frame"
			className={cn("flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg", slot.className("root"), className)}
			style={mergeStyle(slot.style("root"), style)}
		>
			{toolbar && <div
				data-slot="browser-frame-toolbar"
				className={cn("flex items-center gap-3 border-b border-border bg-muted px-3 py-2", slot.className("toolbar"))}
				style={slot.style("toolbar")}
			>
				{showControls && (
					<span aria-hidden="true" data-slot="browser-frame-controls" className={cn("flex shrink-0 gap-1.5", slot.className("controls"))} style={slot.style("controls")}>
						{DOTS.map((tone) => (
							<span key={tone} data-slot="browser-frame-control" className={cn("size-2.5 rounded-full", tone, slot.className("control"))} style={slot.style("control")} />
						))}
					</span>
				)}
				{!hideAddressBar && <div
					data-slot="browser-frame-address"
					className={cn(
						"flex h-(--control-h-sm) min-w-0 flex-1 items-center justify-center gap-1.5 truncate rounded-(--radius-md) border border-border bg-background px-3 text-xs text-muted-foreground",
						slot.className("address"),
					)}
					style={slot.style("address")}
				>
					{secure && address !== undefined && <LockIcon aria-hidden="true" data-slot="browser-frame-address-icon" className={cn("size-3 shrink-0", slot.className("address-icon"))} />}
					<span data-slot="browser-frame-address-text" className={cn("truncate", slot.className("address-text"))}>{address}</span>
				</div>}
				{actions !== undefined && (
					<div data-slot="browser-frame-actions" className={cn("flex shrink-0 items-center gap-1", slot.className("actions"))} style={slot.style("actions")}>
						{actions}
					</div>
				)}
			</div>}
			<div
				data-slot="browser-frame-content"
				className={cn("relative overflow-hidden bg-background [&>*]:size-full", slot.className("content"))}
				style={mergeStyle(ratio === undefined ? undefined : { aspectRatio: String(ratio) }, slot.style("content"))}
			>
				{children}
			</div>
		</div>
	);
}
