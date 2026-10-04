import type { BlueprintEdge, BlueprintGraph, BlueprintNode, BlueprintRegistry } from "./types";
import { nodeHeight, nodeWidth } from "./geometry";

/**
 * 布局的辅助件。
 *
 * 单独成文件是因为主文件超过了行预算: 这些是**独立的小算法**, 与主流程
 * (分层 -> 定序 -> 定坐标) 没有纠缠, 拆出来既降行数也更清楚。
 */

/** 布局内部的节点视图。 */
export interface LayoutNode {
  readonly id: string;
  readonly node: BlueprintNode;
  w: number;
  h: number;
  rank: number;
  y: number;
}

/**
 * 把过长的链折叠进更少的列。
 *
 * 为什么需要: 分层布局的天然倾向是"链有多长就有多少列", 出来的图是一条
 * 细长带子。实测 dsh 图 28 列 / 宽高比 39.6 (8000 x 202), 缩放到适应后
 * 每个节点小得看不清 —— 那是"整理完更难看"的典型。
 *
 * 做法: 目标列数约 sqrt(n)*1.6 (让宽高比落在 1~3, 人眼舒服的区间)。
 * 超过就合并相邻列, 每次挑**合并代价最小**的一对 (代价 = 两列节点数之和)。
 *
 * 硬约束: 只能合并**没有依赖关系**的相邻列。若 a 列有节点指向 b 列,
 * 合并后那条边会变成同列内的竖线, 方向感就丢了。
 */
export function compactRanks(
  nodes: Map<string, LayoutNode>,
  ranks: Map<number, string[]>,
  succ: Map<string, string[]>
): void {
  const n = nodes.size;
  if (n <= 2) return;

  const target = Math.max(2, Math.round(Math.sqrt(n) * 1.6));
  let keys = [...ranks.keys()].sort((a, b) => a - b);
  let guard = 0;

  while (keys.length > target && guard++ < 200) {
    let bestI = -1;
    let bestCost = Infinity;
    for (let i = 0; i < keys.length - 1; i++) {
      const a = ranks.get(keys[i])!;
      const b = ranks.get(keys[i + 1])!;
      // 有依赖的列不能合并
      const linked = a.some((u) => (succ.get(u) ?? []).some((v) => b.includes(v)));
      if (linked) continue;
      const cost = a.length + b.length;
      if (cost < bestCost) {
        bestCost = cost;
        bestI = i;
      }
    }
    if (bestI < 0) break; // 所有相邻列都有依赖, 压不动了

    const from = keys[bestI + 1];
    const to = keys[bestI];
    for (const id of ranks.get(from)!) nodes.get(id)!.rank = to;
    ranks.set(to, [...ranks.get(to)!, ...ranks.get(from)!]);
    ranks.delete(from);
    keys = [...ranks.keys()].sort((a, b) => a - b);
  }
}


/**
 * 找出回边 (DFS 里指向灰色节点的边)。
 *
 * 这些边构成环, 分层时必须临时反转, 否则最长路径算法会在环上死循环
 * (或退化成"环上节点全是同一层")。
 */
export function findBackEdges(ids: readonly string[], edges: readonly BlueprintEdge[]): BlueprintEdge[] {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (e.from.node === e.to.node) continue;
    const l = adj.get(e.from.node);
    if (l) l.push(e.to.node);
    else adj.set(e.from.node, [e.to.node]);
  }

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  for (const id of ids) color.set(id, WHITE);

  const back: BlueprintEdge[] = [];
  const byPair = new Map<string, BlueprintEdge>();
  for (const e of edges) byPair.set(`${e.from.node}>${e.to.node}`, e);

  const visit = (u: string) => {
    color.set(u, GRAY);
    for (const v of adj.get(u) ?? []) {
      const c = color.get(v) ?? WHITE;
      if (c === GRAY) {
        const e = byPair.get(`${u}>${v}`);
        if (e) back.push(e);
      } else if (c === WHITE) {
        visit(v);
      }
    }
    color.set(u, BLACK);
  };

  for (const id of ids) if ((color.get(id) ?? WHITE) === WHITE) visit(id);
  return back;
}


/**
 * 数交叉数。用于评估布局质量与写测试。
 *
 * 接受**显式的坐标来源**, 而不是内部跑一次 autoLayout ——
 * 后者让这个函数永远只能测"布局后的交叉数", 于是它自己有没有算对
 * 根本无法验证 (实测踩到过: 造一张必然交叉的图, 它报 0, 因为布局已经把
 * 交叉修掉了, 看上去像是"算法完美", 实际是测量工具失效)。
 *
 * 不传坐标时才走 autoLayout。
 */
