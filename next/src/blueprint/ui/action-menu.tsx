import { m } from "motion/react";
import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { nodesAcceptingPin, type PinMatch } from "../connect";
import { createIdGen } from "../ids";
import type { GraphOp } from "../ops";
import type { NodeDef, PinRef } from "../types";
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

interface Item { readonly def: NodeDef; readonly pin?: string | undefined; readonly conversion?: string | undefined }

function matches(def: NodeDef, q: string): boolean {
  if (!q) return true;
  const hay = `${def.title} ${def.id} ${def.category} ${def.description ?? ""}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
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
    if (from && contextual) return nodesAcceptingPin(from.type, from.dir, reg).map((x: PinMatch) => ({ def: x.node, pin: x.pin, conversion: x.conversion }));
    const accepting = from ? new Map(nodesAcceptingPin(from.type, from.dir, reg).map((x) => [x.node.id, x])) : undefined;
    return [...reg.nodes.values()].filter((d) => !d.internal)
      .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title))
      .map((def) => ({ def, pin: accepting?.get(def.id)?.pin, conversion: accepting?.get(def.id)?.conversion }));
  }, [reg, from, contextual]);
  const items = useMemo(() => all.filter((i) => matches(i.def, query.trim())), [all, query]);
  const groups = useMemo(() => {
    const out = new Map<string, { item: Item; index: number }[]>();
    items.forEach((item, index) => out.set(item.def.category, [...(out.get(item.def.category) ?? []), { item, index }]));
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
    const probe = layoutNode({ id, type: item.def.id, x: 0, y: 0 }, reg, ed.graph);
    const pinAt = item.pin && from ? probe.pins.get(pinKey(from.dir === "out" ? "in" : "out", item.pin)) : undefined;
    const snap = (v: number) => (ed.snap > 1 ? Math.round(v / ed.snap) * ed.snap : Math.round(v));
    const x = snap(at.x - (pinAt?.x ?? 0));
    const y = Math.round(at.y - (pinAt?.y ?? 0));
    const ops: GraphOp[] = [{ op: "addNode", id, type: item.def.id, at: [x, y] }];
    if (from && item.pin) {
      const mine = { node: id, pin: item.pin };
      ops.push(from.dir === "out" ? { op: "connect", from: from.ref, to: mine } : { op: "connect", from: mine, to: from.ref });
    }
    ed.apply(ops, { label: `添加 ${item.def.title}` });
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
              <div key={item.def.id} id={`${listId}-${index}`} role="option" aria-selected={index === active}
                onPointerMove={() => setActive(index)} onClick={() => pick(item)}
                className="flex cursor-default items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground">
                <span className="truncate">{item.def.title}</span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{item.conversion ? "自动转换" : item.pin ?? ""}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </m.div>
  );
}
