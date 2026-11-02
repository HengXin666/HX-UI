"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import {
  COMMERCE_TRADE_SLOT,
  TOTAL_KIND,
  TRADE_CLASS as C,
  TRADE_ICON,
  TRADE_NUMBERS,
  tradeSlot,
  type TradeTexts,
} from "../../constants/blocks-commerce-v108";
import { useControllableState } from "../../hooks/state/useControllableState";
import { Stepper, type StepStatus } from "../../layout/Stepper";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { CtaButton } from "../_shared/SectionHeading";
import type { BlockBaseProps, Cta, HeadingLevel } from "../_shared/types";
import { CartSummary, type CartSummaryProps } from "./CartSummary";
import { fillText, useTradeTexts } from "./commerce-v108-parts";

const slot = (part?: string): string => tradeSlot(COMMERCE_TRADE_SLOT.checkoutSteps, part);
const HEADING_TAG = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;

export interface CheckoutStepData {
  key: string;
  /** 步骤名 (地址, 配送, 支付); Stepper 只收纯文本. */
  title: string;
  description?: string;
  /** 本步内容 (表单等), 由调用方渲染. */
  content: React.ReactNode;
  /** 状态覆盖 (例: 支付失败标 error). */
  status?: StepStatus;
  /** 本步"继续"按钮的文案覆盖. */
  nextLabel?: string;
  /** 为 false 时禁用继续 (表单未通过校验). */
  canContinue?: boolean;
}

export interface CheckoutStepsProps extends BlockBaseProps {
  steps: CheckoutStepData[];
  /** 当前步下标 (受控) 三件套. */
  current?: number;
  defaultCurrent?: number;
  onStepChange?: (index: number, step: CheckoutStepData) => void;
  /** 订单摘要: 渲染为只读 CartSummary (桌面右栏粘性, 移动端折叠到顶部). */
  summary: CartSummaryProps;
  /** 最后一步的提交动作; 不传时用 summary.checkout. */
  submit?: Cta;
  /** 允许点 Stepper 跳转的范围, 默认只能回看已完成步. */
  clickable?: "none" | "done" | "all";
  /** 隐藏底部的上一步 / 继续 (调用方在 content 里自带按钮时). */
  hideNav?: boolean;
  headingLevel?: HeadingLevel;
  texts?: Partial<TradeTexts>;
  ref?: React.Ref<HTMLElement>;
}

/** 移动端顶部折叠的订单摘要: 标题行显示总计, 展开为只读 CartSummary. */
function MobileSummary({ summary, texts }: { summary: CartSummaryProps; texts: TradeTexts }): React.JSX.Element {
  const { formatMoney } = useBlocks();
  const [open, setOpen] = React.useState(false);
  const bodyId = React.useId();
  const grand = summary.totals.find((row) => row.kind === TOTAL_KIND.grand) ?? summary.totals[summary.totals.length - 1];
  return (
    <div data-slot={slot("summary-mobile")} className={C.checkoutMobile}>
      <button type={BUTTON_TYPE} aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen(!open)} className={cn(C.checkoutToggle, C.focus)}>
        <span className={C.stock}>
          <span aria-hidden className={cn(TRADE_ICON.cart, C.icon)} />
          {open ? texts.hideSummary : texts.showSummary}
          <span aria-hidden className={cn(TRADE_ICON.chevron, C.icon, C.detailsChevron, open && C.chevronOpen)} />
        </span>
        {grand && <span className={C.totalValue}>{formatMoney(grand.value)}</span>}
      </button>
      {open && (
        <div id={bodyId} className={C.checkoutToggleBody}>
          <CartSummary readOnly {...summary} bare />
        </div>
      )}
    </div>
  );
}

/**
 * 结账步骤 (设计稿 4.3, 审计 B15): 复用 layout/Stepper 作步骤条, 当前步内容 + 上一步 / 继续,
 * 订单摘要桌面右栏粘性, 移动端折叠到顶部 (显示总计). 切步后焦点移到步骤标题, 读屏能听到新步骤.
 * 步骤推进由调用方掌控 (canContinue / current 受控), 区块不做表单校验.
 */
export function CheckoutSteps(props: CheckoutStepsProps): React.JSX.Element {
  const {
    steps, current, defaultCurrent = TRADE_NUMBERS.first, onStepChange, summary, submit, clickable = "done", hideNav = false,
    headingLevel = 2, texts, ref, labels: _labels, ...shell
  } = props;
  const { formatNumber } = useBlocks();
  const t = useTradeTexts(texts);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const moved = React.useRef(false);
  const [index, setIndex] = useControllableState<number>({
    value: current,
    defaultValue: defaultCurrent,
    onChange: (i) => onStepChange?.(i, steps[i]),
  });
  const at = Math.min(Math.max(index, TRADE_NUMBERS.first), Math.max(steps.length - 1, 0));
  const step = steps[at];
  const last = at === steps.length - 1;
  const go = (i: number): void => {
    moved.current = true;
    setIndex(i);
  };
  React.useEffect(() => {
    if (moved.current) titleRef.current?.focus();
  }, [at]);
  const Heading = HEADING_TAG[headingLevel];
  const finalCta = submit ?? summary.checkout;

  return (
    <BlockShell {...shell} ref={ref} aria-label={shell["aria-label"] ?? t.steps}>
      <div data-slot={slot()} data-step={step?.key} className={C.checkoutRoot}>
        <div className={C.checkoutMain}>
          <MobileSummary summary={summary} texts={t} />
          <nav aria-label={t.steps} className={C.checkoutStepper}>
            <Stepper
              steps={steps.map((s) => ({ id: s.key, title: s.title, description: s.description, status: s.status }))}
              current={at}
              clickable={clickable}
              onStepClick={clickable === "none" ? undefined : (i) => go(i)}
            />
          </nav>
          {step && (
            <section data-slot={slot("panel")} aria-labelledby={`${step.key}-title`} className={C.checkoutPanel}>
              <Heading id={`${step.key}-title`} ref={titleRef} tabIndex={-1} className={cn(C.checkoutStepTitle, C.focus)}>
                <span className={C.srOnly}>{fillText(t.stepOf, { n: formatNumber(at + 1) })} </span>
                {step.title}
              </Heading>
              {step.content}
            </section>
          )}
          {!hideNav && step && (
            <div data-slot={slot("nav")} className={C.checkoutNav}>
              {at > TRADE_NUMBERS.first ? (
                <CtaButton cta={{ label: t.back, variant: "ghost", icon: TRADE_ICON.previous, onClick: () => go(at - 1) }} />
              ) : (
                <span />
              )}
              {last ? (
                <CtaButton cta={{ size: "lg", ...finalCta, disabled: finalCta.disabled || step.canContinue === false }} />
              ) : (
                <CtaButton
                  cta={{ label: step.nextLabel ?? t.continue, variant: "primary", size: "lg", icon: TRADE_ICON.next, iconEnd: true, disabled: step.canContinue === false, onClick: () => go(at + 1) }}
                />
              )}
            </div>
          )}
        </div>
        <aside data-slot={slot("summary")} aria-label={t.orderSummary} className={C.checkoutAside}>
          <CartSummary readOnly {...summary} bare />
        </aside>
      </div>
    </BlockShell>
  );
}
