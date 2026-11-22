import * as React from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spin } from "@/components/ui/spin";
import { cn } from "@/lib/utils";

export type ButtonPhase = "idle" | "pending" | "success" | "error";

export interface StatefulButtonProps extends Omit<React.ComponentProps<typeof Button>, "onClick" | "children"> {
  /** 点击后执行的任务. resolve 显示成功, reject 显示失败 */
  action: () => Promise<unknown>;
  children: React.ReactNode;
  pendingLabel?: React.ReactNode;
  successLabel?: React.ReactNode;
  errorLabel?: React.ReactNode;
  /** 成功 / 失败停留多久后复原 (毫秒) */
  resetAfter?: number;
}

/**
 * 提交按钮的完整状态流: 待命 → 进行中 → 成功 / 失败 → 复原.
 * 进行中自动禁用, 防重复提交; 状态变化通过 aria-live 播报.
 */
export function StatefulButton({
  action, children, pendingLabel = "提交中", successLabel = "已完成", errorLabel = "失败, 重试",
  resetAfter = 1600, className, disabled, ...rest
}: StatefulButtonProps) {
  const [phase, setPhase] = React.useState<ButtonPhase>("idle");
  const reduce = useReducedMotion();
  const timer = React.useRef<number>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = async () => {
    if (phase === "pending") return;
    window.clearTimeout(timer.current);
    setPhase("pending");
    try {
      await action();
      setPhase("success");
    } catch {
      setPhase("error");
    }
    timer.current = window.setTimeout(() => setPhase("idle"), resetAfter);
  };

  const label = { idle: children, pending: pendingLabel, success: successLabel, error: errorLabel }[phase];
  const icon = {
    idle: null,
    pending: <Spin size={14} variant="ring" />,
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
      className={cn("relative overflow-hidden data-[phase=pending]:opacity-100 data-[phase=error]:bg-destructive data-[phase=error]:text-white", className)}
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
