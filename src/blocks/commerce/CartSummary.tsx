"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import {
  CART_VARIANT,
  COMMERCE_TRADE_SLOT,
  PROMO_STATUS,
  TOTAL_KIND,
  TRADE_CLASS as C,
  TRADE_DEFAULT,
  TRADE_ICON,
  TRADE_NUMBERS,
  TRADE_SHEET_SIDE,
  tradeSlot,
  type CartVariant,
  type PromoStatus,
  type TotalKind,
  type TradeTexts,
} from "../../constants/blocks-commerce-v108";
import { COMMERCE_SIZE, Price } from "../../commerce";
import { useControllableState } from "../../hooks/state/useControllableState";
import { EmptyState } from "../../layout/EmptyState";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../../primitives/sheet";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { CtaButton } from "../_shared/SectionHeading";
import type { BlockBaseProps, Cta, Media, Money, Rich } from "../_shared/types";
import { BlockMedia } from "./browse/media";
import { QuantityStepper, useTradeTexts } from "./commerce-v108-parts";

const slot = (part?: string): string => tradeSlot(COMMERCE_TRADE_SLOT.cartSummary, part);
const OPTION_SEPARATOR = " · ";

export interface CartLineData {
  id?: string;
  media?: Media;
  title: Rich;
  href?: string;
  /** 已选规格 ("黑色", "42"), 以 " · " 连接显示. */
  options?: string[];
  qty: number;
  maxQty?: number;
  /** 单价; 行金额 = 单价 × 数量 (compareAt 同乘). */
  price: Money;
}

export interface CartTotalData {
  label: Rich;
  value: Money;
  /** discount 以优惠色显示, grand 加粗并加分隔线. 默认 normal. */
  kind?: TotalKind;
}

export interface CartPromoSpec {
  /** resolve 为 false 或字符串视为失败 (字符串作错误文案), 抛错同样视为失败. */
  onApply: (code: string) => void | boolean | string | Promise<void | boolean | string>;
  /** 已使用的码 (受控展示). */
  applied?: string;
}

/** 购物摘要的数据形态 (可 JSON 序列化, 回调除外). */
export interface CartSummaryData {
  title?: Rich;
  lines: CartLineData[];
  totals: CartTotalData[];
  checkout: Cta;
  /** checkout 下方的次要动作 (继续购物) 与说明 (运费在下一步计算). */
  secondary?: Cta[];
  note?: Rich;
  empty?: { text?: Rich; hint?: Rich; action?: Cta };
}

