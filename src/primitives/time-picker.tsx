"use client";

import { useCallback, useEffect, useState, type JSX } from "react";
import { cn } from "../primitives/utils";

/**
 * 时:分 选择器。
 *
 * 为什么不用 <input type="time">: 它的呈现完全交给浏览器 —— Chrome 是带钟表图标的
 * 分段输入, Firefox 是另一种, 而且**宽度与高度不可控**, 放进设置页那一行式版式里
 * 会把整行撑歪。这里自己拼两个 number 输入, 尺寸与 Input 一致。
 *
 * 三条被上游调过的行为, 原样保留 (它们是这类输入最容易踩坑的地方):
 *   一、**受控但不卡输入**。输入过程中允许中间态 (例如想输 09 时先出现的 "0"),
 *       只有解析得出的数字才回调; 失焦时再按规范化值回填, 于是 "7" 会变成 "07"。
 *   二、**越界即夹紧**, 不报错也不拒绝。输了 99 就变成 59 —— 比弹出校验提示更顺手。
 *   三、**去掉 spinner**。数字输入框右侧的上下箭头在 48px 宽的框里占掉三分之一,
 *       而且方向键本来就能调值。
 */
export interface TimePickerProps {
	/** 小时 0-23。 */
	readonly hour: number;
	/** 分钟 0-59。 */
	readonly minute: number;
	readonly onHourChange: (hour: number) => void;
	readonly onMinuteChange: (minute: number) => void;
	readonly className?: string;
	/** 小时输入的无障碍名。默认"小时"。 */
	readonly hourLabel?: string;
	readonly minuteLabel?: string;
	readonly disabled?: boolean;
}

const FIELD_CLASS =
	"h-8 w-12 [appearance:textfield] rounded-lg border border-border/60 bg-transparent px-2 py-1 text-center text-[length:var(--fs-sm-half)] tabular-nums text-foreground transition-colors outline-none hover:border-border focus-visible:border-ring/60 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function clamp(v: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, v));
}

export function TimePicker({
	hour,
	minute,
	onHourChange,
	onMinuteChange,
	className,
	hourLabel = "小时",
	minuteLabel = "分钟",
	disabled,
}: TimePickerProps): JSX.Element {
	const [hourStr, setHourStr] = useState(() => String(hour).padStart(2, "0"));
	const [minuteStr, setMinuteStr] = useState(() => String(minute).padStart(2, "0"));

	// 外部把值改掉时 (例如"设为当前时间"按钮) 输入框要跟着走
	useEffect(() => {
		setHourStr(String(hour).padStart(2, "0"));
	}, [hour]);
	useEffect(() => {
		setMinuteStr(String(minute).padStart(2, "0"));
	}, [minute]);

	const handleHour = useCallback(
		(raw: string) => {
			setHourStr(raw);
			const n = Number.parseInt(raw, 10);
			if (!Number.isNaN(n)) onHourChange(clamp(n, 0, 23));
		},
		[onHourChange],
	);

	const handleMinute = useCallback(
		(raw: string) => {
			setMinuteStr(raw);
			const n = Number.parseInt(raw, 10);
			if (!Number.isNaN(n)) onMinuteChange(clamp(n, 0, 59));
		},
		[onMinuteChange],
	);

	return (
		<div role="group" className={cn("flex items-center gap-1", className)}>
			<input
				type="number"
				inputMode="numeric"
				min={0}
				max={23}
				value={hourStr}
				disabled={disabled}
				aria-label={hourLabel}
				onChange={(e) => handleHour(e.target.value)}
				onBlur={() => setHourStr(String(hour).padStart(2, "0"))}
				className={FIELD_CLASS}
			/>
			<span aria-hidden className="text-[length:var(--fs-sm-half)] font-medium text-muted-foreground">:</span>
			<input
				type="number"
				inputMode="numeric"
				min={0}
				max={59}
				value={minuteStr}
				disabled={disabled}
				aria-label={minuteLabel}
				onChange={(e) => handleMinute(e.target.value)}
				onBlur={() => setMinuteStr(String(minute).padStart(2, "0"))}
				className={FIELD_CLASS}
			/>
		</div>
	);
}