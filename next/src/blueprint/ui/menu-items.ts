import { nodesInComment } from "../comment";
import { SUBGRAPH_NODE } from "../registry";
import {
  breakNodeLinks, collapseSelected, commentSelected, deleteSelected, duplicate, expandNode, straighten,
} from "./commands";
import type { MenuEntry } from "./context-menu";
import type { BlueprintEditor } from "./editor";

/** What was right-clicked. */
export type MenuTarget =
  | { readonly kind: "node"; readonly id: string }
  | { readonly kind: "edge"; readonly id: string; readonly at: { readonly x: number; readonly y: number } }
  | { readonly kind: "comment"; readonly id: string };

export interface MenuHost {
  rename(target: { kind: "node" | "comment"; id: string }): void;
}

/** Items of the right-click menu for a node, a wire or a comment. */
export function menuFor(ed: BlueprintEditor, t: MenuTarget, host: MenuHost): { title: string; items: MenuEntry[] } {
  const g = ed.graph;
  const ro = ed.readOnly;
  if (t.kind === "edge") {
    return {
      title: "连线",
      items: [
        { label: "插入转接点", disabled: ro, run: () => ed.apply([{ op: "addReroute", edge: t.id, at: [Math.round(t.at.x - 8), Math.round(t.at.y - 8)] }], { label: "插入转接点" }) },
        { label: "拉直连线", keys: "Q", disabled: ro, run: () => { ed.select({ edges: [t.id] }); straighten(ed); } },
        { kind: "sep" },
        { label: "删除连线", keys: "Delete", danger: true, disabled: ro, run: () => ed.apply([{ op: "disconnect", edge: t.id }], { label: "删除连线" }) },
      ],
    };
  }
  if (t.kind === "comment") {
    const c = g.comments?.find((x) => x.id === t.id);
    return {
      title: c?.title || "注释",
      items: [
        { label: "重命名", keys: "F2", disabled: ro, run: () => host.rename({ kind: "comment", id: t.id }) },
        { label: "选中框内节点", run: () => c && ed.select({ nodes: nodesInComment(g, c, ed.registry), comments: [t.id] }) },
        { kind: "tones", value: c?.tone ?? "default", run: (tone) => { if (!ro) ed.apply([{ op: "updateComment", id: t.id, tone }], { label: "注释颜色" }); } },
        { kind: "sep" },
        { label: "删除注释", keys: "Delete", danger: true, disabled: ro, run: () => ed.apply([{ op: "removeComment", id: t.id }], { label: "删除注释" }) },
      ],
    };
  }
  const n = g.nodes.find((x) => x.id === t.id);
  const isGraph = n?.subgraph !== undefined || n?.type === SUBGRAPH_NODE;
  const many = ed.selection.nodes.length > 1;
  const items: MenuEntry[] = [
    { label: "重命名", keys: "F2", disabled: ro || many, run: () => host.rename({ kind: "node", id: t.id }) },
    { label: "原地复制", keys: "Mod+D", disabled: ro, run: () => duplicate(ed) },
    { label: "断开全部连线", disabled: ro, run: () => breakNodeLinks(ed, ed.selection.nodes) },
    { label: "拉直连线", keys: "Q", disabled: ro, run: () => straighten(ed) },
    { label: n?.collapsed ? "展开节点" : "收起节点", disabled: ro, run: () => ed.apply(ed.selection.nodes.map((id) => ({ op: "updateNode" as const, id, collapsed: !n?.collapsed })), { label: "收起节点" }) },
  ];
  if (isGraph && n?.subgraph !== undefined) {
    const sg = n.subgraph;
    items.push({ kind: "sep" }, { label: "进入子图", run: () => ed.enter(sg) }, { label: "展开为节点", disabled: ro, run: () => expandNode(ed, t.id) });
  }
  items.push(
    { kind: "sep" },
    { label: "折叠为子图", keys: "Mod+G", disabled: ro, run: () => collapseSelected(ed) },
    { label: "添加注释", keys: "C", disabled: ro, run: () => commentSelected(ed) },
    { kind: "sep" },
    { label: many ? `删除 ${ed.selection.nodes.length} 个节点` : "删除", keys: "Delete", danger: true, disabled: ro, run: () => deleteSelected(ed) },
  );
  return { title: n ? (n.title ?? ed.registry.node(n.type)?.title ?? n.type) : "节点", items };
}
