import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** 只读评分: 支持小数 (填充按比例裁切). */
export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 text-sm", className)} aria-label={`评分 ${value} / 5`}>
      <div className="relative flex">
        {Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-4 text-muted-foreground/30" fill="currentColor" strokeWidth={0} />)}
        <div className="absolute inset-0 flex overflow-hidden" style={{ width: `${(value / 5) * 100}%` }}>
          {Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-4 shrink-0 text-amber-400" fill="currentColor" strokeWidth={0} />)}
        </div>
      </div>
      <span className="font-medium tabular">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted-foreground tabular">({count.toLocaleString("zh-CN")})</span>}
    </div>
  );
}
