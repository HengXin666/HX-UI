import * as React from "react";
import { cn } from "../primitives/utils";
import { ALIGN } from "../constants";

/**
 * 会话消息 (对标 shadcn Message): 头像, 头部 (名字 / 时间), 正文, 底部 (操作 / 状态).
 *
 * align={ALIGN.end} 时整条靠右并镜像排列, 用于 "我" 发的消息. 正文通常放 Bubble,
 * 也可以直接放 Markdown 渲染结果. 每条新消息进场时上浮淡入.
 * 只要一个开箱即用的流式会话面板时用 ChatStream; 这一组用于自己拼会话界面.
 *
 * .agents/notes/implemented/feature/2026-10-18-shadcn-parity-components.md
 */
function Message({
	className,
	align = ALIGN.start,
	...props
}: React.ComponentProps<"div"> & { align?: "start" | "end" }): React.JSX.Element {
	return (
		<div
			data-slot="message"
			data-align={align}
			className={cn(
				"group/message flex w-full items-start gap-2.5 data-[align=end]:flex-row-reverse",
				"animate-in fade-in-0 slide-in-from-bottom-2 duration-(--duration-base) ease-out",
				className,
			)}
			{...props}
		/>
	);
}

/** 头像位: 放 Avatar; 同一人的连续消息可以传空 div 占位保持对齐. */
function MessageAvatar({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="message-avatar" className={cn("flex size-8 shrink-0 items-start justify-center", className)} {...props} />;
}

function MessageContent({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="message-content"
			className={cn("flex max-w-[80%] min-w-0 flex-col gap-1 group-data-[align=end]/message:items-end", className)}
			{...props}
		/>
	);
}

function MessageHeader({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="message-header"
			className={cn("flex items-baseline gap-2 px-1 text-[12px] text-muted-foreground group-data-[align=end]/message:flex-row-reverse [&>strong]:font-medium [&>strong]:text-foreground", className)}
			{...props}
		/>
	);
}

/** 底部: 复制 / 重试等操作, 默认在悬停整条消息时浮现. */
function MessageFooter({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="message-footer"
			className={cn(
				"flex items-center gap-1 px-1 text-[11px] text-muted-foreground opacity-60 transition-opacity duration-(--duration-fast)",
				"group-hover/message:opacity-100 group-focus-within/message:opacity-100 group-data-[align=end]/message:flex-row-reverse",
				className,
			)}
			{...props}
		/>
	);
}

/** 一组连续消息: 只负责组内间距. */
function MessageGroup({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="message-group" className={cn("flex flex-col gap-4", className)} {...props} />;
}

export { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader };
