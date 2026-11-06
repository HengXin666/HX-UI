"use client";

import * as React from "react";
import { BUTTON_TYPE, ROLE } from "../constants";
import {
	CHOICE_CLASSES as C,
	CHOICE_STATE,
	COMMERCE_CLASSES as K,
	COMMERCE_CONTROL,
	COMMERCE_FOCUS,
	COMMERCE_NUMBERS,
	COMMERCE_SIZE,
	COMMERCE_SLOT,
	type CommerceSize,
	type SIZE_SELECTOR_SLOTS,
} from "../constants/commerce";
import { DIR } from "../constants/locale";
import { useControllableState } from "../hooks/state/useControllableState";
import type { CommerceMessages } from "../locale/core";
import { useLocale } from "../locale/LocaleProvider";
import { useCommerceFormat } from "./shared/money";
import { useRoving } from "./shared/use-roving";
import { dataFlag, resolveSlots, slotName, type SlotClassNames, type SlotStyles } from "./shared/slots";

export type SizeSelectorSlot = (typeof SIZE_SELECTOR_SLOTS)[number];

export interface SizeOption {
	value: string;
	/** 显示文字 (S, M, 42, 256 GB). 不传时用 value. */
	label?: React.ReactNode;
	/** 读屏名称. label 不是纯文本时必传. */
	ariaLabel?: string;
	/** 库存. 0 视为缺货 (置灰, 删除线, 不可选); 小于等于 lowStockThreshold 显示 "仅剩 N". */
	stock?: number;
	/** 自定义提示, 覆盖库存提示. */
	hint?: React.ReactNode;
	disabled?: boolean;
}

export interface SizeSelectorState {
	value: string | null;
}

export interface SizeSelectorProps
	extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
	/** 按 slot 覆盖内部部件类名 (契约 4.1), 可传对象或按 SizeSelectorState 计算的函数. */
	classNames?: SlotClassNames<SizeSelectorSlot, SizeSelectorState>;
	/** 按 slot 覆盖内部部件内联样式 (契约 4.1). */
	styles?: SlotStyles<SizeSelectorSlot, SizeSelectorState>;
	options: readonly SizeOption[];
	value?: string | null;
	defaultValue?: string | null;
	onValueChange?: (value: string | null) => void;
	/** 按钮尺寸档. 默认 md. */
	size?: CommerceSize;
	/** 库存提示阈值. 默认 5. */
	lowStockThreshold?: number;
	/** 是否在按钮下显示库存提示. 默认 true. */
	showStock?: boolean;
	disabled?: boolean;
	locale?: string;
	labels?: Partial<CommerceMessages>;
}

/**
 * 尺码 / 规格选择: 一排按钮, radiogroup + roving tabindex. 缺货项置灰带删除线, 读屏名追加 "缺货";
 * 低库存项在按钮内显示 "仅剩 N". ref 指向根 <div role="radiogroup">.
 * .agents/notes/implemented/feature/2026-11-02-commerce-atoms.md
 */
export function SizeSelector({
	options,
	value,
	defaultValue = null,
	onValueChange,
	size = COMMERCE_SIZE.md,
	lowStockThreshold = COMMERCE_NUMBERS.lowStock,
	showStock = true,
	disabled = false,
	locale,
	labels,
	classNames,
	styles,
	className,
	style,
	"aria-label": ariaLabel,
	...props
}: SizeSelectorProps): React.JSX.Element {
	const f = useCommerceFormat(labels, locale);
	const { dir } = useLocale();
	const [current, setCurrent] = useControllableState<string | null>({ value, defaultValue, onChange: onValueChange });
	const soldOut = (option: SizeOption): boolean => option.stock === 0;
	const items = options.map((option) => ({ value: option.value, disabled: disabled || option.disabled || soldOut(option) }));
	const roving = useRoving(items, current, (index) => setCurrent(options[index].value), dir === DIR.rtl);
	const s = resolveSlots<SizeSelectorSlot, SizeSelectorState>({ classNames, styles, className, style }, { value: current });
	const name = (slot: SizeSelectorSlot): string => slotName(COMMERCE_SLOT.sizeSelector, slot);

	const hintOf = (option: SizeOption): React.ReactNode => {
		if (option.hint !== undefined) return option.hint;
		if (!showStock || option.stock === undefined || soldOut(option) || option.stock > lowStockThreshold) return null;
		return f.text.lowStock(f.count(option.stock));
	};

	return (
		<div
			{...props}
			role={ROLE.radiogroup}
			aria-label={ariaLabel ?? f.text.sizeGroup}
			aria-disabled={disabled || undefined}
			data-slot={name("root")}
			data-size={size}
			data-disabled={dataFlag(disabled)}
			onKeyDown={roving.onKeyDown}
			className={s.className("root", C.group)}
			style={s.style("root")}
		>
			{options.map((option, index) => {
				const checked = option.value === current;
				const empty = soldOut(option);
				const off = items[index].disabled;
				const hint = hintOf(option);
				const text = option.ariaLabel ?? (typeof option.label === "string" ? option.label : option.value);
				const status = empty ? f.text.soldOut : typeof hint === "string" ? hint : null;
				return (
					<button
						key={option.value}
						ref={roving.register(index)}
						type={BUTTON_TYPE}
						role={ROLE.radio}
						aria-checked={checked}
						aria-label={status ? `${text}, ${status}` : text}
						disabled={off}
						tabIndex={roving.tabIndexOf(index)}
						data-slot={name("item")}
						data-state={checked ? CHOICE_STATE.checked : CHOICE_STATE.unchecked}
						data-disabled={dataFlag(off)}
						data-sold-out={dataFlag(empty)}
						onClick={() => setCurrent(option.value)}
						className={s.className("item", C.sizeItem, COMMERCE_CONTROL[size], K.colors, K.disabled, COMMERCE_FOCUS)}
						style={s.style("item")}
					>
						<span data-slot={name("item-text")} data-sold-out={dataFlag(empty)} className={s.className("item-text", C.soldOut)} style={s.style("item-text")}>
							{option.label ?? option.value}
						</span>
						{hint && (
							<span aria-hidden="true" data-slot={name("item-hint")} className={s.className("item-hint", C.sizeHint)} style={s.style("item-hint")}>
								{hint}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
