/**
 * 主题模式状态: system / light / dark 三态, 持久化到 localStorage, 解析 system 后写 data-mode.
 */
import * as React from "react";
import { HX_ATTR, HX_LIGHT_QUERY, HX_MODE } from "../../constants/provider";
import { SITE_STORAGE } from "../../constants/site";
import { useMediaQuery } from "../../hooks/browser/media/useMediaQuery";
import { useLocalStorage } from "../../hooks/browser/useLocalStorage";
import type { HxMode } from "../../provider/context";

export type ThemeMode = HxMode;
export type ResolvedThemeMode = typeof HX_MODE.light | typeof HX_MODE.dark;

/** 三态的循环顺序, 与文档站 ThemeToggle 一致. */
export const THEME_MODES: readonly ThemeMode[] = [HX_MODE.system, HX_MODE.light, HX_MODE.dark];

export function isThemeMode(value: unknown): value is ThemeMode {
	return THEME_MODES.includes(value as ThemeMode);
}

export interface UseThemeModeOptions {
	value?: ThemeMode;
	defaultValue?: ThemeMode;
	onValueChange?: (mode: ThemeMode) => void;
	/** 存储键, 默认 SITE_STORAGE.theme; false 不持久化. 存原始字符串, 可直接交给 getThemeScript. */
	storageKey?: string | false;
	/** 是否把解析后的明暗写到 documentElement 的 data-mode, 默认 true. 与 HxProvider mode 联用时设 false. */
	apply?: boolean;
}

export interface UseThemeModeReturn {
	mode: ThemeMode;
	resolvedMode: ResolvedThemeMode;
	setMode: (mode: ThemeMode) => void;
}

const asRaw = (value: string): string => value;

/**
 * 受控时只读 value, 用户操作照常写存储 (持久化是选择的副作用, 不是内部状态) 并回调 onValueChange.
 */
export function useThemeMode(options: UseThemeModeOptions = {}): UseThemeModeReturn {
	const { value, defaultValue, onValueChange, storageKey, apply } = options;
	const fallback = defaultValue ?? HX_MODE.system;
	const persisted = storageKey !== false;
	const key = persisted && storageKey ? storageKey : SITE_STORAGE.theme;
	const [stored, setStored] = useLocalStorage<ThemeMode>(key, fallback, {
		serializer: asRaw,
		deserializer: (raw) => (isThemeMode(raw) ? raw : fallback),
	});
	const [memory, setMemory] = React.useState<ThemeMode>(fallback);
	const mode = value ?? (persisted ? stored : memory);
	const prefersLight = useMediaQuery(HX_LIGHT_QUERY, false, { getInitialValueInEffect: false });
	const resolvedMode: ResolvedThemeMode = mode === HX_MODE.system ? (prefersLight ? HX_MODE.light : HX_MODE.dark) : mode;

	const setMode = React.useCallback(
		(next: ThemeMode) => {
			if (Object.is(next, mode)) return;
			if (persisted) setStored(next);
			else setMemory(next);
			onValueChange?.(next);
		},
		[mode, persisted, setStored, onValueChange],
	);

	React.useEffect(() => {
		if (apply === false) return;
		document.documentElement.setAttribute(HX_ATTR.mode, resolvedMode);
	}, [apply, resolvedMode]);

	return { mode, resolvedMode, setMode };
}
