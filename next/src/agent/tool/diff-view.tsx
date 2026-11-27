"use client";
import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiffRow } from "../parts/diff";

export interface DiffViewProps {
  rows: DiffRow[];
  /** 超过多少行折叠 (DSH: 9 行够放文件头 + 一对增删 + 上下各 3 行) */
  fold?: number;
  className?: string;
}

/** 统一 diff 视图: 旧 / 新行号, 增删行底色, 超长折叠 */
export function DiffView({ rows, fold = 12, className }: DiffViewProps) {
  const [open, setOpen] = React.useState(false);
  const shown = !open && rows.length > fold ? rows.slice(0, fold) : rows;
  const w = String(rows.reduce((mx, r) => Math.max(mx, r.oldNo ?? 0, r.newNo ?? 0), 0)).length;
  return (
    <div data-slot="diff" className={cn("hx-code overflow-hidden rounded-md border border-[var(--hx-code-border)] bg-[var(--hx-code-bg)] font-mono text-xs leading-5 text-[var(--hx-code-fg)]", className)}>
      <div className="overflow-x-auto scrollbar-thin">
        <div className="w-max min-w-full py-1">
          {shown.map((r, i) =>
            r.kind === "hunk" ? (
              <div key={i} className="px-3 py-0.5 text-[var(--hx-code-muted)] italic">{r.text}</div>
            ) : (
              <div key={i} className={cn("flex", r.kind === "add" && "bg-[var(--hx-code-add)]", r.kind === "del" && "bg-[var(--hx-code-del)]")}>
                <span aria-hidden className="shrink-0 select-none pl-2 text-right text-[var(--hx-code-ln)] tabular" style={{ width: `${w + 1}ch` }}>{r.oldNo ?? ""}</span>
                <span aria-hidden className="shrink-0 select-none pl-2 text-right text-[var(--hx-code-ln)] tabular" style={{ width: `${w + 1}ch` }}>{r.newNo ?? ""}</span>
                <span aria-hidden className={cn("w-6 shrink-0 select-none text-center", r.kind === "add" && "text-[var(--hx-code-add-fg)]", r.kind === "del" && "text-[var(--hx-code-del-fg)]")}>{r.kind === "add" ? "+" : r.kind === "del" ? "-" : ""}</span>
                <span className="whitespace-pre pr-4">{r.text || "\u200b"}</span>
              </div>
            ),
          )}
        </div>
      </div>
      {rows.length > fold && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-center gap-1.5 border-t border-[var(--hx-code-border)] py-1 text-[var(--hx-code-muted)] transition-colors duration-150 hover:text-[var(--hx-code-fg)]">
          <ChevronsUpDown className="size-3.5" />
          {open ? "收起" : `展开其余 ${rows.length - fold} 行`}
        </button>
      )}
    </div>
  );
}

/** +12 -3 (悬停行时上色) */
export function DiffStat({ added, removed }: { added: number; removed: number }) {
  if (!added && !removed) return null;
  return (
    <span className="font-mono tabular">
      <span className="group-hover/row:text-success">+{added}</span> <span className="group-hover/row:text-destructive">-{removed}</span>
    </span>
  );
}
