"use client";

import { AlertTriangle, CircleCheck, CircleX, Eye, Layers, Search, Trash2 } from "lucide-react";
import { useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { compileExpr } from "../expr";
import { resolveNodePath, callStackOf } from "../subgraph";
import type { ValidationIssue } from "../types";
import { issueText } from "./chrome";
import type { BlueprintEditor } from "./editor";
import { collectFind, filterFind, nodeTitle, revealFind } from "./find";
import { Empty, ICON_BTN, INPUT, PANEL_BTN } from "./wb-ui";

/**
 * Bottom dock (UE5 "Compiler Results" / "Find Results" / Blueprint Debugger):
 *   编译结果  every validation issue on every level; click to open its level and frame the node
 *   查找结果  document-wide search (definitions, nodes, comments, values)
 *   调用栈    when paused: the call sites leading to the paused node, outermost first; click a frame
 *   监视      watched pins and graph variable values from the last run
 *   断点      every breakpoint: enable, condition, hit count, hits this run, remove, remove all
 * A WAI-ARIA tablist (arrow keys move between tabs). Driven by the same BlueprintEditor.
 */

export type DockTab = "issues" | "find" | "stack" | "watch" | "breakpoints";

export interface DebugDockProps {
  readonly editor: BlueprintEditor;
  /** Controlled tab. */
  readonly tab?: DockTab;
  readonly onTabChange?: (tab: DockTab) => void;
  /** Controlled find query (the workbench sets it from "查找引用"). */
  readonly query?: string;
  readonly onQueryChange?: (q: string) => void;
  /** Hide the debugging tabs (调用栈 / 监视 / 断点). */
  readonly debug?: boolean;
  readonly className?: string;
  /** Extra controls at the right end of the tab strip (the workbench puts collapse there). */
  readonly actions?: ReactNode;
}

const LABEL: Record<DockTab, string> = { issues: "编译结果", find: "查找结果", stack: "调用栈", watch: "监视", breakpoints: "断点" };

export function DebugDock({ editor: ed, tab: ctl, onTabChange, query: qCtl, onQueryChange, debug = true, className = "", actions }: DebugDockProps) {
  useSyncExternalStore(ed.subscribe, ed.version, ed.version);
  const [own, setOwn] = useState<DockTab>("issues");
  const [qOwn, setQOwn] = useState("");
  const tab = ctl ?? own;
  const setTab = (t: DockTab) => { setOwn(t); onTabChange?.(t); };
  const query = qCtl ?? qOwn;
  const setQuery = (q: string) => { setQOwn(q); onQueryChange?.(q); };
  const uid = useId();
  const tabs: DockTab[] = debug ? ["issues", "find", "stack", "watch", "breakpoints"] : ["issues", "find"];
  const issues = ed.validation.all.issues;
  const errors = issues.filter((i) => i.level === "error").length;
  const st = ed.debug;
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = tabs.indexOf(tab);
    const go = (k: number) => { const t = tabs[(k + tabs.length) % tabs.length]!; setTab(t); document.getElementById(`${uid}-${t}`)?.focus(); };
    if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
    else if (e.key === "Home") { e.preventDefault(); go(0); }
    else if (e.key === "End") { e.preventDefault(); go(tabs.length - 1); }
  };
  const badge = (t: DockTab) => {
    if (t === "issues" && issues.length) return <span className={`ml-1 rounded px-1 text-[10px] tabular-nums ${errors ? "bg-destructive text-white" : "bg-muted text-foreground"}`}>{issues.length}</span>;
    if (t === "stack" && st.status === "paused") return <span aria-label="已暂停" className="ml-1.5 size-1.5 rounded-full bg-[var(--bp-break,#e11)]" />;
    if (t === "breakpoints" && ed.breakpoints.size) return <span className="ml-1 text-[10px] text-muted-foreground tabular-nums">{ed.breakpoints.size}</span>;
    return null;
  };

  return (
    <div className={`flex min-h-0 flex-col bg-background text-foreground ${className}`}>
      <div className="flex h-8 shrink-0 items-center gap-1 border-b pr-1 pl-1">
        <div role="tablist" aria-label="输出面板" className="scrollbar-none flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t} id={`${uid}-${t}`} type="button" role="tab" aria-selected={tab === t} aria-controls={`${uid}-panel`} tabIndex={tab === t ? 0 : -1}
              onClick={() => setTab(t)} onKeyDown={onTabKey}
              className="flex h-7 shrink-0 items-center rounded-md px-2 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-selected:bg-accent aria-selected:text-foreground">
              {LABEL[t]}{badge(t)}
            </button>
          ))}
        </div>
        {actions}
      </div>
      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-${tab}`} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {tab === "issues" ? <Issues ed={ed} /> : tab === "find" ? <Find ed={ed} query={query} setQuery={setQuery} />
          : tab === "stack" ? <Stack ed={ed} /> : tab === "watch" ? <Watch ed={ed} /> : <Breakpoints ed={ed} />}
      </div>
    </div>
  );
}

export default DebugDock;

const ROW = "flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1 text-left text-xs hover:bg-accent";

/** "主图" / "函数 · 名称" for a level key. */
function levelName(ed: BlueprintEditor, key: string): string {
  const i = key.lastIndexOf("/");
  if (i < 0) return "主图";
  const sg = ed.root.subgraphs?.[key.slice(0, i)];
  const kind = sg?.kind === "function" ? "函数" : sg?.kind === "macro" ? "宏" : "折叠图";
  return `${kind} · ${sg?.label ?? key.slice(0, i)}`;
}

function titleOfKey(ed: BlueprintEditor, key: string): string {
  const i = key.lastIndexOf("/");
  const sg = i < 0 ? undefined : ed.root.subgraphs?.[key.slice(0, i)];
  const nodes = sg ? sg.nodes : ed.root.nodes;
  const n = nodes.find((x) => x.id === (i < 0 ? key : key.slice(i + 1)));
  return n ? nodeTitle(ed, n, sg ? { ...ed.root, ...(sg.variables ? { locals: sg.variables } : {}) } : ed.root) : key;
}

function Issues({ ed }: { ed: BlueprintEditor }) {
  const [filter, setFilter] = useState<"all" | "error" | "warning">("all");
  const all = ed.validation.all.issues;
  const list = filter === "all" ? all : all.filter((i) => i.level === filter);
  const go = (i: ValidationIssue) => {
    const id = i.nodeIds?.[0] ?? i.edgeIds?.[0];
    if (!id) return;
    const local = ed.reveal(id);
    requestAnimationFrame(() => {
      if (i.nodeIds?.length) { ed.select([local]); ed.fit([local]); } else ed.select({ edges: [local] });
    });
  };
  if (!all.length) return <p className="flex items-center gap-2 px-3 py-2 text-xs"><CircleCheck aria-hidden className="size-3.5 text-success" />编译通过，没有错误或警告。</p>;
  return (
    <div>
      <div role="radiogroup" aria-label="筛选" className="flex gap-0.5 px-2 pt-1.5">
        {(["all", "error", "warning"] as const).map((f) => (
          <button key={f} type="button" role="radio" aria-checked={filter === f} onClick={() => setFilter(f)}
            className="h-6 rounded px-2 text-[11px] text-muted-foreground aria-checked:bg-accent aria-checked:text-foreground">
            {f === "all" ? `全部 ${all.length}` : f === "error" ? `错误 ${all.filter((i) => i.level === "error").length}` : `警告 ${all.filter((i) => i.level === "warning").length}`}
          </button>
        ))}
      </div>
      <ul className="p-1">
        {list.map((i, k) => (
          <li key={k}>
            <button type="button" className={ROW} onClick={() => go(i)} title={i.message}>
              {i.level === "error" ? <CircleX aria-label="错误" className="size-3.5 shrink-0 text-destructive" /> : <AlertTriangle aria-label="警告" className="size-3.5 shrink-0 text-warning" />}
              <span className="min-w-0 flex-1 truncate">{issueText(ed, i)}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{levelName(ed, i.nodeIds?.[0] ?? i.edgeIds?.[0] ?? "")}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Find({ ed, query, setQuery }: { ed: BlueprintEditor; query: string; setQuery: (q: string) => void }) {
  const all = useMemo(() => collectFind(ed), [ed, ed.root]); // eslint-disable-line react-hooks/exhaustive-deps
  const hits = useMemo(() => filterFind(all, query), [all, query]);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-2 pt-1.5">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input ref={input} data-dock-find autoFocus value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }} spellCheck={false}
            placeholder="在所有图里查找节点、函数、变量、注释、值" aria-label="查找" role="combobox" aria-expanded={hits.length > 0} aria-controls={listId}
            aria-activedescendant={hits.length ? `${listId}-${active}` : undefined}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(hits.length - 1, a + 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              else if (e.key === "Enter") { e.preventDefault(); const h = hits[active]; if (h) { revealFind(ed, h); setActive((active + 1) % Math.max(1, hits.length)); } }
              else if (e.key === "Escape") setQuery("");
            }}
            className={`${INPUT} pl-7`} />
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground" aria-live="polite">{query.trim() ? `${hits.length} 个结果` : ""}</span>
      </div>
      {query.trim() && !hits.length ? <Empty>没有找到。</Empty> : null}
      <div id={listId} role="listbox" aria-label="查找结果" className="p-1">
        {hits.map((h, i) => (
          <div key={h.key} id={`${listId}-${i}`} role="option" aria-selected={i === active} onClick={() => { setActive(i); revealFind(ed, h); }}
            className="flex cursor-default items-center gap-2 rounded-md px-2 py-1 text-xs aria-selected:bg-accent">
            <span className="min-w-0 truncate">{h.title}</span>
            {h.detail ? <span className="min-w-0 truncate text-[11px] text-muted-foreground">{h.detail}</span> : null}
            <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{h.where}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stack({ ed }: { ed: BlueprintEditor }) {
  const st = ed.debug;
  if (st.status !== "paused" || !st.at) {
    return <Empty>{st.status === "idle" ? "运行后在断点或单步处暂停时，这里列出调用栈。" : st.status === "running" ? "运行中…暂停后显示调用栈。" : "运行已结束。"}</Empty>;
  }
  const frames = callStackOf(ed.root, st.at.node).reverse();
  const go = (key: string) => {
    const local = ed.reveal(key);
    requestAnimationFrame(() => { ed.select([local]); ed.fit([local]); });
  };
  return (
    <ol aria-label="调用栈" className="p-1">
      {frames.map((f, i) => (
        <li key={f.path}>
          <button type="button" className={ROW} onClick={() => go(f.key)} aria-current={i === 0 ? "step" : undefined}>
            <Layers aria-hidden className={`size-3.5 shrink-0 ${i === 0 ? "text-foreground" : "text-muted-foreground"}`} />
            <span className={`min-w-0 flex-1 truncate ${i === 0 ? "font-medium" : ""}`}>{titleOfKey(ed, f.key)}</span>
            <span className="shrink-0 text-[11px] text-muted-foreground">{i === 0 ? "暂停于 · " : "调用自 · "}{levelName(ed, f.key)}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function fmt(v: unknown): string {
  if (v === undefined) return "未定义";
  if (typeof v === "string") return JSON.stringify(v);
  try { return JSON.stringify(v instanceof Set ? [...v] : v instanceof Map ? Object.fromEntries(v) : v) ?? String(v); } catch { return String(v); }
}

function Watch({ ed }: { ed: BlueprintEditor }) {
  const st = ed.debug;
  const byKey = new Map<string, Readonly<Record<string, unknown>>>();
  for (const [path, v] of st.values) { const r = resolveNodePath(ed.root, path); if (r) byKey.set(r.key, v); }
  const watches = [...ed.watches];
  const vars = st.result?.variables;
  return (
    <div className="p-1">
      {watches.length ? (
        <ul aria-label="监视的引脚">
          {watches.map((w) => {
            const [key, pinKey] = w.split("|") as [string, string];
            const out = pinKey.startsWith("out:");
            const pin = pinKey.slice(pinKey.indexOf(":") + 1);
            const val = out ? byKey.get(key)?.[pin] : undefined;
            const has = out ? byKey.get(key) && pin in byKey.get(key)! : false;
            return (
              <li key={w} className="flex items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-accent">
                <Eye aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 truncate">{titleOfKey(ed, key)} · {pin}</span>
                <span className="min-w-0 flex-1 truncate text-right font-mono text-[11px]">{has ? fmt(val) : out ? "—" : "输入（悬停引脚看值）"}</span>
                <button type="button" aria-label={`取消监视 ${pin}`} className={ICON_BTN}
                  onClick={() => ed.removeWatch(w)}>
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : <Empty>右键一个引脚选「监视此值」，运行后在这里看它的值。</Empty>}
      {vars && vars.size ? (
        <>
          <div className="px-2 pt-2 pb-1 text-[11px] font-medium text-muted-foreground">图变量（运行结束时）</div>
          <ul>
            {(ed.root.variables ?? []).map((v) => (
              <li key={v.id} className="flex items-center gap-2 px-2 py-0.5 text-xs">
                <span className="min-w-0 truncate">{v.name}</span>
                <span className="ml-auto truncate font-mono text-[11px]">{fmt(vars.get(v.id))}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function Breakpoints({ ed }: { ed: BlueprintEditor }) {
  const keys = [...ed.breakpoints];
  const hits = ed.debug.hits;
  if (!keys.length) return <Empty>还没有断点。选中节点按 F9，或在细节面板里勾选「断点」。条件断点可以写引脚值和 hit（第几次到达）。</Empty>;
  return (
    <div className="p-1">
      <div className="flex items-center justify-end px-1 pb-1">
        <button type="button" className={`${PANEL_BTN} hover:text-destructive`} onClick={() => ed.clearBreakpoints()} title="Ctrl Shift F9"><Trash2 className="size-3.5" aria-hidden />删除全部</button>
      </div>
      <ul aria-label="断点" className="space-y-1">
        {keys.map((k) => {
          const spec = ed.breakpointSpecs.get(k);
          const err = spec?.condition ? compileExpr(spec.condition).error : undefined;
          const go = () => { const local = ed.reveal(k); requestAnimationFrame(() => { ed.select([local]); ed.fit([local]); }); };
          return (
            <li key={k} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md px-2 py-1 text-xs hover:bg-accent/50">
              <input type="checkbox" aria-label={`启用断点 ${titleOfKey(ed, k)}`} checked={spec?.enabled !== false} className="size-3.5 accent-foreground"
                onChange={(e) => ed.setBreakpointSpec(k, { ...spec, enabled: e.target.checked })} />
              <button type="button" onClick={go} className="min-w-0 max-w-[40%] truncate text-left hover:underline">{titleOfKey(ed, k)}</button>
              <span className="shrink-0 text-[11px] text-muted-foreground">{levelName(ed, k)}</span>
              <input key={spec?.condition ?? ""} defaultValue={spec?.condition ?? ""} placeholder="条件（可选）" aria-label={`条件 ${titleOfKey(ed, k)}`} aria-invalid={err ? true : undefined} spellCheck={false}
                onBlur={(e) => { if (e.currentTarget.value !== (spec?.condition ?? "")) ed.setBreakpointSpec(k, { ...spec, condition: e.currentTarget.value.trim() }); }}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") e.currentTarget.blur(); }}
                className={`${INPUT} h-6 min-w-24 flex-1 font-mono aria-invalid:border-destructive`} title={err ? `条件写法有误：${err}` : undefined} />
              <input key={`h${spec?.hitCount ?? ""}`} type="number" min={1} step={1} defaultValue={spec?.hitCount ?? ""} placeholder="次数" aria-label={`命中次数 ${titleOfKey(ed, k)}`}
                onBlur={(e) => { const n = e.currentTarget.value === "" ? undefined : Math.max(1, Math.round(Number(e.currentTarget.value))); if (n !== spec?.hitCount) ed.setBreakpointSpec(k, { ...spec, hitCount: n }); }}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") e.currentTarget.blur(); }}
                className={`${INPUT} h-6 w-16 font-mono`} />
              <span className="w-14 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">{hits.get(k) ? `到达 ${hits.get(k)}` : ""}</span>
              <button type="button" aria-label={`删除断点 ${titleOfKey(ed, k)}`} className={ICON_BTN} onClick={() => ed.removeBreakpoint(k)}><Trash2 className="size-3.5" /></button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
