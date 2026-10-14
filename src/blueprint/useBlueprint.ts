import { useCallback, useMemo, useRef, useState } from "react";
import type { BlueprintGraph, BlueprintNode, PortRef, BlueprintRegistry } from "./types";
import { applyConnect, canConnect, type ConnectResult } from "./connect";
import { collapseToSubgraph, expandSubgraph, writeSubgraph, subgraphRefCount } from "./subgraph";
import { addComment, removeComment, updateComment, commentAround, moveCommentWithNodes, resizeComment } from "./comment";
import { autoLayout, applyLayout, type LayoutOptions } from "./layout";
import { validateGraph } from "./validate";
import type { GraphValidation } from "./types";

/**
 * 图状态。
 *
 * ## 受控 / 非受控
 *
 * 跟本库其它组件一个路子: 给 `value` 就是受控, 给 `defaultValue` 就是非受控。
 * 受控模式下所有命令原样转发给 onChange, 内部不留影子 
 * 留影子会出现"UI 显示了但外部没变"这种最难查的错位。
 *
 * ## 命令而不是 setState
 *
 * 暴露 `setGraph` 会让每个使用方自己写一遍"加节点要顺便算 id"、
 * "连线要先判类型"。那些逻辑写错一次就是一条非法边。所以这里只给命令,
 * 每条命令自己保证**产出的图一定合法**。
 */

let seq = 0;
/** id 生成。前缀 + 自增而不是随机: 序列化后的图里能看出创建顺序。 */
export function makeId(prefix = "n"): string {
  seq += 1;
  return `${prefix}${Date.now().toString(36).slice(-4)}${seq.toString(36)}`;
}

export interface UseBlueprintOptions {
  readonly registry: BlueprintRegistry;
  /** 受控值。给了它, 改图必须走 onChange。 */
  readonly value?: BlueprintGraph;
  readonly defaultValue?: BlueprintGraph;
  readonly onChange?: (graph: BlueprintGraph) => void;
  /** 校验选项, 透传给 validateGraph。 */
  readonly requireEntry?: boolean;
}

export interface BlueprintApi {
  readonly graph: BlueprintGraph;
  readonly validation: GraphValidation;

  addNode(type: string, at: { x: number; y: number }, init?: Partial<BlueprintNode>): string | null;
  removeNode(id: string): void;
  moveNode(id: string, to: { x: number; y: number }): void;
  /** 批量移动 (框选拖动)。一次提交, 免得每个节点触发一次 onChange。 */
  moveNodes(delta: { dx: number; dy: number }, ids: readonly string[]): void;
  duplicateNode(id: string, offset?: { dx: number; dy: number }): string | null;
  setNodeTitle(id: string, title: string): void;
  setParam(id: string, key: string, value: unknown): void;
  setCollapsed(id: string, collapsed: boolean): void;

  /** 连线。返回 false = 没连上 (原因见 check)。 */
  connect(from: PortRef, to: PortRef): boolean;
  /** 拖线前先问一次  不落库, 只拿结论给 UI 染色。 */
  check(from: PortRef, to: PortRef): ConnectResult;
  disconnect(edgeId: string): void;
  /** 断开某输入口上的所有线。 */
  disconnectInput(nodeId: string, portId: string): void;

  /** 自动布局。返回是否改动了坐标。 */
  autoLayout(opts?: LayoutOptions): boolean;
  /** 整理时保留这些节点的原坐标。 */
  tidy(opts?: LayoutOptions & { readonly preserve?: readonly string[] }): boolean;

  /** 整体替换 (导入 / 撤销 / 清空)。 */
  replace(next: BlueprintGraph): void;
  clear(): void;

  // ── 子图 ──
  /** 把选中的节点折成一个子图节点。返回新节点 id, 失败返回 null。 */
  collapse(ids: readonly string[], label?: string): string | null;
  /** 展开子图节点。返回是否真的展开了。 */
  expand(nodeId: string): boolean;
  /** 写回子图内部。 */
  writeSubgraph(sgId: string, inner: Pick<BlueprintGraph, "nodes" | "edges">): void;

  // ── 区间注释 ──
  addComment(box: { x: number; y: number; w?: number; h?: number }, title?: string): string;
  /** 给一批节点套一个刚好包住它们的注释框。 */
  commentAround(ids: readonly string[], title?: string): string;
  updateComment(id: string, patch: Record<string, unknown>): void;
  removeComment(id: string): void;
  /** 移动注释到绝对位置: 里面被完全包住的节点跟着走同样的位移。 */
  moveComment(id: string, at: { x: number; y: number }): void;
  resizeComment(id: string, box: { x: number; y: number; w: number; h: number }): void;
}

