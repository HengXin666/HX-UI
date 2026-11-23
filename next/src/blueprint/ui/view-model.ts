import { findVariable } from "../ports";
import { VAR_GET, VAR_SET } from "../registry";
import type { BlueprintEditor } from "./editor";
import { layoutNode, nodeKindOf } from "./geometry";
import { ISSUE_LABEL } from "./labels";
import type { NodeViewProps } from "./node-view";

/**
 * Everything the canvas renders, as primitive-valued props so the memoised layers only re-render
 * what actually changed. Pure function of the editor state.
 */
export interface ViewModel {
  readonly nodes: readonly Omit<NodeViewProps, "ed" | "readOnly" | "domId">[];
  /** Node the keyboard acts on (aria-activedescendant): the last selected one. */
  readonly active: string | undefined;
  readonly wires: { readonly selected: string; readonly bad: string; readonly near: string };
}

export function deriveView(ed: BlueprintEditor): ViewModel {
  const g = ed.graph;
  const sel = ed.selection;
  const val = ed.validation;
  const selNodes = new Set(sel.nodes);
  const connected = new Map<string, string[]>();
  const add = (id: string, key: string) => connected.set(id, [...(connected.get(id) ?? []), key]);
  const near: string[] = [];
  for (const e of g.edges) {
    add(e.from.node, `out:${e.from.pin}`);
    add(e.to.node, `in:${e.to.pin}`);
    if (selNodes.has(e.from.node) || selNodes.has(e.to.node)) near.push(e.id);
  }
  const activeId = sel.nodes[sel.nodes.length - 1];
  const nodes = g.nodes.map((n) => {
    const issues = val.byNode.get(n.id) ?? [];
    const top = issues.find((i) => i.level === "error") ?? issues[0];
    const sg = n.subgraph !== undefined ? g.subgraphs?.[n.subgraph] : undefined;
    const def = ed.registry.node(n.type);
    const isVar = n.type === VAR_GET || n.type === VAR_SET;
    const v = isVar ? findVariable(g, n.variable) : undefined;
    const varTitle = isVar ? (n.type === VAR_GET ? v?.name ?? "未知变量" : `设置 ${v?.name ?? "未知变量"}`) : undefined;
    const sub = n.subgraph !== undefined ? (sg?.kind === "function" ? "函数" : sg?.kind === "macro" ? "宏" : "折叠图") : !def ? "未知类型" : n.type === VAR_SET ? "变量" : undefined;
    return {
      node: n,
      layout: layoutNode(n, ed.registry, g),
      kind: nodeKindOf(n, ed.registry, g),
      title: n.title ?? varTitle ?? sg?.label ?? def?.title ?? n.type,
      subtitle: sub,
      selected: selNodes.has(n.id),
      breakpoint: ed.breakpoints.has(ed.keyOf(n.id)),
      active: n.id === activeId,
      connected: (connected.get(n.id) ?? []).join("|"),
      badPins: issues.flatMap((i) => (i.pin && i.pin.node === n.id && i.level === "error" ? [`in:${i.pin.pin}`] : [])).join("|"),
      issueLevel: top?.level,
      issueText: top ? ISSUE_LABEL[top.code] : "",
      issueDetail: issues.map((i) => `${ISSUE_LABEL[i.code]}（${i.message}）`).join("\n"),
    };
  });
  const bad = [...val.byEdge].filter(([, list]) => list.some((i) => i.level === "error")).map(([id]) => id);
  return { nodes, active: activeId, wires: { selected: sel.edges.join("|"), bad: bad.join("|"), near: near.join("|") } };
}
