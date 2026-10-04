import { useCallback, useMemo, useRef, useState } from "react";
import type { BlueprintGraph, BlueprintNode, PortRef, BlueprintRegistry } from "./types";
import { applyConnect, canConnect, type ConnectResult } from "./connect";
import { validateGraph } from "./validate";
import type { GraphValidation } from "./types";

/**
 * 图状态。
 *
 * ## 受控 / 非受控
 *
 * 跟本库其它组件一个路子: 给 `value` 就是受控, 给 `defaultValue` 就是非受控。
 * 受控模式下所有命令原样转发给 onChange, 内部不留影子 ——
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
  /** 拖线前先问一次 —— 不落库, 只拿结论给 UI 染色。 */
  check(from: PortRef, to: PortRef): ConnectResult;
  disconnect(edgeId: string): void;
  /** 断开某输入口上的所有线。 */
  disconnectInput(nodeId: string, portId: string): void;

  /** 整体替换 (导入 / 撤销 / 清空)。 */
  replace(next: BlueprintGraph): void;
  clear(): void;
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

  /** 校验。按 graph 引用缓存 —— 拖坐标每帧变, 但结构没变时不该重算。 */
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

  const replace = useCallback((next: BlueprintGraph) => commit(next), [commit]);
  const clear = useCallback(() => commit(EMPTY), [commit]);

  return {
    graph, validation,
    addNode, removeNode, moveNode, moveNodes, duplicateNode,
    setNodeTitle, setParam, setCollapsed,
    connect, check, disconnect, disconnectInput,
    replace, clear,
  };
}

/** 选中集。框选、多选、点空白清空 —— 每个画布都要, 抽出来免得各写一遍。 */
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
