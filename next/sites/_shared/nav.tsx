import { Activity, AlertTriangle, BarChart3, Boxes, Database, Gauge, LayoutDashboard, Network, Settings, Users } from "lucide-react";
import type { NavGroup } from "@sites/_blocks/shell/app-shell";
import { Badge } from "@/components/ui/badge";

export const OPS_NAV: NavGroup[] = [
  { items: [{ id: "overview", label: "总览", icon: LayoutDashboard }, { id: "alerts", label: "告警", icon: AlertTriangle, badge: <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">3</Badge> }] },
  { label: "资源", items: [{ id: "services", label: "服务", icon: Boxes }, { id: "db", label: "数据库", icon: Database }, { id: "net", label: "网络", icon: Network }] },
  { label: "观测", items: [{ id: "metrics", label: "指标", icon: Gauge }, { id: "traces", label: "链路", icon: Activity }] },
  { label: "设置", items: [{ id: "team", label: "成员", icon: Users }, { id: "settings", label: "设置", icon: Settings }] },
];

export const BI_NAV: NavGroup[] = [
  { items: [{ id: "dash", label: "经营看板", icon: BarChart3 }, { id: "users", label: "用户分析", icon: Users }, { id: "funnel", label: "转化漏斗", icon: Activity }] },
];
