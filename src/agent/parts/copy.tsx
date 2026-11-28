"use client";
import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** 复制后保持 "已复制" 的时长 */
export const COPIED_MS = 1400;

export function useCopy(): [boolean, (text: string) => void] {
  const [ok, setOk] = React.useState(false);
  const timer = React.useRef<number | null>(null);
  React.useEffect(() => () => {
    if (timer.current != null) window.clearTimeout(timer.current);
  }, []);
  const copy = React.useCallback((text: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setOk(true);
      if (timer.current != null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setOk(false), COPIED_MS);
    });
  }, []);
  return [ok, copy];
}

/** 小号图标按钮: 代码块, 工具卡片, 消息操作条共用 */
export const IconButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button"> & { label: string; active?: boolean }>(function IconButton({ label, active, className, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      data-active={active || undefined}
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-current/70 transition-[color,background-color,opacity,transform] duration-150 hover:bg-current/10 hover:text-current active:scale-95 disabled:pointer-events-none disabled:opacity-40 data-[active]:text-current [&_svg]:size-3.5",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

export function CopyIconButton({ text, className, label = "复制" }: { text: string | (() => string); className?: string; label?: string }) {
  const [ok, copy] = useCopy();
  return (
    <IconButton label={ok ? "已复制" : label} className={className} onClick={() => copy(typeof text === "function" ? text() : text)}>
      {ok ? <Check className="text-success" /> : <Copy />}
    </IconButton>
  );
}