export interface CartSummaryProps extends BlockBaseProps, CartSummaryData {
  variant?: CartVariant;
  promo?: CartPromoSpec;
  /** 只读 (结账页摘要): 不渲染数量步进与移除. */
  readOnly?: boolean;
  onQtyChange?: (line: CartLineData, qty: number, index: number) => void;
  onRemove?: (line: CartLineData, index: number) => void;
  /** 不渲染 BlockShell 外壳 (嵌进 CheckoutSteps 或自定义容器时). */
  bare?: boolean;
  /** variant="drawer": 打开状态三件套与触发器. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  texts?: Partial<TradeTexts>;
  ref?: React.Ref<HTMLElement>;
}

function times(money: Money, qty: number): Money {
  const original = money.originalAmount ?? money.compareAt;
  return { ...money, amount: money.amount * qty, originalAmount: original === undefined ? undefined : original * qty, compareAt: undefined };
}

function PromoForm({ promo, texts }: { promo: CartPromoSpec; texts: TradeTexts }): React.JSX.Element {
  const [code, setCode] = React.useState("");
  const [status, setStatus] = React.useState<PromoStatus>(promo.applied ? PROMO_STATUS.applied : PROMO_STATUS.idle);
  const [message, setMessage] = React.useState<string | undefined>();
  const inputId = React.useId();
  const msgId = React.useId();
  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const value = code.trim();
    if (!value) return;
    setStatus(PROMO_STATUS.pending);
    try {
      const r = await promo.onApply(value);
      const failed = r === false || typeof r === "string";
      setStatus(failed ? PROMO_STATUS.error : PROMO_STATUS.applied);
      setMessage(typeof r === "string" ? r : undefined);
    } catch {
      setStatus(PROMO_STATUS.error);
      setMessage(undefined);
    }
  };
  const shown = status === PROMO_STATUS.error ? (message ?? texts.promoError) : status === PROMO_STATUS.applied ? `${texts.promoApplied}${promo.applied ? `: ${promo.applied}` : ""}` : undefined;
  return (
    <form data-slot={slot("promo")} data-state={status} onSubmit={submit} className={C.promo}>
      <label htmlFor={inputId} className={C.label}>{texts.promo}</label>
      <div className={C.promoRow}>
        <input id={inputId} value={code} onChange={(e) => setCode(e.currentTarget.value)} placeholder={texts.promoPlaceholder} aria-invalid={status === PROMO_STATUS.error || undefined}
          aria-describedby={shown ? msgId : undefined} className={cn(C.input, C.focus)} />
        <button type="submit" disabled={status === PROMO_STATUS.pending || !code.trim()} className={cn(C.promoButton, C.colors, C.focus)}>{texts.promoApply}</button>
      </div>
      <p id={msgId} role="status" className={status === PROMO_STATUS.error ? C.promoMsgError : C.promoMsgOk}>{shown}</p>
    </form>
  );
}

function CartLine({ line, index, readOnly, onQtyChange, onRemove, texts }: Pick<CartSummaryProps, "readOnly" | "onQtyChange" | "onRemove"> & { line: CartLineData; index: number; texts: TradeTexts }): React.JSX.Element {
  const { locale } = useBlocks();
  const titleId = React.useId();
  const total = times(line.price, line.qty);
  return (
    <li data-slot={slot("line")} className={C.line}>
      <div className={C.lineMedia}>{line.media && <BlockMedia media={line.media} ratio={TRADE_NUMBERS.lineRatio} fallbackRatio={TRADE_NUMBERS.lineRatio} sizes={TRADE_DEFAULT.lineSizes} />}</div>
      <div className={C.lineBody}>
        <div className={C.lineTop}>
          <p id={titleId} className={C.lineTitle}>
            {line.href ? <a href={line.href} className={cn(C.lineLink, C.focus)}>{line.title}</a> : line.title}
          </p>
          <Price amount={total.amount} originalAmount={total.originalAmount} currency={total.currency} locale={locale} size={COMMERCE_SIZE.sm} showDiscount={false} />
        </div>
        {line.options && line.options.length > 0 && <p className={C.lineOptions}>{line.options.join(OPTION_SEPARATOR)}</p>}
        <div className={C.lineBottom}>
          {readOnly ? (
            <span className={C.lineOptions}>{`${texts.quantity}: ${line.qty}`}</span>
          ) : (
            <QuantityStepper value={line.qty} max={line.maxQty} onChange={(q) => onQtyChange?.(line, q, index)} disabled={!onQtyChange} describedBy={titleId} texts={texts} />
          )}
          {!readOnly && onRemove && (
            <button type={BUTTON_TYPE} aria-label={texts.remove} aria-describedby={titleId} onClick={() => onRemove(line, index)} className={cn(C.iconButton, C.colors, C.focus)}>
              <span aria-hidden className={cn(TRADE_ICON.remove, C.icon)} />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function TotalsList({ totals }: { totals: CartTotalData[] }): React.JSX.Element {
  const { formatMoney } = useBlocks();
  return (
    <dl data-slot={slot("totals")} className={C.totals}>
      {totals.map((row, i) => {
        const kind = row.kind ?? TOTAL_KIND.normal;
        return (
          <div key={typeof row.label === "string" ? row.label : i} data-kind={kind} className={cn(C.totalRow, kind === TOTAL_KIND.grand && C.totalGrand)}>
            <dt className={C.totalLabel}>{row.label}</dt>
            <dd className={kind === TOTAL_KIND.discount ? C.totalDiscount : C.totalValue}>{formatMoney(row.value)}</dd>
          </div>
        );
      })}
    </dl>
  );
}

/**
 * 购物摘要 (设计稿 4.3, 审计 B15): 商品行 (图, 名, 规格, 数量步进, 移除, 行金额) + 优惠码 + 合计行 (Intl) + 结账动作.
 * variant="page" 渲染为卡片; variant="drawer" 渲染为右侧 Sheet (trigger 打开). 空购物袋渲染 EmptyState.
 * readOnly 用于结账页的订单摘要.
 */
export function CartSummary(props: CartSummaryProps): React.JSX.Element {
  const {
    title, lines, totals, checkout, secondary, note, empty, variant = CART_VARIANT.page, promo, readOnly = false, onQtyChange, onRemove,
    bare = false, open, defaultOpen = false, onOpenChange, trigger, texts, ref, labels: _labels, ...shell
  } = props;
  const t = useTradeTexts(texts);
  const titleId = React.useId();
  const [isOpen, setOpen] = useControllableState<boolean>({ value: open, defaultValue: defaultOpen, onChange: onOpenChange });
  const heading = title ?? (readOnly ? t.orderSummary : t.cart);
  const isEmpty = lines.length === 0;

  const list = isEmpty ? (
    <EmptyState compact text={empty?.text ?? t.cartEmpty} hint={empty?.hint} action={empty?.action ? <CtaButton cta={empty.action} /> : undefined} />
  ) : (
    <ul data-slot={slot("lines")} aria-label={typeof heading === "string" ? heading : t.cart} className={C.lines}>
      {lines.map((line, i) => (
        <CartLine key={line.id ?? i} line={line} index={i} readOnly={readOnly} onQtyChange={onQtyChange} onRemove={onRemove} texts={t} />
      ))}
    </ul>
  );
  const footer = !isEmpty && (
    <>
      {promo && !readOnly && <PromoForm promo={promo} texts={t} />}
      <TotalsList totals={totals} />
      <div data-slot={slot("checkout")} className={C.checkout}>
        {!readOnly && <CtaButton cta={{ size: "lg", ...checkout }} />}
        {secondary?.map((cta, i) => <CtaButton key={typeof cta.label === "string" ? cta.label : i} cta={cta} />)}
        {note !== undefined && <p className={C.muted}>{note}</p>}
      </div>
    </>
  );

  if (variant === CART_VARIANT.drawer) {
    return (
      <Sheet open={isOpen} onOpenChange={setOpen}>
        {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        <SheetContent side={TRADE_SHEET_SIDE.cart} aria-describedby={undefined} data-slot={slot("drawer")} className={C.drawer}>
          <div className={C.drawerHead}>
            <SheetTitle>{heading}</SheetTitle>
          </div>
          <div className={C.drawerBody}>{list}</div>
          {footer && <div className={cn(C.drawerFoot, C.cart)}>{footer}</div>}
        </SheetContent>
      </Sheet>
    );
  }

  const card = (
    <div data-slot={slot()} data-variant={variant} data-read-only={readOnly || undefined} className={cn(C.cartCard, C.cart)}>
      <div className={C.cartHead}>
        <h2 id={titleId} className={C.cartTitle}>{heading}</h2>
      </div>
      {list}
      {footer}
    </div>
  );
  if (bare) return card;
  return (
    <BlockShell {...shell} ref={ref} aria-labelledby={shell["aria-labelledby"] ?? titleId}>
      {card}
    </BlockShell>
  );
}
