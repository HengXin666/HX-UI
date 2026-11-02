"use client";

import * as React from "react";
import { BUTTON_TYPE, ROLE } from "../constants";
import {
	CHOICE_CLASSES as C,
	CHOICE_STATE,
	COMMERCE_CLASSES as K,
	COMMERCE_FOCUS,
	COMMERCE_NUMBERS,
	COMMERCE_SIZE,
	COMMERCE_SLOT,
	SWATCH_DIAMETER,
	type CommerceSize,
	type PRODUCT_SWATCH_SLOTS,
} from "../constants/commerce";
import { DIR } from "../constants/locale";
import { useControllableState } from "../hooks/state/useControllableState";
import type { CommerceMessages } from "../locale/core";
import { useLocale } from "../locale/LocaleProvider";
import { useCommerceFormat } from "./shared/money";
import { useRoving } from "./shared/use-roving";
import { dataFlag, resolveSlots, slotName, type SlotClassNames, type SlotStyles } from "./shared/slots";

export type ProductSwatchSlot = (typeof PRODUCT_SWATCH_SLOTS)[number];

export interface ProductSwatchOption {
	value: string;
	/** 颜色名, 也是可访问名 (颜色不能只靠颜色本身传达). */
	label: string;
	/** 色块填充: 来自商品数据的 CSS 颜色或令牌引用, 组件不内置任何色值. */
	color?: string;
	/** 用图片 (面料, 花色) 代替纯色填充. */
	image?: string;
	/** 不可选 (无货或下架). */
	disabled?: boolean;
}

export interface ProductSwatchState {
	value: string | null;
	expanded: boolean;
}

export interface ProductSwatchProps
	extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
	/** 按 slot 覆盖内部部件类名 (契约 4.1), 可传对象或按 ProductSwatchState 计算的函数. */
	classNames?: SlotClassNames<ProductSwatchSlot, ProductSwatchState>;
	/** 按 slot 覆盖内部部件内联样式 (契约 4.1). */
	styles?: SlotStyles<ProductSwatchSlot, ProductSwatchState>;
	options: readonly ProductSwatchOption[];
	/** 受控值, null 表示未选. */
	value?: string | null;
	defaultValue?: string | null;
	onValueChange?: (value: string | null) => void;
	/** 折叠前最多露出几个, 其余收成 "+N". 默认 6. */
	maxVisible?: number;
	/** 是否已展开全部 (受控). */
	expanded?: boolean;
	defaultExpanded?: boolean;
	onExpandedChange?: (expanded: boolean) => void;
	size?: CommerceSize;
	disabled?: boolean;
	locale?: string;
	labels?: Partial<CommerceMessages>;
}

/**
 * 商品色板: 一排圆形色块选商品颜色 (与 widgets/ColorSwatch 的取色器不同, 这里只在给定款式间选).
 * radiogroup + roving tabindex; 超出 maxVisible 时折叠成 "+N" 按钮, 已选项始终可见.
 * ref 指向根 <div role="radiogroup">.
 * .agents/notes/implemented/feature/2026-11-02-commerce-atoms.md
 */
export function ProductSwatch({
	options,
	value,
	defaultValue = null,
	onValueChange,
	maxVisible = COMMERCE_NUMBERS.swatchMax,
	expanded: expandedProp,
	defaultExpanded = false,
	onExpandedChange,
	size = COMMERCE_SIZE.md,
	disabled = false,
	locale,
	labels,
	classNames,
	styles,
	className,
	style,
	"aria-label": ariaLabel,
	...props
}: ProductSwatchProps): React.JSX.Element {
	const f = useCommerceFormat(labels, locale);
	const { dir } = useLocale();
	const [current, setCurrent] = useControllableState<string | null>({ value, defaultValue, onChange: onValueChange });
	const [expanded, setExpanded] = useControllableState<boolean>({
		value: expandedProp,
		defaultValue: defaultExpanded,
		onChange: onExpandedChange,
	});

	const selectedIndex = options.findIndex((option) => option.value === current);
	const folded = !expanded && options.length > maxVisible;
	const visible = folded
		? options.filter((_, index) => index < maxVisible - 1 || index === selectedIndex).slice(0, maxVisible)
		: options;
	const hidden = options.length - visible.length;
	const items = visible.map((option) => ({ value: option.value, disabled: disabled || option.disabled }));
	const roving = useRoving(items, current, (index) => setCurrent(visible[index].value), dir === DIR.rtl);
	const s = resolveSlots<ProductSwatchSlot, ProductSwatchState>(
		{ classNames, styles, className, style },
		{ value: current, expanded },
	);
	const name = (slot: ProductSwatchSlot): string => slotName(COMMERCE_SLOT.productSwatch, slot);

	return (
		<div
			{...props}
			role={ROLE.radiogroup}
			aria-label={ariaLabel ?? f.text.swatchGroup}
			aria-disabled={disabled || undefined}
			data-slot={name("root")}
			data-size={size}
			data-disabled={dataFlag(disabled)}
			onKeyDown={roving.onKeyDown}
			className={s.className("root", C.group, K.disabled)}
			style={s.style("root")}
		>
			{visible.map((option, index) => {
				const checked = option.value === current;
				const off = disabled || option.disabled;
				return (
					<button
						key={option.value}
						ref={roving.register(index)}
						type={BUTTON_TYPE}
						role={ROLE.radio}
						aria-checked={checked}
						aria-label={option.disabled ? `${option.label}, ${f.text.unavailable}` : option.label}
						title={option.label}
						disabled={off}
						tabIndex={roving.tabIndexOf(index)}
						data-slot={name("item")}
						data-state={checked ? CHOICE_STATE.checked : CHOICE_STATE.unchecked}
						data-disabled={dataFlag(off)}
						onClick={() => setCurrent(option.value)}
						className={s.className("item", C.swatchItem, K.colors, K.disabled, COMMERCE_FOCUS)}
						style={s.style("item")}
					>
						<span
							aria-hidden="true"
							data-slot={name("swatch")}
							className={s.className("swatch", C.swatch, SWATCH_DIAMETER[size])}
							style={s.style("swatch", {
								backgroundColor: option.color,
								backgroundImage: option.image ? `url(${JSON.stringify(option.image)})` : undefined,
								backgroundSize: option.image ? "cover" : undefined,
							})}
						/>
						{checked && (
							<span aria-hidden="true" data-slot={name("indicator")} className={s.className("indicator", C.indicator)} style={s.style("indicator")} />
						)}
					</button>
				);
			})}
			{hidden > 0 && (
				<button
					type={BUTTON_TYPE}
					aria-label={f.text.swatchMore(f.count(hidden))}
					aria-expanded={false}
					disabled={disabled}
					data-slot={name("more")}
					onClick={() => setExpanded(true)}
					className={s.className("more", C.more, SWATCH_DIAMETER[size], C.moreWidth, K.colors, COMMERCE_FOCUS)}
					style={s.style("more")}
				>
					{f.plus(hidden)}
				</button>
			)}
		</div>
	);
}
