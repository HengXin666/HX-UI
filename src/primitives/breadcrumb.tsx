import * as React from "react";
import { Slot } from "radix-ui";
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import { cn } from "./utils";
import { ARIA, ROLE, TAG, UI_CLASSES } from "../constants";

/**
 * 面包屑: 当前页在层级里的位置.
 *
 * 结构与 shadcn 一致: Breadcrumb(nav) > BreadcrumbList(ol) > BreadcrumbItem(li),
 * 当前页用 BreadcrumbPage (aria-current=page, 不可点), 层级之间放 BreadcrumbSeparator.
 * 链接默认渲染 a, 接路由库时用 asChild 交给 Link.
 */
function Breadcrumb(props: React.ComponentProps<"nav">): React.JSX.Element {
	return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">): React.JSX.Element {
	return (
		<ol
			data-slot="breadcrumb-list"
			className={cn("flex flex-wrap items-center gap-1.5 text-[13px] break-words text-muted-foreground", className)}
			{...props}
		/>
	);
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">): React.JSX.Element {
	return <li data-slot="breadcrumb-item" className={cn("inline-flex items-center gap-1", className)} {...props} />;
}

function BreadcrumbLink({
	asChild,
	className,
	...props
}: React.ComponentProps<"a"> & { asChild?: boolean }): React.JSX.Element {
	const Comp = asChild ? Slot.Root : TAG.a;
	return (
		<Comp
			data-slot="breadcrumb-link"
			className={cn("rounded-sm transition-colors duration-(--duration-fast) outline-none hover:text-foreground focus-visible:text-link", className)}
			{...props}
		/>
	);
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element {
	return (
		<span
			data-slot="breadcrumb-page"
			role={ROLE.link}
			aria-disabled={ARIA.true}
			aria-current={ARIA.page}
			className={cn(UI_CLASSES.strong, className)}
			{...props}
		/>
	);
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">): React.JSX.Element {
	return (
		<li
			data-slot="breadcrumb-separator"
			role={ROLE.presentation}
			aria-hidden={ARIA.true}
			className={cn("[&>svg]:size-3.5 [&>svg]:text-muted-foreground/70", className)}
			{...props}
		>
			{children ?? <ChevronRightIcon />}
		</li>
	);
}

/** 折叠掉的中间层级, 常与 DropdownMenu 组合展开. */
function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element {
	return (
		<span
			data-slot="breadcrumb-ellipsis"
			role={ROLE.presentation}
			aria-hidden={ARIA.true}
			className={cn("flex size-6 items-center justify-center [&>svg]:size-4", className)}
			{...props}
		>
			<MoreHorizontalIcon />
			<span className={UI_CLASSES.srOnly}>更多</span>
		</span>
	);
}

export {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
};
