"use client";

import { useId, type JSX, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "../primitives/utils";

/**
 * 步骤条。数据驱动, 且**状态可由外部控制** —— 这是它区别于纯展示型 stepper 的地方。
 *
 * 对标 open-vetta 的 setup-wizard (apps/desktop/src/renderer/domains/setup-wizard):
 *   指示器是一排点, 当前那个用 layoutId 拉着跑; 步骤内容切换用 opacity + y + blur。
 *   这两点沿用 —— 尤其是 layoutId, 它让指示点真正"滑过去"而不是两个点各自淡入淡出。
 *
 * 为什么把状态交出去:
 *   真实场景里步骤的完成与否由外部事实决定 (HTTP 请求成功、websocket 连上、权限授予)。
 *   组件自己记 currentStep 的话, 这些事实就要再同步一遍, 迟早不同步。
 *   所以这里只收 `steps` 与 `current` —— 谁推进、什么时候推进由使用方决定。
 *
 * 三种状态:
 *   done     已完成。实心或勾。
 *   active   正在进行。它是唯一"被指出来"的那个。
 *   pending  还没到。最淡。
 *   error    出错。红色 —— 步骤失败必须能一眼看到, 否则用户会卡在第二步不知道为什么。
 */

export type StepStatus = "pending" | "active" | "done" | "error";

export interface StepItem {
  readonly id: string;
  readonly title: string;
  /** 步骤说明。可选, 显示在标题下方。 */
  readonly description?: string;
  /** 步骤图标 (Iconify 类名)。不传时按状态显示序号或勾。 */
  readonly icon?: string;
  /**
   * 状态覆盖。留空则按「index 与 current 的关系」自动推断。
   * 需要"某一步失败但后面的步骤仍可点"这类场景时显式传。
   */
  readonly status?: StepStatus;
}

export interface StepperProps {
  readonly steps: readonly StepItem[];
  /** 当前步骤的下标 (从 0 开始)。 */
  readonly current: number;
  /**
   * 点击已完成/可跳转的步骤时触发。
   * 传了它才会让步骤可点 —— 没传时整排只是展示, 不响应点击。
   */
  readonly onStepClick?: (index: number, step: StepItem) => void;
  /**
   * 允许点击的范围。默认 "done" —— 只能回看已完成的步骤, 不能跳到还没到的。
   * 允许往前跳会绕过前置校验, 那是要显式开启的行为。
   */
  readonly clickable?: "none" | "done" | "all";
  /** 方向。横向是一排点加文字; 纵向适合放在侧栏里配合内容区。 */
  readonly orientation?: "horizontal" | "vertical";
  readonly className?: string;
}

const STATUS_DOT: Record<StepStatus, string> = {
  done: "bg-primary text-primary-foreground",
  active: "bg-primary text-primary-foreground",
  pending: "bg-muted-foreground/20 text-muted-foreground",
  error: "bg-destructive text-destructive-foreground",
};

/** 自动推断状态: current 之前是 done, 等于 current 是 active, 之后是 pending。 */
function resolveStatus(step: StepItem, index: number, current: number): StepStatus {
  if (step.status) return step.status;
  if (index < current) return "done";
  if (index === current) return "active";
  return "pending";
}

function StepMarker({ status, index, icon }: { status: StepStatus; index: number; icon?: string }): JSX.Element {
  return (
    <span
      className={cn(
        "relative z-10 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors",
        STATUS_DOT[status],
      )}
    >
      {status === "done" && !icon ? (
        <span className="icon-[solar--check-circle-linear] size-3.5" aria-hidden />
      ) : icon ? (
        <span className={cn(icon, "size-3.5")} aria-hidden />
      ) : (
        index + 1
      )}
    </span>
  );
}

export function Stepper({
  steps,
  current,
  onStepClick,
  clickable = "done",
  orientation = "horizontal",
  className,
}: StepperProps): JSX.Element {
  // layoutId 需要全局唯一 —— 同一页放两个 Stepper 时不加前缀会互相抢指示器
  const uid = useId().replace(/:/g, "");

  const canClick = (index: number, status: StepStatus): boolean => {
    if (!onStepClick || clickable === "none") return false;
    if (clickable === "all") return true;
    return status === "done";
  };

  return (
    <ol
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row items-start gap-0" : "flex-col gap-0",
        className,
      )}
      aria-label="步骤"
    >
      {steps.map((step, index) => {
        const status = resolveStatus(step, index, current);
        const isLast = index === steps.length - 1;
        const clickableNow = canClick(index, status);

        // 连接线。已完成的段落用主色, 其余用淡色 —— 这条线本身就在表达进度。
        const line = (
          <span
            aria-hidden
            className={cn(
              "block transition-colors",
              orientation === "horizontal" ? "h-px flex-1" : "w-px flex-1",
              index < current ? "bg-primary/60" : "bg-border",
            )}
          />
        );

        const content = (
          <>
            <StepMarker status={status} index={index} icon={step.icon} />
            <span className={cn(orientation === "horizontal" ? "mt-2 text-center" : "min-w-0 flex-1")}>
              <span
                className={cn(
                  "block text-[13px] transition-colors",
                  status === "active" ? "font-medium text-foreground"
                    : status === "error" ? "font-medium text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {step.title}
              </span>
              {step.description ? (
                <span className="mt-0.5 block text-[12px] text-muted-foreground/80">{step.description}</span>
              ) : null}
            </span>
          </>
        );

        return (
          <li
            key={step.id}
            aria-current={status === "active" ? "step" : undefined}
            className={cn(
              "relative flex",
              orientation === "horizontal" ? "flex-1 flex-col items-center" : "flex-row items-start gap-3 pb-6 last:pb-0",
            )}
          >
            {/* 横向: 指示点之间画线, 线要盖在点下方且不遮住点 (所以点在 z-10) */}
            {orientation === "horizontal" && !isLast ? (
              <span className="absolute left-1/2 top-3 flex h-px w-full items-center">
                <span className={cn("ml-3 h-px flex-1", index < current ? "bg-primary/60" : "bg-border")} />
              </span>
            ) : null}
            {orientation === "vertical" && !isLast ? (
              <span className="absolute left-3 top-6 h-[calc(100%-1.5rem)] w-px bg-border">
                <span className={cn("block w-px", index < current ? "h-full bg-primary/60" : "h-0")} />
              </span>
            ) : null}

            {clickableNow ? (
              <button
                type="button"
                onClick={() => onStepClick?.(index, step)}
                className={cn(
                  "flex outline-none transition-opacity hover:opacity-80 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
                  orientation === "horizontal" ? "flex-col items-center rounded-lg px-2 py-1" : "flex-row items-start gap-3 rounded-lg p-1 text-left",
                )}
              >
                {content}
              </button>
            ) : (
              <span
                className={cn(
                  "flex",
                  orientation === "horizontal" ? "flex-col items-center px-2 py-1" : "flex-row items-start gap-3 p-1",
                )}
              >
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * 步骤内容容器。切换时做淡入 + 轻微上移 + 模糊。
 *
 * 模糊 (filter: blur) 是这一步的关键 —— 只做 opacity 会看起来像两个画面叠着换;
 * 加上模糊之后是"旧的散掉、新的聚起来", 观感更接近翻页。上游就是这么做的。
 */
export function StepContent({
  stepKey,
  children,
  className,
}: {
  /** 当前步骤的标识。它变了就播一次切换动画 —— 必须与步骤一一对应。 */
  stepKey: string;
  readonly children: ReactNode;
  readonly className?: string;
}): JSX.Element {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** 进度圆点条。比带文字的 Stepper 更轻, 用在只需要"走到哪了"的地方。 */
export function StepDots({
  total,
  current,
  className,
}: {
  readonly total: number;
  readonly current: number;
  readonly className?: string;
}): JSX.Element {
  const uid = useId().replace(/:/g, "");
  return (
    <div className={cn("flex items-center gap-2", className)} aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <span key={i} className="relative flex h-2 items-center justify-center">
            {active ? (
              /*
               * 当前这个是一条短横条, 并且用 layoutId 在位置之间滑动 ——
               * 两个点各自淡入淡出看不出"移动", 一个横条滑过去才有方向感。
               */
              <motion.span
                layoutId={`hx-step-dot-${uid}`}
                className="block h-1.5 w-5 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
              />
            ) : (
              <motion.span
                className={cn(
                  "block size-1.5 rounded-full",
                  done ? "bg-primary/50" : "bg-muted-foreground/25",
                )}
                initial={false}
                animate={{ scale: done ? 1 : 0.9, opacity: done ? 1 : 0.7 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}