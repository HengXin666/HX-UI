"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import {
  STOCK_STATE,
  STOCK_TONE_CLASS,
  TRADE_CLASS as C,
  TRADE_ICON,
  TRADE_LANG_SEPARATOR,
  TRADE_NUMBERS,
  TRADE_PLACEHOLDER,
  TRADE_TEXT_FALLBACK,
  TRADE_TEXT_PACKS,
  type StockState,
  type TradeTexts,
} from "../../constants/blocks-commerce-v108";
import { cn } from "../../primitives/utils";
import { useBlocks } from "../_shared/BlocksProvider";

/**
 * V1-08 四个交易区块共用的小件: 文案 hook, 占位替换, 数量步进器, 库存行.
 * 只在 src/blocks/commerce/ 内部使用 (同类别共享, 不跨类别).
 */

/** 区块内置文案: texts prop > 按 BlocksProvider locale 取的内置包. */
export function useTradeTexts(texts?: Partial<TradeTexts>): TradeTexts {
  const { locale } = useBlocks();
  return React.useMemo(() => {
    const lang = locale.split(TRADE_LANG_SEPARATOR)[0].toLowerCase() as keyof typeof TRADE_TEXT_PACKS;
    const pack = TRADE_TEXT_PACKS[lang] ?? TRADE_TEXT_PACKS[TRADE_TEXT_FALLBACK];
    return { ...pack, ...texts };
  }, [locale, texts]);
}

/** 把 {n} / {q} 换成已格式化的值. */
export function fillText(template: string, values: { n?: string; q?: string }): string {
  let out = template;
  if (values.n !== undefined) out = out.replace(TRADE_PLACEHOLDER.n, values.n);
  if (values.q !== undefined) out = out.replace(TRADE_PLACEHOLDER.q, values.q);
  return out;
}

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  /** 读屏名的补充 (商品名), 例: "数量, Air Runner 2". */
  describedBy?: string;
  texts: TradeTexts;
  "data-slot"?: string;
}

/** 数量步进器: 减 / 数字输入 / 加. 越界自动夹取; 输入非数字时回退到当前值. */
export function QuantityStepper({ value, onChange, min = TRADE_NUMBERS.qtyMin, max = TRADE_NUMBERS.qtyMax, disabled, describedBy, texts, "data-slot": slot }: QuantityStepperProps): React.JSX.Element {
  const clamp = (n: number): number => Math.min(Math.max(n, min), max);
  const set = (n: number): void => {
    const next = clamp(n);
    if (next !== value) onChange(next);
  };
  return (
    <div data-slot={slot} role="group" aria-label={texts.quantity} aria-describedby={describedBy} className={C.qty}>
      <button type={BUTTON_TYPE} aria-label={texts.decrease} disabled={disabled || value <= min} onClick={() => set(value - TRADE_NUMBERS.qtyStep)} className={cn(C.iconButton, C.colors, C.focus)}>
        <span aria-hidden className={cn(TRADE_ICON.minus, C.icon)} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={texts.quantity}
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const n = Number.parseInt(e.currentTarget.value, 10);
          if (Number.isFinite(n)) set(n);
        }}
        className={cn(C.qtyValue, C.focus)}
      />
      <button type={BUTTON_TYPE} aria-label={texts.increase} disabled={disabled || value >= max} onClick={() => set(value + TRADE_NUMBERS.qtyStep)} className={cn(C.iconButton, C.colors, C.focus)}>
        <span aria-hidden className={cn(TRADE_ICON.plus, C.icon)} />
      </button>
    </div>
  );
}

/** 库存数据: state 显式给出, 或只给 quantity 由阈值推断. label 覆盖内置文案. */
export interface StockData {
  state?: StockState;
  quantity?: number;
  label?: string;
}

/** 由 StockData 推断状态 (0 缺货, 不超过阈值为低库存). */
export function stockStateOf(stock: StockData, threshold: number = TRADE_NUMBERS.lowStock): StockState {
  if (stock.state) return stock.state;
  if (stock.quantity === undefined) return STOCK_STATE.inStock;
  if (stock.quantity <= 0) return STOCK_STATE.out;
  return stock.quantity <= threshold ? STOCK_STATE.low : STOCK_STATE.inStock;
}

/** 库存行: 色点 + 文案; 色点 aria-hidden, 颜色不是唯一信息来源. */
export function StockLine({ stock, texts, formatCount, "data-slot": slot }: { stock: StockData; texts: TradeTexts; formatCount: (n: number) => string; "data-slot"?: string }): React.JSX.Element {
  const state = stockStateOf(stock);
  const text =
    stock.label ??
    (state === STOCK_STATE.out
      ? texts.outOfStock
      : state === STOCK_STATE.preorder
        ? texts.preorder
        : state === STOCK_STATE.low && stock.quantity !== undefined
          ? fillText(texts.lowStock, { n: formatCount(stock.quantity) })
          : texts.inStock);
  return (
    <p data-slot={slot} data-state={state} className={cn(C.stock, STOCK_TONE_CLASS[state])}>
      <span aria-hidden className={C.stockDot} />
      {text}
    </p>
  );
}
