import type { BlueprintEdge, BlueprintGraph, BlueprintNode, BlueprintRegistry } from "./types";
import { nodeHeight, nodeWidth } from "./geometry";

/**
 * 自动布局。
 *
 * ## 为什么需要
 *
 * 手写坐标摆出来的一定难看 —— 人会摆成一条直线或者一堆对齐的方块,
 * 而节点图真正要传达的是**流向与层次**。手写坐标还有个更实际的问题:
 * 图一改(加两个节点)就得重新摆一遍。
 *
 * ## 用什么算法
 *
 * 简化版的 **Sugiyama (分层) 布局**, 四步:
 *
 *   1. 分层     按最长路径把节点分到各层, 保证边一律从左往右
 *   2. 定序     层内排序, 减少交叉 ( barycenter 重心法, 迭代若干轮 )
 *   3. 定坐标   按序分配 y, 再按重心把相邻层拉近
 *   4. 拉直     把能对齐的父节点吸到子节点重心上
 *
 * 为什么不是力导向 (force-directed): 力导向出来的图"有机"但没有方向感,
 * 而且每次跑出来的形状都不一样 —— 对需要稳定复现的图 (进 git diff) 是灾难。
 * 分层布局是确定性的: 同样的图永远得到同样的坐标。
 * UE5 的 "Auto Arrange" 与 ComfyUI 的多数整理插件走的也是这一类。
 *
 * ## 三条刻意的选择
 *
 *   1. **确定性**。不用随机数, 同图必得同结果。排序用稳定排序 + id 兜底。
 *   2. **只动没手动摆过的**。给 `preserve` 传入一批节点 id, 它们保持原位 ——
 *      自动布局不该拆掉用户辛苦摆好的部分。
 *   3. **纯函数**。不依赖 React、不改原图, 返回新坐标表。
 */

export interface LayoutOptions {
  /** 层间水平间距。 */
  readonly rankGap?: number;
  /** 层内节点垂直间距。 */
  readonly nodeGap?: number;
  /** 定序迭代轮数。越多交叉越少, 但越慢。 */
  readonly iterations?: number;
  /** 这些节点保持原坐标不动。 */
  readonly preserve?: readonly string[];
  /** 边的方向: "lr" 左到右 (默认), "tb" 上到下。 */
  readonly direction?: "lr" | "tb";
}

/** 布局结果: 节点 id -> 新坐标。 */
export type LayoutResult = ReadonlyMap<string, { x: number; y: number }>;

interface LayoutNode {
  readonly id: string;
  readonly node: BlueprintNode;
  w: number;
  h: number;
  rank: number;
  y: number;
}

/**
 * 主入口: 算一张图的自动布局。
 *
 * 有环时先**拆环** —— 分层要求偏序, 有环就没法分层。
 * 拆法: 反向边的深度优先序里"回边"挑出来临时反转, 分完层再还原。
 * 环上的边不参与定序权重, 免得互相拉扯。
 */
