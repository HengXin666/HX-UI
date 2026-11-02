"use client";

import * as React from "react";
import { MonitorIcon, MoonIcon, SunIcon, type LucideIcon } from "lucide-react";
import { BUTTON_TYPE } from "../../constants";
import { HX_MODE } from "../../constants/provider";
import { SITE_CLASSES, SITE_KEY, SITE_THEME_VARIANT, type THEME_SWITCHER_SLOTS } from "../../constants/site";
import { cn } from "../../primitives/utils";
import { resolveSlots, type SlotProps } from "../slots";
import { THEME_MODES, useThemeMode, type ThemeMode, type UseThemeModeOptions } from "./use-theme-mode";

export type ThemeSwitcherSlot = (typeof THEME_SWITCHER_SLOTS)[number];

/** 全部文案由调用方提供: label 是整组的可访问名称, 其余是三档的名称. */
export interface ThemeSwitcherLabels {
	label: string;
	system: string;
	light: string;
	dark: string;
}

export interface ThemeSwitcherProps
	extends UseThemeModeOptions,
		SlotProps<ThemeSwitcherSlot, { mode: ThemeMode }>,
		Omit<React.ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
	labels: ThemeSwitcherLabels;
	/** segmented: 三段单选组 (role=radiogroup); cycle: 单按钮循环三态. */
	variant?: (typeof SITE_THEME_VARIANT)[keyof typeof SITE_THEME_VARIANT];
}

const ICONS: Record<ThemeMode, LucideIcon> = {
	[HX_MODE.system]: MonitorIcon,
	[HX_MODE.light]: SunIcon,
	[HX_MODE.dark]: MoonIcon,
};

const NEXT_KEYS: readonly string[] = [SITE_KEY.arrowRight, SITE_KEY.arrowDown];
const PREV_KEYS: readonly string[] = [SITE_KEY.arrowLeft, SITE_KEY.arrowUp];

/**
 * 主题切换器: system / light / dark 三态, 默认持久化到 localStorage 并写 data-mode.
 *
 * 不用 forwardRef: React 19 中 ref 是普通 prop (契约 6.1), ref 指向根 div.
 * segmented 形态按 APG Radio Group: 只有选中项在 Tab 序列里, 方向键移动并选中, Home / End 到首末.
 *
 * .agents/notes/implemented/feature/2026-11-02-site-shell-parts.md
 */
export function ThemeSwitcher({
	labels,
	variant = SITE_THEME_VARIANT.segmented,
	value,
	defaultValue,
	onValueChange,
	storageKey,
	apply,
	classNames,
	styles,
	className,
	style,
	...props
}: ThemeSwitcherProps): React.JSX.Element {
	const { mode, setMode } = useThemeMode({ value, defaultValue, onValueChange, storageKey, apply });
	const slots = resolveSlots({ classNames, styles }, { mode });
	const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
	const descId = React.useId();
	const index = THEME_MODES.indexOf(mode);

	const moveTo = (next: number): void => {
		const target = (next + THEME_MODES.length) % THEME_MODES.length;
		setMode(THEME_MODES[target]);
		itemRefs.current[target]?.focus();
	};

	const onKeyDown = (event: React.KeyboardEvent): void => {
		if (NEXT_KEYS.includes(event.key)) moveTo(index + 1);
		else if (PREV_KEYS.includes(event.key)) moveTo(index - 1);
		else if (event.key === SITE_KEY.home) moveTo(0);
		else if (event.key === SITE_KEY.end) moveTo(THEME_MODES.length - 1);
		else return;
		event.preventDefault();
	};

	if (variant === SITE_THEME_VARIANT.cycle) {
		const Icon = ICONS[mode];
		return (
			<div
				data-slot="theme-switcher"
				data-variant={variant}
				className={slots.className("root", "inline-flex", className)}
				style={slots.style("root", style)}
				{...props}
			>
				<button
					type={BUTTON_TYPE}
					data-slot="theme-switcher-item"
					aria-label={labels.label}
					aria-describedby={descId}
					onClick={() => setMode(THEME_MODES[(index + 1) % THEME_MODES.length])}
					className={slots.className("item", cn(SITE_CLASSES.iconButton, SITE_CLASSES.focus))}
					style={slots.style("item")}
				>
					<Icon aria-hidden data-slot="theme-switcher-item-icon" className={slots.className("item-icon", SITE_CLASSES.icon)} />
					<span id={descId} className="sr-only">{labels[mode]}</span>
				</button>
			</div>
		);
	}

	return (
		<div
			role="radiogroup"
			aria-label={labels.label}
			data-slot="theme-switcher"
			data-variant={variant}
			onKeyDown={onKeyDown}
			className={slots.className("root", "inline-flex items-center gap-0.5 rounded-(--radius-full) border border-border bg-muted p-0.5", className)}
			style={slots.style("root", style)}
			{...props}
		>
			{THEME_MODES.map((item, i) => {
				const Icon = ICONS[item];
				const checked = item === mode;
				return (
					<button
						key={item}
						ref={(node) => {
							itemRefs.current[i] = node;
						}}
						type={BUTTON_TYPE}
						role="radio"
						aria-checked={checked}
						aria-label={labels[item]}
						tabIndex={checked ? 0 : -1}
						data-slot="theme-switcher-item"
						data-state={checked ? "checked" : "unchecked"}
						onClick={() => setMode(item)}
						className={slots.className(
							"item",
							cn(
								"inline-flex size-(--control-h-sm) items-center justify-center rounded-(--radius-full) text-muted-foreground",
								"transition-colors duration-(--duration-fast) hover:text-foreground",
								"data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-xs",
								SITE_CLASSES.focus,
							),
						)}
						style={slots.style("item")}
					>
						<Icon aria-hidden data-slot="theme-switcher-item-icon" className={slots.className("item-icon", SITE_CLASSES.icon)} />
					</button>
				);
			})}
		</div>
	);
}
