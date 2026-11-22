import * as React from "react";
import { Download, LineChart, ShoppingCart, UserPlus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@sites/_blocks/shell/app-shell";
import { ThemeToggle } from "@sites/_blocks/shell/theme-toggle";
import { PageHeader } from "@sites/_blocks/shell/page-header";
import { StatCard } from "@sites/_blocks/dashboard/stat-card";
import { ChartCard } from "@sites/_blocks/analytics/chart-card";
import { Segmented } from "@sites/_blocks/analytics/segmented";
import { AreaTrend } from "@/data/charts/area-trend";
import { BarCompare } from "@/data/charts/bar-compare";
import { Donut } from "@/data/charts/donut";
import { DataTable, type ColumnDef } from "@/data/table/data-table";
import { Stagger, StaggerItem } from "@/motion/reveal";
import { cn } from "@/lib/utils";
import { BI_NAV } from "@sites/_shared/nav";
import { UserChip } from "@sites/_shared/user-chip";
import { channels, daily, orders, regions, revenue, spark, type Order } from "@sites/_shared/data";

const cny = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" });
const STATUS_CLS: Record<Order["status"], string> = {
  已支付: "bg-success/12 text-success",
  待支付: "bg-warning/15 text-warning",
  已退款: "bg-muted text-muted-foreground",
};

const columns: ColumnDef<Order>[] = [
  { accessorKey: "id", header: "订单号", cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
  { accessorKey: "customer", header: "客户" },
  { accessorKey: "plan", header: "套餐", cell: (c) => <Badge variant="outline">{c.getValue<string>()}</Badge> },
  { accessorKey: "amount", header: "金额", cell: (c) => <span className="tabular">{cny.format(c.getValue<number>())}</span> },
  { accessorKey: "status", header: "状态", cell: (c) => <span className={cn("rounded-full px-2 py-0.5 text-xs", STATUS_CLS[c.getValue<Order["status"]>()])}>{c.getValue<string>()}</span> },
  { accessorKey: "date", header: "日期", cell: (c) => <span className="tabular text-muted-foreground">{c.getValue<string>()}</span> },
];

export default function Analytics() {
  const [range, setRange] = React.useState<"7" | "14" | "30">("30");
  const series = daily.slice(-Number(range));
  return (
    <>
      <AppShell
        brand={<span className="flex items-center gap-2 font-semibold"><LineChart className="size-5 text-brand" />Lumen 分析</span>}
        nav={BI_NAV}
        active="dash"
        onNavigate={() => undefined}
        footer={<UserChip />}
        actions={<><Segmented value={range} onChange={setRange} options={[{ value: "7", label: "7 天" }, { value: "14", label: "14 天" }, { value: "30", label: "30 天" }]} /><ThemeToggle /></>}
      >
        <PageHeader title="经营看板" description="2026 年 11 月 · 数据截至今日 02:00" actions={<Button variant="outline" size="sm"><Download className="size-4" />导出</Button>} />
        <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 [&>*]:min-w-0">
          <StaggerItem><StatCard label="营收" value={3_128_406.52} format={{ style: "currency", currency: "CNY", maximumFractionDigits: 0 }} delta={0.186} trend={spark(300)} icon={Wallet} /></StaggerItem>
          <StaggerItem><StatCard label="订单" value={18_427} delta={0.092} trend={spark(180)} icon={ShoppingCart} /></StaggerItem>
          <StaggerItem><StatCard label="新增用户" value={6_215} delta={-0.037} trend={spark(60)} icon={UserPlus} /></StaggerItem>
          <StaggerItem><StatCard label="转化率" value={0.0493} format={{ style: "percent", maximumFractionDigits: 2 }} delta={0.051} trend={spark(5)} icon={LineChart} /></StaggerItem>
        </Stagger>
        <div className="mt-4 grid gap-4 [&>*]:min-w-0 xl:grid-cols-3">
          <ChartCard className="xl:col-span-2" title="访问量与访客" description={`最近 ${range} 天`}>
            <AreaTrend data={series} x="day" series={[{ key: "访问", label: "访问" }, { key: "访客", label: "独立访客", color: "var(--chart-2)" }]} height={280} />
          </ChartCard>
          <ChartCard title="流量来源" description="本月会话占比">
            <Donut data={channels} centerLabel="会话" size={240} />
          </ChartCard>
          <ChartCard className="xl:col-span-2" title="月度营收构成" description="订阅 + 增购，单位 元">
            <BarCompare data={revenue} x="month" series={[{ key: "订阅", label: "订阅" }, { key: "增购", label: "增购", color: "var(--chart-2)" }]} stacked height={260} />
          </ChartCard>
          <ChartCard title="区域订单" description="本月 vs 上月">
            <BarCompare data={regions} x="region" horizontal series={[{ key: "本月", label: "本月" }, { key: "上月", label: "上月", color: "var(--chart-3)" }]} height={260} />
          </ChartCard>
        </div>
        <h2 className="mb-3 mt-8 text-sm font-medium text-muted-foreground">最近订单</h2>
        <DataTable data={orders} columns={columns} searchable searchPlaceholder="搜索订单号 / 客户 / 套餐…" pageSize={8} />
      </AppShell>
    </>
  );
}
