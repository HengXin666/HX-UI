"use client";

import { Check, Minus } from "lucide-react";
import * as React from "react";
import { COMMERCE_SIZE, PRICE_PERIOD, type PricePeriod } from "../../constants/commerce";
import { MONEY_PERIOD } from "../../constants/blocks";
import {
  PRICING_BILLING,
  PRICING_CLASS as C,
  PRICING_GRID_CLASS,
  PRICING_NUMBERS,
  PRICING_PLAN_KIND,
  V105_CLASS as K,
  V105_INTL,
  V105_SLOT,
  pickV105Text,
  type V105Text,
} from "../../constants/blocks-marketing-v105";
import { Price } from "../../commerce/Price";
import { discountRate } from "../../commerce/shared/money";
import { IconSlot } from "../../layout/Icon";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { CtaButton, renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, Cta, Money, Rich, SectionHeadingData } from "../_shared/types";

type Billing = (typeof PRICING_BILLING)[keyof typeof PRICING_BILLING];

/** 要点: 纯文案即"包含"; included 为 false 显示"不包含", 为字符串显示取值 (例如 "10 GB"). */
export type PricingFeature = string | { label: Rich; included?: boolean | string };

export interface PricingPlan {
  key?: string;
  name: Rich;
  description?: Rich;
  /** 单一价格, 或不显示金额时的文案 ({ label: "按用量" }). */
  price?: Money | { label: Rich };
  /** 月付 / 年付两套价格, 开启 billing 切换时使用. 年价请给全年总额并标 period: "year". */
  prices?: Partial<Record<Billing, Money>>;
  /** free: 无价格时显示"免费"; contact: 显示"联系销售", 不显示金额. */
  kind?: (typeof PRICING_PLAN_KIND)[keyof typeof PRICING_PLAN_KIND];
  /** 价格下方的补充说明行 (按席位, 含税...). */
  priceNote?: Rich;
  featuresTitle?: Rich;
  features: PricingFeature[];
  cta: Cta;
  highlight?: boolean;
  badge?: Rich;
}

export interface PricingBilling {
  options: Billing[];
  default?: Billing;
  /** 年付折扣徽记文案; 不给时按各档 月价*12 与年价自动算最大折扣. */
  saveLabel?: Rich;
  /** 年付按月折算显示 (默认 true), 并在说明行写出全年总额. */
  yearlyAsMonthly?: boolean;
  /** 年付时在价格旁显示划线月价与折扣率 (默认 true). */
  showDiscount?: boolean;
  onChange?: (billing: Billing) => void;
}

export interface PricingProps extends BlockBaseProps {
  heading?: SectionHeadingData;
  plans: PricingPlan[];
  billing?: PricingBilling;
  /** 整块下方的"所有档位都包含"说明区. */
  includes?: { title?: Rich; items: Rich[] };
  /** 覆盖区块自有文案 (月付/年付/免费/联系销售...). */
  messages?: Partial<V105Text>;
  ref?: React.Ref<HTMLElement>;
}

const PERIOD_MAP: Partial<Record<string, PricePeriod>> = { [MONEY_PERIOD.month]: PRICE_PERIOD.month, [MONEY_PERIOD.year]: PRICE_PERIOD.year };

function isMoney(value: PricingPlan["price"]): value is Money {
  return typeof value === "object" && value !== null && "amount" in value;
}

function planMoney(plan: PricingPlan, billing: Billing | undefined): Money | undefined {
  if (billing && plan.prices?.[billing]) return plan.prices[billing];
  return isMoney(plan.price) ? plan.price : undefined;
}

/** 年价相对 月价*12 的折扣率 (0 到 1), 不可比时 null. */
function yearlyRate(plan: PricingPlan): number | null {
  const month = plan.prices?.month;
  const year = plan.prices?.year;
  if (!month || !year || month.currency !== year.currency) return null;
  return discountRate(month.amount * PRICING_NUMBERS.monthsPerYear, year.amount);
}

function FeatureLine({ feature, text }: { feature: PricingFeature; text: V105Text }): React.JSX.Element {
  const item = typeof feature === "string" ? { label: feature, included: true as boolean | string } : feature;
  const off = item.included === false;
  return (
    <li className={K.row}>
      <IconSlot source={off ? Minus : Check} className={off ? K.cross : K.check} />
      <span className={cn(off && K.muted)}>
        <span className={K.srOnly}>{`${off ? text.notIncluded : text.included}: `}</span>
        {item.label}
        {typeof item.included === "string" && <span className={K.muted}>{` ${item.included}`}</span>}
      </span>
    </li>
  );
}

interface PlanCardProps {
  plan: PricingPlan;
  billing?: Billing;
  config?: PricingBilling;
  text: V105Text;
}

function PlanPrice({ plan, billing, config, text }: PlanCardProps): React.JSX.Element {
  const { locale, formatMoney } = useBlocks();
  const money = planMoney(plan, billing);
  if (plan.kind === PRICING_PLAN_KIND.contact || (!money && plan.price && !isMoney(plan.price))) {
    const label = plan.price && !isMoney(plan.price) ? plan.price.label : text.contactSales;
    return <span className={C.priceLabel}>{label}</span>;
  }
  if (!money || (plan.kind === PRICING_PLAN_KIND.free && money.amount === 0)) return <span className={C.priceLabel}>{text.free}</span>;
  const asMonthly = billing === PRICING_BILLING.year && money.period === MONEY_PERIOD.year && config?.yearlyAsMonthly !== false;
  const amount = asMonthly ? money.amount / PRICING_NUMBERS.monthsPerYear : money.amount;
  const original = asMonthly && config?.showDiscount !== false ? plan.prices?.month?.amount : (money.originalAmount ?? money.compareAt);
  return (
    <>
      <Price
        amount={amount}
        originalAmount={original}
        currency={money.currency}
        locale={locale}
        period={asMonthly ? PRICE_PERIOD.month : PERIOD_MAP[money.period ?? ""]}
        size={COMMERCE_SIZE.xl}
      />
      {asMonthly && <span className={K.muted}>{`${text.billedYearly} ${formatMoney(money)}`}</span>}
      {money.note !== undefined && <span className={K.muted}>{money.note}</span>}
    </>
  );
}

