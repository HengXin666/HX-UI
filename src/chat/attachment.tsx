import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { AlertCircleIcon, FileIcon } from "lucide-react";
import { cn } from "../primitives/utils";
import { ARIA, PERCENT, ROLE, TASK_STATUS, VARIANT } from "../constants";

/** 附件的上传状态. */
type AttachmentState = "idle" | "uploading" | "done" | "error";

const attachmentVariants = cva(
	"group/attachment relative flex min-w-0 items-center gap-2.5 overflow-hidden rounded-lg border border-border bg-card text-[13px] transition-[border-color,background-color] duration-(--duration-fast)",
	{
		variants: {
			size: {
				default: "w-60 p-2",
				sm: "w-48 p-1.5 text-[12px]",
			},
		},
		defaultVariants: { size: VARIANT.default },
	},
);

/**
 * 文件 / 图片附件 (对标 shadcn Attachment): 缩略图或图标, 文件名, 大小或状态, 操作.
 *
 * state="uploading" 时底部出现进度条 (progress 0 到 100), state="error" 边框转危险色.
 * 进场时轻微缩放淡入, 用于输入框上方的待发送附件与消息里的已发送附件.
 */
function Attachment({
	className,
	size,
	state = TASK_STATUS.idle,
	progress,
	children,
	...props
}: React.ComponentProps<"div"> &
	VariantProps<typeof attachmentVariants> & {
		state?: AttachmentState;
		/** 上传进度 0 到 100, 只在 uploading 时显示. */
		progress?: number;
	}): React.JSX.Element {
	return (
		<div
			data-slot="attachment"
			data-state={state}
			className={cn(
				attachmentVariants({ size }),
				"animate-in fade-in-0 zoom-in-95 duration-(--duration-base) data-[state=error]:border-danger/50 data-[state=error]:bg-danger/5",
				className,
			)}
			{...props}
		>
			{children}
			{state === "uploading" && (
				<div className="absolute inset-x-0 bottom-0 h-0.5 bg-muted" aria-hidden={ARIA.true}>
					{progress === undefined ? (
						<div className="hx-progress-indeterminate h-full w-1/3 bg-link" />
					) : (
						<div className="h-full bg-link transition-[width] duration-(--duration-base) ease-out" style={{ width: `${Math.min(PERCENT, Math.max(0, progress))}%` }} />
					)}
				</div>
			)}
		</div>
	);
}

/** 左侧媒体位: 默认显示文件图标; 出错时换成警示图标. */
function AttachmentMedia({ className, children, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="attachment-media"
			className={cn(
				"flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
				"group-data-[state=error]/attachment:text-danger-fg",
				className,
			)}
			{...props}
		>
			{children ?? <FileIcon />}
		</div>
	);
}

function AttachmentImage({ className, alt = "", ...props }: React.ComponentProps<"img">): React.JSX.Element {
	return <img data-slot="attachment-image" alt={alt} className={cn("size-full object-cover", className)} {...props} />;
}

function AttachmentContent({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="attachment-content" className={cn("flex min-w-0 flex-1 flex-col", className)} {...props} />;
}

function AttachmentTitle({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="attachment-title" className={cn("truncate font-medium text-foreground", className)} {...props} />;
}

/** 大小 / 类型 / 状态说明; 出错时转危险色并带图标. */
function AttachmentDescription({ className, children, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="attachment-description"
			className={cn("flex items-center gap-1 truncate text-[11.5px] text-muted-foreground group-data-[state=error]/attachment:text-danger-fg", className)}
			{...props}
		>
			<AlertCircleIcon className="hidden size-3 shrink-0 group-data-[state=error]/attachment:block" />
			{children}
		</div>
	);
}

function AttachmentActions({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="attachment-actions" className={cn("flex shrink-0 items-center gap-0.5", className)} {...props} />;
}

/** 单个操作 (删除 / 重试 / 下载), 通常 asChild 包一个 icon 尺寸的 Button. */
function AttachmentAction({ asChild = false, className, ...props }: React.ComponentProps<"span"> & { asChild?: boolean }): React.JSX.Element {
	const Comp = asChild ? Slot.Root : "span";
	return <Comp data-slot="attachment-action" className={cn("inline-flex", className)} {...props} />;
}

/** 一排附件: 横向排列, 超出时换行. */
function AttachmentGroup({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="attachment-group" role={ROLE.list} className={cn("flex flex-wrap gap-1.5", className)} {...props} />;
}

export {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentGroup,
	AttachmentImage,
	AttachmentMedia,
	AttachmentTitle,
	attachmentVariants,
	type AttachmentState,
};