export function autoLayout(
  reg: BlueprintRegistry,
  graph: BlueprintGraph,
  opts: LayoutOptions = {}
): LayoutResult {
  const gapX = opts.rankGap ?? 120;
  const gapY = opts.nodeGap ?? 40;
  const iterations = opts.iterations ?? 4;
  const dir = opts.direction ?? "lr";
  const preserve = new Set(opts.preserve ?? []);

  if (graph.nodes.length === 0) return new Map();

  // ── 建图 ──────────────────────────────────────────────────────────
  const nodes = new Map<string, LayoutNode>();
  for (const n of graph.nodes) {
    nodes.set(n.id, {
      id: n.id,
      node: n,
      w: nodeWidth(reg, n),
      h: nodeHeight(reg, n),
      rank: 0,
      y: 0,
    });
  }

  const succ = new Map<string, string[]>();
  const pred = new Map<string, string[]>();
  const link = (m: Map<string, string[]>, a: string, b: string) => {
    const l = m.get(a);
    if (l) {
      if (!l.includes(b)) l.push(b);
    } else m.set(a, [b]);
  };

  /** 参与布局的边。自环忽略 —— 它不影响层次。 */
  const edges = graph.edges.filter((e) => e.from.node !== e.to.node && nodes.has(e.from.node) && nodes.has(e.to.node));

  // ── 拆环: 反向边(回边)临时反转 ────────────────────────────────────
  const backEdges = findBackEdges(graph.nodes.map((n) => n.id), edges);
  const backSet = new Set(backEdges.map((e) => e.id));
  const flowEdges = edges.filter((e) => !backSet.has(e.id));

  for (const e of flowEdges) {
    link(succ, e.from.node, e.to.node);
    link(pred, e.to.node, e.from.node);
  }
  for (const e of backEdges) {
    // 反转后方向变成 to -> from
    link(succ, e.to.node, e.from.node);
    link(pred, e.from.node, e.to.node);
  }

  // ── 1. 分层: 最长路径 ─────────────────────────────────────────────
  const indeg = new Map<string, number>();
  for (const n of nodes.values()) indeg.set(n.id, (pred.get(n.id) ?? []).length);
  const queue: string[] = [];
  for (const n of nodes.values()) if ((indeg.get(n.id) ?? 0) === 0) queue.push(n.id);

  const order: string[] = [];
  while (queue.length) {
    const u = queue.shift()!;
    order.push(u);
    for (const v of succ.get(u) ?? []) {
      const d = (indeg.get(v) ?? 0) - 1;
      indeg.set(v, d);
      if (d === 0) queue.push(v);
    }
  }
  // 有孤立节点(或环没拆干净)时兜底: 剩下的按 id 稳定追加
  for (const n of nodes.values()) if (!order.includes(n.id)) order.push(n.id);

  for (const id of order) {
    const n = nodes.get(id)!;
    let rank = 0;
    for (const p of pred.get(id) ?? []) {
      rank = Math.max(rank, (nodes.get(p)?.rank ?? 0) + 1);
    }
    n.rank = rank;
  }

  // ── 按层分组 ──────────────────────────────────────────────────────
  const ranks = new Map<number, string[]>();
  for (const n of nodes.values()) {
    const l = ranks.get(n.rank);
    if (l) l.push(n.id);
    else ranks.set(n.rank, [n.id]);
  }
  const rankKeys = [...ranks.keys()].sort((a, b) => a - b);
  for (const k of rankKeys) {
    // 稳定排序 + id 兜底, 保证确定性
    ranks.get(k)!.sort((a, b) => a.localeCompare(b));
  }

  // ── 2. 定序: barycenter 迭代 ──────────────────────────────────────
  /** 层内索引。 */
  const posInRank = new Map<string, number>();
  const reindex = () => {
    for (const k of rankKeys) {
      ranks.get(k)!.forEach((id, i) => posInRank.set(id, i));
    }
  };
  reindex();

  const barycenter = (id: string, side: "pred" | "succ"): number | null => {
    const nb = (side === "pred" ? pred : succ).get(id) ?? [];
    if (nb.length === 0) return null;
    let sum = 0;
    let cnt = 0;
    for (const o of nb) {
      const p = posInRank.get(o);
      if (p === undefined) continue;
      sum += p;
      cnt += 1;
    }
    return cnt === 0 ? null : sum / cnt;
  };

  for (let it = 0; it < iterations; it++) {
    const downward = it % 2 === 0;
    const keys = downward ? rankKeys : [...rankKeys].reverse();
    for (const k of keys) {
      const layer = ranks.get(k)!;
      const measure = new Map<string, number>();
      layer.forEach((id, i) => {
        const b = barycenter(id, downward ? "pred" : "succ");
        // 没有邻居时保持当前位置, 免得被挤到边上
        measure.set(id, b ?? i);
      });
      layer.sort((a, b) => {
        const d = (measure.get(a) ?? 0) - (measure.get(b) ?? 0);
        return d !== 0 ? d : a.localeCompare(b); // id 兜底 = 确定性
      });
      ranks.set(k, layer);
      reindex();
    }
  }

  // ── 3. 定坐标 ─────────────────────────────────────────────────────
  // x: 按层的累计宽度; y: 层内按高度累加
  const xs: number[] = [];
  let cursor = 0;
  for (const k of rankKeys) {
    xs[k] = cursor;
    cursor += Math.max(...ranks.get(k)!.map((id) => nodes.get(id)!.w)) + gapX;
  }

  for (const k of rankKeys) {
    const layer = ranks.get(k)!;
    let y = 0;
    for (const id of layer) {
      const n = nodes.get(id)!;
      n.y = y;
      y += n.h + gapY;
    }
  }

  /**
   * 把每层垂直居中对齐到"整图的中线"。
   * 不做这一步的话各层都从 y=0 开始, 短层会贴在顶上, 整体是歪的。
   */
  const layerHeights = rankKeys.map((k) => {
    const layer = ranks.get(k)!;
    const last = layer[layer.length - 1];
    return nodes.get(last)!.y + nodes.get(last)!.h;
  });
  const maxH = Math.max(...layerHeights);
  for (let i = 0; i < rankKeys.length; i++) {
    const k = rankKeys[i];
    const shift = (maxH - layerHeights[i]) / 2;
    for (const id of ranks.get(k)!) nodes.get(id)!.y += shift;
  }

  // ── 4. 拉直: 把父节点吸到子节点重心 ────────────────────────────────
  /**
   * 相邻层之间做几轮重心吸附, 让"一个输出连多个输入"的连线接近直线。
   * 只在**不产生重叠**的前提下移动 —— 这一步改善观感, 但不能把布局搞坏。
   */
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < rankKeys.length; i++) {
      const k = rankKeys[i];
      const layer = ranks.get(k)!;
      for (const id of layer) {
        const nb = (succ.get(id) ?? []).concat(pred.get(id) ?? []);
        if (nb.length === 0) continue;
        const centers = nb
          .map((o) => nodes.get(o))
          .filter((n): n is LayoutNode => !!n)
          .map((n) => n.y + n.h / 2);
        if (centers.length === 0) continue;
        const want = centers.reduce((a, b) => a + b, 0) / centers.length - nodes.get(id)!.h / 2;

        // 夹到"不与同层邻居重叠"的范围内
        const idx = layer.indexOf(id);
        const prev = idx > 0 ? nodes.get(layer[idx - 1])! : null;
        const next = idx < layer.length - 1 ? nodes.get(layer[idx + 1])! : null;
        const lo = prev ? prev.y + prev.h + gapY : -Infinity;
        const hi = next ? next.y - nodes.get(id)!.h - gapY : Infinity;
        if (lo <= hi) nodes.get(id)!.y = Math.min(hi, Math.max(lo, want));
      }
    }
  }

  // ── 输出 ──────────────────────────────────────────────────────────
  const out = new Map<string, { x: number; y: number }>();
  for (const n of nodes.values()) {
    if (preserve.has(n.id)) {
      out.set(n.id, { x: n.node.x, y: n.node.y });
      continue;
    }
    out.set(n.id, dir === "lr" ? { x: xs[n.rank], y: n.y } : { x: n.y, y: xs[n.rank] });
  }

  /** 归一化到非负 —— 负坐标会让"缩放到适应"算出奇怪的偏移。 */
  let minX = Infinity;
  let minY = Infinity;
  for (const p of out.values()) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
  }
  if (minX !== Infinity && (minX < 0 || minY < 0)) {
    for (const [k, p] of out) out.set(k, { x: p.x - Math.min(0, minX), y: p.y - Math.min(0, minY) });
  }

  return out;
}

/**
 * 找出回边 (DFS 里指向灰色节点的边)。
 *
 * 这些边构成环, 分层时必须临时反转, 否则最长路径算法会在环上死循环
 * (或退化成"环上节点全是同一层")。
 */
function findBackEdges(ids: readonly string[], edges: readonly BlueprintEdge[]): BlueprintEdge[] {
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

/** 把布局结果应用到图上, 返回新图。 */
export function applyLayout(
  graph: BlueprintGraph,
  layout: LayoutResult,
  opts: { readonly preserve?: readonly string[] } = {}
): BlueprintGraph {
  const keep = new Set(opts.preserve ?? []);
  return {
    ...graph,
    nodes: graph.nodes.map((n) => {
      if (keep.has(n.id)) return n;
      const p = layout.get(n.id);
      return p ? { ...n, x: Math.round(p.x), y: Math.round(p.y) } : n;
    }),
  };
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
  const layout = positions ?? autoLayout(reg, graph);
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
