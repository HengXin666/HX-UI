"use client";

import type { JSX, ReactNode } from "react";
import { BUTTON_TYPE } from "../constants";
import { cn } from "../primitives/utils";
import { useButtonPress, useReducedMotion } from "./hooks";
import { MS, SCALE } from "./tokens";

const LOOK = {
  primary: "border-transparent bg-primary text-primary-foreground",
  outline: "border-border bg-transparent text-foreground",
  ghost: "border-transparent bg-transparent text-muted-foreground",
} as const;

export type CraftButtonProps = {
  readonly children: ReactNode;
  readonly variant?: keyof typeof LOOK;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly type?: "button" | "submit" | "reset";
  readonly className?: string;
  readonly onClick?: () => void;
};

/** 按下与松开是两段弹簧, 不是一条 transition. 环画在外层, 不跟着缩放. */
export function CraftButton({
  children,
  variant = "primary",
  disabled = false,
  loading = false,
  type = BUTTON_TYPE,
  className,
  onClick,
}: CraftButtonProps): JSX.Element {
  const reduced = useReducedMotion();
  const press = useButtonPress(reduced);
  return (
    <button
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      onClick={() => {
        if (!loading) onClick?.();
      }}
      onPointerDown={(event) => {
        if (!loading) press.onPointerDown(event);
      }}
      onPointerUp={press.onPointerUp}
      onPointerCancel={press.onPointerCancel}
      className={cn(
        "relative inline-flex h-8 items-center justify-center rounded-lg border px-3 text-sm outline-1 outline-offset-2 outline-transparent transition-[background-color,border-color,opacity] ease-out",
        "hover:bg-accent/40 focus-visible:outline-ring disabled:pointer-events-none",
        LOOK[variant],
        className,
      )}
      style={{
        transitionDuration: `${MS.color}ms`,
        opacity: disabled ? SCALE.disabled : undefined,
        fontWeight: 500,
      }}
    >
      <span ref={press.ref} className={"inline-flex items-center gap-1.5" + (loading ? " invisible" : "")}>
        {children}
      </span>
      {loading ? (
        <span
          aria-hidden
          className="absolute size-3 animate-spin rounded-full border border-current border-t-transparent motion-reduce:animate-none"
          style={{ animationDuration: `${MS.spin}ms` }}
        />
      ) : null}
    </button>
  );
}
