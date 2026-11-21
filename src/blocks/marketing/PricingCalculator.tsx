"use client";

import * as React from "react";
import { NumberRoll } from "../../craft/NumberRoll";
import { PRICING_BILLING } from "../../constants/blocks-marketing-pricing";
import { CALC_CLASS as C, CALC_TEXT } from "../../constants/sections-saas";

export type CalcBilling = (typeof PRICING_BILLING)[keyof typeof PRICING_BILLING];

/** 一个按席位计价的档位. 金额都是按月付时每月的数. */
export interface CalcPlan {
  key: string;
  name: string;
  /** 每席每月. */
  perSeat: number;
  /** 每月固定费, 与人数无关. */
  base?: number;
  /** 不足按此人数收. */
  minSeats?: number;
  /** 超过即不适用. */
  maxSeats?: number;
  /** 按年付的折扣比例, 0.2 即八折. */
  yearDiscount?: number;
}

export interface CalcQuote {
  /** 人数在档位上限内. */
  fits: boolean;
  /** 折算到每月的总价 (整数). */
  monthly: number;
  /** 折算到每人每月 (保留一位小数). */
  perSeat: number;
  /** 按年付比按月付一年省下的钱 (整数); 按月付时为 0. */
  yearSaving: number;
}

/** 算一个档位在给定人数与计费周期下的价格. 纯函数, 计算器与模板共用. */
export function quote(plan: CalcPlan, seats: number, billing: CalcBilling): CalcQuote {
  const billed = Math.max(seats, plan.minSeats ?? 1);
  const list = (plan.base ?? 0) + plan.perSeat * billed;
  const discount = billing === PRICING_BILLING.year ? (plan.yearDiscount ?? 0) : 0;
  const monthly = Math.round(list * (1 - discount));
  return {
    fits: plan.maxSeats === undefined || seats <= plan.maxSeats,
    monthly,
    perSeat: Math.round((monthly / Math.max(seats, 1)) * 10) / 10,
    yearSaving: Math.round(list * discount * 12),
  };
}

/** 适用档位里每月最便宜的那个; 都不适用时 undefined. */
export function bestPlan(plans: readonly CalcPlan[], seats: number, billing: CalcBilling): CalcPlan | undefined {
  let best: { plan: CalcPlan; monthly: number } | undefined;
  for (const plan of plans) {
    const q = quote(plan, seats, billing);
    if (q.fits && (!best || q.monthly < best.monthly)) best = { plan, monthly: q.monthly };
  }
  return best?.plan;
}

export interface PricingCalculatorProps {
  plans: CalcPlan[];
  /** ISO 4217. */
  currency: string;
  seats?: { min: number; max: number; step?: number; default: number };
  defaultBilling?: CalcBilling;
  locale?: string;
  texts?: Partial<typeof CALC_TEXT>;
  onChange?: (state: { seats: number; billing: CalcBilling; best?: string }) => void;
  id?: string;
}

const DEFAULT_SEATS = { min: 1, max: 200, step: 1, default: 12 } as const;

/** 货币符号: 只取 Intl 给的 currency 片段, 数字交给 NumberRoll 按位滚. */
function symbolOf(currency: string, locale?: string): string {
  const parts = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? currency;
}

/**
 * 定价计算器: 拖人数, 切按月 / 按年, 每个档位的月价按位滚动到新值, 最划算的档位描边, 超上限的档位变淡.
 * 读屏只听到一句汇总 (人数 + 最划算的档位与价格), 不会每一位数字都播报; 减弱动效时数字直接落定.
 */
export function PricingCalculator({ plans, currency, seats: range = DEFAULT_SEATS, defaultBilling = PRICING_BILLING.month, locale, texts, onChange, id }: PricingCalculatorProps): React.JSX.Element {
  const t = { ...CALC_TEXT, ...texts };
  const uid = React.useId();
  const [seats, setSeats] = React.useState(range.default);
  const [billing, setBilling] = React.useState<CalcBilling>(defaultBilling);
  const best = bestPlan(plans, seats, billing);
  const symbol = symbolOf(currency, locale);

  React.useEffect(() => {
    onChange?.({ seats, billing, best: best?.key });
  }, [seats, billing, best?.key, onChange]);

  const bestQuote = best ? quote(best, seats, billing) : undefined;
  const summary = best && bestQuote ? `${seats} ${t.summary} ${best.name}, ${symbol}${bestQuote.monthly} ${t.perMonth}` : `${seats} ${t.seatsUnit}`;

  return (
    <div id={id} className={C.root} data-slot="pricing-calculator">
      <div className={C.controls}>
        <label className={C.field} htmlFor={`${uid}-seats`}>
          <span className={C.label}>{t.seats}</span>
          <span className={C.seats} aria-hidden="true">
            {seats} {t.seatsUnit}
          </span>
          <input
            id={`${uid}-seats`}
            type="range"
            className={C.range}
            min={range.min}
            max={range.max}
            step={range.step ?? 1}
            value={seats}
            aria-valuetext={`${seats} ${t.seatsUnit}`}
            onChange={(e) => setSeats(Number(e.currentTarget.value))}
          />
        </label>
        <fieldset className={C.billing}>
          <legend className={C.live}>{t.billing}</legend>
          {[PRICING_BILLING.month, PRICING_BILLING.year].map((b) => (
            <label key={b} className={C.billingOption}>
              <input type="radio" className={C.radio} name={`${uid}-billing`} value={b} checked={billing === b} onChange={() => setBilling(b)} />
              {b === PRICING_BILLING.year ? t.year : t.month}
            </label>
          ))}
        </fieldset>
      </div>
      <ul className={C.plans}>
        {plans.map((plan) => {
          const q = quote(plan, seats, billing);
          const isBest = plan.key === best?.key;
          return (
            <li key={plan.key} className={C.plan} data-slot="calc-plan" data-plan={plan.key} data-fit={q.fits} data-best={isBest}>
              <span className={C.planName}>
                {plan.name}
                {isBest ? ` · ${t.best}` : null}
              </span>
              <span className={C.amount} aria-hidden="true">
                {symbol}
                <NumberRoll value={q.monthly} />
                <span className={C.unit}>{t.perMonth}</span>
              </span>
              <span className={C.live} data-slot="calc-amount">{`${symbol}${q.monthly} ${t.perMonth}`}</span>
              <span className={C.note}>
                {q.fits ? `${t.perSeat} ${symbol}${q.perSeat}` : t.overLimit}
                {q.fits && q.yearSaving > 0 ? ` · ${t.yearSaves} ${symbol}${q.yearSaving}` : null}
              </span>
            </li>
          );
        })}
      </ul>
      <p className={C.live} aria-live="polite" data-slot="calc-summary">
        {summary}
      </p>
    </div>
  );
}
