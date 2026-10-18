import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { Separator } from "./separator";
import { cn } from "./utils";
import { ORIENTATION, SPACE, TAG, UI_CLASSES, VARIANT } from "../constants";

/**
 * 列表条目: 左侧媒体 (图标 / 头像 / 图片), 中间标题与说明, 右侧操作.
 *
 * 一个条目就是一行, 多行放进 ItemGroup. 整行可点时用 asChild 包一个 a (a 可容纳块级子部件),
 * 悬停底色与焦点框由 Item 自己给. 整行已是可点宿主时不要再在 ItemActions 里放按钮, 避免嵌套交互控件;
 * button 宿主只能容纳 phrasing content, 不适合本组合结构.
 * ItemGroup 不声明 list 语义 (条目不是 listitem); 需要列表语义时由调用方用 ul / li 组合.
 */
function ItemGroup({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="item-group" className={cn("group/item-group flex flex-col", className)} {...props} />;
}

function ItemSeparator({ className, ...props }: React.ComponentProps<typeof Separator>): React.JSX.Element {
	return <Separator data-slot="item-separator" orientation={ORIENTATION.horizontal} className={cn("my-0 bg-border-muted", className)} {...props} />;
}

const itemVariants = cva(
	[
		"group/item flex flex-wrap items-center rounded-lg border border-transparent text-[13px] outline-none",
		"transition-colors duration-(--duration-fast) focus-visible:border-ring [a]:hover:bg-accent/50 [button]:hover:bg-accent/50",
	].join(SPACE),
	{
		variants: {
			variant: {
				default: UI_CLASSES.transparent,
				outline: "border-border",
				muted: "bg-muted/50",
			},
			size: {
				default: "gap-3 p-3",
				sm: "gap-2.5 px-3 py-2",
			},
		},
		defaultVariants: { variant: VARIANT.default, size: VARIANT.default },
	},
);

function Item({
	className,
	variant = VARIANT.default,
	size = VARIANT.default,
	asChild = false,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemVariants> & { asChild?: boolean }): React.JSX.Element {
	const Comp = asChild ? Slot.Root : TAG.div;
	return (
		<Comp
			data-slot="item"
			data-variant={variant}
			data-size={size}
			className={cn(itemVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

const itemMediaVariants = cva(
	"flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none",
	{
		variants: {
			variant: {
				default: UI_CLASSES.transparent,
				icon: "size-8 rounded-lg border border-border bg-secondary text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
				image: "size-10 overflow-hidden rounded-lg [&_img]:size-full [&_img]:object-cover",
			},
		},
		defaultVariants: { variant: VARIANT.default },
	},
);

function ItemMedia({
	className,
	variant = VARIANT.default,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>): React.JSX.Element {
	return <div data-slot="item-media" data-variant={variant} className={cn(itemMediaVariants({ variant, className }))} {...props} />;
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="item-content" className={cn("flex min-w-0 flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none", className)} {...props} />;
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="item-title" className={cn("flex w-fit items-center gap-2 leading-snug font-medium text-foreground", className)} {...props} />;
}

function ItemDescription({ className, ...props }: React.ComponentProps<"p">): React.JSX.Element {
	return (
		<p
			data-slot="item-description"
			className={cn("line-clamp-2 text-[12.5px] leading-normal font-normal text-balance text-muted-foreground [&>a]:text-link [&>a]:underline-offset-4 [&>a:hover]:underline", className)}
			{...props}
		/>
	);
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="item-actions" className={cn(UI_CLASSES.row, className)} {...props} />;
}

function ItemHeader({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="item-header" className={cn("flex basis-full items-center justify-between gap-2", className)} {...props} />;
}

function ItemFooter({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="item-footer" className={cn("flex basis-full items-center justify-between gap-2", className)} {...props} />;
}

export {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemFooter,
	ItemGroup,
	ItemHeader,
	ItemMedia,
	ItemSeparator,
	ItemTitle,
	itemVariants,
};
