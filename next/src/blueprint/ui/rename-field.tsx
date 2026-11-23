import { useEffect, useRef } from "react";
import type { BlueprintEditor } from "./editor";

/** F2 / double-click title: an input placed over the node header or comment title. Enter or blur saves, Esc cancels. */

export interface RenameTarget { readonly kind: "node" | "comment"; readonly id: string }

export function RenameField({ ed, target, onDone }: { ed: BlueprintEditor; target: RenameTarget; onDone: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);
  const g = ed.graph;
  const node = target.kind === "node" ? g.nodes.find((n) => n.id === target.id) : undefined;
  const comment = target.kind === "comment" ? g.comments?.find((c) => c.id === target.id) : undefined;
  const initial = node ? node.title ?? ed.registry.node(node.type)?.title ?? "" : comment?.title ?? "";
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  if (!node && !comment) return null;
  const v = ed.viewport;
  const x = (node?.x ?? comment!.x) * v.z + v.x;
  const y = (node?.y ?? comment!.y) * v.z + v.y;
  const w = Math.max(160, (node ? 176 : comment!.w) * v.z);

  const save = () => {
    if (done.current) return;
    done.current = true;
    const text = ref.current?.value.trim() ?? "";
    if (text !== initial) {
      if (node) ed.apply([{ op: "updateNode", id: node.id, title: text || null }], { label: "重命名" });
      else ed.apply([{ op: "updateComment", id: comment!.id, title: text }], { label: "重命名注释" });
    }
    onDone();
  };
  return (
    <input ref={ref} data-bp-overlay className="bp-rename" defaultValue={initial} aria-label={node ? "节点名称" : "注释标题"}
      style={{ left: x, top: y, width: w }} spellCheck={false}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") save();
        if (e.key === "Escape") { done.current = true; onDone(); }
      }}
      onBlur={save} />
  );
}
