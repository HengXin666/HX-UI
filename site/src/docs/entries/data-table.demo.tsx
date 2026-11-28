import * as React from "react";
import { Download, Truck, Plus } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type ColumnDef } from "@/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DemoProps } from "../types";

type Order = { id: string; who: string; city: string; amount: number; status: "待发货" | "已发货" | "已完成" | "已退款"; at: string };
const NAMES = ["林晓", "周屿", "陈默", "苏青", "许诺", "顾川", "沈念", "江枫", "唐果", "白露", "叶舟", "温言"];
const CITIES = ["上海", "北京", "深圳", "杭州", "成都", "广州"];
const STATUS: Order["status"][] = ["待发货", "已发货", "已完成", "已完成", "已退款"];
const ORDERS: Order[] = Array.from({ length: 48 }, (_, i) => ({
  id: `TL-${20518 - i}`,
  who: NAMES[(i * 7) % NAMES.length],
  city: CITIES[(i * 5) % CITIES.length],
  amount: Math.round(((i * 7919) % 4000) + 89) + ((i * 37) % 100) / 100,
  status: STATUS[(i * 3) % STATUS.length],
  at: `11-${String(22 - Math.floor(i / 4)).padStart(2, "0")} ${String(9 + (i % 10)).padStart(2, "0")}:${String((i * 13) % 60).padStart(2, "0")}`,
}));
const TONE = { 待发货: "warning", 已发货: "info", 已完成: "success", 已退款: "muted" } as const;
const yuan = (n: number) => `¥${n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const COLUMNS: ColumnDef<Order>[] = [
  { accessorKey: "id", header: "订单号", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span> },
  { accessorKey: "who", header: "客户" },
  { accessorKey: "city", header: "城市" },
  { accessorKey: "amount", header: "金额", cell: ({ getValue }) => <span className="tabular-nums">{yuan(getValue<number>())}</span> },
  { accessorKey: "status", header: "状态", cell: ({ getValue }) => { const s = getValue<Order["status"]>(); return <Badge variant="secondary" dot={TONE[s]}>{s}</Badge>; } },
  { accessorKey: "at", header: "下单时间", cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{getValue<string>()}</span> },
];

/** 真实场景: 运营后台的订单列表 */
export default function DataTableDemo({ values }: DemoProps) {
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!values.loading) return setLoading(false);
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, [values.loading]);
  return (
    <div className="w-full max-w-4xl">
      <DataTable
        aria-label="订单"
        data={values.empty ? [] : ORDERS}
        columns={COLUMNS}
        getRowId={(r) => r.id}
        searchable={Boolean(values.searchable)}
        searchPlaceholder="搜索订单号、客户、城市…"
        pageSize={Number(values.pageSize)}
        density={values.density as "default" | "compact"}
        loading={loading}
        empty={<div className="grid gap-2"><p>还没有订单</p><Button size="sm" variant="outline" className="mx-auto"><Plus />创建第一笔</Button></div>}
        selectable={Boolean(values.selectable)}
        bulkActions={(rows, clear) => (
          <>
            <Button size="sm" variant="outline" onClick={() => toast.success(`已导出 ${rows.length} 笔订单`)}><Download />导出</Button>
            <Button size="sm" onClick={() => { toast.success(`${rows.length} 笔已标记发货`); clear(); }}><Truck />标记发货</Button>
          </>
        )}
        toolbar={<Button size="sm" variant="outline" onClick={() => toast("导出全部 48 笔")}><Download />导出</Button>}
        onRowClick={values.rowClick ? (r) => toast(`打开 ${r.id}`) : undefined}
      />
    </div>
  );
}
