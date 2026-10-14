import type { BlueprintGraph, BlueprintNode, BlueprintEdge, BlueprintComment } from "./types";

/**
 * 蓝图剪贴板。
 *
 * ## 为什么自己实现而不是用系统剪贴板
 *
 * 1. 系统剪贴板是**异步 + 权限**的 (navigator.clipboard 需要用户手势与安全
 * 上下文), 而复制/粘贴在编辑器里必须是同步、可靠、可撤销的一步操作。
 * 2. 蓝图要复制的不只是节点, 还有**节点之间的连线**  只复制节点会丢掉
 * 内部结构, 粘出来一堆散点。
 * 3. 跨标签页同步是本库的能力: 内存剪贴板能让两个标签页之间也复制粘贴,
 * 系统剪贴板做不到 (或者说做得到但要权限)。
 *
 * ## 一条硬规则: 只复制"两端都在选区内"的边
 *
 * 选中 3 个节点去复制, 其中一条边连到外面第 4 个节点  那条边**不复制**。
 * 复制进来会变成一条悬空边 (指向不存在的节点), 而悬空边会让校验、求值、
 * 布局全线出错。宁可少复制一条线。
 */

export interface ClipboardPayload {
  readonly nodes: readonly BlueprintNode[];
  readonly edges: readonly BlueprintEdge[];
  /** 完全落在选区内的注释也一并带走。 */
  readonly comments?: readonly BlueprintComment[];
}

/**
 * 从图里裁出选区。
 *
 * @param ids 选中的节点 id。
 * @param offset 复制后再粘贴时的默认位移  不偏移的话粘出来会**精确盖住**
 * 原节点, 用户看不到任何变化, 只会以为"粘贴坏了"。
 */
export function copySelection(
  graph: BlueprintGraph,
  ids: readonly string[]
): ClipboardPayload {
  const set = new Set(ids);
  const nodes = graph.nodes.filter((n) => set.has(n.id));
  const edges = graph.edges.filter((e) => set.has(e.from.node) && set.has(e.to.node));
  const comments = (graph.comments ?? []).filter((c) => {
    // 注释只有在"它内部所有节点都被选中"时才跟着走 
    // 半包住的注释复制出去会框住一堆不存在的节点
    const inside = graph.nodes.filter(
      (n) => n.x >= c.x && n.y >= c.y && n.x <= c.x + c.w && n.y <= c.y + c.h
    );
    return inside.length > 0 && inside.every((n) => set.has(n.id));
  });
  return { nodes, edges, ...(comments.length ? { comments } : {}) };
}

/** 有没有实际内容。空选区不该覆盖掉剪贴板里原有的东西。 */
export function isEmptyClip(p: ClipboardPayload | null): boolean {
  return !p || p.nodes.length === 0;
}

/**
 * 把剪贴板内容贴进图里。
 *
 * ## id 必须重新生成
 *
 * 直接用原 id 会让粘贴出来的节点与原节点**同 id**, 于是选中、删除、
 * 连线全部串到同一个对象上  表现为"删掉新节点, 原节点也消失了"。
 * 所以每个节点与每条边都换新 id, 并按映射表改写边的两端。
 *
 * @param offset 位移量。不给就用默认 (24, 24): 看得出来是新的一份,
 * 又不至于跑到很远的地方。
 */
export function pasteClip(
  graph: BlueprintGraph,
  clip: ClipboardPayload,
  opts?: {
    readonly offset?: { readonly dx: number; readonly dy: number };
    readonly idGen?: (prefix: string) => string;
  }
): { readonly graph: BlueprintGraph; readonly ids: readonly string[] } {
  const dx = opts?.offset?.dx ?? 24;
  const dy = opts?.offset?.dy ?? 24;
  const gen = opts?.idGen ?? ((p: string) => `${p}_${Math.random().toString(36).slice(2, 8)}`);

  const idMap = new Map<string, string>();
  for (const n of clip.nodes) idMap.set(n.id, gen(n.id));

  const nodes: BlueprintNode[] = [
    ...graph.nodes,
    ...clip.nodes.map((n) => ({ ...n, id: idMap.get(n.id)!, x: n.x + dx, y: n.y + dy })),
  ];

  const edges: BlueprintEdge[] = [
    ...graph.edges,
    ...clip.edges.map((e) => ({
      id: gen("e"),
      from: { node: idMap.get(e.from.node)!, port: e.from.port },
      to: { node: idMap.get(e.to.node)!, port: e.to.port },
      ...(e.kind ? { kind: e.kind } : {}),
    })),
  ];

  const comments = (graph.comments ?? []).concat(
    (clip.comments ?? []).map((c) => ({ ...c, id: gen("c"), x: c.x + dx, y: c.y + dy }))
  );

  return {
    graph: { ...graph, nodes, edges, ...(comments.length ? { comments } : {}) },
    ids: [...idMap.values()],
  };
}

/**
 * 对齐选中的节点。
 *
 * UE4/UE5 社区的 Shift+W/A/S/D 四个方向键位。对齐到**选区的边界框**,
 * 而不是"第一个选中的节点"  后者随选择顺序变化, 同一次操作会得到
 * 不同结果, 那是不确定性。
 */
export function alignNodes(
  graph: BlueprintGraph,
  ids: readonly string[],
  edge: "left" | "right" | "top" | "bottom"
): BlueprintGraph {
  const set = new Set(ids);
  const picked = graph.nodes.filter((n) => set.has(n.id));
  if (picked.length < 2) return graph;

  const xs = picked.map((n) => n.x);
  const ys = picked.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    ...graph,
    nodes: graph.nodes.map((n) => {
      if (!set.has(n.id)) return n;
      switch (edge) {
        case "left": return { ...n, x: minX };
        case "right": return { ...n, x: maxX };
        case "top": return { ...n, y: minY };
        case "bottom": return { ...n, y: maxY };
      }
    }),
  };
}
