import { cn } from "@/lib/utils";

/** 价格: 现价 + 原价划线 + 折扣徽标. 金额用 Intl 格式化. */
export function Price({ amount, compareAt, currency = "CNY", size = "md", className }: { amount: number; compareAt?: number; currency?: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const fmt = new Intl.NumberFormat("zh-CN", { style: "currency", currency, maximumFractionDigits: amount % 1 ? 2 : 0 });
  const off = compareAt && compareAt > amount ? Math.round((1 - amount / compareAt) * 100) : 0;
  return (
    <div className={cn("flex items-baseline gap-2 tabular", className)}>
      <span className={cn("font-semibold tracking-tight", size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-base")}>{fmt.format(amount)}</span>
      {off > 0 && (
        <>
          <span className="text-sm text-muted-foreground line-through">{fmt.format(compareAt!)}</span>
          <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">-{off}%</span>
        </>
      )}
    </div>
  );
}
