import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { DemoProps } from "../types";

const ORDERS = [
  { id: "TL-20518", who: "林晓", amt: "¥1,280.00", st: "待发货" },
  { id: "TL-20517", who: "周屿", amt: "¥349.00", st: "已发货" },
  { id: "TL-20516", who: "陈默", amt: "¥2,016.50", st: "已完成" },
];

/** 真实场景: 订单列表点一行, 侧边抽屉看详情, 不丢列表滚动位置 */
export default function SheetDemo({ values }: DemoProps) {
  const side = values.side as "right" | "left" | "bottom" | "top";
  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border bg-background/85 shadow-float backdrop-blur">
      <p className="border-b px-4 py-3 text-sm font-medium">最近订单</p>
      <ul className="divide-y">
        {ORDERS.map((o) => (
          <li key={o.id}>
            <Sheet>
              <SheetTrigger asChild>
                <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none">
                  <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                  <span className="flex-1">{o.who}</span>
                  <span className="tabular-nums">{o.amt}</span>
                </button>
              </SheetTrigger>
              <SheetContent side={side} className={side === "bottom" || side === "top" ? "max-h-[70vh]" : undefined}>
                <SheetHeader>
                  <SheetTitle>订单 {o.id}</SheetTitle>
                  <SheetDescription>{o.who} · 2026-11-22 14:32</SheetDescription>
                </SheetHeader>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 px-4 text-sm">
                  <dt className="text-muted-foreground">状态</dt><dd><Badge variant="secondary" dot={o.st === "待发货" ? "warning" : "success"}>{o.st}</Badge></dd>
                  <dt className="text-muted-foreground">金额</dt><dd className="tabular-nums">{o.amt}</dd>
                  <dt className="text-muted-foreground">配送</dt><dd>顺丰标快 · 上海市徐汇区</dd>
                </dl>
                {values.footer ? (
                  <SheetFooter className="flex-row justify-end">
                    <SheetClose asChild><Button variant="outline">关闭</Button></SheetClose>
                    <Button>{o.st === "待发货" ? "去发货" : "查看物流"}</Button>
                  </SheetFooter>
                ) : null}
              </SheetContent>
            </Sheet>
          </li>
        ))}
      </ul>
    </div>
  );
}
