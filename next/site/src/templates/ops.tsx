import * as React from "react";
import { Bell, Cpu, Gauge, RefreshCw, ServerCrash, Waypoints } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/blocks/shell/app-shell";
import { CommandMenu } from "@/blocks/shell/command-menu";
import { ThemeToggle } from "@/blocks/shell/theme-toggle";
import { PageHeader } from "@/blocks/shell/page-header";
import { StatCard } from "@/blocks/dashboard/stat-card";
import { StatusBoard, type ServiceState, type ServiceStatus } from "@/blocks/dashboard/status-board";
import { LogStream, type LogLine } from "@/blocks/dashboard/log-stream";
import { ChartCard } from "@/blocks/analytics/chart-card";
import { AreaTrend } from "@/data/charts/area-trend";
import { LiveDot } from "@/effects/live-dot";
import { Stagger, StaggerItem } from "@/motion/reveal";
import { OPS_NAV } from "../demos/nav";
import { UserChip } from "../demos/user-chip";
import { spark } from "../demos/data";
import { BackLink } from "../pages/back-link";
import { go } from "../router";

const hist = (bad: number[]): ServiceState[] => Array.from({ length: 30 }, (_, i) => (bad.includes(i) ? (i % 2 ? "degraded" : "down") : "up"));
const SERVICES: ServiceStatus[] = [
  { name: "api-gateway", region: "cn-shanghai · 12 实例", state: "up", latencyMs: 42, uptime: 0.99987, history: hist([]) },
  { name: "order-service", region: "cn-shanghai · 8 实例", state: "degraded", latencyMs: 318, uptime: 0.99812, history: hist([26, 27, 29]) },
  { name: "payment-core", region: "cn-hangzhou · 6 实例", state: "up", latencyMs: 87, uptime: 0.99995, history: hist([]) },
  { name: "search-indexer", region: "cn-beijing · 4 实例", state: "down", latencyMs: undefined, uptime: 0.98731, history: hist([22, 28, 29]) },
  { name: "redis-cluster", region: "cn-shanghai · 3 主 3 从", state: "up", latencyMs: 2, uptime: 1, history: hist([]) },
  { name: "notify-worker", region: "cn-shenzhen · 2 实例", state: "maintenance", latencyMs: 0, uptime: 0.9991, history: hist([29]) },
];

const SOURCES = ["api-gateway", "order-service", "payment-core", "search-indexer", "scheduler"];
const MSGS: [LogLine["level"], string][] = [
  ["info", "GET /v2/orders?page=3 200 41ms"],
  ["info", "POST /v2/payments 201 88ms"],
  ["debug", "cache hit ratio=0.934 keys=128402"],
  ["warn", "upstream order-service p95=318ms > 250ms"],
  ["info", "deployment canary 12% healthy"],
  ["error", "search-indexer: connection refused es-node-3:9200"],
  ["info", "cron settle-daily finished in 4.82s"],
];

function useLiveLogs(): LogLine[] {
  const [lines, setLines] = React.useState<LogLine[]>([]);
  const n = React.useRef(0);
  React.useEffect(() => {
    const t = setInterval(() => {
      const [level, message] = MSGS[Math.floor(Math.random() * MSGS.length)];
      const d = new Date();
      n.current += 1;
      setLines((ls) => [...ls.slice(-299), { id: n.current, time: d.toTimeString().slice(0, 8), level, source: SOURCES[n.current % SOURCES.length], message }]);
    }, 900);
    return () => clearInterval(t);
  }, []);
  return lines;
}

function useLiveTraffic() {
  const [data, setData] = React.useState(() =>
    Array.from({ length: 40 }, (_, i) => ({ t: `${i}`, 请求: 4_200 + Math.sin(i / 4) * 600 + Math.random() * 300, 错误: 20 + Math.random() * 18 })),
  );
  React.useEffect(() => {
    const id = setInterval(() => {
      setData((d) => {
        const i = Number(d[d.length - 1].t) + 1;
        return [...d.slice(1), { t: `${i}`, 请求: 4_200 + Math.sin(i / 4) * 600 + Math.random() * 300, 错误: 20 + Math.random() * 18 }];
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);
  return data;
}

export default function Ops() {
  const [active, setActive] = React.useState("overview");
  const logs = useLiveLogs();
  const traffic = useLiveTraffic();
  return (
    <>
      <BackLink />
      <AppShell
        brand={<span className="flex items-center gap-2 font-semibold"><Waypoints className="size-5 text-brand" />Orbit 运维</span>}
        nav={OPS_NAV}
        active={active}
        onNavigate={setActive}
        footer={<UserChip />}
        actions={
          <>
            <CommandMenu
              className="hidden sm:inline-flex"
              entries={[
                ...OPS_NAV.flatMap((g) => g.items.map((it) => ({ id: it.id, label: it.label, group: "页面", icon: it.icon, onSelect: () => setActive(it.id) }))),
                { id: "restart", label: "滚动重启 order-service", group: "操作", icon: RefreshCw, onSelect: () => toast.success("已发起滚动重启", { description: "order-service · 8 实例，预计 4 分钟" }) },
                { id: "home", label: "返回组件总览", group: "操作", onSelect: () => go("home") },
              ]}
            />
            <Button variant="ghost" size="icon" className="size-9" aria-label="通知"><Bell className="size-4" /></Button>
            <ThemeToggle />
          </>
        }
      >
        <PageHeader
          title="生产环境总览"
          description={<span className="inline-flex items-center gap-2"><LiveDot /> 实时 · 每 2 秒刷新</span>}
          actions={<Button variant="outline" size="sm" onClick={() => toast("已导出最近 1 小时报告")}>导出报告</Button>}
        />
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StaggerItem><StatCard label="请求量 / 分" value={248_612} delta={0.084} trend={spark(240)} icon={Gauge} /></StaggerItem>
          <StaggerItem><StatCard label="P95 延迟" value={186} suffix="ms" delta={0.123} invert trend={spark(180)} icon={Waypoints} /></StaggerItem>
          <StaggerItem><StatCard label="错误率" value={0.0042} format={{ style: "percent", maximumFractionDigits: 2 }} delta={-0.211} invert trend={spark(4)} icon={ServerCrash} /></StaggerItem>
          <StaggerItem><StatCard label="集群 CPU" value={0.637} format={{ style: "percent", maximumFractionDigits: 1 }} delta={0.032} invert trend={spark(63)} icon={Cpu} /></StaggerItem>
        </Stagger>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <ChartCard title="实时流量" description="最近 80 秒，每 2 秒追加一个点">
            <AreaTrend data={traffic} x="t" series={[{ key: "请求", label: "请求 / 秒" }]} height={240} showAxis={false} />
          </ChartCard>
          <ChartCard title="实时日志" description="可暂停，向上翻阅时不会被拉回底部">
            <LogStream lines={logs} height={220} className="-mx-1" />
          </ChartCard>
        </div>
        <h2 className="mb-3 mt-8 text-sm font-medium text-muted-foreground">服务状态 · 最近 30 分钟</h2>
        <StatusBoard services={SERVICES} />
      </AppShell>
    </>
  );
}
