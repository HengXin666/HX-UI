import { Badge } from "@/components/ui/badge";
import type { DemoProps } from "../types";

const ROWS = [
  { name: "api-gateway", region: "上海", dot: "success", text: "运行中" },
  { name: "payments", region: "北京", dot: "warning", text: "延迟偏高" },
  { name: "search", region: "深圳", dot: "destructive", text: "故障" },
  { name: "batch-jobs", region: "杭州", dot: "muted", text: "已暂停" },
] as const;

export default function BadgeDemo({ values }: DemoProps) {
  const variant = values.variant as "outline" | "secondary" | "default";
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border bg-background/80 backdrop-blur">
      {ROWS.map((r) => (
        <div key={r.name} className="flex items-center gap-3 border-b px-4 py-3 text-sm last:border-0">
          <span className="font-mono">{r.name}</span>
          <span className="text-muted-foreground">{r.region}</span>
          <Badge variant={variant} dot={values.dot ? r.dot : undefined} live={Boolean(values.live) && r.dot !== "muted"} className="ml-auto">{r.text}</Badge>
        </div>
      ))}
    </div>
  );
}
