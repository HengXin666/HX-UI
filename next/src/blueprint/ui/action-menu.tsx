import { m } from "motion/react";
import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { nodesAcceptingPin, type PinMatch } from "../connect";
import { createIdGen } from "../ids";
import type { GraphOp } from "../ops";
import { getPorts } from "../ports";
import { libraryItemId } from "../library";
import { SUBGRAPH_NODE, TUNNEL_OUT, VAR_GET, VAR_SET } from "../registry";
import type { BlueprintNode, NodeDef, PinRef, SubgraphScope } from "../types";
import type { BlueprintEditor } from "./editor";
import { layoutNode, pinKey } from "./geometry";
import { TYPE_LABEL } from "./labels";

/**
 * UE5 "All Actions" menu: opens at the cursor (right-click on empty canvas, Tab, or dropping a
 * wire on empty space), searchable, grouped by category, fully keyboard driven.
 * When opened from a dragged pin it lists only nodes that can take that wire ("仅显示可连接")
 * and connects the new node on pick, with its pin placed under the cursor.
 */

export interface MenuOrigin {
  /** The fixed end of the dragged wire. */
  readonly ref: PinRef;
  readonly dir: "in" | "out";
  readonly type: string;
}

export interface ActionMenuProps {
  readonly ed: BlueprintEditor;
  /** Screen position inside the editor element. */
  readonly sx: number;
  readonly sy: number;
  readonly from?: MenuOrigin | undefined;
  readonly onClose: () => void;
}

interface Item {
  readonly def: NodeDef;
  readonly pin?: string | undefined;
  readonly conversion?: string | undefined;
  /** Document items (function / macro call sites, variable Get / Set) override these. */
  readonly key?: string;
  readonly title?: string;
  readonly category?: string;
  readonly extra?: { readonly subgraph?: string; readonly variable?: string };
  /** Ops to run first (importing a library item into the document). */
  readonly prep?: readonly GraphOp[];
  readonly keywords?: string;
}

const titleOf = (i: Item) => i.title ?? i.def.title;
const catOf = (i: Item) => i.category ?? i.def.category;

