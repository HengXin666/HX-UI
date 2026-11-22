import type * as React from "react";

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
