import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { DemoProps } from "../types";

const ROWS = {
  all: [["TL-20518", "林晓", "待发货"], ["TL-20517", "周屿", "已发货"], ["TL-20516", "陈默", "已完成"]],
  pending: [["TL-20518", "林晓", "待发货"]],
  done: [["TL-20516", "陈默", "已完成"]],
} as const;

/** 真实场景: 订单页按状态切换 */
export default function TabsDemo({ values }: DemoProps) {
  const vertical = values.orientation === "vertical";
  return (
    <div className="w-full max-w-lg rounded-2xl border bg-background/85 p-5 shadow-float backdrop-blur">
      <Tabs defaultValue="all" orientation={vertical ? "vertical" : "horizontal"} className={vertical ? "flex-row gap-5" : undefined}>
        <TabsList variant={values.variant as "default" | "line"}>
          <TabsTrigger value="all">全部{values.counts ? <span className="font-mono text-xs text-muted-foreground">128</span> : null}</TabsTrigger>
          <TabsTrigger value="pending">待发货{values.counts ? <span className="font-mono text-xs text-muted-foreground">12</span> : null}</TabsTrigger>
          <TabsTrigger value="done">已完成{values.counts ? <span className="font-mono text-xs text-muted-foreground">96</span> : null}</TabsTrigger>
          <TabsTrigger value="refund" disabled>退款</TabsTrigger>
        </TabsList>
        {(Object.keys(ROWS) as (keyof typeof ROWS)[]).map((k) => (
          <TabsContent key={k} value={k} className={vertical ? "" : "pt-3"}>
            <ul className="divide-y text-sm">
              {ROWS[k].map(([id, who, st]) => (
                <li key={id} className="flex items-center gap-3 py-2.5">
                  <span className="font-mono text-xs text-muted-foreground">{id}</span>
                  <span className="flex-1">{who}</span>
                  <Badge variant="secondary" dot={st === "待发货" ? "warning" : "success"}>{st}</Badge>
                </li>
              ))}
            </ul>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