function matches(i: Item, q: string): boolean {
  if (!q) return true;
  const hay = `${titleOf(i)} ${i.def.id} ${catOf(i)} ${i.def.description ?? ""} ${i.keywords ?? ""}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
}

/**
 * Items that come from the document rather than the registry: a call site for every function and
 * macro (UE5 lists them in the action menu), and Get / Set for every visible variable.
 */
function documentItems(ed: BlueprintEditor, from: MenuOrigin | undefined, contextual: boolean): Item[] {
  const reg = ed.registry;
  const g = ed.graph;
  const out: Item[] = [];
  const consider = (probe: BlueprintNode, base: Omit<Item, "pin">, scope: SubgraphScope = g) => {
    if (!from) return void out.push(base);
    const ports = getPorts(probe, reg, scope);
    const exec = reg.isExec(from.type);
    const pins = from.dir === "out" ? ports.inputs : ports.outputs;
    const hit = pins.find((p) => p.exec === exec && (from.dir === "out" ? reg.assignable(from.type, p.type) : reg.assignable(p.type, from.type)));
    if (hit || !contextual) out.push({ ...base, pin: hit?.id });
  };
  const subgraphDef = reg.node(SUBGRAPH_NODE)!;
  for (const sg of Object.values(ed.root.subgraphs ?? {})) {
    if (sg.kind !== "function" && sg.kind !== "macro") continue;
    if (sg.id === ed.subgraph) continue;
    consider({ id: "_", type: SUBGRAPH_NODE, x: 0, y: 0, subgraph: sg.id }, {
      def: subgraphDef, key: `sg:${sg.id}`, title: sg.label ?? sg.id, category: sg.category ?? (sg.kind === "function" ? "函数" : "宏"),
      extra: { subgraph: sg.id }, ...(sg.keywords || sg.description ? { keywords: `${sg.keywords ?? ""} ${sg.description ?? ""}` } : {}),
    });
  }
  // library items not yet in the document: picking one imports it (with what it calls)
  for (const lib of reg.libraries) {
    for (const item of Object.values(lib.items)) {
      const docId = libraryItemId(lib.id, item.id);
      if (ed.root.subgraphs?.[docId] || docId === ed.subgraph) continue;
      const scope: SubgraphScope = { ...g, subgraphs: { ...(g.subgraphs ?? {}), [docId]: item } };
      consider({ id: "_", type: SUBGRAPH_NODE, x: 0, y: 0, subgraph: docId }, {
        def: subgraphDef, key: `lib:${docId}`, title: item.label ?? item.id, category: item.category ?? lib.name,
        extra: { subgraph: docId }, prep: [{ op: "importLibrary", library: lib, items: [item.id], replace: false }],
        keywords: `${lib.name} ${item.keywords ?? ""} ${item.description ?? ""}`,
      }, scope);
    }
  }
  // inside a function: another Return node, and getters of its inputs
  if (g.locals !== undefined) {
    const sig = g.nodes.find((n) => n.type === TUNNEL_OUT)?.pins;
    const ret = reg.node(TUNNEL_OUT);
    if (ret) consider({ id: "_", type: TUNNEL_OUT, x: 0, y: 0, pins: { inputs: sig?.inputs ?? [] } }, { def: ret, key: "return", title: "返回节点", category: "函数", keywords: "return 返回" });
    for (const v of g.params ?? []) {
      consider({ id: "_", type: VAR_GET, x: 0, y: 0, variable: v.id }, { def: reg.node(VAR_GET)!, key: `param:${v.id}`, title: `获取 ${v.name}`, category: "函数输入", extra: { variable: v.id } });
    }
  }
  for (const v of [...(g.locals ?? []), ...(g.variables ?? [])]) {
    for (const t of [VAR_GET, VAR_SET]) {
      consider({ id: "_", type: t, x: 0, y: 0, variable: v.id }, {
        def: reg.node(t)!, key: `${t}:${v.id}`, title: t === VAR_GET ? `获取 ${v.name}` : `设置 ${v.name}`, category: "变量", extra: { variable: v.id },
      });
    }
  }
  return out;
}

/** The library definition behind a document id "<lib>:<item>" offered by the registry. */
function findLibItem(ed: BlueprintEditor, docId: string) {
  for (const lib of ed.registry.libraries) for (const item of Object.values(lib.items)) if (libraryItemId(lib.id, item.id) === docId) return item;
  return undefined;
}

export function ActionMenu({ ed, sx, sy, from, onClose }: ActionMenuProps) {
  const [query, setQuery] = useState("");
  const [contextual, setContextual] = useState(true);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: sx, top: sy });
  const listId = useId();
  const reg = ed.registry;

  const all = useMemo<Item[]>(() => {
    const docs = documentItems(ed, from, contextual);
    if (from && contextual) return [...docs, ...nodesAcceptingPin(from.type, from.dir, reg).map((x: PinMatch) => ({ def: x.node, pin: x.pin, conversion: x.conversion }))];
    const accepting = from ? new Map(nodesAcceptingPin(from.type, from.dir, reg).map((x) => [x.node.id, x])) : undefined;
    return [...docs, ...[...reg.nodes.values()].filter((d) => !d.internal)
      .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title))
      .map((def) => ({ def, pin: accepting?.get(def.id)?.pin, conversion: accepting?.get(def.id)?.conversion }))];
  }, [ed, reg, from, contextual]);
  const items = useMemo(() => {
    // listbox order must equal visual (grouped) order, so the arrow keys walk what you see
    const hits = all.filter((i) => matches(i, query.trim()));
    const cats = [...new Set(hits.map(catOf))];
    return cats.flatMap((c) => hits.filter((i) => catOf(i) === c));
  }, [all, query]);
  const groups = useMemo(() => {
    const out = new Map<string, { item: Item; index: number }[]>();
    items.forEach((item, index) => out.set(catOf(item), [...(out.get(catOf(item)) ?? []), { item, index }]));
    return [...out];
  }, [items]);

  // keep the menu inside the editor
  useLayoutEffect(() => {
    const el = boxRef.current;
    const host = ed.el;
    if (!el || !host) return;
    const left = Math.max(8, Math.min(sx, host.clientWidth - el.offsetWidth - 8));
    const top = Math.max(8, Math.min(sy, host.clientHeight - el.offsetHeight - 8));
    setPos({ left, top });
  }, [ed, sx, sy]);

  useLayoutEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  const pick = (item: Item) => {
    const at = ed.toGraph(sx, sy);
    const id = createIdGen(ed.root)("n");
    const lib = item.prep && item.extra?.subgraph ? { ...ed.graph, subgraphs: { ...(ed.graph.subgraphs ?? {}), [item.extra.subgraph]: findLibItem(ed, item.extra.subgraph)! } } : ed.graph;
    const probe = layoutNode({ id, type: item.def.id, x: 0, y: 0, ...item.extra }, reg, lib);
    const pinAt = item.pin && from ? probe.pins.get(pinKey(from.dir === "out" ? "in" : "out", item.pin)) : undefined;
    const snap = (v: number) => (ed.snap > 1 ? Math.round(v / ed.snap) * ed.snap : Math.round(v));
    const x = snap(at.x - (pinAt?.x ?? 0));
    const y = Math.round(at.y - (pinAt?.y ?? 0));
    const ops: GraphOp[] = [...(item.prep ?? []), { op: "addNode", id, type: item.def.id, at: [x, y], ...item.extra }];
    if (from && item.pin) {
      const mine = { node: id, pin: item.pin };
      ops.push(from.dir === "out" ? { op: "connect", from: from.ref, to: mine } : { op: "connect", from: mine, to: from.ref });
    }
    ed.apply(ops, { label: `添加 ${titleOf(item)}` });
    ed.select([id]);
    onClose();
    ed.el?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Escape") { e.preventDefault(); onClose(); ed.el?.focus(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Home" && e.ctrlKey) setActive(0);
    else if (e.key === "Enter") { e.preventDefault(); const it = items[active]; if (it) pick(it); }
    else if (e.key === "Tab") { e.preventDefault(); onClose(); ed.el?.focus(); }
  };

  const title = from ? `从「${TYPE_LABEL[from.type] ?? from.type}」${from.dir === "out" ? "输出" : "输入"}连出` : "全部操作";
  return (
    <m.div ref={boxRef} data-bp-overlay role="dialog" aria-label={title}
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
      className="absolute z-40 flex w-72 flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-float"
      style={{ left: pos.left, top: pos.top }} onKeyDown={onKey} onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between gap-2 border-b px-3 pt-2 pb-1.5">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        {from ? (
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" checked={contextual} onChange={(e) => { setContextual(e.target.checked); setActive(0); }} className="size-3 accent-foreground" />
            仅显示可连接
          </label>
        ) : null}
      </div>
      <input autoFocus value={query} placeholder="搜索节点…" spellCheck={false}
        role="combobox" aria-expanded="true" aria-controls={listId} aria-label="搜索节点"
        aria-activedescendant={items.length ? `${listId}-${active}` : undefined}
        onChange={(e) => { setQuery(e.target.value); setActive(0); }}
        className="h-9 border-b bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground" />
      <div id={listId} role="listbox" aria-label="节点" className="scrollbar-thin max-h-72 overflow-y-auto p-1">
        {groups.length === 0 ? <div className="px-2 py-6 text-center text-xs text-muted-foreground">没有匹配的节点</div> : null}
        {groups.map(([cat, list]) => (
          <div role="group" key={cat} aria-label={cat}>
            <div role="presentation" className="px-2 pt-2 pb-1 text-[11px] font-medium text-muted-foreground">{cat}</div>
            {list.map(({ item, index }) => (
              <div key={item.key ?? item.def.id} id={`${listId}-${index}`} role="option" aria-selected={index === active}
                onPointerMove={() => setActive(index)} onClick={() => pick(item)}
                className="flex cursor-default items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground">
                <span className="truncate">{titleOf(item)}</span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{item.conversion ? "自动转换" : item.pin ?? ""}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </m.div>
  );
}
