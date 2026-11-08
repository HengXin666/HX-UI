/** ReasoningTrace 展开列表里的一步: 出现时从下方淡入, 完成后提亮. */
import { useLayoutEffect, useRef, type JSX, type ReactNode } from "react";
import { COMPOSE_EASE_OUT, NONE, TRACE } from "../../tokens";

export interface TraceStep {
  readonly id: string;
  readonly label: ReactNode;
  readonly done?: boolean;
}

const STEP_RISE = "translateY(4px)";

export function TraceStepRow({ step, reduced }: { step: TraceStep; reduced: boolean }): JSX.Element {
  const ref = useRef<HTMLLIElement>(null);
  useLayoutEffect(() => {
    if (reduced) return;
    ref.current?.animate?.([{ opacity: 0, transform: STEP_RISE }, { opacity: 1, transform: NONE }], {
      duration: TRACE.stepMs,
      easing: COMPOSE_EASE_OUT,
    });
  }, [reduced]);
  return (
    <li ref={ref} data-done={step.done ? "" : undefined} className="data-[done]:text-foreground">
      {step.label}
    </li>
  );
}
