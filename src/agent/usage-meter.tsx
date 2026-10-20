"use client";

import type { JSX } from "react";
import { Progress } from "../primitives/progress";
import { cn } from "../primitives/utils";

export interface UsageMeterProps {
	used: number;
	limit: number;
	unit?: string;
	rate?: number;
}

const NUMBER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

const TONE_TEXT = {
	primary: "text-muted-foreground",
	warning: "text-warning-fg",
	destructive: "text-danger-fg",
} as const;

/** 额度用量条, 按已用与上限的比值给出正常, 警告, 危险三档语义色, 可选显示速率 */
export function UsageMeter({ used, limit, unit, rate }: UsageMeterProps): JSX.Element {
	const safeUsed = Number.isFinite(used) ? Math.max(0, used) : 0;
	const safeLimit = Number.isFinite(limit) ? Math.max(0, limit) : 0;
	const percent = safeLimit > 0 ? (safeUsed / safeLimit) * 100 : 0;
	const tone = percent > 95 ? "destructive" : percent > 80 ? "warning" : "primary";
	const remaining = Math.max(0, safeLimit - safeUsed);
	const suffix = unit ? " " + unit : "";
	const rateText = rate !== undefined && Number.isFinite(rate) && rate >= 0
		? NUMBER.format(rate) + suffix + "/s"
		: null;

	return (
		<div data-slot="usage-meter" data-tone={tone} className="flex w-full min-w-0 flex-col gap-1.5">
			<div className="flex min-w-0 items-baseline justify-between gap-3">
				<span className="min-w-0 truncate text-[length:var(--fs-sm-half)] font-medium text-foreground">
					已用 {NUMBER.format(safeUsed)} / {NUMBER.format(safeLimit)}{suffix}
				</span>
				<span className={cn("shrink-0 text-[length:var(--fs-sm-half)] font-medium tabular-nums", TONE_TEXT[tone])}>
					{NUMBER.format(percent)}%
				</span>
			</div>
			<Progress value={percent} tone={tone} aria-label={"额度已用 " + NUMBER.format(percent) + "%"} />
			<div className="flex min-w-0 items-baseline justify-between gap-3 text-[length:var(--fs-xs)] text-muted-foreground">
				<span className="min-w-0 truncate">剩余 {NUMBER.format(remaining)}{suffix}</span>
				{rateText ? <span className="shrink-0 tabular-nums">速率 {rateText}</span> : null}
			</div>
		</div>
	);
}

export type DiffLineType = "add" | "del" | "ctx";

export interface DiffLine {
	type: DiffLineType;
	text: string;
}

export interface DiffViewProps {
	hunks: DiffLine[];
	filename?: string;
}

const DIFF_ROW = {
	add: "bg-success/10 text-success-fg",
	del: "bg-destructive/10 text-danger-fg",
	ctx: "text-muted-foreground",
} as const;

const DIFF_SIGN: Record<DiffLineType, string> = { add: "+", del: "-", ctx: " " };

const DIFF_LABEL: Record<DiffLineType, string> = { add: "新增行", del: "删除行", ctx: "上下文行" };

/** 逐行渲染变更, 新增绿底, 删除红底, 上下文灰字, 行首带符号 */
export function DiffView({ hunks, filename }: DiffViewProps): JSX.Element {
	const added = hunks.filter((line) => line.type === "add").length;
	const removed = hunks.filter((line) => line.type === "del").length;

	return (
		<div data-slot="diff-view" className="w-full min-w-0 overflow-hidden rounded-lg border border-border bg-background">
			{filename ? (
				<div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-3 py-1.5">
					<span className="min-w-0 truncate font-mono text-[length:var(--fs-sm)] text-foreground">{filename}</span>
					<span
						className="shrink-0 font-mono text-[length:var(--fs-xs)] tabular-nums text-muted-foreground"
						aria-label={"新增 " + added + " 行, 删除 " + removed + " 行"}
					>
						<span className="text-success-fg">+{added}</span>
						<span className="mx-1.5 text-muted-foreground/40">/</span>
						<span className="text-danger-fg">-{removed}</span>
					</span>
				</div>
			) : null}
			<div className="overflow-x-auto" role="group" aria-label={filename ? filename + " 变更对比" : "变更对比"}>
				{hunks.length === 0 ? (
					<div className="px-3 py-2 font-mono text-[length:var(--fs-sm)] text-muted-foreground">无变更</div>
				) : (
					<div className="w-max min-w-full font-mono text-[length:var(--fs-sm)] leading-5 [tab-size:2]">
						{hunks.map((line, index) => (
							<div key={index} data-type={line.type} className={cn("flex w-full whitespace-pre", DIFF_ROW[line.type])}>
								<span className="sr-only">{DIFF_LABEL[line.type]}</span>
								<span aria-hidden className="w-6 shrink-0 select-none text-center opacity-80">{DIFF_SIGN[line.type]}</span>
								<span className="pr-3">{line.text.length > 0 ? line.text : " "}</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

