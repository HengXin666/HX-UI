import { type JSX, useState } from "react";
import { Badge } from "../layout/Badge";
import { Button } from "../primitives/button";
import { BUTTON_TYPE } from "../constants";
import { Card, CardContent, CardHeader, CardTitle } from "../layout/Card";

export interface InlineApprovalProps {
	readonly title?: string;
	readonly detail: string;
	readonly approveText?: string;
	readonly rejectText?: string;
	readonly onApprove?: () => void;
	readonly onReject?: () => void;
}

type Verdict = "idle" | "approved" | "rejected";

const MUTED = "text-[12px] text-muted-foreground";

/** 行内确认卡: 高风险写入前要求人选择允许或拒绝, 选择后给出结论. */
export function InlineApproval({
	title = "需要确认",
	detail,
	approveText = "允许并写入",
	rejectText = "拒绝",
	onApprove,
	onReject,
}: InlineApprovalProps): JSX.Element {
	const [verdict, setVerdict] = useState<Verdict>("idle");
	const pending = verdict === "idle";

	function approve(): void {
		setVerdict("approved");
		onApprove?.();
	}

	function reject(): void {
		setVerdict("rejected");
		onReject?.();
	}

	const tone = pending ? "warning" : verdict === "approved" ? "success" : "destructive";

	return (
		<Card variant="default" className="max-w-[540px] border-warning/40" data-slot="inline-approval">
			<CardHeader className="flex items-center gap-2 py-2">
				<span aria-hidden className="size-1.5 rounded-full bg-warning-fg" />
				<CardTitle>{title}</CardTitle>
				<Badge variant={tone} className="ml-auto">
					{pending ? "等待确认" : verdict === "approved" ? "已允许" : "已拒绝"}
				</Badge>
			</CardHeader>
			<CardContent className="pt-0">
				<div className={MUTED}>{detail}</div>
				{pending ? (
					<div className="mt-3 flex items-center gap-2">
						<Button type={BUTTON_TYPE} variant="primary" size="sm" onClick={approve}>{approveText}</Button>
						<Button type={BUTTON_TYPE} variant="outline" size="sm" onClick={reject}>{rejectText}</Button>
					</div>
				) : (
					<div className={"mt-2 " + MUTED}>
						{verdict === "approved" ? "已允许, 正在应用变更." : "已拒绝, 文件保持不变."}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
