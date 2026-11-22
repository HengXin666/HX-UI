import type * as React from "react";
import { Minus, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** 图表演示的卡片外壳: 标题 + 大数 + 图 */
export function ChartCard({ title, value, delta, children, wide }: { title: string; value?: string; delta?: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`w-full ${wide ? "max-w-3xl" : "max-w-2xl"} rounded-2xl border bg-background/85 p-5 shadow-float backdrop-blur`}>
      <p className="text-sm text-muted-foreground">{title}</p>
      {value && <p className="mt-1 text-2xl font-semibold tabular-nums">{value} {delta && <span className="text-sm font-normal">{delta}</span>}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** 可复现的伪随机, 演示数据每次一样 */
export function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/** 图表演示统一的数据操作条: 新增 / 删除 / 更新 / 重置, 用来看进场, 移位和退场动画 */
export function DataOps({ onAdd, onRemove, onUpdate, onReset, addLabel = "新增", removeLabel = "删除一个", updateLabel = "更新数值", canAdd = true, canRemove = true }: {
  onAdd: () => void; onRemove: () => void; onUpdate: () => void; onReset: () => void;
  addLabel?: string; removeLabel?: string; updateLabel?: string; canAdd?: boolean; canRemove?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="数据操作">
      <Button size="sm" variant="outline" onClick={onAdd} disabled={!canAdd}><Plus aria-hidden />{addLabel}</Button>
      <Button size="sm" variant="outline" onClick={onRemove} disabled={!canRemove}><Minus aria-hidden />{removeLabel}</Button>
      <Button size="sm" variant="outline" onClick={onUpdate}><RefreshCw aria-hidden />{updateLabel}</Button>
      <Button size="sm" variant="ghost" onClick={onReset}><RotateCcw aria-hidden />重置</Button>
    </div>
  );
}
