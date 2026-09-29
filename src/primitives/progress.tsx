"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";
import { cn } from "./utils";

/**
 * 进度条。
 *
 * 为什么用 radix 的 Root 而不是一个 div: 它把 role="progressbar" 与
 * aria-valuenow / min / max 一起给齐了。手写 div 的进度条在读屏软件里是**静默**的 ——
 * 视觉上有条, 无障碍上什么都没有, 而且不写 aria 不会有任何报错提示。
 *
 * 指示器的进度用 transform 表达而不是 width: transform 走合成器, 高频更新
 * (例如抓取进度几十次每秒) 不会反复触发布局。代价是必须自己算 translateX 百分比。
 */
function Progress({
	className,
	value = 0,
	indeterminate = false,
	tone = "primary",
	...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
	indeterminate?: boolean;
	tone?: "primary" | "success" | "warning" | "destructive";
}): React.JSX.Element {
	const clamped = Math.min(100, Math.max(0, value ?? 0));
	const toneClass = {
		primary: "bg-primary",
		success: "bg-emerald-500",
		warning: "bg-amber-500",
		destructive: "bg-destructive",
	}[tone];

	return (
		<ProgressPrimitive.Root
			data-slot="progress"
			data-indeterminate={indeterminate || undefined}
			value={indeterminate ? null : clamped}
			className={cn(
				"relative h-1.5 w-full overflow-hidden rounded-full bg-muted",
				className,
			)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				data-slot="progress-indicator"
				className={cn(
					"size-full flex-1 rounded-full transition-transform duration-200 ease-out",
					toneClass,
					indeterminate && "hx-progress-indeterminate origin-left w-1/3",
				)}
				style={indeterminate ? undefined : { transform: "translateX(-" + (100 - clamped) + "%)" }}
			/>
		</ProgressPrimitive.Root>
	);
}

/**
 * 带标题与数值的进度条。抓取 / 导出这类"跑起来要盯着"的场景, 三样缺一都别扭:
 * 光有条不知道在跑什么, 只有条没有数值不知道还差多少。
 */
function ProgressMeter({
	label,
	value,
	max = 100,
	hint,
	showValue = true,
	tone,
	indeterminate,
	className,
}: {
	label: React.ReactNode;
	value: number;
	max?: number;
	hint?: React.ReactNode;
	showValue?: boolean;
	tone?: "primary" | "success" | "warning" | "destructive";
	indeterminate?: boolean;
	className?: string;
}): React.JSX.Element {
	const pct = max > 0 ? (value / max) * 100 : 0;
	return (
		<div data-slot="progress-meter" className={cn("flex flex-col gap-1.5", className)}>
			<div className="flex items-baseline justify-between gap-2 text-[length:var(--fs-xs-half)]">
				<span className="truncate font-medium text-foreground">{label}</span>
				{showValue ? (
					<span className="shrink-0 tabular-nums text-muted-foreground">
						{Math.round(pct)}%
					</span>
				) : null}
			</div>
			<Progress value={pct} tone={tone} indeterminate={indeterminate} />
			{hint ? <div className="text-[length:var(--fs-xs)] text-muted-foreground/80">{hint}</div> : null}
		</div>
	);
}

export { Progress, ProgressMeter };