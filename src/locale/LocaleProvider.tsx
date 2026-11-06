"use client";

import * as React from "react";
import { LANGUAGE_SEPARATOR } from "../constants/locale";
import { DirectionProvider } from "../primitives/direction";
import { directionOf, mergeMessages, resolveText } from "./core";
import type { LocaleDomain, LocaleMessages, LocalePack, PartialMessages, TextDirection, WeekStart } from "./core";
import { enUS } from "./en-US";
import { zhCN } from "./zh-CN";

/** 内置语言包, 按完整标识索引. */
const PACKS: readonly LocalePack[] = [zhCN, enUS];

/** 无 Provider 时的内置默认: 与组件历史上写死的中文文案一致. */
const BUILTIN = zhCN;

const LocaleContext = React.createContext<LocalePack | null>(null);

/** 先按完整标识, 再按语言子标签找内置包, 都没有时回到内置默认的文案. */
function packFor(locale: string): LocalePack {
	const language = locale.split(LANGUAGE_SEPARATOR)[0].toLowerCase();
	return (
		PACKS.find((pack) => pack.locale === locale) ??
		PACKS.find((pack) => pack.locale.split(LANGUAGE_SEPARATOR)[0] === language) ??
		BUILTIN
	);
}

interface LocaleProviderProps {
	/** BCP 47 标识, 例如 zh-CN, en-US, ar-EG. 默认 zh-CN. */
	locale?: string;
	/** 不传时按语言推断 (ar / he / fa 等为 rtl). */
	dir?: TextDirection;
	/** 不传时取语言包的设定 (zh-CN 周一, en-US 周日). */
	weekStartsOn?: WeekStart;
	/** 部分覆盖语言包文案, 未覆盖的键沿用语言包. */
	messages?: PartialMessages;
	children?: React.ReactNode;
}

/**
 * 国际化提供者: 向下提供 locale, dir, 周起始日与整套文案, 并同时挂 DirectionProvider,
 * 让 radix 组件的方向键语义与 CSS 逻辑属性跟着翻转.
 */
function LocaleProvider({ locale, dir, weekStartsOn, messages, children }: LocaleProviderProps): React.JSX.Element {
	const id = locale ?? BUILTIN.locale;
	const value = React.useMemo<LocalePack>(() => {
		const base = packFor(id);
		return {
			locale: id,
			dir: dir ?? directionOf(id),
			weekStartsOn: weekStartsOn ?? base.weekStartsOn,
			messages: mergeMessages(base.messages, messages),
		};
	}, [id, dir, weekStartsOn, messages]);
	return (
		<LocaleContext.Provider value={value}>
			<DirectionProvider dir={value.dir}>{children}</DirectionProvider>
		</LocaleContext.Provider>
	);
}

interface LocaleState extends LocalePack {
	/** 是否处在 LocaleProvider 之内. 组件可据此保持无 Provider 时的旧行为. */
	provided: boolean;
}

/** 读当前语言环境; 没有 Provider 时返回内置默认 (zh-CN, ltr, 周一). */
function useLocale(): LocaleState {
	const context = React.useContext(LocaleContext);
	return { ...(context ?? BUILTIN), provided: context !== null };
}

/**
 * 组件接入用的浅层 API. 回退顺序: labels prop > LocaleProvider > 内置默认.
 * fallback 是组件自己的内置默认, 不传时取内置 zh-CN 包的同名域.
 *
 * 接入示例 (分页):
 * const text = useLocaleText("pagination", labels, DEFAULT_LABELS);
 */
function useLocaleText<K extends LocaleDomain>(
	domain: K,
	labels?: Partial<LocaleMessages[K]>,
	fallback?: LocaleMessages[K],
): LocaleMessages[K] {
	const context = React.useContext(LocaleContext);
	return resolveText(domain, labels, context?.messages, fallback ?? BUILTIN.messages[domain]);
}

export { LocaleProvider, useLocale, useLocaleText };
export type { LocaleProviderProps, LocaleState };
