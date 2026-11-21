import { m } from "motion/react";
import { cn } from "@/lib/utils";
import { spring } from "@/motion/presets";

export interface VariantOption {
  value: string;
  label: string;
  /** 颜色款用色块 */
  swatch?: string;
  /** 当前组合下售罄 */
  soldOut?: boolean;
}

/** 变体选择: 尺码 / 颜色. 售罄划线不可选, 选中态滑块跟随. */
export function VariantPicker({ name, label, options, value, onChange }: {
  name: string;
  label: string;
  options: VariantOption[];
  value?: string;
  onChange: (v: string) => void;
}) {
  const current = options.find((o) => o.value === value);
  const swatch = options.some((o) => o.swatch);
  return (
    <fieldset>
      <legend className="mb-2 flex w-full justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{current?.label ?? "请选择"}</span>
      </legend>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${o.label}${o.soldOut ? " (售罄)" : ""}`}
              disabled={o.soldOut}
              onClick={() => onChange(o.value)}
              className={cn(
                "relative inline-flex items-center justify-center text-sm transition-colors disabled:cursor-not-allowed",
                swatch ? "size-9 rounded-full" : "h-10 min-w-12 rounded-lg border px-3",
                !swatch && (on ? "border-transparent text-background" : "hover:border-foreground/40"),
                o.soldOut && "text-muted-foreground/50 line-through",
              )}
            >
              {on && !swatch && <m.span layoutId={`vp-${name}`} transition={spring.snappy} className="absolute inset-0 rounded-lg bg-foreground" />}
              {swatch ? (
                <span className={cn("size-full rounded-full ring-offset-2 ring-offset-background", on && "ring-2 ring-foreground", o.soldOut && "opacity-30")} style={{ background: o.swatch }} />
              ) : (
                <span className="relative">{o.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
