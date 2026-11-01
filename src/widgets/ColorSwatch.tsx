"use client";

import { useRef, useState, type JSX, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { BUTTON_TYPE, ROLE, SIZE, STEP_BACK } from "../constants";
import { SWATCH_CLASSES as C, WIDGET_CLASSES, WIDGET_ICON, WIDGET_KEY, WIDGET_MOTION, arrowDelta } from "../constants/widgets";
import { cn } from "../primitives/utils";

export interface ColorSwatchOption {
	readonly value: string;
	/** 可访问名, 也是悬停提示. 颜色不能只靠颜色本身传达. */
	readonly label: string;
	/** 色块填充. 传语义 token 引用 (var(--primary)), 由调用方保证来自令牌. */
	readonly color: string;
	readonly disabled?: boolean;
}

export interface ColorSwatchProps {
	readonly options: readonly ColorSwatchOption[];
	/** 受控值. 不传时组件自己记, 初值取 defaultValue. */
	readonly value?: string;
	readonly defaultValue?: string;
	readonly onChange?: (value: string) => void;
	/** 色块边长档位. 默认 md. */
	readonly size?: "sm" | "md";
	/** 选择组的可访问名. */
	readonly label?: string;
	readonly className?: string;
}

const DEFAULT_LABEL = "选择颜色";

/**
 * 色块单选. 外层 radiogroup, 每个色块 role="radio", roving tabindex 只留一个 Tab 停靠点;
 * 方向键在可用色块间循环移动并选中, Home / End 跳到首尾. 选中态是 1px 环加勾, 不只靠颜色区分.
 */
export function ColorSwatch({
	options, value, defaultValue, onChange, size = SIZE.md, label = DEFAULT_LABEL, className,
}: ColorSwatchProps): JSX.Element {
	const [inner, setInner] = useState(defaultValue);
	const current = value ?? inner;
	const refs = useRef<Array<HTMLButtonElement | null>>([]);
	const enabled = options.map((option, index) => (option.disabled ? STEP_BACK : index)).filter((index) => index >= 0);
	const selectedIndex = options.findIndex((option) => option.value === current);
	const tabIndexAt = selectedIndex >= 0 && !options[selectedIndex].disabled ? selectedIndex : enabled[0];

	const select = (index: number): void => {
		const option = options[index];
		if (!option || option.disabled) return;
		if (value === undefined) setInner(option.value);
		onChange?.(option.value);
		refs.current[index]?.focus();
	};

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		if (enabled.length === 0) return;
		const delta = arrowDelta(event.key);
		const at = Math.max(enabled.indexOf(tabIndexAt), 0);
		if (delta !== 0) select(enabled[(at + delta + enabled.length) % enabled.length]);
		else if (event.key === WIDGET_KEY.home) select(enabled[0]);
		else if (event.key === WIDGET_KEY.end) select(enabled[enabled.length - 1]);
		else return;
		event.preventDefault();
	};

	return (
		<div role={ROLE.radiogroup} aria-label={label} onKeyDown={onKeyDown} className={cn(WIDGET_CLASSES.row, className)}>
			{options.map((option, index) => {
				const checked = option.value === current;
				return (
					<button
						key={option.value}
						ref={(node) => { refs.current[index] = node; }}
						type={BUTTON_TYPE}
						role="radio"
						aria-checked={checked}
						aria-label={option.label}
						title={option.label}
						disabled={option.disabled}
						tabIndex={index === tabIndexAt ? 0 : STEP_BACK}
						onClick={() => select(index)}
						className={cn(
							C.swatch,
							C.motion,
							C.disabled,
							checked && C.checked,
							WIDGET_CLASSES.focusRing,
							C[size],
						)}
						style={{ backgroundColor: option.color }}
					>
						{checked && (
							<motion.span
								aria-hidden
								initial={{ scale: WIDGET_MOTION.popScale, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={WIDGET_MOTION.spring}
								className={C.mark}
							>
								<span className={cn(WIDGET_ICON.check, WIDGET_CLASSES.iconSm, WIDGET_CLASSES.fg)} />
							</motion.span>
						)}
					</button>
				);
			})}
		</div>
	);
}
