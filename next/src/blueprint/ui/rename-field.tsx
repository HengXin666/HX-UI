"use client";

import { useEffect, useRef } from "react";
import { compileExpr } from "../expr";
import type { BlueprintEditor } from "./editor";

/**
 * F2 / double-click title: an input placed over the node header or comment title. Enter or blur
 * saves, Esc cancels. kind "note" edits a node's comment bubble (empty text removes it), kind
 * "condition" a breakpoint condition (checked before it is saved; empty = always stop).
 */

export interface RenameTarget { readonly kind: "node" | "comment" | "note" | "condition"; readonly id: string }

export function RenameField({ ed, target, onDone }: { ed: BlueprintEditor; target: RenameTarget; onDone: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);
  const g = ed.graph;
  const note = target.kind === "note";
  const cond = target.kind === "condition";
  const key = ed.keyOf(target.id);
  const node = target.kind !== "comment" ? g.nodes.find((n) => n.id === target.id) : undefined;
  const comment = target.kind === "comment" ? g.comments?.find((c) => c.id === target.id) : undefined;
  const initial = cond ? ed.breakpointSpecs.get(key)?.condition ?? "" : note ? node?.comment ?? "" : node ? node.title ?? ed.registry.node(node.type)?.title ?? "" : comment?.title ?? "";
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  if (!node && !comment) return null;
  const v = ed.viewport;
  const x = (node?.x ?? comment!.x) * v.z + v.x;
  const y = (node?.y ?? comment!.y) * v.z + v.y - (note || cond ? 30 : 0);
  const w = Math.max(cond ? 220 : 160, (node ? 176 : comment!.w) * v.z);

  const save = () => {
    if (done.current) return;
    const text = ref.current?.value.trim() ?? "";
    if (cond) {
      const c = text ? compileExpr(text) : undefined;
      if (c && !c.ok) {
        ed.notify(`条件写法有误：${c.error}`);
        return;
      }
      done.current = true;
      ed.setBreakpointSpec(key, { ...ed.breakpointSpecs.get(key), condition: text });
      ed.breakpoints.add(key);
      onDone();
      return;
    }
    done.current = true;
    if (text !== initial) {
      if (note) ed.apply([{ op: "updateNode", id: node!.id, comment: text || null }], { label: "节点注释" });
      else if (node) ed.apply([{ op: "updateNode", id: node.id, title: text || null }], { label: "重命名" });
      else ed.apply([{ op: "updateComment", id: comment!.id, title: text }], { label: "重命名注释" });
    }
    onDone();
  };
  return (
    <input ref={ref} data-bp-overlay className="bp-rename" defaultValue={initial}
      placeholder={note ? "写一句注释" : cond ? "例如 a > 5 && hit >= 2（留空总是暂停）" : undefined}
      aria-label={note ? "节点注释" : cond ? "断点条件" : node ? "节点名称" : "注释标题"}
      style={{ left: x, top: y, width: w }} spellCheck={false}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") save();
        if (e.key === "Escape") { done.current = true; onDone(); }
      }}
      onBlur={() => { if (cond && !done.current) { done.current = true; onDone(); } else save(); }} />
  );
}
