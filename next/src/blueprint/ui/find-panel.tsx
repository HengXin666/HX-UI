import { Search, X } from "lucide-react";
import { m } from "motion/react";
import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { findVariable } from "../ports";
import { TUNNEL_IN, TUNNEL_OUT, VAR_GET, VAR_SET } from "../registry";
import type { BlueprintNode, SubgraphScope } from "../types";
import type { BlueprintEditor } from "./editor";

/**
 * Find (UE5 "Find Results", Ctrl+F). Searches every level of the document: titles, node types,
 * node comments, text values and variable names. Picking a result opens its level (full breadcrumb
 * path), selects the node and frames it; the panel stays open so you can walk the results.
 * Lazily loaded by <Blueprint>.
 */

interface Hit {
  readonly key: string;
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly where: string;
}

function nodeTitle(ed: BlueprintEditor, n: BlueprintNode, scope: SubgraphScope): string {
  if (n.title) return n.title;
  if (n.type === VAR_GET || n.type === VAR_SET) {
    const v = findVariable(scope, n.variable)?.name ?? "?";
    return n.type === VAR_GET ? v : `设置 ${v}`;
  }
  if (n.subgraph !== undefined) return ed.root.subgraphs?.[n.subgraph]?.label ?? n.subgraph;
  return ed.registry.node(n.type)?.title ?? n.type;
}

function collect(ed: BlueprintEditor): (Hit & { hay: string })[] {
  const root = ed.root;
  const out: (Hit & { hay: string })[] = [];
  const level = (nodes: readonly BlueprintNode[], sg: string | undefined, where: string, scope: SubgraphScope) => {
    for (const n of nodes) {
      if (n.type === TUNNEL_IN || n.type === TUNNEL_OUT) continue;
      const title = nodeTitle(ed, n, scope);
      const def = ed.registry.node(n.type);
      const texts = Object.values(n.values ?? {}).filter((v): v is string => typeof v === "string");
      const vals = Object.entries(n.values ?? {}).slice(0, 2).map(([k, v]) => `${k}：${typeof v === "string" ? v : JSON.stringify(v)}`);
      out.push({
        key: sg === undefined ? n.id : `${sg}/${n.id}`, id: n.id, title, where,
        detail: [def?.title !== title ? def?.title : undefined, n.comment, ...vals].filter(Boolean).join(" · "),
        hay: [title, n.type, def?.title, def?.category, n.comment, ...texts].filter(Boolean).join(" ").toLowerCase(),
      });
    }
  };
  level(root.nodes, undefined, "主图", root);
  for (const sg of Object.values(root.subgraphs ?? {})) {
    const kind = sg.kind === "function" ? "函数" : sg.kind === "macro" ? "宏" : "折叠图";
    level(sg.nodes, sg.id, `${kind} · ${sg.label ?? sg.id}`, { ...root, ...(sg.variables ? { locals: sg.variables } : {}) });
  }
  return out;
}

export default function FindPanel({ ed, onClose }: { ed: BlueprintEditor; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const all = useMemo(() => collect(ed), [ed, ed.root]); // eslint-disable-line react-hooks/exhaustive-deps
  const q = query.trim().toLowerCase();
  const hits = useMemo(() => (q ? all.filter((h) => q.split(/\s+/).every((w) => h.hay.includes(w))) : []), [all, q]);

  useLayoutEffect(() => input.current?.focus(), []);
  useLayoutEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  const go = (h: Hit) => {
    const local = ed.reveal(h.key);
    requestAnimationFrame(() => {
      ed.select([local]);
      ed.fit([local]);
    });
  };
  const onKey = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(hits.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const h = hits[active];
      if (h) {
        go(h);
        if (hits.length > 1) setActive((active + 1) % hits.length);
      }
    }
  };

  return (
    <m.div data-bp-overlay role="dialog" aria-label="查找节点" onKeyDown={onKey} onPointerDown={(e) => e.stopPropagation()}
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
      className="absolute top-12 right-2 z-30 flex w-72 max-w-[calc(100%-1rem)] flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-float">
      <div className="flex items-center gap-2 border-b px-2.5">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input ref={input} value={query} placeholder="查找节点、注释、值…" spellCheck={false}
          role="combobox" aria-expanded={hits.length > 0} aria-controls={listId} aria-label="查找节点"
          aria-activedescendant={hits.length ? `${listId}-${active}` : undefined}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        <button type="button" aria-label="关闭" onClick={onClose} className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-4" /></button>
      </div>
      <div className="px-3 pt-1.5 pb-1 text-[11px] text-muted-foreground" aria-live="polite">
        {q ? (hits.length ? `${hits.length} 个结果，Enter 逐个跳转` : "没有找到") : "在主图和所有子图里查找"}
      </div>
      <div id={listId} role="listbox" aria-label="查找结果" className="scrollbar-thin max-h-64 overflow-y-auto p-1 pt-0">
        {hits.map((h, i) => (
          <div key={h.key} id={`${listId}-${i}`} role="option" aria-selected={i === active}
            onPointerMove={() => setActive(i)} onClick={() => { setActive(i); go(h); }}
            className="flex cursor-default flex-col gap-0.5 rounded-md px-2 py-1.5 aria-selected:bg-accent aria-selected:text-accent-foreground">
            <span className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate">{h.title}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{h.where}</span>
            </span>
            {h.detail ? <span className="truncate text-[11px] text-muted-foreground">{h.detail}</span> : null}
          </div>
        ))}
      </div>
    </m.div>
  );
}
