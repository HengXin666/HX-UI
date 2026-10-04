import type { BlueprintEdge, BlueprintGraph, BlueprintNode, BlueprintRegistry } from "./types";
import { nodeHeight, nodeWidth } from "./geometry";
import { compactRanks, findBackEdges, resolveOverlaps, worstBackPull, type LayoutNode } from "./layout-parts";
export { countCrossings } from "./layout-parts";

/** 布局结果: 节点 id -> 新坐标。 */
export type LayoutResult = ReadonlyMap<string, { x: number; y: number }>;

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

  /**
   * 分层: **尽量靠左**, 而不是最长路径。
   *
   * 最长路径分层会把链上每个节点都推到新的一列 —— dsh 图会摆出 28 列、
   * 宽高比 39.6 (8000 x 202), 一条细长带子, 缩放到适应后节点小得看不清。
   * 这就是"整理得难看"的根源。
   *
   * 改成: 只要所有前驱都已经定层, 就放在 (前驱最大层 + 1), 但因为我们是
   * 按拓扑序推进的, 这个值与最长路径相同。真正的修正在下面 ——
   * 用**列容量**把节点压进更少的列。
   */
  for (const id of order) {
    const n = nodes.get(id)!;
    let rank = 0;
    for (const p of pred.get(id) ?? []) {
      rank = Math.max(rank, (nodes.get(p)?.rank ?? 0) + 1);
    }
    n.rank = rank;
  }

  /**
   * 列的紧凑化: 把过长的链折叠进更少的列。
   *
   * 目标: 列数接近 sqrt(节点数) 的若干倍, 让宽高比落在 1~3 —— 那是人眼
   * 看着舒服的形状。做法: 若列数超过上限, 就按"每列的累计高度"把相邻列
   * 合并, 优先合并节点少的列 (合并代价小)。
   */

  // ── 按层分组 ──────────────────────────────────────────────────────
  const ranks = new Map<number, string[]>();
  for (const n of nodes.values()) {
    const l = ranks.get(n.rank);
    if (l) l.push(n.id);
    else ranks.set(n.rank, [n.id]);
  }
  void pred; void succ;
  /**
   * 列紧凑化必须在 ranks 建好之后、定序之前。
   * 放在定序之后会打乱已经算好的层内顺序。
   */
  compactRanks(nodes, ranks, succ);

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
  /**
   * x: 按层累计宽度, **超过阈值就折行**。
   *
   * 为什么必须折行: 一条 28 层的链, 每层 296px (节点宽 176 + 间距 120),
   * 摊开是 8000 x 202 的一条细带 —— 宽高比 39.6, 缩放到适应后每个节点
   * 都小得看不清, 整理完反而更难看。
   *
   * 折行让宽高比回到 1~3。折行处 y 拉开一个"行距", 视觉上是一个明显的
   * 断点, 不会误读成同一行。
   */
  const colWidths = rankKeys.map((k) => Math.max(...ranks.get(k)!.map((id) => nodes.get(id)!.w)));
  const rowHeightOf = (keys: number[]): number => {
    let maxH = 0;
    for (const k of keys) {
      const layer = ranks.get(k)!;
      const h = layer.reduce((acc, id) => acc + nodes.get(id)!.h + gapY, 0);
      maxH = Math.max(maxH, h);
    }
    return maxH;
  };

  /** 迭代试算而非解析式: 解析式假设"每行高度=全局最高列", 误差极大。 */
  const totalW = colWidths.reduce((a, b) => a + b + gapX, 0);
  const ASPECT = 2.0; // 目标宽高比
  const stairStep = Math.round((colWidths[0] ?? 176) * 1.5);

  const measure = (rowW: number): { w: number; h: number } => {
    let cursor = 0;
    let rows = 1;
    let rowMaxH = 0;
    let h = 0;
    for (let i = 0; i < rankKeys.length; i++) {
      const w = colWidths[i];
      const colH = ranks.get(rankKeys[i])!.reduce((acc, id) => acc + nodes.get(id)!.h + gapY, 0);
      if (cursor > 0 && cursor + w > rowW) {
        h += rowMaxH + gapY * 2.5;
        rows += 1;
        cursor = 0;
        rowMaxH = 0;
      }
      cursor += w + gapX;
      rowMaxH = Math.max(rowMaxH, colH);
    }
    h += rowMaxH;
    const w = Math.min(rowW, totalW);
    void rows;
    return { w, h: Math.max(1, h) };
  };

  /**
   * 阶梯步长: 每折一行, 起点右移多少。
   *
   * 取**行宽的七成**。这是个取舍: 步长越接近行宽, 跨行的那条边回拉越短
   * (回边长度 ≈ 行宽 - 步长), 但整幅图越宽。
   *
   * 用户明确抱怨"从左边深入右边又拉回去"的长边, 所以这里优先短回边,
   * 接受图更宽 —— 反正可以缩放和平移, 而一条横穿整幅图的线没法看。
   *
   * 归零折行 dx=-592; 步长=1.5 列宽 时 -328; 步长=0.7 行宽 时更短。
   */
  let maxRowW = totalW;
  let bestErr = Infinity;
  const maxPull = Math.max(1, totalW);
  // 候选: 从"每行 2 列"逐步放宽到"不折行"
  for (let colsPerRow = 2; colsPerRow <= rankKeys.length + 1; colsPerRow++) {
    const rowW = colWidths.slice(0, colsPerRow).reduce((a, b) => a + b + gapX, 0);
    const m = measure(rowW);
    const aspectErr = Math.abs(Math.log(m.w / m.h) - Math.log(ASPECT));
    // 回边惩罚权重: 与宽高比同量级, 但稍弱 (不能为了零回边把图拉成一条线)
    const err = aspectErr + 1.5 * (worstBackPull(colWidths, colsPerRow, rankKeys, ranks, succ, gapX) / maxPull);
    if (err < bestErr) {
      bestErr = err;
      maxRowW = rowW;
    }
  }
  // 也考虑完全不折行 (宽高比可能本来就合适)
  {
    const m = measure(totalW);
    const err = Math.abs(Math.log(m.w / m.h) - Math.log(ASPECT));
    if (err < bestErr) maxRowW = totalW;
  }

  const xs = new Map<number, number>();
  const rowOf = new Map<number, number>();
  const rowTops: number[] = [];
  {
    let cursor = 0;
    let row = 0;
    let rowH = 0;
    for (let i = 0; i < rankKeys.length; i++) {
      const k = rankKeys[i];
      const w = colWidths[i];
      if (cursor > 0 && cursor + w > maxRowW) {
        /**
         * 折行用**蛇形** (boustrophedon): 偶数行左→右, 奇数行右→左。
         *
         * 为什么: 直接归零会让跨行的边横穿整幅图 —— dsh 图有一条
         * dx = -592 的边 (往左拉回两整列), 就是用户说的"从左边深入右边
         * 又拉回去", 极难看。
         *
         * 蛇形下, 上一行的**行末**与下一行的**行首**在同一侧, 于是跨行的
         * 那条边几乎垂直向下 —— 短、整齐、方向清楚。阶梯式折行(每行右移
         * 一点)能把回拉从 592 降到 328, 蛇形则基本消掉它。
         */
        rowTops.push(rowH);
        row += 1;
        cursor = row * stairStep;
        rowH = 0;
      }
      xs.set(k, cursor);
      rowOf.set(k, row);
      cursor += w + gapX;
      rowH = Math.max(rowH, ranks.get(k)!.reduce((acc, id) => acc + nodes.get(id)!.h + gapY, 0));
    }
    rowTops.push(rowH);
  }

  // 每行的起始 y
  const rowBase: number[] = [];
  {
    let y = 0;
    for (let i = 0; i < rowTops.length; i++) {
      rowBase.push(y);
      y += rowTops[i] + gapY * 2.5; // 行距比节点间距大, 让折行处一眼可辨
    }
  }

  for (const k of rankKeys) {
    const layer = ranks.get(k)!;
    const base = rowBase[rowOf.get(k)!] ?? 0;
    let y = base;
    for (const id of layer) {
      const n = nodes.get(id)!;
      n.y = y;
      y += n.h + gapY;
    }
  }

  /**
   * 每层在本行内垂直居中。
   * 不做的话短层会贴在行顶, 整行看起来是歪的。
   */
  for (let i = 0; i < rankKeys.length; i++) {
    const k = rankKeys[i];
    const layer = ranks.get(k)!;
    const h = layer.reduce((acc, id) => acc + nodes.get(id)!.h + gapY, 0);
    const shift = ((rowTops[rowOf.get(k)!] ?? h) - h) / 2;
    for (const id of layer) nodes.get(id)!.y += shift;
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

  resolveOverlaps(nodes, xs, gapY);

  // ── 输出 ──────────────────────────────────────────────────────────
  const out = new Map<string, { x: number; y: number }>();
  for (const n of nodes.values()) {
    if (preserve.has(n.id)) {
      out.set(n.id, { x: n.node.x, y: n.node.y });
      continue;
    }
    out.set(n.id, dir === "lr" ? { x: xs.get(n.rank) ?? 0, y: n.y } : { x: n.y, y: xs.get(n.rank) ?? 0 });
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

