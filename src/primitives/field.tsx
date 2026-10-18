"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Label } from "./label";
import { Separator } from "./separator";
import { cn } from "./utils";
import { ARIA, ORIENTATION, ROLE, TONE_VARIANT } from "../constants";

/**
 * 表单字段 (组合式, 对标 shadcn Field).
 *
 * Field 把标签, 控件, 说明与错误摆成一组; orientation 决定标签在上 (vertical),
 * 在左 (horizontal) 还是随容器宽度切换 (responsive, 用容器查询).
 * FieldSet / FieldLegend 给一组字段加语义标题, FieldGroup 负责组内间距.
 * 设置页的 SelectField / InputField 是固定一行式的快捷写法, 这一组用于自由排版.
 */
function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">): React.JSX.Element {
	return (
		<fieldset
			data-slot="field-set"
			className={cn("flex flex-col gap-5 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3", className)}
			{...props}
		/>
	);
}

function FieldLegend({
	className,
	variant = TONE_VARIANT.legend,
	...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }): React.JSX.Element {
	return (
		<legend
			data-slot="field-legend"
			data-variant={variant}
			className={cn("mb-2 font-medium text-heading data-[variant=label]:text-[13px] data-[variant=legend]:text-[15px]", className)}
			{...props}
		/>
	);
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="field-group"
			className={cn("group/field-group @container/field-group flex w-full flex-col gap-5 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4", className)}
			{...props}
		/>
	);
}

const fieldVariants = cva("group/field flex w-full gap-2 data-[invalid=true]:text-danger-fg", {
	variants: {
		orientation: {
			vertical: "flex-col [&>*]:w-full [&>.sr-only]:w-auto",
			horizontal:
				"flex-row items-center [&>[data-slot=field-label]]:flex-auto has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
			responsive:
				"flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto @md/field-group:[&>[data-slot=field-label]]:flex-auto",
		},
	},
	defaultVariants: { orientation: ORIENTATION.vertical },
});

function Field({
	className,
	orientation = ORIENTATION.vertical,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>): React.JSX.Element {
	return (
		<div role={ROLE.group} data-slot="field" data-orientation={orientation} className={cn(fieldVariants({ orientation }), className)} {...props} />
	);
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return <div data-slot="field-content" className={cn("group/field-content flex flex-1 flex-col gap-1 leading-snug", className)} {...props} />;
}

/**
 * 字段标签. 包住整块 Field 时 (选项卡片式) 选中后边框转 primary.
 */
function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>): React.JSX.Element {
	return (
		<Label
			data-slot="field-label"
			className={cn(
				"group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
				"has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border has-[>[data-slot=field]]:border-border",
				"has-[>[data-slot=field]]:transition-colors has-[>[data-slot=field]]:duration-(--duration-fast) *:data-[slot=field]:p-3",
				"has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5",
				className,
			)}
			{...props}
		/>
	);
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="field-label"
			className={cn("flex w-fit items-center gap-2 text-[13px] leading-snug font-medium group-data-[disabled=true]/field:opacity-50", className)}
			{...props}
		/>
	);
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">): React.JSX.Element {
	return (
		<p
			data-slot="field-description"
			className={cn(
				"text-[12.5px] leading-normal font-normal text-muted-foreground group-has-[[data-orientation=horizontal]]/field:text-balance",
				"last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5 [&>a]:text-link [&>a]:underline [&>a]:underline-offset-4",
				className,
			)}
			{...props}
		/>
	);
}

/** 字段组之间的分隔线, 可在中间放一段文字 (例如 "或"). */
function FieldSeparator({ children, className, ...props }: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="field-separator"
			data-content={!!children}
			className={cn("relative -my-2 h-5 text-[12.5px] group-data-[variant=outline]/field-group:-mb-2", className)}
			{...props}
		>
			<Separator className="absolute inset-0 top-1/2" />
			{children && (
				<span className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground" data-slot="field-separator-content">
					{children}
				</span>
			)}
		</div>
	);
}

/**
 * 字段错误. 传 errors (例如 react-hook-form 的 fieldState.error 数组) 时自动去重渲染,
 * 多条以列表显示; 出现时自上而下淡入.
 */
function FieldError({
	className,
	children,
	errors,
	...props
}: React.ComponentProps<"div"> & { errors?: Array<{ message?: string } | undefined> }): React.JSX.Element | null {
	const content = React.useMemo(() => {
		if (children) {
			return children;
		}
		/** 先滤掉没有 message 的项再去重, 避免渲染空的 role="alert". */
		const messages = [...new Set((errors ?? []).map((error) => error?.message).filter((message): message is string => Boolean(message)))];
		if (messages.length === 0) {
			return null;
		}
		if (messages.length === 1) {
			return messages[0];
		}
		return (
			<ul className="ml-4 flex list-disc flex-col gap-1">
				{messages.map((message) => <li key={message}>{message}</li>)}
			</ul>
		);
	}, [children, errors]);

	if (!content) {
		return null;
	}
	return (
		<div
			role={ARIA.alert}
			data-slot="field-error"
			className={cn("text-[12.5px] font-normal text-danger-fg animate-in fade-in-0 slide-in-from-top-1 duration-(--duration-fast)", className)}
			{...props}
		>
			{content}
		</div>
	);
}

export {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
	FieldTitle,
};
