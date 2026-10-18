"use client";

import * as React from "react";
import { GripVerticalIcon } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { cn } from "./utils";

/**
 * 可拖拽调整大小的分栏 (react-resizable-panels).
 *
 * orientation 决定分栏方向; 尺寸写成字符串是百分比 ("30"), 数字是像素.
 * 拖拽条只有 1px 可见线, 实际可点区域向两侧各扩 4px; 悬停与拖拽中线变成 ring 色.
 */
function ResizablePanelGroup({ className, ...props }: React.ComponentProps<typeof Group>): React.JSX.Element {
	return (
		<Group
			data-slot="resizable-panel-group"
			className={cn("flex size-full", className)}
			{...props}
		/>
	);
}

function ResizablePanel(props: React.ComponentProps<typeof Panel>): React.JSX.Element {
	return <Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
	withHandle,
	className,
	...props
}: React.ComponentProps<typeof Separator> & { withHandle?: boolean }): React.JSX.Element {
	return (
		<Separator
			data-slot="resizable-handle"
			className={cn(
				"relative flex w-px shrink-0 items-center justify-center bg-border outline-none",
				"transition-colors duration-(--duration-fast) hover:bg-ring/60 focus-visible:bg-ring data-[separator=active]:bg-ring",
				"after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2",
				"aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full",
				"aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:top-1/2 aria-[orientation=horizontal]:after:left-0",
				"aria-[orientation=horizontal]:after:h-2 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2",
				"[&[aria-orientation=horizontal]>div]:rotate-90",
				className,
			)}
			{...props}
		>
			{withHandle && (
				<div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border border-border bg-secondary">
					<GripVerticalIcon className="size-2.5 text-muted-foreground" />
				</div>
			)}
		</Separator>
	);
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