export function countCrossings(
  reg: BlueprintRegistry,
  graph: BlueprintGraph,
  positions?: ReadonlyMap<string, { x: number; y: number }>
): number {
  /**
   * 不传坐标时无法评估 —— 这里不再内部调 autoLayout。
   *
   * 原来会调, 于是 layout.ts 与 layout-parts.ts 形成了**循环依赖**
   * (parts 需要 autoLayout, layout 需要 parts 的辅助函数)。ESM 能跑,
   * 但这种环迟早在别的打包器或 tree-shaking 下出问题。
   * 而且它让这个函数永远只能测"布局后的交叉数", 自己算对没有无法验证。
   */
  if (!positions) throw new Error("countCrossings 需要显式坐标 (传第三个参数)");
  const layout = positions;
  const byX = new Map<number, string[]>();
  const rankOf = new Map<string, number>();
  for (const n of graph.nodes) {
    const p = layout.get(n.id);
    if (!p) continue;
    const k = Math.round(p.x);
    rankOf.set(n.id, k);
    const l = byX.get(k);
    if (l) l.push(n.id);
    else byX.set(k, [n.id]);
  }
  const keys = [...byX.keys()].sort((a, b) => a - b);
  for (const k of keys) {
    byX.get(k)!.sort((a, b) => (layout.get(a)?.y ?? 0) - (layout.get(b)?.y ?? 0));
  }
  const idx = new Map<string, number>();
  for (const k of keys) byX.get(k)!.forEach((id, i) => idx.set(id, i));

  let crossings = 0;
  const es = graph.edges.filter((e) => e.from.node !== e.to.node && rankOf.has(e.from.node) && rankOf.has(e.to.node));
  for (let i = 0; i < es.length; i++) {
    for (let j = i + 1; j < es.length; j++) {
      const a = es[i];
      const b = es[j];
      /**
       * 判据: 两条边的两端顺序相反即交叉 —— 与"两端是否同列"无关。
       *
       * 踩过的两个坑, 都是让统计静默失效:
       *   1. 原本要求"终点同层"才算, 于是跨列的交叉统计不到 (dsh 图报 0
       *      而实际一堆交叉, 看上去像算法完美, 实际是尺子坏了)。
       *   2. 去掉那个条件后又写了 `if (ax === bx) continue`, 于是**起点同列**
       *      的一对边被跳过 —— 而"一个节点扇形展开两条输出"恰恰是最常见
       *      的交叉场景。手工摆的交叉图就是这么漏掉的。
       *
       * 现在不做任何列相等的过滤: 用有向边端点的层内序号比较即可。
       * 起点/终点同列时序号是按 y 排的, 比较依然有意义。
       */
      const a1 = idx.get(a.from.node)!;
      const a2 = idx.get(a.to.node)!;
      const b1 = idx.get(b.from.node)!;
      const b2 = idx.get(b.to.node)!;
      // 各自"从上到下"的方向, 再比两条边是否相反
      const dirA = Math.sign(a2 - a1);
      const dirB = Math.sign(b2 - b1);
      // 只有起点列的相对顺序与终点列的相对顺序都确定时才能判
      const order1 = Math.sign(a1 - b1);
      const order2 = Math.sign(a2 - b2);
      if (order1 !== 0 && order2 !== 0 && order1 !== order2) crossings += 1;
      void dirA; void dirB;
    }
  }
  return crossings;
}

/**
 * 兜底: 消除残余重叠。
 *
 * 无论前面的分层/定序/折行算得对不对, 这里保证**最终不重叠**。
 *
 * 为什么需要兜底而不是修好上游: 折行逻辑涉及"行宽试算 + 行距累加 +
 * 行内居中", 任一处算错都会让相邻行的节点压住, 而这类错误只在特定
 * 图规模下才出现 —— 实测 dsh 图就有 6 处。与其保证上游每一步都对,
 * 不如在最下游加一道**必然成立**的约束: 不重叠是硬要求。
 *
 * 只向下推 (保序), 所以同列的相对顺序不变 —— 顺序是前面辛苦算出来的。
 */
export function resolveOverlaps(
  nodes: Map<string, LayoutNode>,
  xs: Map<number, number>,
  gapY: number
): void {
  const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
  // 排序键: y -> rank(决定 x) -> id。LayoutNode 没有 x 字段, x 由 rank 决定。
  const ordered = [...nodes.values()].sort(
    (a, b) => a.y - b.y || a.rank - b.rank || a.id.localeCompare(b.id)
  );
  for (const n of ordered) {
    const nx = xs.get(n.rank) ?? 0;
    let y = n.y;
    let guard = 0;
    for (;;) {
      const hit = placed.find(
        (p) => p.x < nx + n.w && nx < p.x + p.w && p.y < y + n.h && y < p.y + p.h
      );
      if (!hit || guard++ > 500) break;
      y = hit.y + hit.h + gapY;
    }
    n.y = y;
    placed.push({ x: nx, y: n.y, w: n.w, h: n.h });
  }
}
