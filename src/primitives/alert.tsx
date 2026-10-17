import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ARIA, VARIANT } from "../constants";
import { cn } from "./utils";

/**
 * 提示条 (页内常驻的说明 / 警告 / 错误, 不是 Toast 那种会消失的消息).
 *
 * 正文保持前景色, 只有边框, 浅色底与图标带语义色: 整块文字都染色会让长说明难读.
 * 有 svg 直接子元素时才切成 grid, 排成"图标 | 标题 + 描述"两列; 没有图标时是单列 flex,
 * 纯文本子节点直接占满宽度 (不能用一个 0 宽首列的 grid 兜底, 文字会被挤进 0 宽列竖排溢出).
 * danger 与 warning 用 role="alert" 让读屏立即播报, 其余用 role="status".
 */
const alertVariants = cva(
	[
		"relative flex w-full flex-col gap-y-0.5 rounded-lg border px-3 py-2.5 text-[13px] text-foreground",
		"has-[>svg]:grid has-[>svg]:grid-cols-[16px_1fr] has-[>svg]:items-start has-[>svg]:gap-x-2.5 [&>svg]:size-4 [&>svg]:translate-y-0.5",
	],
	{
		variants: {
			variant: {
				default: "border-border bg-card [&>svg]:text-muted-foreground",
				info: "border-primary/40 bg-primary/10 [&>svg]:text-link",
				success: "border-success/40 bg-success/10 [&>svg]:text-success-fg",
				warning: "border-warning/40 bg-warning/10 [&>svg]:text-warning-fg",
				danger: "border-danger/40 bg-danger/10 [&>svg]:text-danger-fg",
			},
		},
		defaultVariants: { variant: VARIANT.default },
	},
);

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>["variant"]>;

/** 需要读屏立即播报的变体. */
const ASSERTIVE: ReadonlyArray<AlertVariant> = [VARIANT.danger, VARIANT.warning];

function Alert({
	className,
	variant,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>): React.JSX.Element {
	const assertive = variant != null && ASSERTIVE.includes(variant);
	return (
		<div
			data-slot="alert"
			data-variant={variant ?? undefined}
			role={assertive ? ARIA.alert : ARIA.status}
			className={cn(alertVariants({ variant }), className)}
			{...props}
		/>
	);
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="alert-title" className={cn("col-start-2 font-medium text-heading", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="alert-description"
			className={cn("col-start-2 text-[12.5px] leading-relaxed text-foreground [&_p]:leading-relaxed", className)}
			{...props}
		/>
	);
}

export { Alert, AlertDescription, AlertTitle, alertVariants };
export type { AlertVariant };
