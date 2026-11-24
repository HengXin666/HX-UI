"use client";

import { Boxes, FunctionSquare, GitFork, Library, Plus, Search, SquareStack, Variable as VariableIcon, Workflow, X, MoreHorizontal } from "lucide-react";
import { useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { callSites, brokenCallSites } from "../functions";
import { createIdGen } from "../ids";
import { libraryItemId, type BlueprintLibrary } from "../library";
import { VAR_GET, VAR_SET } from "../registry";
import type { SubGraphDef, VariableDef } from "../types";
import { ContextMenu, type MenuEntry } from "./context-menu";
import type { BlueprintEditor, InspectTarget } from "./editor";
import { typeColor } from "./geometry";
import { KIND_LABEL, uniqueName } from "./labels";
import { SUBGRAPH_MIME, VARIABLE_MIME } from "./use-canvas";
import { Empty, ICON_BTN, Section, typeName } from "./wb-ui";

/**
 * My Blueprint (UE5): everything the document defines, in sections:
 *   图表      the main event graph and collapsed graphs
 *   函数      functions (call sites anywhere, own locals, pure / const)
 *   宏        macros (inlined, any number of exec pins)
 *   变量      graph variables, grouped by category
 *   局部变量  inside a function: its locals, plus its inputs (read only getters)
 *   库        registry libraries: drag in or import
 *
 * Click = show in Details, double-click = open (rename for variables), F2 = rename, Delete = delete,
 * drag onto the canvas = a call node / a Get node (Alt = Set), right-click or ⋯ = more. Arrow keys
 * walk the list. Every change is one undo step on the shared editor.
 */

export interface MyBlueprintPanelProps {
  readonly editor: BlueprintEditor;
  readonly className?: string;
  /** "查找引用": called with a query (the workbench opens its 查找结果 dock). */
  readonly onFindReferences?: (query: string) => void;
}

type Item =
  | { readonly t: "main" }
  | { readonly t: "subgraph"; readonly sg: SubGraphDef }
  | { readonly t: "variable"; readonly v: VariableDef; readonly local?: string | undefined }
  | { readonly t: "param"; readonly v: VariableDef; readonly sg: string }
  | { readonly t: "library"; readonly lib: BlueprintLibrary; readonly item: SubGraphDef };

const itemKey = (i: Item) =>
  i.t === "main" ? "main" : i.t === "subgraph" ? `sg:${i.sg.id}` : i.t === "variable" ? `var:${i.local ?? ""}:${i.v.id}` : i.t === "param" ? `param:${i.sg}:${i.v.id}` : `lib:${i.lib.id}:${i.item.id}`;

const nameOf = (i: Item) => (i.t === "main" ? "事件图" : i.t === "subgraph" ? i.sg.label ?? i.sg.id : i.t === "library" ? i.item.label ?? i.item.id : i.v.name);

export function MyBlueprintPanel({ editor: ed, className = "", onFindReferences }: MyBlueprintPanelProps) {
  useSyncExternalStore(ed.subscribe, ed.version, ed.version);
  const root = ed.root;
  const reg = ed.registry;
  const ro = ed.readOnly;
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ item: Item; sx: number; sy: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const q = query.trim().toLowerCase();
  const hit = (i: Item) => !q || nameOf(i).toLowerCase().includes(q) || (i.t === "subgraph" && (i.sg.keywords ?? "").toLowerCase().includes(q));

  const subs = Object.values(root.subgraphs ?? {});
  const graphs = subs.filter((s) => (s.kind ?? "graph") === "graph");
  const fns = subs.filter((s) => s.kind === "function");
  const macros = subs.filter((s) => s.kind === "macro");
  const here = ed.subgraph !== undefined ? root.subgraphs?.[ed.subgraph] : undefined;
  const inFn = here?.kind === "function" ? here : undefined;
  const refs = useMemo(() => {
    // Get / Set counts per variable id over every level
    const m = new Map<string, number>();
    const count = (nodes: SubGraphDef["nodes"]) => nodes.forEach((n) => { if ((n.type === VAR_GET || n.type === VAR_SET) && n.variable) m.set(n.variable, (m.get(n.variable) ?? 0) + 1); });
    count(root.nodes);
    subs.forEach((s) => count(s.nodes));
    return m;
  }, [root]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------- actions
  const inspected = ed.inspected;
  const isInspected = (i: Item) => {
    if (!inspected) return false;
    if (i.t === "subgraph") return inspected.kind === "subgraph" && inspected.id === i.sg.id;
    if (i.t === "variable") return inspected.kind === "variable" && inspected.id === i.v.id && (inspected.sg ?? "") === (i.local ?? "");
    if (i.t === "main") return inspected.kind === "graph";
    return false;
  };
  const isOpen = (i: Item) => (i.t === "main" ? ed.subgraph === undefined : i.t === "subgraph" && ed.subgraph === i.sg.id);
  const focusName = (key: string) => requestAnimationFrame(() => box.current?.querySelector<HTMLElement>(`[data-mb-key="${CSS.escape(key)}"]`)?.focus());

  const inspect = (i: Item) => {
    const t: InspectTarget | undefined = i.t === "main" ? { kind: "graph" } : i.t === "subgraph" ? { kind: "subgraph", id: i.sg.id }
      : i.t === "variable" ? { kind: "variable", id: i.v.id, sg: i.local } : undefined;
    if (t) ed.inspect(t);
  };
  const open = (i: Item) => {
    if (i.t === "main") return ed.open(undefined);
    if (i.t === "subgraph") return ed.open(i.sg.id);
    if (i.t === "library") return importLib(i);
    if (i.t === "variable") setRenaming(itemKey(i));
  };
  const importLib = (i: Extract<Item, { t: "library" }>) => {
    const r = ed.applyDocument([{ op: "importLibrary", library: i.lib, items: [i.item.id], replace: false }], { label: "导入库函数" });
    if (r && !r.errors.length) {
      const id = libraryItemId(i.lib.id, i.item.id);
      ed.inspect({ kind: "subgraph", id });
      ed.notify(`已导入「${i.item.label ?? i.item.id}」，拖到画布即可调用`);
    }
  };
  const rename = (i: Item, name: string) => {
    const n = name.trim();
    setRenaming(null);
    // keep focus in the list (keyboard users continue from the row; Ctrl Z still reaches the workbench)
    focusName(itemKey(i));
    if (!n || n === nameOf(i)) return;
    if (i.t === "subgraph") ed.applyDocument([{ op: "updateSubgraph", id: i.sg.id, label: n }], { label: "重命名" });
    else if (i.t === "variable") ed.applyAt(i.local, [{ op: "updateVariable", id: i.v.id, name: n }], { label: "重命名变量" });
    else if (i.t === "main") ed.applyDocument([{ op: "setMeta", name: n }], { label: "重命名图" });
    else if (i.t === "param") {
      const sg = root.subgraphs?.[i.sg];
      const pin = i.v.id.slice(4);
      const entry = sg?.nodes.find((x) => x.type === "subgraph.in");
      const inputs = (entry?.pins?.outputs ?? []).map((p) => (p.id === pin ? { ...p, label: n } : p));
      ed.applyDocument([{ op: "setSignature", id: i.sg, inputs }], { label: "重命名输入" });
    }
  };
  const remove = (i: Item) => {
    if (i.t === "subgraph") {
      const n = callSites(root, i.sg.id).length;
      ed.applyDocument([{ op: "removeSubgraph", id: i.sg.id }], { label: "删除" });
      ed.notify(`已删除「${nameOf(i)}」${n ? `和 ${n} 处调用` : ""}，Ctrl Z 可撤销`);
    } else if (i.t === "variable") {
      const n = refs.get(i.v.id) ?? 0;
      ed.applyAt(i.local, [{ op: "removeVariable", id: i.v.id }], { label: "删除变量" });
      ed.notify(`已删除变量「${i.v.name}」${n ? `和 ${n} 个节点` : ""}，Ctrl Z 可撤销`);
    }
  };
  const duplicate = (i: Item) => {
    if (i.t === "subgraph") {
      const r = ed.applyDocument([{ op: "duplicateSubgraph", id: i.sg.id }], { label: "复制" });
      const id = r?.created["#0"];
      if (id) { ed.inspect({ kind: "subgraph", id }); focusName(`sg:${id}`); }
    } else if (i.t === "variable") {
      const list = i.local ? root.subgraphs?.[i.local]?.variables ?? [] : root.variables ?? [];
      ed.applyAt(i.local, [{
        op: "addVariable", name: uniqueName(`${i.v.name} 副本`, list.map((v) => v.name)), type: i.v.type, local: Boolean(i.local),
        ...(i.v.default !== undefined ? { default: i.v.default } : {}), ...(i.v.category ? { category: i.v.category } : {}),
      }], { label: "复制变量" });
    }
  };
  const create = (what: "function" | "macro" | "graph" | "variable" | "local") => {
    if (what === "variable" || what === "local") {
      const sg = what === "local" ? inFn?.id : undefined;
      const list = sg ? inFn?.variables ?? [] : root.variables ?? [];
      const r = ed.applyAt(sg, [{ op: "addVariable", name: uniqueName("新变量", list.map((v) => v.name)), type: reg.type("number") ? "number" : "boolean", default: reg.type("number") ? 0 : false, local: what === "local" }], { label: "添加变量" });
      const id = r?.created["#0"];
      if (id) { ed.inspect({ kind: "variable", id, sg }); setRenaming(`var:${sg ?? ""}:${id}`); }
      return;
    }
    const base = what === "function" ? "新函数" : what === "macro" ? "新宏" : "新图表";
    const label = uniqueName(base, subs.map((s) => s.label ?? s.id));
    const id = createIdGen(root)("sg");
    // a collapsed graph lives in the main graph: its node goes in view there (same undo step)
    const v = ed.viewport;
    const host = ed.el;
    const at = ed.subgraph === undefined && host ? ed.toGraph(host.clientWidth / 2 - 100 * v.z, host.clientHeight / 2 - 40 * v.z) : { x: 0, y: 0 };
    const r = ed.applyDocument([
      { op: "addSubgraph", id, kind: what, label },
      ...(what === "graph" ? [{ op: "addNode" as const, type: "subgraph", subgraph: id, at: [Math.round(at.x / 16) * 16, Math.round(at.y / 16) * 16] as const }] : []),
    ], { label: `添加${KIND_LABEL[what]}` });
    if (!r || r.errors.length) return;
    ed.open(id);
    ed.inspect({ kind: "subgraph", id });
    setRenaming(`sg:${id}`);
  };
  const convert = (sg: SubGraphDef, kind: "graph" | "function" | "macro") => {
    const r = ed.applyDocument([{ op: "updateSubgraph", id: sg.id, kind }], { label: "转换类型" });
    if (r?.errors.length) ed.notify("函数只能有一个执行输入和一个执行输出");
  };

  const menuFor = (i: Item): MenuEntry[] => {
    const name = nameOf(i);
    const items: MenuEntry[] = [];
    if (i.t === "main" || i.t === "subgraph") items.push({ label: "打开", keys: "Enter", run: () => open(i) });
    if (i.t === "library") items.push({ label: "导入到文档", disabled: ro, run: () => importLib(i) });
    if (i.t !== "library") items.push({ label: "重命名", keys: "F2", disabled: ro, run: () => setRenaming(itemKey(i)) });
    if (i.t === "subgraph" || i.t === "variable") items.push({ label: "复制一份", disabled: ro, run: () => duplicate(i) });
    if (i.t === "subgraph") {
      const kind = i.sg.kind ?? "graph";
      for (const k of ["graph", "function", "macro"] as const) {
        if (k === kind) continue;
        items.push({ label: kind === "graph" && k === "function" ? "提升为函数" : `转换为${KIND_LABEL[k]}`, disabled: ro, run: () => convert(i.sg, k) });
      }
    }
    if (onFindReferences && i.t !== "main" && i.t !== "library") items.push({ label: "查找引用", run: () => onFindReferences(name) });
    if (i.t === "subgraph" || i.t === "variable") items.push({ kind: "sep" }, { label: "删除", keys: "Delete", danger: true, disabled: ro, run: () => remove(i) });
    return items;
  };

  // ---------------------------------------------------------------- rows
  const onDragStart = (e: React.DragEvent, i: Item) => {
    if (i.t === "subgraph") e.dataTransfer.setData(SUBGRAPH_MIME, i.sg.id);
    else if (i.t === "library") e.dataTransfer.setData(SUBGRAPH_MIME, `lib|${i.lib.id}|${i.item.id}`);
    else if (i.t === "variable" || i.t === "param") e.dataTransfer.setData(VARIABLE_MIME, i.v.id);
    else return e.preventDefault();
    e.dataTransfer.setData("text/plain", nameOf(i));
    e.dataTransfer.effectAllowed = "copy";
  };
  const onRowKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: Item) => {
    const list = [...(box.current?.querySelectorAll<HTMLElement>("[data-mb-key]") ?? [])];
    const at = list.indexOf(e.currentTarget);
    if (e.key === "ArrowDown") { e.preventDefault(); list[Math.min(list.length - 1, at + 1)]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); list[Math.max(0, at - 1)]?.focus(); }
    else if (e.key === "Home") { e.preventDefault(); list[0]?.focus(); }
    else if (e.key === "End") { e.preventDefault(); list[list.length - 1]?.focus(); }
    else if (e.key === "F2" && !ro && i.t !== "library") { e.preventDefault(); setRenaming(itemKey(i)); }
    else if ((e.key === "Delete" || e.key === "Backspace") && !ro && (i.t === "subgraph" || i.t === "variable")) { e.preventDefault(); remove(i); }
    else if (e.key === "Enter") { e.preventDefault(); inspect(i); open(i); }
    else if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      const b = box.current!.getBoundingClientRect();
      setMenu({ item: i, sx: r.left - b.left + 24, sy: r.bottom - b.top });
    }
  };

  const row = (i: Item, icon: ReactNode, meta?: ReactNode, opts: { readonly bad?: boolean; readonly draggable?: boolean; readonly title?: string } = {}) => {
    const key = itemKey(i);
    const name = nameOf(i);
    const active = isInspected(i);
    const opened = isOpen(i);
    if (renaming === key) {
      return (
        <li key={key} className="px-1.5 py-0.5">
          <input autoFocus defaultValue={name} aria-label={`重命名「${name}」`} spellCheck={false}
            onBlur={(e) => rename(i, e.currentTarget.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") { setRenaming(null); focusName(key); }
            }}
            className="h-7 w-full rounded-md border bg-background px-2 text-xs outline-none ring-2 ring-ring/40" />
        </li>
      );
    }
    return (
      <li key={key} className="group/row relative px-1.5">
        <button type="button" data-mb-key={key} draggable={!ro && opts.draggable !== false && i.t !== "main"}
          onDragStart={(e) => onDragStart(e, i)} onClick={() => inspect(i)} onDoubleClick={() => open(i)} onKeyDown={(e) => onRowKey(e, i)}
          onContextMenu={(e) => {
            e.preventDefault();
            const b = box.current!.getBoundingClientRect();
            setMenu({ item: i, sx: e.clientX - b.left, sy: e.clientY - b.top });
          }}
          aria-current={opened ? "page" : undefined} aria-pressed={active}
          title={opts.title}
          className={`flex h-7 w-full min-w-0 items-center gap-2 rounded-md pr-7 pl-2 text-left text-[13px] outline-none hover:bg-accent/70 focus-visible:ring-2 focus-visible:ring-ring/50 aria-pressed:bg-accent aria-pressed:text-accent-foreground ${opened ? "font-medium" : ""}`}>
          <span aria-hidden className="grid size-4 shrink-0 place-items-center text-muted-foreground">{icon}</span>
          <span className={`min-w-0 flex-1 truncate ${opts.bad ? "text-destructive" : ""}`}>{name}</span>
          {meta ? <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{meta}</span> : null}
        </button>
        {ro && i.t !== "library" ? null : (
          <button type="button" aria-label={`更多操作：${name}`} tabIndex={-1}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const b = box.current!.getBoundingClientRect();
              setMenu({ item: i, sx: r.left - b.left, sy: r.bottom - b.top + 2 });
            }}
            className={`${ICON_BTN} absolute top-0 right-2 size-7 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100`}>
            <MoreHorizontal className="size-3.5" />
          </button>
        )}
      </li>
    );
  };

  const dot = (type: string) => <span className="size-2.5 rounded-full" style={{ background: typeColor(reg, type.replace(/^(array|set)<(.+)>$/, "$2").replace(/^map<[^,]+,(.+)>$/, "$1")) }} />;
  const sgRow = (sg: SubGraphDef) => {
    const n = callSites(root, sg.id).length;
    const broken = brokenCallSites(root, sg.id, reg).length;
    const icon = sg.kind === "function" ? <FunctionSquare className="size-3.5" /> : sg.kind === "macro" ? <SquareStack className="size-3.5" /> : <Workflow className="size-3.5" />;
    return row({ t: "subgraph", sg }, icon, (
      <>
        {sg.pure ? <span className="mr-1.5">纯</span> : null}
        {sg.library ? <span className="mr-1.5">库</span> : null}
        {broken ? <span className="mr-1.5 text-destructive">{broken} 处失配</span> : null}
        {n ? `×${n}` : "未调用"}
      </>
    ), { bad: broken > 0, title: sg.description });
  };
  const add = (label: string, what: Parameters<typeof create>[0]) => ro ? undefined : (
    <button type="button" aria-label={label} title={label} onClick={() => create(what)} className={ICON_BTN}><Plus className="size-3.5" /></button>
  );
  const list = (items: readonly Item[], render: (i: Item) => ReactNode, empty: string) => {
    const shown = items.filter(hit);
    if (!shown.length) return q ? null : <Empty>{empty}</Empty>;
    return <ul className="space-y-px">{shown.map(render)}</ul>;
  };

  // variables grouped by category (no category first)
  const vars = root.variables ?? [];
  const cats = [...new Set(vars.map((v) => v.category ?? ""))].sort((a, b) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b)));
  const varRow = (i: Item) => {
    const v = (i as Extract<Item, { t: "variable" }>).v;
    return row(i, dot(v.type), <span className="truncate">{typeName(reg, v.type)}{refs.get(v.id) ? ` · ${refs.get(v.id)}` : ""}</span>, { title: v.tooltip });
  };
  const libs = reg.libraries;
  const forceOpen = q ? true : undefined;
  const count = (items: readonly Item[]) => items.filter(hit).length;
  const graphItems: Item[] = [{ t: "main" }, ...graphs.map((sg) => ({ t: "subgraph" as const, sg }))];
  const fnItems: Item[] = fns.map((sg) => ({ t: "subgraph" as const, sg }));
  const macroItems: Item[] = macros.map((sg) => ({ t: "subgraph" as const, sg }));
  const varItems: Item[] = vars.map((v) => ({ t: "variable" as const, v }));
  const localItems: Item[] = inFn ? [
    ...(ed.graph.params ?? []).map((v) => ({ t: "param" as const, v, sg: inFn.id })),
    ...(inFn.variables ?? []).map((v) => ({ t: "variable" as const, v, local: inFn.id })),
  ] : [];
  const libItems: Item[] = libs.flatMap((lib) => Object.values(lib.items).map((item) => ({ t: "library" as const, lib, item })));

  return (
    <div ref={box} tabIndex={-1} aria-label="我的蓝图" role="region" className={`relative flex min-h-0 flex-col bg-background text-foreground outline-none ${className}`}>
      <div className="flex items-center gap-1.5 border-b px-2 py-1.5">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索图表、函数、变量" aria-label="搜索我的蓝图" spellCheck={false}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Escape") setQuery(""); if (e.key === "ArrowDown") { e.preventDefault(); box.current?.querySelector<HTMLElement>("[data-mb-key]")?.focus(); } }}
            className="h-7 w-full rounded-md border bg-background pr-7 pl-7 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50" />
          {query ? <button type="button" aria-label="清除搜索" onClick={() => setQuery("")} className={`${ICON_BTN} absolute top-0 right-0`}><X className="size-3.5" /></button> : null}
        </div>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        <Section title="图表" count={count(graphItems)} open={forceOpen} actions={add("新建图表", "graph")}>
          {list(graphItems, (i) => (i.t === "main" ? row(i, <GitFork className="size-3.5" />, root.meta?.name ? undefined : "主图") : sgRow((i as Extract<Item, { t: "subgraph" }>).sg)), "")}
        </Section>
        <Section title="函数" count={count(fnItems)} open={forceOpen} actions={add("新建函数", "function")}>
          {list(fnItems, (i) => sgRow((i as Extract<Item, { t: "subgraph" }>).sg), "还没有函数。选中节点后右键「折叠为函数」，或点 + 新建。")}
        </Section>
        <Section title="宏" count={count(macroItems)} open={forceOpen} actions={add("新建宏", "macro")}>
          {list(macroItems, (i) => sgRow((i as Extract<Item, { t: "subgraph" }>).sg), "还没有宏。")}
        </Section>
        <Section title="变量" count={count(varItems)} open={forceOpen} actions={add("新建变量", "variable")}>
          {cats.length > 1 || (cats.length === 1 && cats[0]) ? cats.map((c) => {
            const items = varItems.filter((i) => ((i as Extract<Item, { t: "variable" }>).v.category ?? "") === c);
            if (!items.some(hit)) return null;
            return (
              <div key={c || "_"}>
                <div className="px-3.5 pt-1 pb-0.5 text-[11px] text-muted-foreground">{c || "未分类"}</div>
                {list(items, varRow, "")}
              </div>
            );
          }) : list(varItems, varRow, "还没有变量。点 + 新建，再拖到画布：直接拖是获取，按住 Alt 是设置。")}
        </Section>
        {inFn ? (
          <Section title={`局部变量 · ${inFn.label ?? inFn.id}`} count={count(localItems)} open={forceOpen} actions={add("新建局部变量", "local")}>
            {list(localItems, (i) => (i.t === "param"
              ? row(i, dot(i.v.type), "输入", { title: "函数输入：拖到画布得到它的获取节点（只读）" })
              : varRow(i)), "函数的输入可以在这里拖出获取节点；局部变量每次调用都会重置。")}
          </Section>
        ) : null}
        {libItems.length ? (
          <Section title="库" count={count(libItems)} open={forceOpen} defaultOpen={false}>
            {libs.map((lib) => {
              const items = libItems.filter((i) => (i as Extract<Item, { t: "library" }>).lib === lib);
              if (!items.some(hit)) return null;
              return (
                <div key={lib.id}>
                  <div className="flex items-center gap-1.5 px-3.5 pt-1 pb-0.5 text-[11px] text-muted-foreground"><Library aria-hidden className="size-3" />{lib.name}{lib.version ? ` ${lib.version}` : ""}</div>
                  {list(items, (i) => {
                    const it = (i as Extract<Item, { t: "library" }>).item;
                    const inDoc = Boolean(root.subgraphs?.[libraryItemId(lib.id, it.id)]);
                    return row(i, it.kind === "macro" ? <SquareStack className="size-3.5" /> : <Boxes className="size-3.5" />, inDoc ? "已导入" : it.category, { title: it.description });
                  }, "")}
                </div>
              );
            })}
          </Section>
        ) : null}
        <p className="px-3 py-2 text-[11px] leading-4 text-muted-foreground">
          <VariableIcon aria-hidden className="mr-1 inline size-3 align-[-2px]" />拖到画布：函数、宏得到调用节点；变量得到获取节点，按住 Alt 得到设置节点。
        </p>
      </div>
      {menu ? <ContextMenu title={nameOf(menu.item)} items={menuFor(menu.item)} sx={menu.sx} sy={menu.sy} host={box.current} onClose={() => setMenu(null)} /> : null}
    </div>
  );
}

export default MyBlueprintPanel;
