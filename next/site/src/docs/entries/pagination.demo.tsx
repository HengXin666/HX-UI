import * as React from "react";
import { PaginationBar } from "@/components/ui/pagination";
import type { DemoProps } from "../types";

/** 真实场景: 表格底部 */
export default function PaginationDemo({ values }: DemoProps) {
  const [page, setPage] = React.useState(5);
  const total = Number(values.total);
  const pageSize = Number(values.pageSize);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  React.useEffect(() => setPage((p) => Math.min(p, pages)), [pages]);
  const start = (page - 1) * pageSize;
  return (
    <div className="w-full max-w-2xl rounded-2xl border bg-background/85 shadow-float backdrop-blur">
      <ul className="divide-y text-sm">
        {Array.from({ length: Math.min(3, total - start) }, (_, i) => start + i + 1).map((n) => (
          <li key={n} className="flex items-center gap-3 px-4 py-2.5">
            <span className="font-mono text-xs text-muted-foreground">TL-{String(30000 - n)}</span>
            <span className="flex-1">订单 #{n}</span>
            <span className="tabular-nums text-muted-foreground">¥{(n * 37.5).toFixed(2)}</span>
          </li>
        ))}
        <li className="px-4 py-2 text-center text-xs text-muted-foreground">…</li>
      </ul>
      <PaginationBar className="border-t px-4 py-3" page={page} total={total} pageSize={pageSize} onPageChange={setPage} siblings={Number(values.siblings)} showRange={Boolean(values.showRange)} />
    </div>
  );
}
