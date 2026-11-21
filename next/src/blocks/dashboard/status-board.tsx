import { LiveDot } from "@/effects/live-dot";
import { cn } from "@/lib/utils";

export type ServiceState = "up" | "degraded" | "down" | "maintenance";
export interface ServiceStatus {
  name: string;
  region?: string;
  state: ServiceState;
  latencyMs?: number;
  uptime?: number;
  /** 最近若干个时间片, true = 正常 */
  history?: ServiceState[];
}

const TONE = { up: "success", degraded: "warning", down: "destructive", maintenance: "info" } as const;
const LABEL: Record<ServiceState, string> = { up: "正常", degraded: "降级", down: "故障", maintenance: "维护中" };
const BAR: Record<ServiceState, string> = { up: "bg-success/70", degraded: "bg-warning", down: "bg-destructive", maintenance: "bg-info/70" };

/** 服务状态板: 实时点 + 延迟 + 可用率 + 历史条. */
export function StatusBoard({ services, className }: { services: ServiceStatus[]; className?: string }) {
  return (
    <ul className={cn("divide-y rounded-xl border bg-card", className)}>
      {services.map((s) => (
        <li key={s.name} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <LiveDot tone={TONE[s.state]} live={s.state !== "up"} />
          <div className="min-w-32 flex-1">
            <div className="text-sm font-medium">{s.name}</div>
            {s.region && <div className="text-xs text-muted-foreground">{s.region}</div>}
          </div>
          {s.history && (
            <div className="hidden h-6 items-end gap-[2px] lg:flex" aria-hidden>
              {s.history.map((h, i) => (
                <span key={i} className={cn("w-1.5 rounded-sm", BAR[h], h === "up" ? "h-full" : "h-3/4")} />
              ))}
            </div>
          )}
          <div className="w-20 text-right text-sm tabular text-muted-foreground">{s.latencyMs !== undefined ? `${s.latencyMs} ms` : "—"}</div>
          <div className="w-20 text-right text-sm tabular">{s.uptime !== undefined ? `${(s.uptime * 100).toFixed(2)}%` : "—"}</div>
          <span className={cn("w-16 text-right text-xs", s.state === "up" ? "text-success" : s.state === "down" ? "text-destructive" : s.state === "degraded" ? "text-warning" : "text-info")}>{LABEL[s.state]}</span>
        </li>
      ))}
    </ul>
  );
}