const EMPTY: BlueprintGraph = { nodes: [], edges: [] };

export function useBlueprint(opts: UseBlueprintOptions): BlueprintApi {
  const { registry, value, defaultValue, onChange, requireEntry } = opts;
  const controlled = value !== undefined;
  const [inner, setInner] = useState<BlueprintGraph>(() => defaultValue ?? value ?? EMPTY);
  const graph = controlled ? value! : inner;

  const commit = useCallback(
    (next: BlueprintGraph) => {
      if (!controlled) setInner(next);
      onChange?.(next);
    },
    [controlled, onChange]
  );

  /** 校验。按 graph 引用缓存  拖坐标每帧变, 但结构没变时不该重算。 */
  const validation = useMemo(
    () => validateGraph(registry, graph, { requireEntry }),
    [registry, graph, requireEntry]
  );

  const addNode: BlueprintApi["addNode"] = useCallback(
    (type, at, init) => {
      if (!registry.nodeTypes.has(type)) return null;
      const def = registry.nodeTypes.get(type)!;
      const id = init?.id ?? makeId();
      const params: Record<string, unknown> = {};
      for (const p of def.params ?? []) params[p.id] = p.default;
      const node: BlueprintNode = {
        id,
        type,
        x: at.x,
        y: at.y,
        params: { ...params, ...(init?.params ?? {}) },
        ...(init?.title ? { title: init.title } : {}),
        ...(init?.collapsed !== undefined ? { collapsed: init.collapsed } : {}),
      };
      commit({ nodes: [...graph.nodes, node], edges: graph.edges });
      return id;
    },
    [registry, graph, commit]
  );

  const removeNode = useCallback(
    (id: string) => {
      commit({
        nodes: graph.nodes.filter((n) => n.id !== id),
        edges: graph.edges.filter((e) => e.from.node !== id && e.to.node !== id),
      });
    },
    [graph, commit]
  );

  const moveNode = useCallback(
    (id, to) => {
      commit({ ...graph, nodes: graph.nodes.map((n) => (n.id === id ? { ...n, x: to.x, y: to.y } : n)) });
    },
    [graph, commit]
  );

  const moveNodes = useCallback(
    (delta, ids) => {
      const set = new Set(ids);
      commit({
        ...graph,
        nodes: graph.nodes.map((n) => (set.has(n.id) ? { ...n, x: n.x + delta.dx, y: n.y + delta.dy } : n)),
      });
    },
    [graph, commit]
  );

  const duplicateNode = useCallback(
    (id, offset = { dx: 24, dy: 24 }) => {
      const src = graph.nodes.find((n) => n.id === id);
      if (!src) return null;
      const newId = makeId();
      // 复制节点但不复制连线: 原节点的入边指向原节点, 抄过来会变成自环
      commit({
        nodes: [...graph.nodes, { ...src, id: newId, x: src.x + offset.dx, y: src.y + offset.dy }],
        edges: graph.edges,
      });
      return newId;
    },
    [graph, commit]
  );

  const patchNode = useCallback(
    (id: string, patch: (n: BlueprintNode) => BlueprintNode) => {
      commit({ ...graph, nodes: graph.nodes.map((n) => (n.id === id ? patch(n) : n)) });
    },
    [graph, commit]
  );

  const setNodeTitle = useCallback((id: string, title: string) => patchNode(id, (n) => ({ ...n, title })), [patchNode]);
  const setParam = useCallback(
    (id: string, key: string, v: unknown) => patchNode(id, (n) => ({ ...n, params: { ...(n.params ?? {}), [key]: v } })),
    [patchNode]
  );
  const setCollapsed = useCallback(
    (id: string, collapsed: boolean) => patchNode(id, (n) => ({ ...n, collapsed })),
    [patchNode]
  );

  const check = useCallback((from: PortRef, to: PortRef) => canConnect(registry, graph, from, to), [registry, graph]);

  const connect = useCallback(
    (from: PortRef, to: PortRef) => {
      const next = applyConnect(registry, graph, from, to, () => makeId("e"));
      if (!next) return false;
      commit(next);
      return true;
    },
    [registry, graph, commit]
  );

  const disconnect = useCallback(
    (edgeId: string) => commit({ ...graph, edges: graph.edges.filter((e) => e.id !== edgeId) }),
    [graph, commit]
  );

  const disconnectInput = useCallback(
    (nodeId: string, portId: string) =>
      commit({ ...graph, edges: graph.edges.filter((e) => !(e.to.node === nodeId && e.to.port === portId)) }),
    [graph, commit]
  );

  /** 自动布局。纯函数算坐标, 再整体替换  一次提交, 不留中间态。 */
  const doLayout: BlueprintApi["autoLayout"] = useCallback(
    (o) => {
      const layout = autoLayout(registry, graph, o ?? {});
      const next = applyLayout(graph, layout, { preserve: o?.preserve });
      const changed = next.nodes.some((n, i) => n.x !== graph.nodes[i].x || n.y !== graph.nodes[i].y);
      if (changed) commit(next);
      return changed;
    },
    [registry, graph, commit]
  );

  const replace = useCallback((next: BlueprintGraph) => commit(next), [commit]);
  const clear = useCallback(() => commit(EMPTY), [commit]);

  const collapse: BlueprintApi["collapse"] = useCallback(
    (ids, label) => {
      const before = new Set(graph.nodes.map((n) => n.id));
      const next = collapseToSubgraph(registry, graph, ids, { ...(label ? { label } : {}) });
      if (next === graph) return null;
      commit(next);
      // 折叠后新出现的那个节点就是子图节点
      const added = next.nodes.find((n) => !before.has(n.id));
      return added?.id ?? null;
    },
    [registry, graph, commit]
  );

  const expand = useCallback(
    (nodeId: string) => {
      const node = graph.nodes.find((n) => n.id === nodeId);
      if (!node?.subgraph) return false;
      // 还有别的调用点就把定义留着, 否则连定义一起删  不然子图表会无限长
      const keep = subgraphRefCount(graph, node.subgraph) > 1;
      commit(expandSubgraph(graph, nodeId, { keepSubgraphDef: keep }));
      return true;
    },
    [graph, commit]
  );

  const writeSub = useCallback(
    (sgId: string, inner: Pick<BlueprintGraph, "nodes" | "edges">) => commit(writeSubgraph(graph, sgId, inner)),
    [graph, commit]
  );

  const addCmt: BlueprintApi["addComment"] = useCallback(
    (box, title) => {
      const r = addComment(graph, {
        x: box.x, y: box.y, w: box.w ?? 240, h: box.h ?? 140,
        ...(title ? { title } : {}),
      });
      commit(r.graph);
      return r.id;
    },
    [graph, commit]
  );

  const commentAroundIds: BlueprintApi["commentAround"] = useCallback(
    (ids, title) => {
      const r = commentAround(registry, graph, ids, { ...(title ? { title } : {}) });
      commit(r.graph);
      return r.id;
    },
    [registry, graph, commit]
  );

  const updateCmt: BlueprintApi["updateComment"] = useCallback(
    (id, patch) => commit(updateComment(graph, id, patch as never)),
    [graph, commit]
  );

  const removeCmt = useCallback((id: string) => commit(removeComment(graph, id)), [graph, commit]);
  const moveCmt = useCallback(
    (id: string, at: { x: number; y: number }) => commit(moveCommentWithNodes(registry, graph, id, at)),
    [registry, graph, commit]
  );
  const resizeCmt = useCallback(
    (id: string, box: { x: number; y: number; w: number; h: number }) => commit(resizeComment(graph, id, box)),
    [graph, commit]
  );

  return {
    graph, validation,
    addNode, removeNode, moveNode, moveNodes, duplicateNode,
    setNodeTitle, setParam, setCollapsed,
    connect, check, disconnect, disconnectInput,
    replace, clear, autoLayout: doLayout, tidy: doLayout,
    collapse, expand, writeSubgraph: writeSub,
    addComment: addCmt, commentAround: commentAroundIds,
    updateComment: updateCmt, removeComment: removeCmt,
    moveComment: moveCmt, resizeComment: resizeCmt,
  };
}

/** 选中集。框选、多选、点空白清空  每个画布都要, 抽出来免得各写一遍。 */
export function useSelection(initial: readonly string[] = []) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial));
  const ref = useRef(selected);
  ref.current = selected;

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const only = useCallback((id: string) => setSelected(new Set([id])), []);
  const add = useCallback((ids: readonly string[]) => setSelected((prev) => new Set([...prev, ...ids])), []);
  const clear = useCallback(() => setSelected(new Set()), []);

  return { selected, ref, toggle, only, add, clear, setSelected };
}
