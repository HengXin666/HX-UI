import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { DemoProps } from "../types";

const PEOPLE = [["林晓", "产品经理", "LX"], ["周屿", "前端工程师", "ZY"], ["陈默", "设计师", "CM"]];

/** 骨架的形状要跟真实内容一致, 加载完不跳 */
export default function SkeletonDemo({ values }: DemoProps) {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => setLoading(Boolean(values.loading)), [values.loading]);
  const layout = String(values.layout);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div aria-busy={loading} aria-live="polite" className="rounded-2xl border bg-background/85 p-5 shadow-float backdrop-blur">
        {loading && <span className="sr-only">加载中</span>}
        {layout === "card" ? (
          loading ? (
            <div className="grid gap-3"><Skeleton className="aspect-[16/9] w-full rounded-xl" /><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div>
          ) : (
            <div className="grid gap-3"><div className="grid aspect-[16/9] w-full place-items-center rounded-xl bg-gradient-to-br from-brand/30 to-chart-2/30 text-sm text-muted-foreground">封面</div><p className="h-5 font-medium leading-5">2026 秋季发布会回顾</p><p className="text-sm leading-[1.25rem] text-muted-foreground">这一季我们重做了结账流程，把转化率提高了 18%，下面是完整的数据和方法。</p></div>
          )
        ) : (
          <ul className="grid gap-4">
            {PEOPLE.map(([n, r, a]) => (
              <li key={n} className="flex items-center gap-3">
                {loading ? <Skeleton className="size-10 rounded-full" /> : <span className="grid size-10 place-items-center rounded-full bg-accent text-sm font-medium">{a}</span>}
                <div className="grid flex-1 gap-1.5">
                  {loading ? <><Skeleton className="h-4 w-24" /><Skeleton className="h-3.5 w-36" /></> : <><p className="h-4 text-sm leading-4 font-medium">{n}</p><p className="h-3.5 text-[13px] leading-[0.875rem] text-muted-foreground">{r}</p></>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button variant="outline" size="sm" className="self-center" onClick={() => setLoading((v) => !v)}>{loading ? "加载完成" : "重新加载"}</Button>
    </div>
  );
}
