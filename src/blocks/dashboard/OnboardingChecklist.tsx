"use client";

import * as React from "react";
import { DASH_CLASS, DASH_ICON, DASH_SLOT, dashFill, dashText, type ONBOARDING_SLOTS } from "../../constants/blocks-dashboard-v110";
import { IconSlot } from "../../layout/Icon";
import { Progress } from "../../primitives/progress";
import { cn } from "../../primitives/utils";
import { resolveSlots } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { CtaButton } from "../_shared/SectionHeading";
import type { BlockBaseProps, Cta, Rich, SlotClassNames } from "../_shared/types";

export type OnboardingChecklistSlot = (typeof ONBOARDING_SLOTS)[number];

/** 一步: done 由调用方的数据决定 (完成与否来自后端, 不在区块内勾选). */
export interface OnboardingStep {
  id?: string;
  title: Rich;
  description?: Rich;
  done: boolean;
  /** 未完成时显示的去完成入口. */
  cta?: Cta;
}

export interface OnboardingChecklistState {
  done: number;
  total: number;
  complete: boolean;
}

export interface OnboardingChecklistProps extends Pick<BlockBaseProps, "id" | "className" | "style" | "slots" | "aria-label"> {
  steps: ReadonlyArray<OnboardingStep>;
  /** 面板标题; 默认取 labels.checklist. */
  title?: Rich;
  description?: Rich;
  /** 全部完成后显示的内容; 默认 labels.allDone. */
  completeContent?: Rich;
  /** 隐藏已完成的步骤 (进度条仍按全部步骤计). */
  hideCompleted?: boolean;
  /** 标题右侧动作 (例如 "稍后再说" 按钮). */
  actions?: React.ReactNode;
  classNames?: SlotClassNames<OnboardingChecklistSlot, OnboardingChecklistState>;
  labels?: Partial<Record<string, string>>;
  ref?: React.Ref<HTMLElement>;
}

/**
 * 上手清单 (设计文档 4.5): 进度条 + 步骤列表 + 未完成步骤的 Cta.
 * 进度条用 primitives/progress (role="progressbar" 与 aria-valuenow 齐全), 文本 "已完成 x / y" 走 labels.progress 占位.
 * 每步的完成状态同时用图标与读屏文本表达, 不只靠颜色.
 */
export function OnboardingChecklist({
  steps,
  title,
  description,
  completeContent,
  hideCompleted = false,
  actions,
  classNames,
  labels,
  slots,
  className,
  style,
  id,
  ref,
  "aria-label": ariaLabel,
}: OnboardingChecklistProps): React.JSX.Element {
  const { locale } = useBlocks();
  const text = dashText(locale, labels);
  const titleId = React.useId();
  const total = steps.length;
  const done = steps.filter((step) => step.done).length;
  const complete = total > 0 && done === total;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const progressText = dashFill(text.progress, { done, total });
  const cls = resolveSlots<OnboardingChecklistSlot, OnboardingChecklistState, string>(classNames, { done, total, complete });
  const visible = hideCompleted ? steps.filter((step) => !step.done) : steps;
  return (
    <section
      ref={ref}
      id={id}
      style={style}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel === undefined ? titleId : undefined}
      data-slot={DASH_SLOT.checklist}
      data-complete={complete || undefined}
      className={cn(DASH_CLASS.panel, cls.root, className)}
    >
      <div className={cn(DASH_CLASS.panelHeader, DASH_CLASS.headerFlush)}>
        <div className={DASH_CLASS.panelHeadText}>
          <h3 id={titleId} className={DASH_CLASS.panelTitle}>
            {title ?? text.checklist}
          </h3>
          {description !== undefined && <p className={DASH_CLASS.panelDescription}>{description}</p>}
        </div>
        {actions !== undefined && <div className={DASH_CLASS.panelActions}>{actions}</div>}
      </div>
      <div data-slot={DASH_SLOT.checklistProgress} className={cn(DASH_CLASS.checkProgress, cls.progress)}>
        <Progress value={percent} tone={complete ? "success" : "primary"} aria-label={progressText} />
        <p className={DASH_CLASS.checkProgressText} aria-hidden>
          {progressText}
        </p>
      </div>
      {slots?.before}
      {complete && hideCompleted ? (
        <p className={DASH_CLASS.feedEmpty}>{completeContent ?? text.allDone}</p>
      ) : (
        <ol className={cn(DASH_CLASS.checkList, cls.list)}>
          {visible.map((step, index) => (
            <li
              key={step.id ?? (typeof step.title === "string" ? step.title : index)}
              data-slot={DASH_SLOT.checklistStep}
              data-state={step.done ? "checked" : "unchecked"}
              className={cn(DASH_CLASS.checkStep, cls.step)}
            >
              <IconSlot
                source={step.done ? DASH_ICON.check : DASH_ICON.pending}
                className={cn(DASH_CLASS.checkIcon, step.done ? DASH_CLASS.checkIconDone : DASH_CLASS.checkIconTodo)}
              />
              <div className={DASH_CLASS.checkText}>
                <p className={cn(DASH_CLASS.checkTitle, step.done && DASH_CLASS.checkTitleDone)}>
                  <span className={DASH_CLASS.srOnly}>{`${step.done ? text.done : text.todo}: `}</span>
                  {step.title}
                </p>
                {step.description !== undefined && <p className={DASH_CLASS.checkDescription}>{step.description}</p>}
              </div>
              {!step.done && step.cta !== undefined && <CtaButton cta={{ size: "sm", variant: "secondary", ...step.cta }} className={cls.cta} />}
            </li>
          ))}
        </ol>
      )}
      {slots?.after}
    </section>
  );
}
