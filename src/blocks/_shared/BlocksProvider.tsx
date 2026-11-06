"use client";

import * as React from "react";
import { BLOCK_ATTR, BLOCK_DEFAULT, BLOCK_LABEL_FALLBACK, BLOCK_LABEL_PACKS, BLOCK_LANG_SEPARATOR, BLOCK_SLOT } from "../../constants/blocks";
import { useLocale } from "../../locale/LocaleProvider";
import { formatCurrency, formatDate, formatNumber } from "../../locale/format";
import type { BackdropRenderer, BackdropVariant, BlockDensity, BlockLabels, BlocksContextValue, Money } from "./types";

/** 运行环境的默认语言; 服务端没有 navigator 时返回 undefined. */
function runtimeLocale(): string | undefined {
  return globalThis.navigator?.language;
}

/** 按语言子标签取内置文案包, 未命中回到 zh. */
function packFor(locale: string): BlockLabels {
  const language = locale.split(BLOCK_LANG_SEPARATOR)[0].toLowerCase() as keyof typeof BLOCK_LABEL_PACKS;
  return BLOCK_LABEL_PACKS[language] ?? BLOCK_LABEL_PACKS[BLOCK_LABEL_FALLBACK];
}

/** 逐键叠加, 显式 undefined 不覆盖下层 (与 locale/core 的 layer 同口径). */
function layerLabels(...layers: Array<Partial<BlockLabels> | undefined>): BlockLabels {
  const out = {} as Record<string, string>;
  for (const item of layers.slice().reverse()) {
    for (const [key, value] of Object.entries(item ?? {})) {
      if (value !== undefined) out[key] = value;
    }
  }
  return out as BlockLabels;
}

/** 由 locale 构建三个格式化函数 (全部走 Intl). */
function formatters(locale: string): Pick<BlocksContextValue, "formatMoney" | "formatNumber" | "formatDate"> {
  return {
    formatMoney: (money: Money, options?: Intl.NumberFormatOptions) => formatCurrency(money.amount, money.currency, locale, options),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => formatNumber(value, locale, options),
    formatDate: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => formatDate(value, locale, options),
  };
}

const EMPTY_BACKDROPS: Partial<Record<BackdropVariant, BackdropRenderer>> = {};

/** 无 Provider 时的值: locale 取 LocaleProvider (若有) 否则 navigator.language, 文案取内置包. */
function fallbackValue(locale: string): BlocksContextValue {
  return { locale, labels: packFor(locale), density: BLOCK_DEFAULT.density, backdrops: EMPTY_BACKDROPS, ...formatters(locale) };
}

const BlocksContext = React.createContext<BlocksContextValue | null>(null);

export interface BlocksProviderProps {
  /** BCP 47. 回退顺序: 本 prop > 外层 BlocksProvider > LocaleProvider > navigator.language > zh-CN. */
  locale?: string;
  /** 部分覆盖区块内置 aria 文案. 嵌套时逐键叠加. */
  labels?: Partial<BlockLabels>;
  /** 区块密度: 缩放 --section-pad-* 与 --block-gap-* (令牌由 V0 skins 任务提供). */
  density?: BlockDensity;
  /** 注入背景组件 (mesh / grain / beam / image), 例如 { mesh: MeshGradientLayer }. */
  backdrops?: Partial<Record<BackdropVariant, BackdropRenderer>>;
  /** 渲染 display: contents 的包裹层并写 data-density; 默认 true. 关闭时只提供上下文. */
  scoped?: boolean;
  ref?: React.Ref<HTMLDivElement>;
  children?: React.ReactNode;
}

/**
 * 区块层上下文: locale, 内置 aria 文案, 密度, 注入的背景组件与 Intl 格式化函数.
 * 区块内部的默认文案与数字/货币/日期格式全部从这里取, 不在区块里写死.
 * ref 作为普通 prop (React 19, component-contract 6.1), 不使用 forwardRef.
 */
export function BlocksProvider({ locale, labels, density, backdrops, scoped = true, ref, children }: BlocksProviderProps): React.JSX.Element {
  const parent = React.useContext(BlocksContext);
  const ambient = useLocale();
  const id = locale ?? parent?.locale ?? (ambient.provided ? ambient.locale : runtimeLocale()) ?? ambient.locale;
  const resolvedDensity = density ?? parent?.density ?? BLOCK_DEFAULT.density;
  const value = React.useMemo<BlocksContextValue>(
    () => ({
      locale: id,
      labels: layerLabels(labels, locale === undefined ? parent?.labels : undefined, packFor(id)),
      density: resolvedDensity,
      backdrops: { ...parent?.backdrops, ...backdrops },
      ...formatters(id),
    }),
    [id, labels, locale, parent, resolvedDensity, backdrops],
  );
  const attrs = { [BLOCK_ATTR.density]: resolvedDensity };
  return (
    <BlocksContext.Provider value={value}>
      {scoped ? (
        <div ref={ref} data-slot={BLOCK_SLOT.provider} className="contents" {...attrs}>
          {children}
        </div>
      ) : (
        children
      )}
    </BlocksContext.Provider>
  );
}

/** 读区块上下文. 无 Provider 时返回由 LocaleProvider / navigator 推出的默认值, 区块可独立使用. */
export function useBlocks(): BlocksContextValue {
  const context = React.useContext(BlocksContext);
  const ambient = useLocale();
  const locale = ambient.provided ? ambient.locale : (runtimeLocale() ?? ambient.locale);
  return React.useMemo(() => context ?? fallbackValue(locale), [context, locale]);
}

/** 区块取 aria 文案: labels prop > BlocksProvider > 内置包. */
export function useBlockLabels(labels?: Partial<BlockLabels>): BlockLabels {
  const { labels: provided } = useBlocks();
  return React.useMemo(() => layerLabels(labels, provided), [labels, provided]);
}
