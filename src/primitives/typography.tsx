import * as React from "react";
import { cn } from "./utils";
import { UI_CLASSES } from "../constants";

/**
 * 排版 (对标 shadcn Typography).
 *
 * shadcn 只给了一组类名示例; 这里做成组件, 字号与颜色全部来自令牌:
 * 标题用 --heading, 正文用 foreground, 次要文字用 muted-foreground.
 * 文档 / 设置说明 / 空态长文案直接用这些, 不要各自手写一套字号.
 */
function TypographyH1({ className, ...props }: React.ComponentProps<"h1">): React.JSX.Element {
	return <h1 data-slot="typography-h1" className={cn("scroll-m-20 text-[30px] font-bold tracking-tight text-balance text-heading", className)} {...props} />;
}

function TypographyH2({ className, ...props }: React.ComponentProps<"h2">): React.JSX.Element {
	return (
		<h2
			data-slot="typography-h2"
			className={cn("scroll-m-20 border-b border-border pb-2 text-[22px] font-semibold tracking-tight text-heading first:mt-0", className)}
			{...props}
		/>
	);
}

function TypographyH3({ className, ...props }: React.ComponentProps<"h3">): React.JSX.Element {
	return <h3 data-slot="typography-h3" className={cn("scroll-m-20 text-[19px] font-semibold tracking-tight text-heading", className)} {...props} />;
}

function TypographyH4({ className, ...props }: React.ComponentProps<"h4">): React.JSX.Element {
	return <h4 data-slot="typography-h4" className={cn("scroll-m-20 text-[15px] font-semibold tracking-tight text-heading", className)} {...props} />;
}

function TypographyP({ className, ...props }: React.ComponentProps<"p">): React.JSX.Element {
	return <p data-slot="typography-p" className={cn("leading-7 text-foreground [&:not(:first-child)]:mt-4", className)} {...props} />;
}

function TypographyBlockquote({ className, ...props }: React.ComponentProps<"blockquote">): React.JSX.Element {
	return <blockquote data-slot="typography-blockquote" className={cn("mt-4 border-l border-link pl-4 text-muted-foreground italic", className)} {...props} />;
}

function TypographyList({ className, ...props }: React.ComponentProps<"ul">): React.JSX.Element {
	return <ul data-slot="typography-list" className={cn("my-4 ml-6 list-disc text-foreground [&>li]:mt-1.5", className)} {...props} />;
}

function TypographyInlineCode({ className, ...props }: React.ComponentProps<"code">): React.JSX.Element {
	return (
		<code
			data-slot="typography-inline-code"
			className={cn("relative rounded-md bg-muted px-1.5 py-0.5 font-mono text-[12px] font-medium text-foreground", className)}
			{...props}
		/>
	);
}

/** 导语: 标题下的一段放大说明文字. */
function TypographyLead({ className, ...props }: React.ComponentProps<"p">): React.JSX.Element {
	return <p data-slot="typography-lead" className={cn("text-[17px] text-muted-foreground", className)} {...props} />;
}

function TypographyLarge({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="typography-large" className={cn("text-[15px] font-semibold text-heading", className)} {...props} />;
}

function TypographySmall({ className, ...props }: React.ComponentProps<"small">): React.JSX.Element {
	return <small data-slot="typography-small" className={cn("text-[12px] leading-none font-medium", className)} {...props} />;
}

function TypographyMuted({ className, ...props }: React.ComponentProps<"p">): React.JSX.Element {
	return <p data-slot="typography-muted" className={cn(UI_CLASSES.mutedHalf, className)} {...props} />;
}

export {
	TypographyBlockquote,
	TypographyH1,
	TypographyH2,
	TypographyH3,
	TypographyH4,
	TypographyInlineCode,
	TypographyLarge,
	TypographyLead,
	TypographyList,
	TypographyMuted,
	TypographyP,
	TypographySmall,
};
