/**
 * 流程图的分层布局: 按依赖深度分列, 列内按声明顺序分行, 坐标归一到 0..100.
 * 纯函数, 不依赖 DOM, 单测直接覆盖.
 */

export interface FlowNode {
  id: string;
  label: string;
  /** 选中时在说明区显示的一段话. */
  detail?: string;
}

export interface FlowEdge {
  from: string;
  to: string;
}

export interface PlacedNode extends FlowNode {
  column: number;
  row: number;
  x: number;
  y: number;
}

export interface PlacedEdge extends FlowEdge {
  d: string;
  /** 起点所在列, 入场按列错峰. */
  column: number;
}

export interface FlowLayout {
  nodes: PlacedNode[];
  edges: PlacedEdge[];
  columns: number;
}

const SPAN = 100;
const HALF = 0.5;
const SAMPLES = 24;
const CUBIC = 3;

/** 每个节点到源头的最长路径长度. 环上的节点按出现顺序追加到最后一列之后. */
function depths(nodes: readonly FlowNode[], edges: readonly FlowEdge[]): Map<string, number> {
  const known = new Set(nodes.map((node) => node.id));
  const incoming = new Map<string, number>(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>(nodes.map((node) => [node.id, []]));
  for (const edge of edges) {
    if (!known.has(edge.from) || !known.has(edge.to)) continue;
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    outgoing.get(edge.from)?.push(edge.to);
  }
  const depth = new Map<string, number>();
  const queue = nodes.filter((node) => incoming.get(node.id) === 0).map((node) => node.id);
  for (const id of queue) depth.set(id, 0);
  while (queue.length > 0) {
    const id = queue.shift() as string;
    for (const next of outgoing.get(id) ?? []) {
      depth.set(next, Math.max(depth.get(next) ?? 0, (depth.get(id) ?? 0) + 1));
      const left = (incoming.get(next) ?? 0) - 1;
      incoming.set(next, left);
      if (left === 0) queue.push(next);
    }
  }
  let tail = Math.max(-1, ...depth.values()) + 1;
  for (const node of nodes) {
    if (!depth.has(node.id)) {
      depth.set(node.id, tail);
      tail += 1;
    }
  }
  return depth;
}

/** 两点之间的水平 S 形三次曲线. 控制点落在两列正中, 线从侧边出, 侧边进. */
export function edgePath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const mid = from.x + (to.x - from.x) * HALF;
  return `M${from.x} ${from.y} C${mid} ${from.y} ${mid} ${to.y} ${to.x} ${to.y}`;
}

/** 三次曲线长度的近似: 均匀取样折线长度. 用来给脉冲虚线定长, 误差在 1% 以内. */
export function edgeLength(from: { x: number; y: number }, to: { x: number; y: number }): number {
  const mid = from.x + (to.x - from.x) * HALF;
  let total = 0;
  let px = from.x;
  let py = from.y;
  for (let step = 1; step <= SAMPLES; step += 1) {
    const t = step / SAMPLES;
    const u = 1 - t;
    const x = u * u * u * from.x + CUBIC * u * u * t * mid + CUBIC * u * t * t * mid + t * t * t * to.x;
    const y = u * u * u * from.y + CUBIC * u * u * t * from.y + CUBIC * u * t * t * to.y + t * t * t * to.y;
    total += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return total;
}

/**
 * 分层布局. 列宽均分, 每列的节点在纵向均分, 所以两三个节点的流程不会被挤到顶部.
 * 指向不存在节点的边直接丢弃, 不抛错: 流程描述常来自 CMS 或 Agent, 宁可少一条线.
 *
 * .agents/notes/implemented/feature/2026-11-08-viz-layer.md
 */
export function layoutFlow(nodes: readonly FlowNode[], edges: readonly FlowEdge[]): FlowLayout {
  const depth = depths(nodes, edges);
  const columns = Math.max(0, ...depth.values()) + 1;
  const byColumn: FlowNode[][] = Array.from({ length: columns }, () => []);
  for (const node of nodes) byColumn[depth.get(node.id) ?? 0].push(node);
  const placed = new Map<string, PlacedNode>();
  byColumn.forEach((list, column) => {
    list.forEach((node, row) => {
      const x = ((column + HALF) / columns) * SPAN;
      const y = ((row + HALF) / list.length) * SPAN;
      placed.set(node.id, { ...node, column, row, x, y });
    });
  });
  const placedEdges: PlacedEdge[] = [];
  for (const edge of edges) {
    const a = placed.get(edge.from);
    const b = placed.get(edge.to);
    if (a && b) placedEdges.push({ ...edge, d: edgePath(a, b), column: a.column });
  }
  return { nodes: nodes.map((node) => placed.get(node.id) as PlacedNode), edges: placedEdges, columns };
}

/** 键盘遍历顺序: 先列后行, 与视觉阅读顺序一致. */
export function walkOrder(layout: FlowLayout): string[] {
  return [...layout.nodes].sort((a, b) => a.column - b.column || a.row - b.row).map((node) => node.id);
}

/** 与某节点直接相连的边 (进或出), 高亮用. */
export function touching(layout: FlowLayout, id: string): Set<string> {
  const out = new Set<string>();
  for (const edge of layout.edges) {
    if (edge.from === id || edge.to === id) out.add(`${edge.from}>${edge.to}`);
  }
  return out;
}
