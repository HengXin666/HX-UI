import { GripVertical, Plus, Trash2, X } from "lucide-react";
import { m } from "motion/react";
import { useSyncExternalStore } from "react";
import { VAR_GET, VAR_SET } from "../registry";
import type { VariableDef } from "../types";
import type { BlueprintEditor } from "./editor";
import { typeColor } from "./geometry";
import { TYPE_LABEL } from "./labels";
import { VARIABLE_MIME } from "./use-canvas";

/**
 * Variables panel (UE5 "My Blueprint > Variables"): graph variables, plus the local variables of
 * the function being edited. Name, type (any registered non-exec type) and default are edited in
 * place; Get / Set nodes reference variables by id, so a rename shows up everywhere at once.
 *
 * Drag a variable's handle onto the canvas for a Get node, hold Alt while dropping for a Set node
 * (UE5 convention). The 获取 / 设置 buttons do the same at the centre of the view, for keyboard and
 * touch users.
 *
 * <Blueprint variables> docks it inside the editor (lazily loaded). To place it elsewhere, render
 * `<VariablesPanel editor={bp} />` from "@/blueprint/ui/variables-panel" next to the editor.
 */

export interface VariablesPanelProps {
  readonly editor: BlueprintEditor;
  /** Positioned over the canvas, top left (what <Blueprint variables> uses). */
  readonly docked?: boolean;
  readonly onClose?: () => void;
  readonly className?: string;
}

type Literal = "number" | "switch" | "text" | undefined;

