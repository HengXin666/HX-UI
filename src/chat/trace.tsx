"use client";

import * as React from "react";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { CheckIcon, ChevronRightIcon, CircleDashedIcon, Loader2Icon, XIcon } from "lucide-react";
import { cn } from "../primitives/utils";
import { ARIA, TASK_STATUS, TONE, UI_CLASSES } from "../constants";
import { TRACE_STAGGER_MAX_INDEX as STAGGER_MAX_INDEX, TRACE_STAGGER_STEP_MS as STAGGER_STEP_MS } from "../constants/chat";

/** 一步的状态: 等待, 进行中, 完成, 失败. */
type TraceStatus = "pending" | "running" | "done" | "error";

const STATUS_ICON: Record<TraceStatus, React.ReactNode> = {
	pending: <CircleDashedIcon className={UI_CLASSES.muted} />,
	running: <Loader2Icon className="animate-spin text-link motion-reduce:animate-none" />,
	done: <CheckIcon className={TONE.successFg} />,
	error: <XIcon className={TONE.dangerFg} />,
};

/**
 * 连接线的填充: 已完成的步骤连到底, 进行中的填一半并呼吸, 等待中的保持空.
 * scaleY 走合成器, 不用 height 百分比 (父级是绝对定位, 百分比高度在部分布局下退化).
 */
const CONNECTOR_FILL: Record<TraceStatus, string> = {
	pending: "scale-y-0",
	running: "scale-y-50 animate-pulse bg-link/60 motion-reduce:animate-none",
	done: "scale-y-100 bg-success/50",
	error: "scale-y-100 bg-danger/50",
};

/**
 * 推理 / 工具调用轨迹 (对标 shadcn Trace).
 *
 * Trace 是一条竖向时间线, 每个 TraceStep 一行: 状态图标, 标题, 说明, 可折叠的详情
 * (工具入参与输出, 思考过程, 引用来源). 步骤之间用 1px 竖线连接;
 * 步骤逐条错开进场, 连接线随状态生长, running 的标题带扫光, 状态切换时图标缩放进场.
 * 默认展开进行中与失败的步骤. 系统要求减弱动效时全部动画停用, 状态仍然可读.
 *
 * 样式只来自 Tailwind 类与 motion.css 的关键帧, 不引入动效库.
 */
/**
 * .agents/notes/implemented/feature/2026-10-22-streaming-markdown-markstream.md
 */
function Trace({ className, children, ...props }: React.ComponentProps<"ol">): React.JSX.Element {
	/** 逐条进场靠 inline animation-delay: 动画简写会把 delay 重置成 0, 只能写在行内样式上. */
	const items = React.Children.toArray(children).map((child, index) => {
		if (!React.isValidElement(child)) {
			return child;
		}
		const element = child as React.ReactElement<{ style?: React.CSSProperties }>;
		const delay = Math.min(index, STAGGER_MAX_INDEX) * STAGGER_STEP_MS;
		return React.cloneElement(element, {
			style: { ...element.props.style, animationDelay: delay + "ms" },
		});
	});
	return <ol data-slot="trace" className={cn(UI_CLASSES.col, className)} {...props}>{items}</ol>;
}

