import * as React from "react";
import { AnimatePresence, m } from "motion/react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 提交中的小圈: 一个 SVG + animate-spin. 不用 Spin (ldrs 全家桶 ~80KB), 守住本组件 4KB 的预算 */
function Ring() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden>
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M14.25 8A6.25 6.25 0 0 0 8 1.75" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export type ButtonPhase = "idle" | "pending" | "success" | "error";

export interface StatefulButtonProps extends Omit<React.ComponentProps<typeof Button>, "onClick" | "children"> {
  /** 点击后执行的任务. resolve 显示成功, reject 显示失败 */
  action: () => Promise<unknown>;
  children: React.ReactNode;
  pendingLabel?: React.ReactNode;
  successLabel?: React.ReactNode;
  errorLabel?: React.ReactNode;
  /** 成功 / 失败停留多久后复原 (毫秒). 传 0 不复原, 停在结果上 */
  resetAfter?: number;
  /** 执行前的检查, 返回 false 则什么都不做 (例如表单校验没过) */
  guard?: () => boolean;
}

/**
 * 提交按钮的完整状态流: 待命 → 进行中 → 成功 / 失败 → 复原.
 * 进行中自动禁用, 防重复提交; 状态变化通过 aria-live 播报.
 */
export function StatefulButton({
  action, children, pendingLabel = "提交中", successLabel = "已完成", errorLabel = "失败, 重试",
  resetAfter = 1600, guard, className, disabled, ...rest
}: StatefulButtonProps) {
  const [phase, setPhase] = React.useState<ButtonPhase>("idle");
  const reduce = useReducedMotion();
  const timer = React.useRef<number>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = async () => {
    if (phase === "pending") return;
    if (guard && !guard()) return;
    window.clearTimeout(timer.current);
    setPhase("pending");
    try {
      await action();
      setPhase("success");
    } catch {
      setPhase("error");
    }
    if (resetAfter > 0) timer.current = window.setTimeout(() => setPhase("idle"), resetAfter);
  };

  const label = { idle: children, pending: pendingLabel, success: successLabel, error: errorLabel }[phase];
  const icon = {
    idle: null,
    pending: <Ring />,
    success: <Check className="size-3.5" />,
    error: <X className="size-3.5" />,
  }[phase];
  const y = reduce ? 0 : 10;

  return (
    <Button
      type="button"
      {...rest}
      disabled={disabled || phase === "pending"}
      onClick={run}
      data-phase={phase}
      className={cn("relative overflow-hidden data-[phase=pending]:opacity-100 data-[phase=error]:bg-background data-[phase=error]:text-destructive data-[phase=error]:ring-1 data-[phase=error]:ring-destructive/60 data-[phase=error]:ring-inset", className)}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span
          key={phase}
          className="inline-flex items-center gap-1.5"
          initial={{ opacity: 0, y }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -y }}
          transition={{ duration: 0.18 }}
        >
          {icon}
          {label}
        </m.span>
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">{phase === "idle" ? "" : String(label)}</span>
    </Button>
  );
}
