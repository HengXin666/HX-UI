"use client";

import { useCallback, useRef, useState, type JSX, type KeyboardEvent } from "react";
import { BUTTON_TYPE, PERCENT, ROLE, STEP_BACK } from "../constants";
import { RATING, RATING_CLASSES as C, WIDGET_CLASSES, WIDGET_ICON, WIDGET_KEY, arrowDelta } from "../constants/widgets";
import { cn } from "../primitives/utils";

export interface RatingProps {
	/** 受控值 (0 表示未评). 不传时组件自己记, 初值取 defaultValue. */
	readonly value?: number;
	readonly defaultValue?: number;
	readonly onChange?: (value: number) => void;
	/** 星数. 默认 5. */
	readonly count?: number;
	/** 允许半星: 每颗星拆成左右两个可选位, 步长 0.5. */
	readonly allowHalf?: boolean;
	/** 再次选中当前值时清零, Backspace / Delete 也清零. 默认 true. */
	readonly allowClear?: boolean;
	readonly readOnly?: boolean;
	readonly disabled?: boolean;
	/** 评分组的可访问名. 默认 "评分". */
	readonly label?: string;
	/** 每个可选位的读法, 默认 "3.5 星". */
	readonly getValueText?: (value: number) => string;
	readonly className?: string;
}

const DEFAULT_LABEL = "评分";
const STAR_TEXT = " 星";
const defaultValueText = (value: number): string => String(value) + STAR_TEXT;

/** 某颗星 (从 1 数) 在给定分值下的填充比例, 0 到 1. */
function fillOf(star: number, shown: number): number {
	return Math.min(Math.max(shown - (star - 1), 0), 1);
}

/**
 * 评分. 外层 role="radiogroup", 每个可选分值是一个 radio, 采用 roving tabindex:
 * 整组只占一个 Tab 停靠点, 组内 ArrowRight / ArrowUp 加一档, ArrowLeft / ArrowDown 减一档,
 * Home / End 跳到最低与最高档, 移动即选中 (与原生单选组一致). 半星时一档是 0.5.
 * .agents/notes/implemented/feature/2026-11-01-rich-widgets.md
 */
export function Rating({
	value,
	defaultValue = 0,
	onChange,
	count = RATING.count,
	allowHalf = false,
	allowClear = true,
	readOnly = false,
	disabled = false,
	label = DEFAULT_LABEL,
	getValueText = defaultValueText,
	className,
}: RatingProps): JSX.Element {
	const [inner, setInner] = useState(defaultValue);
	const [hover, setHover] = useState<number | null>(null);
	const current = value ?? inner;
	const step = allowHalf ? RATING.halfStep : RATING.step;
	const stops = Array.from({ length: Math.round(count / step) }, (_, i) => (i + 1) * step);
	const refs = useRef(new Map<number, HTMLButtonElement>());
	const inert = readOnly || disabled;

	const commit = useCallback(
		(next: number) => {
			if (value === undefined) setInner(next);
			onChange?.(next);
		},
		[value, onChange],
	);

	const moveTo = (next: number): void => {
		const clamped = Math.min(Math.max(next, step), count);
		commit(clamped);
		refs.current.get(clamped)?.focus();
	};

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		if (inert) return;
		const delta = arrowDelta(event.key);
		if (delta !== 0) moveTo((current || 0) + delta * step);
		else if (event.key === WIDGET_KEY.home) moveTo(step);
		else if (event.key === WIDGET_KEY.end) moveTo(count);
		else if (allowClear && (event.key === WIDGET_KEY.backspace || event.key === WIDGET_KEY.delete)) commit(0);
		else return;
		event.preventDefault();
	};

	const pick = (stop: number): void => {
		commit(allowClear && stop === current ? 0 : stop);
	};

	const shown = hover ?? current;
	const tabStop = stops.includes(current) ? current : stops[0];

	return (
		<div
			role="radiogroup"
			aria-label={label}
			aria-readonly={readOnly || undefined}
			aria-disabled={disabled || undefined}
			onKeyDown={onKeyDown}
			onMouseLeave={() => setHover(null)}
			className={cn(C.group, disabled && C.disabled, className)}
		>
			{Array.from({ length: count }, (_, index) => {
				const star = index + 1;
				const fill = fillOf(star, shown);
				const slots = stops.filter((stop) => stop > star - 1 && stop <= star);
				return (
					<span key={star} className={C.star}>
						<span aria-hidden className={cn(WIDGET_ICON.starEmpty, C.glyph, C.empty)} />
						<span aria-hidden className={C.clip} style={{ width: `${fill * PERCENT}%` }}>
							<span className={cn(WIDGET_ICON.starFilled, C.glyph, C.filled)} />
						</span>
						{slots.map((stop, slot) => (
							<button
								key={stop}
								ref={(node) => {
									if (node) refs.current.set(stop, node);
									else refs.current.delete(stop);
								}}
								type={BUTTON_TYPE}
								role={ROLE.radio}
								aria-checked={stop === current}
								aria-label={getValueText(stop)}
								tabIndex={stop === tabStop && !disabled ? 0 : STEP_BACK}
								disabled={disabled}
								onClick={() => !readOnly && pick(stop)}
								onMouseEnter={() => !inert && setHover(stop)}
								onFocus={() => !inert && setHover(null)}
								className={cn(
									C.slot,
									slots.length > 1 ? (slot === 0 ? C.halfLeft : C.halfRight) : C.whole,
									inert ? C.inert : C.active,
									WIDGET_CLASSES.focusRing,
								)}
							/>
						))}
					</span>
				);
			})}
		</div>
	);
}
