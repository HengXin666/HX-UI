import type { BlueprintGraph, BlueprintNode, PortRef } from "./types";
import { EXEC_IN_PORT, execOutIds } from "./connect";
import type { BlueprintRegistry } from "./types";

/**
 * 几何。
 *
 * 只有一件事是硬约定: **端口一律竖排**, 输入在左边界、输出在右边界。
 * 横排端口在节点变宽时会被挤出边界, 而竖排随高度自然增长。
 *
 * 所有数值都在"图坐标"里 (未缩放), 画到屏幕时乘 zoom 加平移。
 */

export const NODE_WIDTH = 176;
export const PORT_ROW = 20;
export const HEADER_H = 30;
export const BODY_TOP = HEADER_H + 8;
export const PORT_R = 4.5;
/** 贝塞尔的水平控制点长度。随两点水平距离自适应, 但不低于这个值。 */
export const CURVE_MIN = 28;

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** 节点高度: 标题 + 端口区 + 参数区。 */
export function nodeHeight(reg: BlueprintRegistry, node: BlueprintNode): number {
  const def = reg.nodeTypes.get(node.type);
  const collapsed = node.collapsed ?? def?.collapsed;
  if (collapsed) return HEADER_H;
  const ins = def?.inputs?.length ?? 0;
  const outs = def?.outputs?.length ?? 0;
  const rows = Math.max(ins, outs);
  const params = def?.params?.length ?? 0;
  return HEADER_H + 8 + rows * PORT_ROW + (params > 0 ? params * 24 + 6 : 0) + 8;
}

export function nodeWidth(reg: BlueprintRegistry, node: BlueprintNode): number {
  return reg.nodeTypes.get(node.type)?.width ?? NODE_WIDTH;
}

/** 端口在图坐标里的位置。 */
export function portPos(
  reg: BlueprintRegistry,
  graph: Pick<BlueprintGraph, "nodes">,
  ref: PortRef,
  dir: "in" | "out"
): Point | undefined {
  const node = graph.nodes.find((n) => n.id === ref.node);
  if (!node) return undefined;
  const def = reg.nodeTypes.get(node.type);
  const w = nodeWidth(reg, node);
  const collapsed = node.collapsed ?? def?.collapsed;

  // 执行入口画在标题条左侧中间
  if (dir === "in" && ref.port === EXEC_IN_PORT) {
    return { x: node.x, y: node.y + HEADER_H / 2 };
  }

  const outs = execOutIds(def);
  const rows = dir === "in" ? (def?.inputs ?? []) : (def?.outputs ?? []);

  /**
   * 输出列的行序 = [执行出口..., 数据出口...], 输入列 = [数据入口...]。
   * 这个顺序必须和 BlueprintNode 里画圆点的顺序一字不差 ——
   * 差一行就是 20px, 线的端点会明显偏离圆点。
   */
  let idx: number;
  if (dir === "out") {
    const e = outs.indexOf(ref.port);
    idx = e >= 0 ? e : outs.length + rows.findIndex((p) => p.id === ref.port);
  } else {
    idx = rows.findIndex((p) => p.id === ref.port);
  }
  if (idx < 0) return undefined;

  // 折叠时所有出口并到标题条中线
  if (collapsed) return { x: dir === "in" ? node.x : node.x + w, y: node.y + HEADER_H / 2 };

  const y = node.y + BODY_TOP + idx * PORT_ROW + PORT_ROW / 2;
  return { x: dir === "in" ? node.x : node.x + w, y };
}

/**
 * 边的 SVG 路径。
 *
 * 用水平控制点的三次贝塞尔而不是直线: 从右向左的边 (下游回到上游) 走直线会
 * 直接穿过节点, 而曲线会绕出一个可辨认的 S 形。
 */
export function edgePath(a: Point, b: Point): string {
  const dx = Math.abs(b.x - a.x);
  const c = Math.max(CURVE_MIN, dx * 0.5);
  return `M ${a.x} ${a.y} C ${a.x + c} ${a.y}, ${b.x - c} ${b.y}, ${b.x} ${b.y}`;
}

export function edgePathFrom(a: Point, b: Point): string {
  return edgePath(a, b);
}

/** 图坐标 -> 屏幕坐标。 */
export function toScreen(p: Point, view: { x: number; y: number; zoom: number }): Point {
  return { x: p.x * view.zoom + view.x, y: p.y * view.zoom + view.y };
}

/** 屏幕坐标 -> 图坐标。 */
export function toGraphPt(p: Point, view: { x: number; y: number; zoom: number }): Point {
  return { x: (p.x - view.x) / view.zoom, y: (p.y - view.y) / view.zoom };
}

/** 命中测试: 点落在哪个节点上。倒序遍历 —— 后画的在上层。 */
export function hitNode(reg: BlueprintRegistry, graph: BlueprintGraph, p: Point): BlueprintNode | undefined {
  for (let i = graph.nodes.length - 1; i >= 0; i--) {
    const n = graph.nodes[i];
    const w = nodeWidth(reg, n);
    const h = nodeHeight(reg, n);
    if (p.x >= n.x && p.x <= n.x + w && p.y >= n.y && p.y <= n.y + h) return n;
  }
  return undefined;
}

/** 命中测试: 点落在哪个端口上 (带半径容差)。 */
export function hitPort(
  reg: BlueprintRegistry,
  graph: BlueprintGraph,
  p: Point,
  tolerance = 9
): { ref: PortRef; dir: "in" | "out" } | undefined {
  let best: { ref: PortRef; dir: "in" | "out"; d: number } | undefined;
  for (const n of graph.nodes) {
    const def = reg.nodeTypes.get(n.type);
    if (!def) continue;
    for (const dir of ["in", "out"] as const) {
      const ids: string[] =
        dir === "in"
          ? [...(def.inputs ?? []).map((x) => x.id), ...(def.execIn ? [EXEC_IN_PORT] : [])]
          : [...(def.outputs ?? []).map((x) => x.id), ...execOutIds(def)];
      for (const id of ids) {
        const pos = portPos(reg, graph, { node: n.id, port: id }, dir);
        if (!pos) continue;
        const d = Math.hypot(pos.x - p.x, pos.y - p.y);
        if (d <= tolerance && (!best || d < best.d)) best = { ref: { node: n.id, port: id }, dir, d };
      }
    }
  }
  return best ? { ref: best.ref, dir: best.dir } : undefined;
}

/** 矩形求交 (框选用)。 */
export function rectsIntersect(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** 图的包围盒。用于"缩放到适应"。 */
export function graphBounds(reg: BlueprintRegistry, graph: BlueprintGraph) {
  if (graph.nodes.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const n of graph.nodes) {
    x0 = Math.min(x0, n.x);
    y0 = Math.min(y0, n.y);
    x1 = Math.max(x1, n.x + nodeWidth(reg, n));
    y1 = Math.max(y1, n.y + nodeHeight(reg, n));
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
