"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "../primitives/utils";
import { ALIGN, UI_CLASSES, UI_NUMBERS, VARIANT } from "../constants";

const bubbleVariants = cva(
	"relative w-fit max-w-full rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed break-words [&_a]:text-link [&_a]:underline-offset-4 [&_a:hover]:underline",
	{
		variants: {
			variant: {
				default: "border border-border bg-secondary text-foreground",
				primary: "bg-primary text-primary-foreground [&_a]:text-primary-foreground [&_a]:underline",
				outline: "border border-border bg-transparent text-foreground",
				ghost: "bg-transparent px-0 text-foreground",
			},
			align: {
				start: "rounded-tl-md",
				end: "ml-auto rounded-tr-md",
			},
		},
		defaultVariants: { variant: VARIANT.default, align: ALIGN.start },
	},
);

/**
 * 消息气泡 (对标 shadcn Bubble).
 *
 * variant 决定底色: default 灰底, primary 蓝底 (我方), outline 只描边, ghost 无底 (助手长文).
 * align 决定贴角: start 左上角收小, end 右上角收小并靠右.
 * 放在 Message 里时 align 跟随消息方向.
 */
function Bubble({
	className,
	variant,
	align,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof bubbleVariants>): React.JSX.Element {
	return <div data-slot="bubble" data-variant={variant} data-align={align} className={cn(bubbleVariants({ variant, align }), className)} {...props} />;
}

function BubbleContent({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="bubble-content" className={cn("[&>p+p]:mt-2 [&>pre]:my-2", className)} {...props} />;
}

/** 连续几个气泡: 组内间距收紧, 只有第一个保留贴角. */
function BubbleGroup({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="bubble-group"
			className={cn("flex flex-col gap-1 [&>[data-slot=bubble]:not(:first-child)]:rounded-2xl", className)}
			{...props}
		/>
	);
}

/** 气泡下沿的表情回应条, 子元素是一个个小按钮. */
function BubbleReactions({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="bubble-reactions"
			className={cn(
				"-mt-2 ml-3 flex w-fit items-center gap-1 rounded-full border border-border bg-popover px-1.5 py-0.5 text-[12px] shadow-sm",
				"animate-in fade-in-0 zoom-in-90 duration-(--duration-fast) [&>button]:rounded-full [&>button]:px-1 [&>button]:transition-colors [&>button:hover]:bg-accent",
				className,
			)}
			{...props}
		/>
	);
}

/**
 * 可折叠气泡: 超长内容默认收起到 collapsedHeight, 底部渐隐, 点击展开.
 * open / defaultOpen / onOpenChange 与 Radix Collapsible 同义, 受控与非受控都可用.
 * 展开高度按内容实测像素过渡 (max-height 不能在像素与 none 之间补间), 内容变化时跟随更新.
 */
function BubbleCollapsible({
	className,
	children,
	collapsedHeight = UI_NUMBERS.bubbleCollapsedHeight,
	moreLabel = "展开全部",
	lessLabel = "收起内容",
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root> & {
	collapsedHeight?: number;
	moreLabel?: string;
	lessLabel?: string;
}): React.JSX.Element {
	const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
	const open = openProp ?? uncontrolled;
	const setOpen = (next: boolean): void => {
		if (openProp === undefined) {
			setUncontrolled(next);
		}
		onOpenChange?.(next);
	};
	const contentId = React.useId();
	const contentRef = React.useRef<HTMLDivElement | null>(null);
	const [fullHeight, setFullHeight] = React.useState<number | undefined>(undefined);
	React.useLayoutEffect(() => {
		const node = contentRef.current;
		if (!node) {
			return;
		}
		const measure = (): void => setFullHeight(node.scrollHeight);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
	}, []);
	return (
		<CollapsiblePrimitive.Root {...props} open={open} onOpenChange={setOpen} data-slot="bubble-collapsible" className={cn(UI_CLASSES.col, className)}>
			<div
				id={contentId}
				className={cn("relative overflow-hidden transition-[max-height] duration-(--duration-slow) ease-out", !open && "mask-b-from-60%")}
				style={{ maxHeight: open ? fullHeight : collapsedHeight }}
			>
				<div ref={contentRef}>{children}</div>
			</div>
			<CollapsiblePrimitive.Trigger
				aria-controls={contentId}
				className="mt-1 inline-flex w-fit items-center gap-1 text-[12px] text-link outline-none hover:underline focus-visible:underline"
			>
				{open ? lessLabel : moreLabel}
				<ChevronDownIcon className={cn("size-3.5 transition-transform duration-(--duration-base)", open && "rotate-180")} />
			</CollapsiblePrimitive.Trigger>
		</CollapsiblePrimitive.Root>
	);
}

export { Bubble, BubbleCollapsible, BubbleContent, BubbleGroup, BubbleReactions, bubbleVariants };
