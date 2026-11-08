"use client";

import { motion } from "motion/react";
import { useRef, type JSX, type KeyboardEvent } from "react";
import { BUTTON_TYPE } from "../../constants";
import { ONBOARDING_SLOTS } from "../../constants/blocks-dashboard";
import { MEDIA_KEY } from "../../constants/media";
import { LIVE_POLITE } from "../../constants/widgets";
import { ORIENTATION, STEP_BACK } from "../../constants/ui";
import { useControllableState } from "../../hooks/state/useControllableState";
import { useMotionTokens } from "../../motion/presets";
import { cn } from "../../primitives/utils";
import { STUDIO_CLASS } from "../classes";
import { SHOT_BEAT_S, SHOT_VIEWPORT_AMOUNT } from "../../motion/shots";

const ARIA_STEP = ONBOARDING_SLOTS[ONBOARDING_SLOTS.length - 2];

export interface ProcessStep {
  id: string;
  title: string;
  detail: string;
}

export interface ProcessProps {
  steps: readonly ProcessStep[];
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  orientation?: (typeof ORIENTATION)[keyof typeof ORIENTATION];
  className?: string;
  classNames?: { root?: string; step?: string; panel?: string };
}

/**
 * 过程图. 方向键在步骤间移动, 当前步 aria-current="step", 说明放在 aria-live 区域.
 * 连接线用 scaleX / scaleY, 不动画宽度.
 */
export function Process({
  steps,
  label,
  value,
  defaultValue,
  onValueChange,
  orientation = ORIENTATION.horizontal,
  className,
  classNames,
}: ProcessProps): JSX.Element {
  const first = steps[0]?.id ?? "";
  const [current, setCurrent] = useControllableState({ value, defaultValue: defaultValue ?? first, onChange: onValueChange });
  const { tokens, reduced } = useMotionTokens();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const horizontal = orientation === ORIENTATION.horizontal;
  const index = Math.max(0, steps.findIndex((step) => step.id === current));
  const active = steps[index];

  const focusAt = (next: number): void => {
    const step = steps[next];
    if (!step) return;
    setCurrent(step.id);
    buttons.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLOListElement>): void => {
    const prevKey = horizontal ? MEDIA_KEY.left : MEDIA_KEY.up;
    const nextKey = horizontal ? MEDIA_KEY.right : MEDIA_KEY.down;
    if (event.key === prevKey) {
      event.preventDefault();
      focusAt(index <= 0 ? steps.length - 1 : index - 1);
    } else if (event.key === nextKey) {
      event.preventDefault();
      focusAt(index >= steps.length - 1 ? 0 : index + 1);
    } else if (event.key === MEDIA_KEY.home) {
      event.preventDefault();
      focusAt(0);
    } else if (event.key === MEDIA_KEY.end) {
      event.preventDefault();
      focusAt(steps.length - 1);
    }
  };

  return (
    <div data-slot="hx-process" data-orientation={orientation} className={cn(STUDIO_CLASS.stackGap4, className, classNames?.root)}>
      <ol
        aria-label={label}
        data-orientation={orientation}
        className={cn(horizontal ? "gap-3 md:flex-row md:items-stretch" : "", STUDIO_CLASS.stackGap3)}
        onKeyDown={onKeyDown}
      >
        {steps.map((step, stepIndex) => {
          const selected = step.id === current;
          return (
            <li key={step.id} className={cn("flex min-w-0 flex-1 items-center gap-3", horizontal ? "md:flex-row" : "flex-row")}>
              <button
                type={BUTTON_TYPE}
                ref={(node) => {
                  buttons.current[stepIndex] = node;
                }}
                aria-current={selected ? (ARIA_STEP as "step") : undefined}
                tabIndex={selected ? 0 : STEP_BACK}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-border px-3 py-2 text-left",
                  selected ? "bg-card text-foreground" : "bg-transparent text-muted-foreground",
                  classNames?.step,
                )}
                onClick={() => setCurrent(step.id)}
              >
                <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full border border-border text-xs tabular-nums">
                  {stepIndex + 1}
                </span>
                <span className="truncate text-sm font-medium">{step.title}</span>
              </button>
              {stepIndex < steps.length - 1 ? (
                <motion.span
                  aria-hidden
                  className={cn("hidden shrink-0 bg-border md:block", horizontal ? "h-px w-6 origin-left" : "h-6 w-px origin-top")}
                  initial={reduced ? false : { scaleX: horizontal ? 0 : 1, scaleY: horizontal ? 1 : 0 }}
                  whileInView={{ scaleX: 1, scaleY: 1 }}
                  viewport={{ once: true, amount: SHOT_VIEWPORT_AMOUNT }}
                  transition={reduced ? { duration: 0 } : { duration: SHOT_BEAT_S, ease: tokens.ease.out, delay: stepIndex * SHOT_BEAT_S }}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      {active ? (
        <p data-slot="hx-process-panel" aria-live={LIVE_POLITE} className={cn(STUDIO_CLASS.muted, classNames?.panel)}>
          {active.detail}
        </p>
      ) : null}
    </div>
  );
}
