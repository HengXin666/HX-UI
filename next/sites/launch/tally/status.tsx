import { cn } from "@/lib/utils";

export type Status = "matched" | "review" | "diff" | "matching";

const MAP: Record<Status, { label: string; dot: string }> = {
  matched: { label: "已匹配", dot: "bg-success" },
  review: { label: "待确认", dot: "bg-warning" },
  diff: { label: "有差异", dot: "bg-destructive" },
  matching: { label: "匹配中", dot: "bg-muted-foreground/50 animate-pulse" },
};

/** 状态标签: 小圆点 + 文字, 不用整块彩色底. */
export function StatusTag({ status, className }: { status: Status; className?: string }) {
  const s = MAP[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground", className)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export const yuan = (n: number) => n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
