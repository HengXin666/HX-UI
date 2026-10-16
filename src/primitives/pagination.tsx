"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import { Button } from "./button";
import { ARIA, PAGINATION, VARIANT } from "../constants";
import { cn } from "./utils";

/** 页码序列里的省略位. */
const ELLIPSIS = "ellipsis" as const;
type PageItem = number | typeof ELLIPSIS;

const FIRST_PAGE = 1;

function range(from: number, to: number): number[] {
	return Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);
}

/**
 * 计算要显示的页码序列 (页码从 1 开始).
 *
 * 首页与末页总是显示, 当前页两侧各显示 siblings 个, 其余折叠成省略位.
 * 序列长度恒为 siblings * 2 + 5 (总页数不足时为总页数): 翻页时整排宽度不变.
 * 省略位只在它省掉了至少两页时出现, 只省一页时直接显示那一页.
 */
function paginationRange(page: number, pageCount: number, siblings = 1): PageItem[] {
	if (pageCount <= 0) {
		return [];
	}
	const total = pageCount;
	const slots = siblings * PAGINATION.sides + PAGINATION.fixedSlots;
	if (total <= slots) {
		return range(FIRST_PAGE, total);
	}
	const current = Math.min(Math.max(page, FIRST_PAGE), total);
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
	const text = { ...DEFAULT_LABELS, ...labels };
	const items = paginationRange(page, pageCount, siblings);
	const go = (target: number): void => {
		if (target >= FIRST_PAGE && target <= pageCount && target !== page) {
			onPageChange(target);
		}
	};
	return (
		<nav data-slot="pagination" aria-label={text.nav} className={cn("flex flex-wrap items-center gap-1", className)} {...props}>
			<Button variant={VARIANT.ghost} size={VARIANT.iconSm} aria-label={text.previous} disabled={page <= FIRST_PAGE} onClick={() => go(page - 1)}>
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
						variant={item === page ? VARIANT.primary : VARIANT.ghost}
						size={VARIANT.sm}
						aria-label={text.page(item)}
						aria-current={item === page ? ARIA.page : undefined}
						onClick={() => go(item)}
						className="min-w-7 px-1.5 tabular-nums"
					>
						{item}
					</Button>
				),
			)}
			<Button variant={VARIANT.ghost} size={VARIANT.iconSm} aria-label={text.next} disabled={page >= pageCount} onClick={() => go(page + 1)}>
				<ChevronRightIcon />
			</Button>
		</nav>
	);
}

export { Pagination, paginationRange };
export type { PageItem, PaginationLabels, PaginationProps };
