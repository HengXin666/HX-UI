"use client";

import { useMemo, useState, type JSX, type ReactNode } from "react";
import { cn } from "../primitives/utils";
import type { BlueprintRegistry, NodeTypeDef, PortDef } from "./types";
import { EXEC } from "./types";

/**
 * 节点面板。
 *
 * 一级分组用 category, 二级是节点。搜索走"子串 + 子序列"双路 
 * 只做子串时中英混排的目录很难命中 (打 "add" 搜不到 "AddNumber")。
 */

export interface PaletteGroup {
  readonly name: string;
  readonly items: readonly NodeTypeDef[];
}

export function groupByCategory(reg: BlueprintRegistry): PaletteGroup[] {
  const m = new Map<string, NodeTypeDef[]>();
  for (const def of reg.nodeTypes.values()) {
    const key = def.category ?? "未分组";
    const list = m.get(key);
    if (list) list.push(def);
    else m.set(key, [def]);
  }
  return [...m.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "zh"))
    .map(([name, items]) => ({ name, items: items.sort((a, b) => a.label.localeCompare(b.label, "zh")) }));
}

/** 模糊匹配: 子串命中, 或子序列命中。 */
export function fuzzyMatch(text: string, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let i = 0;
  for (const ch of t) {
    if (ch === q[i]) i += 1;
    if (i === q.length) return true;
  }
  return false;
}

/** 一项被拖到画布上时的落点。画布坐标。 */
export interface DropAt {
  readonly x: number;
  readonly y: number;
}

export interface BlueprintPaletteProps {
  readonly registry: BlueprintRegistry;
  /**
   * 某项被**拖到画布上**并松手。
   *
   * `at` 是画布坐标; 没有它表示"点了一下"  那种情况由调用方自己决定
   * 落在哪 (通常是视口中心)。两种交互都保留: 拖拽是主要方式,
   * 点击是键盘/无障碍用户的退路, 不能因为做了拖拽就把点击删掉。
   */
  readonly onPick: (type: string, at?: DropAt) => void;
  readonly className?: string;
  readonly placeholder?: string;
  /** 顶部插槽, 放"最近使用"之类。 */
  readonly header?: ReactNode;
  /** 拖拽时用于传递数据的 MIME 前缀。同一页有多套面板时用它区分。 */
  readonly dragMime?: string;
  /**
   * 关掉拖拽 (默认开)。
   *
   * 嵌在画布内部的浮层面板要关: 那个面板本身就是"拖线到空白处"弹出来的,
   * 它的语义是"选一个类型连到这里", 再拖一次没有意义, 而且拖到画布上会
   * 触发画布自己的 drop, 落点与预期不符。
   */
  readonly draggable?: boolean;
}

export function BlueprintPalette({
  registry, onPick, className, placeholder = "搜索节点…", header,
  dragMime = "application/x-hx-blueprint-node",
  draggable = true,
}: BlueprintPaletteProps): JSX.Element {
  const [q, setQ] = useState("");
  const [closed, setClosed] = useState<Set<string>>(() => new Set());
  const [dragging, setDragging] = useState<string | null>(null);
  const groups = useMemo(() => groupByCategory(registry), [registry]);

  const filtered = useMemo(() => {
    if (!q.trim()) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((d) => fuzzyMatch(d.label, q) || fuzzyMatch(d.type, q) || fuzzyMatch(g.name, q)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, q]);

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {header}
      {/* 提示: 不写这句话, 没人知道要拖  面板看起来只是个列表 */}
      <div className="border-b border-border px-2.5 py-1 text-[10.5px] text-muted-foreground">
        拖到画布上, 或点击添加
      </div>
      <div className="border-b border-border px-2.5 py-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="h-7 w-full rounded-md border border-border bg-background px-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5">
        {filtered.length === 0 && (
          <div className="px-2 py-6 text-center text-[12px] text-muted-foreground">没有匹配的节点</div>
        )}
        {filtered.map((g) => {
          // 搜索时强制展开: 命中项被折叠起来等于没搜到
          const open = q.trim() !== "" ? true : !closed.has(g.name);
          return (
            <div key={g.name} className="mb-0.5">
              <button
                type="button"
                onClick={() =>
                  setClosed((prev) => {
                    const next = new Set(prev);
                    if (next.has(g.name)) next.delete(g.name);
                    else next.add(g.name);
                    return next;
                  })
                }
                className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              >
                <span className={cn("inline-block transition-transform", open ? "rotate-90" : "")}>›</span>
                {g.name}
                <span className="ml-auto tabular-nums opacity-60">{g.items.length}</span>
              </button>
              {open && (
                <div className="mb-1">
                  {g.items.map((d) => (
                    <button
                      key={d.type}
                      type="button"
                      onClick={() => onPick(d.type)}
                      title={d.description ?? d.label}
                      /**
                       * 原生 HTML5 拖放。
                       *
                       * 为什么不用 pointer events 自己做: 跨元素拖拽时
                       * (从面板 -> 画布) 自己做要维护一套全局坐标与"拖影",
                       * 而原生拖放自带拖影、自带 dragover/dragleave 语义、
                       * 自带 Esc 取消。代价是 Safari 上 drag 预览样式不好控,
                       * 但能少写一百行。
                       */
                      draggable={draggable}
                      onDragStart={(e) => {
                        if (!draggable) return;
                        setDragging(d.type);
                        e.dataTransfer.setData(dragMime, d.type);
                        // 也塞一份纯文本, 拖到别的编辑器时不至于什么都没有
                        e.dataTransfer.setData("text/plain", d.label ?? d.type);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onDragEnd={() => setDragging(null)}
                      className={cn(
                        "flex w-full cursor-grab items-center gap-2 rounded px-1.5 py-1 text-left text-[12px] text-foreground transition-colors hover:bg-accent/50 active:cursor-grabbing",
                        dragging === d.type && "opacity-50"
                      )}
                    >
                      {d.icon ? <span className="shrink-0 opacity-70">{d.icon}</span> : null}
                      <span className="truncate">{d.label}</span>
                      {d.execIn ? <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">▷</span> : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 端口圆点。颜色只在这里决定一处。 */
export function PortDot({
  port, registry, filled, invalid, className,
}: {
  readonly port: PortDef;
  readonly registry: BlueprintRegistry;
  readonly filled?: boolean;
  readonly invalid?: boolean;
  readonly className?: string;
}): JSX.Element {
  const isExec = port.type === EXEC;
  const color = isExec ? undefined : registry.typeColor(port.type);
  return (
    <span
      className={cn(
        "pointer-events-none block size-[9px] shrink-0 rounded-full border",
        isExec
          ? "border-foreground bg-background"
          : cn("border-foreground/40", filled ? color ?? "bg-foreground" : "bg-background"),
        invalid && "border-destructive bg-destructive",
        className
      )}
    />
  );
}