function TraceStep({
	status = TASK_STATUS.done,
	title,
	description,
	icon,
	defaultOpen,
	collapseWhenDone = false,
	className,
	children,
	...props
}: Omit<React.ComponentProps<"li">, "title"> & {
	status?: TraceStatus;
	title: React.ReactNode;
	description?: React.ReactNode;
	/** 覆盖默认的状态图标 (例如工具自己的图标). */
	icon?: React.ReactNode;
	defaultOpen?: boolean;
	/**
	 * 这一行完成后自动收起.
	 *
	 * 实时生成的轨迹里, 每一步完成的瞬间读者已经看完了它的详情; 若继续展开,
	 * 轨迹会越滚越长, 正在跑的那一步反而被挤出视口.
	 */
	collapseWhenDone?: boolean;
}): React.JSX.Element {
	/** toArray 会滤掉条件渲染留下的 false / null, 没有真实详情时不显示展开箭头. */
	const hasDetail = React.Children.toArray(children).length > 0;
	const active = status === TASK_STATUS.running || status === TASK_STATUS.error;
	const [open, setOpen] = React.useState(defaultOpen ?? active);
	/** 状态转为进行中或失败的那一刻自动展开 (显式 defaultOpen={false} 除外); 之后用户可自行收起. */
	const [prevStatus, setPrevStatus] = React.useState(status);
	if (prevStatus !== status) {
		setPrevStatus(status);
		if (collapseWhenDone && status === TASK_STATUS.done) {
			setOpen(false);
		} else if (defaultOpen !== false && active) {
			setOpen(true);
		}
	}
	return (
		<li
			data-slot="trace-step"
			data-status={status}
			className={cn(
				"group/trace-step relative flex gap-2.5 pb-3 last:pb-0",
				"animate-in fade-in-0 slide-in-from-left-1 duration-(--duration-base) ease-out motion-reduce:animate-none",
				className,
			)}
			{...props}
		>
			<span
				aria-hidden={ARIA.true}
				data-slot="trace-connector"
				className="absolute top-6 bottom-0 left-2.5 w-px -translate-x-1/2 overflow-hidden bg-border group-last/trace-step:hidden"
			>
				<span
					data-slot="trace-connector-fill"
					className={cn(
						"absolute inset-0 origin-top transition-transform duration-(--duration-slow) ease-out motion-reduce:transition-none",
						CONNECTOR_FILL[status],
					)}
				/>
			</span>
			<span
				key={status}
				data-slot="trace-icon"
				className="relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-background animate-in zoom-in-75 fade-in-0 duration-(--duration-base) transition-[color,border-color] motion-reduce:animate-none [&_svg]:size-3"
			>
				{icon ?? STATUS_ICON[status]}
			</span>
			<CollapsiblePrimitive.Root open={open} onOpenChange={setOpen} className="flex min-w-0 flex-1 flex-col">
				<CollapsiblePrimitive.Trigger
					disabled={!hasDetail}
					className="group/trace-trigger flex min-h-5 items-center gap-1 text-left text-[13px] outline-none enabled:cursor-pointer enabled:hover:text-heading focus-visible:text-link"
				>
					<span
						data-slot="trace-title"
						className={cn(
							"min-w-0 truncate font-medium transition-colors duration-(--duration-base)",
							status === TASK_STATUS.pending && UI_CLASSES.muted,
							status === TASK_STATUS.running && "hx-shimmer",
						)}
					>
						{title}
					</span>
					{hasDetail && (
						<ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-(--duration-base) group-data-[state=open]/trace-trigger:rotate-90" />
					)}
				</CollapsiblePrimitive.Trigger>
				{description && <div data-slot="trace-description" className={UI_CLASSES.mutedSm}>{description}</div>}
				{hasDetail && (
					<CollapsiblePrimitive.Content
						data-slot="trace-content"
						className="overflow-hidden data-[state=closed]:animate-[hx-collapse-up_var(--duration-base)_var(--ease-in)] data-[state=open]:animate-[hx-collapse-down_var(--duration-base)_var(--ease-out)]"
					>
						<div className="mt-1.5 rounded-lg border border-border-muted bg-muted/50 p-2.5 text-[12px] text-foreground">{children}</div>
					</CollapsiblePrimitive.Content>
				)}
			</CollapsiblePrimitive.Root>
		</li>
	);
}

/** 详情里的来源列表: 一行一个链接. */
function TraceSources({ className, ...props }: React.ComponentProps<"ul">): React.JSX.Element {
	return <ul data-slot="trace-sources" className={cn("flex flex-col gap-1 [&_a]:text-link [&_a]:underline-offset-4 [&_a:hover]:underline", className)} {...props} />;
}

/**
 * 实时生成的一步. 与 TraceStep 的区别只是"谁决定它出现": 这里由数据到达决定.
 */
export interface TraceLiveItem {
	readonly id: string;
	readonly title: React.ReactNode;
	readonly description?: React.ReactNode;
	readonly status?: TraceStatus;
	readonly icon?: React.ReactNode;
	/** 展开后的详情: 工具入参与输出, 思考过程, 引用来源. */
	readonly detail?: React.ReactNode;
}

/**
 * 实时生成的轨迹: 步骤一条条到达, 而不是一开始就全部知道.
 *
 * ## 两种用法怎么选
 *
 * - **预先规划**: 步骤在开始时已知 (例如"拉镜像 -> 构建 -> 启动 -> 健康检查"),
 * 用 Trace + TraceStep 直接列出来, 当前步给 running.
 * - **实时生成**: 步骤由 Agent 运行时决定 (调用一次工具才知道下一步是什么),
 * 用 TraceLive 把已到达的步骤喂进来, 每来一条就多一行.
 *
 * ## 它与规划态的差别不只是数据源
 *
 * 1. 已完成的步骤**自动收起**: 实时轨迹会越来越长, 全程展开会把正在跑的那步挤出视口.
 * 2. 最后一步在跑时**自动展开**: 读者的注意力应该在"正在发生什么".
 * 3. streaming 为 true 时末尾挂一条"仍在生成"的占位行, 让读者知道还没结束.
 */
function TraceLive({
	items,
	streaming = false,
	className,
	...props
}: React.ComponentProps<"ol"> & {
	readonly items: readonly TraceLiveItem[];
	/** 仍在生成: 末尾显示一条进行中的占位行. */
	readonly streaming?: boolean;
}): React.JSX.Element {
	const lastIndex = items.length - 1;
	return (
		<Trace className={className} {...props}>
			{items.map((item, index) => {
				const status = item.status ?? TASK_STATUS.done;
				return (
					<TraceStep
						key={item.id}
						status={status}
						title={item.title}
						collapseWhenDone
						defaultOpen={index === lastIndex && status === TASK_STATUS.running}
						{...(item.description !== undefined ? { description: item.description } : {})}
						{...(item.icon !== undefined ? { icon: item.icon } : {})}
					>
						{item.detail}
					</TraceStep>
				);
			})}
			{streaming && <TraceStep status={TASK_STATUS.running} title="正在生成下一步..." />}
		</Trace>
	);
}

export { Trace, TraceLive, TraceSources, TraceStep, type TraceStatus };
