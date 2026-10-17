"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import { Button } from "./button";
import { ARIA, BUTTON_TYPE, PAGINATION, VARIANT } from "../constants";
import { cn } from "./utils";

/** 页码序列里的省略位. */
const ELLIPSIS = "ellipsis" as const;
type PageItem = number | typeof ELLIPSIS;

const FIRST_PAGE = 1;

function range(from: number, to: number): number[] {
	return Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);
}

/**
 * 把当前页收进 [1, pageCount]. 总页数缩小 (筛选后结果变少) 时调用方传进来的页可能已越界,
 * 页码序列, 按钮禁用态与翻页目标都必须基于同一个收敛后的页, 否则"上一页"会算出一个
 * 仍然越界的目标而点了没反应. pageCount 为 0 (空结果) 时返回 0, 表示没有当前页.
 */
function clampPage(page: number, pageCount: number): number {
	if (pageCount < FIRST_PAGE) {
		return 0;
	}
	return Math.min(Math.max(page, FIRST_PAGE), pageCount);
}

/**
 * 计算要显示的页码序列 (页码从 1 开始).
 *
 * 首页与末页总是显示, 当前页两侧各显示 siblings 个, 其余折叠成省略位.
 * 序列长度恒为 siblings * 2 + 5 (总页数不足时为总页数): 翻页时整排宽度不变.
 * 省略位只在它省掉了至少两页时出现, 只省一页时直接显示那一页.
 * 总页数为 0 (空结果) 时返回空序列, 不虚构一个"第 1 页".
 */
function paginationRange(page: number, pageCount: number, siblings = 1): PageItem[] {
	const total = Math.max(0, pageCount);
	const slots = siblings * PAGINATION.sides + PAGINATION.fixedSlots;
	if (total <= slots) {
		return range(FIRST_PAGE, total);
	}
	const current = clampPage(page, total);
	const left = Math.max(current - siblings, FIRST_PAGE);
	const right = Math.min(current + siblings, total);
	/** 省略位连同首页 / 末页一共占两个位置, 剩下的给连续页码 */
	const edgeRun = slots - PAGINATION.edgeSlots;
	const showLeftGap = left > FIRST_PAGE + PAGINATION.minGap;
	const showRightGap = right < total - PAGINATION.minGap;
	if (!showLeftGap) {
		return [...range(FIRST_PAGE, edgeRun), ELLIPSIS, total];
	}
	if (!showRightGap) {
		return [FIRST_PAGE, ELLIPSIS, ...range(total - edgeRun + 1, total)];
	}
	return [FIRST_PAGE, ELLIPSIS, ...range(left, right), ELLIPSIS, total];
}

interface PaginationLabels {
	nav: string;
	previous: string;
	next: string;
	page: (page: number) => string;
}

const DEFAULT_LABELS: PaginationLabels = {
	nav: "分页",
	previous: "上一页",
	next: "下一页",
	page: (page) => `第 ${page} 页`,
};

interface PaginationProps extends Omit<React.ComponentProps<"nav">, "onChange"> {
	/** 当前页, 从 1 开始. */
	page: number;
	pageCount: number;
	onPageChange: (page: number) => void;
	/** 当前页两侧显示的页数. 默认 1. */
	siblings?: number;
	labels?: Partial<PaginationLabels>;
}

/**
 * 分页器: 上一页 / 页码 / 下一页.
 *
 * 三类按钮都显式写 type=button: 放进 form 里点击不会触发提交.
 * 越界的 page 先收进 [1, pageCount] 再用于序列, 禁用态与翻页; pageCount 为 0 时
 * 不显示页码, 前后按钮都禁用.
 * 当前页是 primary 实底并带 aria-current="page", 其余是 ghost 按钮; 页码按钮宽度
 * 用 tabular-nums 与最小宽度固定, 翻页时整排不会左右跳.
 */
function Pagination({
	page,
	pageCount,
	onPageChange,
	siblings = 1,
	labels,
	className,
	...props
}: PaginationProps): React.JSX.Element {
	/* 逐项回退而不是对象展开: 展开会让显式传入的 undefined 覆盖默认文案, 按钮失去无障碍名称 */
	const text: PaginationLabels = {
		nav: labels?.nav ?? DEFAULT_LABELS.nav,
		previous: labels?.previous ?? DEFAULT_LABELS.previous,
		next: labels?.next ?? DEFAULT_LABELS.next,
		page: labels?.page ?? DEFAULT_LABELS.page,
	};
	const total = Math.max(0, pageCount);
	const current = clampPage(page, total);
	const items = paginationRange(current, total, siblings);
	/* 与原始 page 比较: page 越界时点高亮的那一页也会把调用方的状态拉回有效范围 */
	const go = (target: number): void => {
		if (target >= FIRST_PAGE && target <= total && target !== page) {
			onPageChange(target);
		}
	};
	return (
		<nav data-slot="pagination" aria-label={text.nav} className={cn("flex flex-wrap items-center gap-1", className)} {...props}>
			<Button
				type={BUTTON_TYPE}
				variant={VARIANT.ghost}
				size={VARIANT.iconSm}
				aria-label={text.previous}
				disabled={current <= FIRST_PAGE}
				onClick={() => go(current - 1)}
			>
				<ChevronLeftIcon />
			</Button>
			{items.map((item, index) =>
				item === ELLIPSIS ? (
					<span
						key={`${ELLIPSIS}-${index}`}
						aria-hidden
						className="inline-flex size-7 items-center justify-center text-muted-foreground [&_svg]:size-3.5"
					>
						<MoreHorizontalIcon />
					</span>
				) : (
					<Button
						key={item}
						type={BUTTON_TYPE}
						variant={item === current ? VARIANT.primary : VARIANT.ghost}
						size={VARIANT.sm}
						aria-label={text.page(item)}
						aria-current={item === current ? ARIA.page : undefined}
						onClick={() => go(item)}
						className="min-w-7 px-1.5 tabular-nums"
					>
						{item}
					</Button>
				),
			)}
			<Button
				type={BUTTON_TYPE}
				variant={VARIANT.ghost}
				size={VARIANT.iconSm}
				aria-label={text.next}
				disabled={current >= total}
				onClick={() => go(current + 1)}
			>
				<ChevronRightIcon />
			</Button>
		</nav>
	);
}

export { Pagination, paginationRange };
export type { PageItem, PaginationLabels, PaginationProps };
