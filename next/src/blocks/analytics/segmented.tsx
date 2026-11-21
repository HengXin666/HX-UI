import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { spring } from "@/motion/presets";
import { useId } from "react";

/** 分段切换: 滑块跟随. 时间范围 / 视图切换. */
export function Segmented<T extends string>({ options, value, onChange, className }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div role="tablist" className={cn("inline-flex rounded-lg bg-muted p-0.5", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn("relative h-7 rounded-md px-3 text-xs font-medium transition-colors", on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {on && <motion.span layoutId={`seg-${id}`} transition={spring.snappy} className="absolute inset-0 rounded-md bg-background shadow-soft" />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
