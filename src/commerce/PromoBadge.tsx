"use client";

import * as React from "react";
import {
	COMMERCE_SIZE,
	COMMERCE_SLOT,
	COMMERCE_VARIANT,
	PROMO_CLASSES as C,
	PROMO_DEFAULT_TONE,
	PROMO_KIND,
	PROMO_PLACEMENT_CLASSES,
	PROMO_TONE_CLASSES,
	type CommerceSize,
	type CommerceTone,
	type CommerceVariant,
	type PROMO_BADGE_SLOTS,
	type PromoKind,
	type PromoPlacement,
} from "../constants/commerce";
import type { CommerceMessages } from "../locale/core";
import { useCommerceFormat } from "./shared/money";
import { resolveSlots, slotName, type SlotClassNames, type SlotStyles } from "./shared/slots";

export type PromoBadgeSlot = (typeof PROMO_BADGE_SLOTS)[number];

export interface PromoBadgeState {
	kind: PromoKind;
	tone: CommerceTone;
}

export interface PromoBadgeProps extends React.ComponentProps<"span"> {
	/** 按 slot 覆盖内部部件类名 (契约 4.1), 可传对象或按 PromoBadgeState 计算的函数. */
	classNames?: SlotClassNames<PromoBadgeSlot, PromoBadgeState>;
	/** 按 slot 覆盖内部部件内联样式 (契约 4.1). */
	styles?: SlotStyles<PromoBadgeSlot, PromoBadgeState>;
	/** 语义种类: 决定默认文案与默认 tone. children 存在时只用于 tone 推断. 默认 custom. */
	kind?: PromoKind;
	/** 语义色. 不传时按 kind 推断 (new→info, sale/discount→danger, limited/low-stock→warning). */
	tone?: CommerceTone;
	/** 视觉结构. 默认 soft. */
	variant?: CommerceVariant;
	size?: CommerceSize;
	/** kind="discount" 时的折扣率 (0 到 1), 显示为 "-30%". */
	discount?: number;
	/** kind="low-stock" 时的剩余数量. */
	remaining?: number;
	/** 贴到最近的定位祖先的某个角 (父元素需 relative). 不传则随文流排布. */
	placement?: PromoPlacement;
	locale?: string;
	labels?: Partial<CommerceMessages>;
}

/** 按 kind 取默认文案. custom 没有默认文案, 由 children 提供. */
function defaultText(kind: PromoKind, f: ReturnType<typeof useCommerceFormat>, discount?: number, remaining?: number): React.ReactNode {
	switch (kind) {
		case PROMO_KIND.new:
			return f.text.promoNew;
		case PROMO_KIND.sale:
			return f.text.promoSale;
		case PROMO_KIND.limited:
			return f.text.promoLimited;
		case PROMO_KIND.discount:
			return discount === undefined ? f.text.promoSale : f.off(discount);
		case PROMO_KIND.lowStock:
			return remaining === undefined ? null : f.text.lowStock(f.count(remaining));
		default:
			return null;
	}
}

/**
 * 促销徽标 (NEW / SALE / -30% / 限量 / 仅剩 N). 文案来自 LocaleProvider 或 labels, 折扣与数量走 Intl.
 * placement 用逻辑方位 (start / end) 绝对定位, RTL 下自动翻转. ref 指向根 <span>.
 * .agents/notes/implemented/feature/2026-11-02-commerce-atoms.md
 */
export function PromoBadge({
	kind = PROMO_KIND.custom,
	tone,
	variant = COMMERCE_VARIANT.soft,
	size = COMMERCE_SIZE.sm,
	discount,
	remaining,
	placement,
	locale,
	labels,
	classNames,
	styles,
	className,
	style,
	children,
	...props
}: PromoBadgeProps): React.JSX.Element {
	const f = useCommerceFormat(labels, locale);
	const resolvedTone = tone ?? PROMO_DEFAULT_TONE[kind];
	const s = resolveSlots<PromoBadgeSlot, PromoBadgeState>({ classNames, styles, className, style }, { kind, tone: resolvedTone });
	return (
		<span
			{...props}
			data-slot={slotName(COMMERCE_SLOT.promoBadge, "root")}
			data-kind={kind}
			data-tone={resolvedTone}
			data-variant={variant}
			data-size={size}
			data-placement={placement}
			className={s.className(
				"root",
				C.base,
				C[size],
				PROMO_TONE_CLASSES[resolvedTone][variant],
				placement && PROMO_PLACEMENT_CLASSES[placement],
			)}
			style={s.style("root")}
		>
			{children ?? defaultText(kind, f, discount, remaining)}
		</span>
	);
}
