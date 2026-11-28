"use client";

import { AlertTriangle, CircleCheck, CircleX, Keyboard, Maximize, Redo2, Search, Undo2, Variable } from "lucide-react";
import { m } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ValidationIssue } from "../types";
import type { BlueprintEditor } from "./editor";
import { ISSUE_LABEL } from "./labels";

/**
 * Editor chrome drawn over the canvas: breadcrumb (subgraph path), zoom / fit / undo / help
 * buttons, and the validation strip. All carry `data-bp-overlay` so canvas gestures ignore them.
 */

const BTN = "grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent";
const PANEL = "rounded-lg border bg-popover/90 text-popover-foreground shadow-soft backdrop-blur";

export function Breadcrumb({ ed }: { ed: BlueprintEditor }) {
  const path = ed.path;
  const label = (id: string) => {
    const sg = ed.root.subgraphs?.[id];
    const kind = sg?.kind === "function" ? "函数 · " : sg?.kind === "macro" ? "宏 · " : "";
    return `${kind}${sg?.label ?? id}`;
  };
  return (
    <nav data-bp-overlay aria-label="图层级" className={`absolute top-2 left-2 z-20 flex max-w-[calc(100%-12rem)] items-center gap-1 px-2 py-1 text-xs ${PANEL}`}>
      {path.length === 0 ? <span className="px-1 font-medium">主图</span> : (
        <>
          <button type="button" className="rounded px-1 text-muted-foreground hover:text-foreground" onClick={() => ed.exitTo(0)}>主图</button>
          {path.map((id, i) => (
            <span key={id} className="flex min-w-0 items-center gap-1">
              <span aria-hidden className="text-muted-foreground">›</span>
              {i === path.length - 1
                ? <span className="truncate px-1 font-medium" aria-current="page">{label(id)}</span>
                : <button type="button" className="truncate rounded px-1 text-muted-foreground hover:text-foreground" onClick={() => ed.exitTo(i + 1)}>{label(id)}</button>}
            </span>
          ))}
        </>
      )}
    </nav>
  );
}

export function Toolbar({ ed, onHelp, hidden, find, onFind, vars }: {
  ed: BlueprintEditor; onHelp: () => void; hidden: boolean; find: boolean; onFind: () => void;
  vars: { readonly open: boolean; readonly toggle: () => void } | undefined;
}) {
  const zoomRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const paint = () => { if (zoomRef.current) zoomRef.current.textContent = `${Math.round(ed.viewport.z * 100)}%`; };
    paint();
    return ed.onViewport(paint);
  }, [ed]);
  return (
    <div data-bp-overlay role="toolbar" aria-label="编辑器工具" aria-hidden={hidden || undefined} inert={hidden || undefined}
      className={`absolute top-2 right-2 z-20 flex items-center gap-0.5 p-0.5 ${PANEL} ${hidden ? "invisible" : ""}`}>
      {vars ? (
        <button type="button" className={`${BTN} aria-pressed:bg-accent aria-pressed:text-foreground`} aria-label="变量" title="变量面板" aria-pressed={vars.open} onClick={vars.toggle}><Variable className="size-4" /></button>
      ) : null}
      <button type="button" className={`${BTN} aria-pressed:bg-accent aria-pressed:text-foreground`} aria-label="查找" title="查找节点（Ctrl F）" aria-pressed={find} onClick={onFind}><Search className="size-4" /></button>
      {ed.readOnly ? null : (
        <>
          <button type="button" className={BTN} aria-label="撤销" title="撤销（Ctrl Z）" disabled={!ed.canUndo} onClick={() => ed.undo()}><Undo2 className="size-4" /></button>
          <button type="button" className={BTN} aria-label="重做" title="重做（Ctrl Y）" disabled={!ed.canRedo} onClick={() => ed.redo()}><Redo2 className="size-4" /></button>
        </>
      )}
      <span ref={zoomRef} className="w-11 text-center font-mono text-[11px] text-muted-foreground tabular" aria-label="缩放比例" />
      <button type="button" className={BTN} aria-label="适配视图" title="适配视图（Home）" onClick={() => ed.fit()}><Maximize className="size-4" /></button>
      <button type="button" className={BTN} aria-label="快捷键" title="快捷键（?）" onClick={onHelp}><Keyboard className="size-4" /></button>
    </div>
  );
}

/** Chinese one-liner for an issue: code label + node titles. */
export function issueText(ed: BlueprintEditor, i: ValidationIssue): string {
  const g = ed.root;
  const title = (id: string) => {
    const [sg, local] = id.includes("/") ? id.split("/") as [string, string] : [undefined, id];
    const nodes = sg ? g.subgraphs?.[sg]?.nodes ?? [] : g.nodes;
    const n = nodes.find((x) => x.id === local);
    return n ? n.title ?? ed.registry.node(n.type)?.title ?? n.type : local;
  };
  const who = (i.nodeIds ?? []).slice(0, 3).map(title).join("、");
  const pin = i.pin ? `「${i.pin.pin}」` : "";
  return `${ISSUE_LABEL[i.code]}${who ? `：${who}${pin}` : ""}`;
}

export function IssuesStrip({ ed }: { ed: BlueprintEditor }) {
  const [open, setOpen] = useState(false);
  const issues = ed.validation.all.issues;
  const errors = issues.filter((i) => i.level === "error").length;
  const warnings = issues.length - errors;
  const go = (i: ValidationIssue) => {
    const id = i.nodeIds?.[0] ?? i.edgeIds?.[0];
    if (!id) return;
    // open the full path to the level the issue lives on, so the breadcrumb shows every parent
    const local = ed.reveal(id);
    requestAnimationFrame(() => {
      if (i.nodeIds?.length) {
        ed.select([local]);
        ed.fit([local]);
      } else ed.select({ edges: [local] });
      ed.el?.focus();
    });
  };
  return (
    <div data-bp-overlay className="absolute bottom-2 left-2 z-20 flex max-w-[calc(100%-1rem)] flex-col items-start gap-1.5">
      {open && issues.length ? (
        <m.ul initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
          aria-label="问题列表" className={`scrollbar-thin max-h-48 w-80 max-w-full overflow-y-auto p-1 text-xs ${PANEL}`}>
          {issues.map((i, k) => (
            <li key={k}>
              <button type="button" onClick={() => go(i)} title={i.message}
                className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent">
                {i.level === "error" ? <CircleX className="mt-px size-3.5 shrink-0 text-destructive" /> : <AlertTriangle className="mt-px size-3.5 shrink-0 text-warning" />}
                <span className="min-w-0">{issueText(ed, i)}</span>
              </button>
            </li>
          ))}
        </m.ul>
      ) : null}
      <button type="button" aria-expanded={issues.length ? open : undefined} onClick={() => setOpen((o) => !o)} disabled={!issues.length}
        className={`flex h-8 items-center gap-2 px-2.5 text-xs ${PANEL}`}>
        {issues.length === 0 ? <><CircleCheck className="size-3.5 text-success" />校验通过</> : (
          <>
            {errors ? <span className="flex items-center gap-1"><CircleX className="size-3.5 text-destructive" />{errors} 个错误</span> : null}
            {warnings ? <span className="flex items-center gap-1"><AlertTriangle className="size-3.5 text-warning" />{warnings} 个警告</span> : null}
          </>
        )}
      </button>
    </div>
  );
}