function PlanCard(props: PlanCardProps): React.JSX.Element {
  const { plan, text } = props;
  return (
    <article data-slot={V105_SLOT.pricingPlan} data-highlight={plan.highlight || undefined} data-kind={plan.kind ?? PRICING_PLAN_KIND.standard} className={cn(C.plan, plan.highlight && C.planHighlight)}>
      <div className={C.header}>
        <div className={C.nameRow}>
          <h3 className={C.name}>{plan.name}</h3>
          {plan.badge !== undefined && <span data-slot={V105_SLOT.pricingBadge} className={C.badge}>{plan.badge}</span>}
        </div>
        {plan.description !== undefined && <p className={K.muted}>{plan.description}</p>}
      </div>
      <div data-slot={V105_SLOT.pricingPrice} className={C.priceBox} aria-live="polite">
        <PlanPrice {...props} />
        {plan.priceNote !== undefined && <span data-slot={V105_SLOT.pricingNote} className={K.muted}>{plan.priceNote}</span>}
      </div>
      <CtaButton cta={{ variant: plan.highlight ? "primary" : "secondary", ...plan.cta }} className={C.cta} />
      <div data-slot={V105_SLOT.pricingFeatures} className={C.features}>
        {plan.featuresTitle !== undefined && <p className={K.groupTitle}>{plan.featuresTitle}</p>}
        <ul className={K.stack}>
          {plan.features.map((feature, i) => (
            <FeatureLine key={typeof feature === "string" ? feature : i} feature={feature} text={text} />
          ))}
        </ul>
      </div>
    </article>
  );
}

function BillingToggle({ config, value, onChange, rate, text }: { config: PricingBilling; value: Billing; onChange: (b: Billing) => void; rate: number | null; text: V105Text }): React.JSX.Element {
  const { formatNumber } = useBlocks();
  const save = config.saveLabel ?? (rate !== null && rate > 0 ? `${text.save} ${formatNumber(rate, { style: V105_INTL.percent })}` : undefined);
  return (
    <div data-slot={V105_SLOT.pricingToggle} className={K.toggleWrap}>
      <div role="radiogroup" aria-label={text.billingLabel} className={K.toggle}>
        {config.options.map((option) => (
          <button key={option} type="button" role="radio" aria-checked={value === option} className={K.toggleItem} onClick={() => onChange(option)}>
            {option === PRICING_BILLING.year ? text.yearly : text.monthly}
          </button>
        ))}
      </div>
      {save !== undefined && <span className={K.save}>{save}</span>}
    </div>
  );
}

/**
 * 定价表: 2 到 4 档卡片, 月付/年付切换 (价格, 周期与年付折扣联动), 推荐档高亮并在移动端置顶,
 * 免费档与联系销售档, 价格下方说明行, 整块下方"所有档位都包含"区. 金额全部经 commerce Price 与 Intl.
 * 无 JS 时以 billing.default 渲染, 切换按钮为 radiogroup.
 */
export function Pricing({ heading, plans, billing, includes, messages, labels: _labels, ref, ...shell }: PricingProps): React.JSX.Element {
  const { locale } = useBlocks();
  const text = React.useMemo(() => pickV105Text(locale, messages), [locale, messages]);
  const [current, setCurrent] = React.useState<Billing | undefined>(billing?.default ?? billing?.options[0]);
  const shown = plans.slice(0, PRICING_NUMBERS.maxPlans);
  const cols = Math.max(PRICING_NUMBERS.minPlans, shown.length) as keyof typeof PRICING_GRID_CLASS;
  const maxRate = shown.reduce<number | null>((best, plan) => {
    const rate = yearlyRate(plan);
    return rate !== null && (best === null || rate > best) ? rate : best;
  }, null);
  const change = (next: Billing): void => {
    setCurrent(next);
    billing?.onChange?.(next);
  };
  return (
    <BlockShell ref={ref} heading={heading} renderHeading={renderSectionHeading} {...shell}>
      <div data-slot={V105_SLOT.pricing} data-billing={current}>
        {billing && billing.options.length > 1 && current && (
          <BillingToggle config={billing} value={current} onChange={change} rate={maxRate} text={text} />
        )}
        <div className={PRICING_GRID_CLASS[cols]}>
          {shown.map((plan, i) => (
            <PlanCard key={plan.key ?? i} plan={plan} billing={current} config={billing} text={text} />
          ))}
        </div>
        {includes && includes.items.length > 0 && (
          <div data-slot={V105_SLOT.pricingIncludes} className={C.includes}>
            <p className={K.groupTitle}>{includes.title ?? text.allPlansInclude}</p>
            <ul className={C.includesGrid}>
              {includes.items.map((item, i) => (
                <FeatureLine key={typeof item === "string" ? item : i} feature={{ label: item }} text={text} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </BlockShell>
  );
}
