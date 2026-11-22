import { LiveDot } from "@/effects/live-dot";
import type { DemoProps } from "../types";

const ROWS = [
  { name: "api-gateway", region: "上海", tone: "success", text: "运行中" },
  { name: "payments", region: "北京", tone: "warning", text: "延迟偏高" },
  { name: "search", region: "深圳", tone: "destructive", text: "故障" },
  { name: "batch-jobs", region: "杭州", tone: "muted", text: "已暂停" },
] as const;

export default function LiveDotDemo({ values }: DemoProps) {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border bg-background/80 backdrop-blur">
      {ROWS.map((r) => (
        <div key={r.name} className="flex items-center gap-3 border-b px-4 py-3 text-sm last:border-0">
          <LiveDot tone={r.tone} live={Boolean(values.live) && r.tone !== "muted"} />
          <span className="font-mono">{r.name}</span>
          <span className="text-muted-foreground">{r.region}</span>
          <span className="ml-auto text-muted-foreground">{r.text}</span>
        </div>
      ))}
    </div>
  );
}
