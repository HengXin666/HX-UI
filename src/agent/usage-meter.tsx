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

/** 额度用量条, 显示已用与上限的比值, 超过 80% 转黄, 超过 95% 转红. */
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