export function VariablesPanel({ editor: ed, docked = false, onClose, className = "" }: VariablesPanelProps) {
  useSyncExternalStore(ed.subscribe, ed.version, ed.version);
  const reg = ed.registry;
  const view = ed.graph;
  const sg = ed.subgraph !== undefined ? ed.root.subgraphs?.[ed.subgraph] : undefined;
  const isFn = sg?.kind === "function";
  const types = [...reg.types.values()].filter((t) => t.shape !== "exec");
  const typeName = (id: string) => TYPE_LABEL[id] ?? reg.type(id)?.label ?? id;
  const literal = (type: string): Literal => {
    if (reg.shape(type) !== "data" || type === "any") return undefined;
    if (reg.assignable(type, "number")) return "number";
    if (reg.assignable(type, "boolean")) return "switch";
    if (reg.assignable(type, "string")) return "text";
    return undefined;
  };

  const add = (local: boolean) => {
    const taken = new Set([...(view.variables ?? []), ...(view.locals ?? [])].map((v) => v.name));
    let name = "新变量";
    for (let i = 2; taken.has(name); i++) name = `新变量 ${i}`;
    const type = reg.type("number") ? "number" : types[0]?.id ?? "any";
    ed.apply([{ op: "addVariable", name, type, default: literal(type) === "number" ? 0 : undefined, local }], { label: "添加变量" });
  };
  const place = (v: VariableDef, set: boolean) => {
    const host = ed.el;
    const p = ed.toGraph((host?.clientWidth ?? 600) / 2, (host?.clientHeight ?? 400) / 2);
    const snap = (x: number) => (ed.snap > 1 ? Math.round(x / ed.snap) * ed.snap : Math.round(x));
    const r = ed.apply([{ op: "addNode", type: set ? VAR_SET : VAR_GET, variable: v.id, at: [snap(p.x - 80), snap(p.y - 30)] }], { label: set ? "添加设置变量" : "添加获取变量" });
    const id = r?.created["#0"];
    if (id && !r.errors.length) ed.select([id]);
  };

  const row = (v: VariableDef) => {
    const lit = literal(v.type);
    const ro = ed.readOnly;
    const commitName = (el: HTMLInputElement) => {
      const name = el.value.trim();
      if (name && name !== v.name) ed.apply([{ op: "updateVariable", id: v.id, name }], { label: "重命名变量" });
      else el.value = v.name;
    };
    return (
      <li key={v.id} className="bp-var rounded-md px-1.5 py-1.5 hover:bg-accent/60" data-variable={v.id}>
        <div className="flex items-center gap-1">
          <span draggable={!ro} title="拖到画布添加获取节点，按住 Alt 拖入添加设置节点" data-var-handle
            onDragStart={(e) => { e.dataTransfer.setData(VARIABLE_MIME, v.id); e.dataTransfer.setData("text/plain", v.name); e.dataTransfer.effectAllowed = "copy"; }}
            className="flex shrink-0 cursor-grab items-center gap-1 text-muted-foreground active:cursor-grabbing">
            <GripVertical className="size-3.5" aria-hidden />
            <span className="size-2.5 rounded-full" style={{ background: typeColor(reg, v.type) }} aria-hidden />
          </span>
          <input key={v.name} defaultValue={v.name} aria-label={`变量名：${v.name}`} disabled={ro} spellCheck={false}
            onBlur={(e) => commitName(e.currentTarget)}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { e.currentTarget.value = v.name; e.currentTarget.blur(); } }}
            className="h-6 min-w-0 flex-1 rounded bg-transparent px-1 text-[13px] outline-none focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring" />
          {ro ? null : (
            <>
              <button type="button" onClick={() => place(v, false)} className="h-6 shrink-0 rounded px-1.5 text-[11px] text-muted-foreground hover:bg-background hover:text-foreground">获取</button>
              <button type="button" onClick={() => place(v, true)} className="h-6 shrink-0 rounded px-1.5 text-[11px] text-muted-foreground hover:bg-background hover:text-foreground">设置</button>
              <button type="button" aria-label={`删除变量 ${v.name}`} title="删除变量（连同它的获取、设置节点）"
                onClick={() => ed.apply([{ op: "removeVariable", id: v.id }], { label: "删除变量" })}
                className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-background hover:text-destructive"><Trash2 className="size-3.5" /></button>
            </>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5 pl-6">
          <select value={v.type} disabled={ro} aria-label={`${v.name} 的类型`}
            onChange={(e) => ed.apply([{ op: "updateVariable", id: v.id, type: e.target.value }], { label: "修改变量类型" })}
            className="h-6 min-w-0 flex-1 rounded border bg-background px-1 text-[12px]">
            {types.map((t) => <option key={t.id} value={t.id}>{typeName(t.id)}</option>)}
          </select>
          {lit === "switch" ? (
            <input type="checkbox" checked={Boolean(v.default)} disabled={ro} aria-label={`${v.name} 的默认值`}
              onChange={(e) => ed.apply([{ op: "updateVariable", id: v.id, default: e.target.checked }], { label: "修改默认值" })} className="size-3.5" />
          ) : lit ? (
            <input key={`${v.type}:${String(v.default)}`} defaultValue={v.default === undefined ? "" : String(v.default)} disabled={ro}
              aria-label={`${v.name} 的默认值`} placeholder="默认值" type={lit === "number" ? "number" : "text"} step="any" spellCheck={false}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") e.currentTarget.blur(); }}
              onBlur={(e) => {
                const raw = e.currentTarget.value;
                const val = lit === "number" ? (raw === "" || Number.isNaN(Number(raw)) ? undefined : Number(raw)) : raw;
                if (val === v.default) return;
                ed.apply([val === undefined ? { op: "updateVariable", id: v.id, unsetDefault: true } : { op: "updateVariable", id: v.id, default: val }], { label: "修改默认值" });
              }}
              className="h-6 w-20 rounded border bg-background px-1 font-mono text-[11px]" />
          ) : null}
        </div>
      </li>
    );
  };

  const globals = view.variables ?? [];
  const locals = view.locals ?? [];
  const body = (
    <>
      <div className="flex items-center justify-between gap-2 border-b px-2.5 py-1.5">
        <h2 className="text-xs font-semibold">变量</h2>
        <div className="flex items-center gap-0.5">
          {ed.readOnly ? null : (
            <button type="button" onClick={() => add(false)} className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
              <Plus className="size-3.5" aria-hidden />新建
            </button>
          )}
          {onClose ? <button type="button" aria-label="关闭变量面板" onClick={onClose} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-4" /></button> : null}
        </div>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-1">
        {globals.length ? <ul aria-label="图变量" className="space-y-0.5">{globals.map(row)}</ul> : (
          <p className="px-2 py-3 text-xs text-muted-foreground">还没有变量。新建一个，再拖到画布上。</p>
        )}
        {isFn ? (
          <section className="mt-2 border-t pt-1.5">
            <div className="flex items-center justify-between px-1.5 pb-1">
              <h3 className="text-[11px] font-medium text-muted-foreground">局部变量 · {sg?.label ?? sg?.id}</h3>
              {ed.readOnly ? null : (
                <button type="button" onClick={() => add(true)} className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground">
                  <Plus className="size-3" aria-hidden />新建局部
                </button>
              )}
            </div>
            {locals.length ? <ul aria-label="局部变量" className="space-y-0.5">{locals.map(row)}</ul> : <p className="px-2 pb-2 text-[11px] text-muted-foreground">每次调用函数都会重置为默认值。</p>}
          </section>
        ) : null}
      </div>
    </>
  );

  if (!docked) return <aside aria-label="变量" className={`flex flex-col rounded-lg border bg-popover text-popover-foreground ${className}`}>{body}</aside>;
  return (
    <m.aside data-bp-overlay aria-label="变量" onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }}
      className={`absolute top-12 left-2 z-20 flex max-h-[calc(100%-6.5rem)] w-64 max-w-[calc(100%-1rem)] flex-col rounded-lg border bg-popover/95 text-popover-foreground shadow-soft backdrop-blur ${className}`}>
      {body}
    </m.aside>
  );
}

export default VariablesPanel;
