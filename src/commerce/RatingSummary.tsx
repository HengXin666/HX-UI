"use client";

import * as React from "react";
import { BUTTON_TYPE, PERCENT } from "../constants";
import {
	COMMERCE_CLASSES as K,
	COMMERCE_FOCUS,
	COMMERCE_NUMBERS,
	COMMERCE_SLOT,
	RATING_SUMMARY_CLASSES as C,
	type RATING_SUMMARY_SLOTS,
} from "../constants/commerce";
import { WIDGET_ICON } from "../constants/widgets";
import type { CommerceMessages } from "../locale/core";
import { useCommerceFormat } from "./shared/money";
import { dataFlag, resolveSlots, slotName, type SlotClassNames, type SlotStyles } from "./shared/slots";

export type RatingSummarySlot = (typeof RATING_SUMMARY_SLOTS)[number];

export interface RatingSummaryState {
	compact: boolean;
	interactive: boolean;
}

export interface RatingSummaryProps
	extends Omit<React.HTMLAttributes<HTMLElement>, "onClick"> {
	/** 按 slot 覆盖内部部件类名 (契约 4.1), 可传对象或按 RatingSummaryState 计算的函数. */
	classNames?: SlotClassNames<RatingSummarySlot, RatingSummaryState>;
	/** 按 slot 覆盖内部部件内联样式 (契约 4.1). */
	styles?: SlotStyles<RatingSummarySlot, RatingSummaryState>;
	ref?: React.Ref<HTMLElement>;
	/** 平均分. */
	value: number;
	/** 满分. 默认 5. */
	max?: number;
	/** 评价数. 不传时不显示. */
	count?: number;
	/** 紧凑模式: 一颗星 + 分数 + 缩写计数 (1.2万 / 1.2K). */
	compact?: boolean;
	/** 评价区锚点 (#reviews). 传了就渲染为 <a>. */
	href?: string;
	/** 点击回调 (无 href 时渲染为 <button>). */
	onClick?: (event: React.MouseEvent<HTMLElement>) => void;
	locale?: string;
	labels?: Partial<CommerceMessages>;
}

/** 某颗星 (从 1 数) 在给定分值下的填充比例, 0 到 1. */
function fillOf(star: number, value: number): number {
	return Math.min(Math.max(value - (star - 1), 0), 1);
}

/**
 * 评分摘要: 只读星级 + 分数 + 评价数. 整体只有一个可访问名 ("4.6 分, 满分 5, 1,234 条评价"),
 * 视觉部件 aria-hidden. 有 href 时是链接 (跳到评价区), 有 onClick 时是按钮, 否则是 role="img".
 * ref 指向根元素.
 * .agents/notes/implemented/feature/2026-11-02-commerce-atoms.md
 */
export function RatingSummary({
	ref,
	value,
	max = COMMERCE_NUMBERS.ratingMax,
	count,
	compact = false,
	href,
	onClick,
	locale,
	labels,
	classNames,
	styles,
	className,
	style,
	...props
}: RatingSummaryProps): React.JSX.Element {
	const f = useCommerceFormat(labels, locale);
	const interactive = href !== undefined || onClick !== undefined;
	const s = resolveSlots<RatingSummarySlot, RatingSummaryState>({ classNames, styles, className, style }, { compact, interactive });
	const name = (slot: RatingSummarySlot): string => slotName(COMMERCE_SLOT.ratingSummary, slot);
	const score = f.decimal(value, COMMERCE_NUMBERS.ratingDigits);
	const label =
		count === undefined ? f.text.ratingScore(score, f.count(max)) : f.text.ratingSummary(score, f.count(max), f.count(count));
	const stars = compact ? 1 : Math.round(max);

	const content = (
		<>
			<span aria-hidden="true" data-slot={name("stars")} className={s.className("stars", C.stars)} style={s.style("stars")}>
				{Array.from({ length: stars }, (_, index) => (
					<span key={index} data-slot={name("star")} className={s.className("star", C.star)} style={s.style("star")}>
						<span data-slot={name("star-icon")} className={s.className("star-icon", WIDGET_ICON.starEmpty, C.glyph, C.empty)} />
						<span
							data-slot={name("star-fill")}
							className={s.className("star-fill", C.fill)}
							style={s.style("star-fill", { width: `${(compact ? 1 : fillOf(index + 1, value)) * PERCENT}%` })}
						>
							<span data-slot={name("star-icon")} className={s.className("star-icon", WIDGET_ICON.starFilled, C.glyph)} />
						</span>
					</span>
				))}
			</span>
			<span aria-hidden="true" data-slot={name("score")} className={s.className("score", C.score, K.nums)} style={s.style("score")}>
				{score}
			</span>
			{count !== undefined && (
				<span aria-hidden="true" data-slot={name("count")} className={s.className("count", K.muted, K.nums)} style={s.style("count")}>
					{compact ? `(${f.count(count, true)})` : f.text.reviews(f.count(count))}
				</span>
			)}
		</>
	);

	const shared = {
		...props,
		"data-slot": name("root"),
		"data-compact": dataFlag(compact),
		"aria-label": label,
		className: s.className("root", C.root, interactive && C.link, interactive && COMMERCE_FOCUS),
		style: s.style("root"),
	};

	if (href !== undefined) {
		return (
			<a {...shared} ref={ref as React.Ref<HTMLAnchorElement>} href={href} onClick={onClick}>
				{content}
			</a>
		);
	}
	if (onClick !== undefined) {
		return (
			<button {...shared} ref={ref as React.Ref<HTMLButtonElement>} type={BUTTON_TYPE} onClick={onClick}>
				{content}
			</button>
		);
	}
	return (
		<div {...shared} ref={ref as React.Ref<HTMLDivElement>} role="img">
			{content}
		</div>
	);
}
