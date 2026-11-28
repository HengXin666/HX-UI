"use client";
/**
 * "过程行": 思考, 工具调用, 活动分组共用的一行可展开标题.
 *   [图标] 标题  摘要 (省略号)              [后缀: 耗时, 状态胶囊]  [箭头]
 * 进行中标题有微光; 展开体贴在左侧一条竖线后面 (和图标中线对齐).
 */
import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import "../agent.css";

export interface DisclosureProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  summary?: React.ReactNode;
  suffix?: React.ReactNode;
  /** 进行中: 标题微光 */
  running?: boolean;
  /** 状态色: 失败 / 中断 / 拒绝 时标题变色 */
  tone?: "default" | "error" | "warning";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 没有可展开的内容时, 行不可点, 不画箭头 */
  expandable?: boolean;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** 展开体不画左侧竖线 */
  flush?: boolean;
  "data-slot"?: string;
}

export function Disclosure({ icon, title, summary, suffix, running, tone = "default", open: openProp, defaultOpen = false, onOpenChange, expandable = true, children, className, bodyClassName, flush, ...rest }: DisclosureProps) {
  const [inner, setInner] = React.useState(defaultOpen);
  const open = openProp ?? inner;
  const setOpen = (v: boolean) => {
    if (openProp === undefined) setInner(v);
    onOpenChange?.(v);
  };
  const id = React.useId();
  const can = expandable && children != null;
  const head = (
    <>
      {icon != null && <span className={cn("grid size-5 shrink-0 place-items-center [&_svg]:size-3.5", tone === "error" ? "text-destructive" : tone === "warning" ? "text-warning" : "text-[var(--hx-agent-process)]")}>{icon}</span>}
      <span className={cn("shrink-0 font-medium", tone === "error" ? "text-destructive" : tone === "warning" ? "text-warning" : "text-foreground/85", running && "hx-shimmer-text")}>{title}</span>
      {summary != null && summary !== "" && <span className="min-w-0 flex-1 truncate text-[var(--hx-agent-process)]">{summary}</span>}
      {(summary == null || summary === "") && <span className="flex-1" />}
      {suffix != null && <span className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--hx-agent-process)] tabular">{suffix}</span>}
      {can && <ChevronRight aria-hidden className={cn("size-3.5 shrink-0 text-[var(--hx-agent-process)] opacity-0 transition-[transform,opacity] duration-200 group-hover/row:opacity-100 group-focus-visible/row:opacity-100", open && "rotate-90 opacity-100")} />}
    </>
  );
  return (
    <div data-slot={rest["data-slot"] ?? "disclosure"} data-state={open ? "open" : "closed"} className={cn("min-w-0 text-[13px]", className)}>
      {can ? (
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="group/row -mx-1.5 flex h-8 w-[calc(100%+0.75rem)] min-w-0 items-center gap-2 rounded-md px-1.5 text-left transition-colors duration-150 hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-ring">
          {head}
        </button>
      ) : (
        <div className="flex h-8 min-w-0 items-center gap-2">{head}</div>
      )}
      {can && open && (
        <div id={id} className={cn("animate-in fade-in-0 slide-in-from-top-1 duration-200", !flush && "ml-[9px] border-l pl-[17px]", "pb-1.5 pt-0.5", bodyClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}

/** 状态小胶囊: 退出码, 拒绝, 中断 */
export function StatusPill({ tone, children }: { tone: "error" | "warning" | "muted" | "success"; children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 items-center gap-1 rounded-full border px-1.5 text-[11px] leading-none text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", tone === "error" ? "bg-destructive" : tone === "warning" ? "bg-warning" : tone === "success" ? "bg-success" : "bg-muted-foreground/60")} />
      {children}
    </span>
  );
}
