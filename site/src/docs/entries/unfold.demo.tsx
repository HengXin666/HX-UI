import * as React from "react";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnfold } from "@/motion/use-unfold";
import { UNFOLD_DEFAULTS, type UnfoldType } from "@/motion/unfold";
import type { DemoProps } from "../types";

interface Change {
  id: string;
  kind: "新增" | "修复" | "改进";
  text: string;
}
interface Release {
  id: string;
  title: string;
  date: string;
  items: Change[];
}

const RELEASES: Release[] = [
  { id: "2.7.0", title: "2.7.0", date: "11-28", items: [
    { id: "a", kind: "新增", text: "useUnfold: 通用的展开 / 收起动效" },
    { id: "b", kind: "新增", text: "Tree animation 参数" },
    { id: "c", kind: "改进", text: "上下文检视器的构成表展开有动画" },
  ] },
  { id: "2.6.1", title: "2.6.1", date: "11-27", items: [
    { id: "a", kind: "修复", text: "Tree 外观对齐目录树" },
    { id: "b", kind: "修复", text: "连接线落在箭头中线上" },
  ] },
  { id: "2.6.0", title: "2.6.0", date: "11-26", items: [
    { id: "a", kind: "新增", text: "通用树组件 Tree" },
    { id: "b", kind: "新增", text: "懒加载, 级联勾选, 键盘导航" },
    { id: "c", kind: "改进", text: "文档页加 Tree 示例" },
    { id: "d", kind: "改进", text: "ui-check 纯逻辑自检" },
  ] },
  { id: "2.5.0", title: "2.5.0", date: "11-24", items: Array.from({ length: 12 }, (_, i) => ({ id: String(i), kind: "改进" as const, text: `Agent 组件细节打磨 ${i + 1}` })) },
];

type Line = { key: string; release: Release } | { key: string; change: Change };

const ROW = "flex h-8 min-w-0 items-center gap-2 rounded-md px-2 text-sm";

/** 真实场景: 更新日志, 点版本展开它的条目 (可同时开多个) */
export default function UnfoldDemo({ values }: DemoProps) {
  const [open, setOpen] = React.useState<string[]>(["2.7.0"]);
  const type: UnfoldType = values.animation === "fade" || values.animation === "none" ? values.animation : "slide";
  const lines = React.useMemo(
    () => RELEASES.flatMap((r): Line[] => [{ key: r.id, release: r }, ...(open.includes(r.id) ? r.items.map((c) => ({ key: `${r.id}/${c.id}`, change: c })) : [])]),
    [open],
  );
  const { entries, ref } = useUnfold(lines, (l) => l.key, { type, duration: Number(values.duration ?? UNFOLD_DEFAULTS.duration), stagger: Number(values.stagger ?? UNFOLD_DEFAULTS.stagger) });
  const toggle = (id: string) => setOpen((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  return (
    <div className="w-full max-w-md rounded-xl border bg-popover p-3 text-popover-foreground shadow-float">
      <div className="flex items-center gap-1.5 pb-2">
        <span className="text-sm font-medium">更新日志</span>
        <button type="button" onClick={() => setOpen(RELEASES.map((r) => r.id))} className="ml-auto rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors duration-150 hover:bg-accent/60 hover:text-foreground">全部展开</button>
        <button type="button" onClick={() => setOpen([])} className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors duration-150 hover:bg-accent/60 hover:text-foreground">全部收起</button>
      </div>
      <div className="grid h-[22rem] content-start gap-0.5 overflow-y-auto overscroll-contain rounded-lg border bg-background/50 p-1.5">
        {entries.map(({ key, item, exiting }) =>
          "release" in item ? (
            <button
              key={key}
              ref={ref(key)}
              type="button"
              aria-expanded={open.includes(item.release.id)}
              onClick={() => toggle(item.release.id)}
              className={cn(ROW, "w-full text-left font-medium transition-colors duration-150 hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-ring")}
            >
              <ChevronRightIcon aria-hidden className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none", open.includes(item.release.id) && "rotate-90")} />
              <span className="tabular">{item.release.title}</span>
              <span className="ml-auto text-xs font-normal text-muted-foreground tabular">{item.release.date}</span>
            </button>
          ) : (
            <div key={key} ref={ref(key)} inert={exiting || undefined} aria-hidden={exiting || undefined} className={cn(ROW, "pl-8 text-muted-foreground")}>
              <span className={cn("shrink-0 rounded-sm border px-1 text-[11px] leading-4", item.change.kind === "修复" ? "text-warning" : item.change.kind === "新增" ? "text-success" : "text-brand")}>{item.change.kind}</span>
              <span className="min-w-0 truncate text-foreground">{item.change.text}</span>
            </div>
          ),
        )}
      </div>
      <p className="px-1 pt-2.5 text-xs text-muted-foreground">点版本号开合；连点、展开中途收起都会从当前位置接着走。</p>
    </div>
  );
}
