// hx:server-safe 纯函数 (收集 / 过滤 Find 结果); requestAnimationFrame 只在 revealFind 调用时用.
import { findVariable, paramVariables } from "../ports";
import { TUNNEL_IN, TUNNEL_OUT, VAR_GET, VAR_SET } from "../registry";
import { subgraphPath } from "../subgraph";
import type { BlueprintNode, SubgraphScope } from "../types";
import type { BlueprintEditor } from "./editor";

/**
 * Document-wide search (UE5 "Find in Blueprint"), shared by the Find overlay and the workbench's
 * 查找结果 dock: titles, node types, node comments, text values, variable names, on every level.
 */

export interface FindHit {
  readonly key: string;
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly where: string;
  /** Lowercase haystack the query words are matched against. */
  readonly hay: string;
}

export function nodeTitle(ed: BlueprintEditor, n: BlueprintNode, scope: SubgraphScope): string {
  if (n.title) return n.title;
  if (n.type === VAR_GET || n.type === VAR_SET) {
    const v = findVariable(scope, n.variable)?.name ?? "?";
    return n.type === VAR_GET ? v : `设置 ${v}`;
  }
  if (n.subgraph !== undefined) return ed.root.subgraphs?.[n.subgraph]?.label ?? n.subgraph;
  return ed.registry.node(n.type)?.title ?? n.type;
}

export function collectFind(ed: BlueprintEditor): FindHit[] {
  const root = ed.root;
  const out: FindHit[] = [];
  const level = (nodes: readonly BlueprintNode[], sg: string | undefined, where: string, scope: SubgraphScope) => {
    for (const n of nodes) {
      if (n.type === TUNNEL_IN || n.type === TUNNEL_OUT) continue;
      const title = nodeTitle(ed, n, scope);
      const def = ed.registry.node(n.type);
      const texts = Object.values(n.values ?? {}).filter((v): v is string => typeof v === "string");
      const vals = Object.entries(n.values ?? {}).slice(0, 2).map(([k, v]) => `${k}：${typeof v === "string" ? v : JSON.stringify(v)}`);
      out.push({
        key: sg === undefined ? n.id : `${sg}/${n.id}`, id: n.id, title, where,
        detail: [def?.title !== title ? def?.title : undefined, n.comment, ...vals].filter(Boolean).join(" · "),
        hay: [title, n.type, def?.title, def?.category, n.comment, ...texts].filter(Boolean).join(" ").toLowerCase(),
      });
    }
  };
  // definitions first: functions / macros / collapsed graphs and variables by name
  for (const sg of Object.values(root.subgraphs ?? {})) {
    const kind = sg.kind === "function" ? "函数" : sg.kind === "macro" ? "宏" : "折叠图";
    const name = sg.label ?? sg.id;
    out.push({ key: `@sg:${sg.id}`, id: sg.id, title: name, where: `${kind}定义`, detail: sg.description ?? "", hay: [name, sg.id, kind, sg.category, sg.keywords, sg.description].filter(Boolean).join(" ").toLowerCase() });
  }
  for (const v of root.variables ?? []) {
    out.push({ key: `@var:${v.id}`, id: v.id, title: v.name, where: "变量定义", detail: v.tooltip ?? v.type, hay: [v.name, v.type, v.category, v.tooltip, "变量"].filter(Boolean).join(" ").toLowerCase() });
  }
  level(root.nodes, undefined, "主图", root);
  for (const sg of Object.values(root.subgraphs ?? {})) {
    const kind = sg.kind === "function" ? "函数" : sg.kind === "macro" ? "宏" : "折叠图";
    level(sg.nodes, sg.id, `${kind} · ${sg.label ?? sg.id}`, { ...root, ...(sg.variables ? { locals: sg.variables } : {}), ...(sg.kind === "function" ? { params: paramVariables(sg.nodes, ed.registry) } : {}) });
  }
  return out;
}


/** Hits matching every word of `q` (already lowercase); empty query = none. */
export function filterFind(all: readonly FindHit[], q: string): FindHit[] {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return words.length ? all.filter((h) => words.every((w) => h.hay.includes(w))) : [];
}

/** Open the hit's level (full breadcrumb path), select and frame it. */
export function revealFind(ed: BlueprintEditor, h: Pick<FindHit, "key">) {
  if (h.key.startsWith("@sg:")) {
    const id = h.key.slice(4);
    ed.openPath(subgraphPath(ed.root, id) ?? [id]);
    ed.inspect({ kind: "subgraph", id });
    return;
  }
  if (h.key.startsWith("@var:")) return ed.inspect({ kind: "variable", id: h.key.slice(5) });
  const local = ed.reveal(h.key);
  requestAnimationFrame(() => {
    ed.select([local]);
    ed.fit([local]);
  });
}
