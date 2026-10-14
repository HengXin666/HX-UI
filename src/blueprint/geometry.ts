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
   * 这个顺序必须和 BlueprintNode 里画圆点的顺序一字不差 
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

/**
 * 回边的**绕行**路径。
 *
 * 为什么需要: 分层布局折行之后, "上一行末尾 -> 下一行开头"这类边在几何上
 * 必然往左回拉。用普通贝塞尔画, 它会**斜穿过中间所有节点**  就是用户说的
 * "从左边深入右边又拉回去", 极难看。
 *
 * 绕行: 从起点向右出一小段, 向下绕到两行之间的空白, 向左走到目标列, 再向下
 * 进入目标端口。整条线走在节点之间的空隙里, 不与任何节点相交。
 * 这也是 UE5 / n8n 画回边的方式。
 */
export function detourPath(a: Point, b: Point, opts?: { readonly lane?: number }): string {
  const lane = opts?.lane ?? 0;
  const out = Math.max(CURVE_MIN, 24);
  const midY = (a.y + b.y) / 2 + lane;
  return [
    `M ${a.x} ${a.y}`,
    // 出端口先向右出一小段 (沿数据流方向离开节点)
    `C ${a.x + out} ${a.y}, ${a.x + out} ${midY}, ${a.x + out} ${midY}`,
    // 横向走到目标列左边
    `L ${b.x - out} ${midY}`,
    // 拐进目标端口
    `C ${b.x - out} ${midY}, ${b.x - out} ${b.y}, ${b.x} ${b.y}`,
  ].join(" ");
}

/**
 * 是否该走绕行。
 *
 * 三个条件**同时**成立才绕:
 * 1. 明显往左回拉 (dx 为负且幅度可观)
 * 2. 垂直跨度也大  说明它跨了行。同一行内的回勾走普通曲线就够了,
 * 绕行反而画蛇添足
 * 3. 水平跨度足够大  短距离的回拉用贝塞尔已经很自然
 *
 * 第一版只看条件 1, 结果 70 条边里 50 条都在绕  短边也被画成绕来绕去,
 * 比原来更难看。收紧之后只有真正跨行长回边才绕。
 */
export function shouldDetour(a: Point, b: Point): boolean {
  const dx = b.x - a.x;
  const dy = Math.abs(b.y - a.y);
  return dx < -CURVE_MIN * 4 && dy > 60 && Math.abs(dx) > 200;
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

/** 命中测试: 点落在哪个节点上。倒序遍历  后画的在上层。 */
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

// ── UE5 风格连线 ──────────────────────────────────────────────────────

/**
 * 连线的视觉分类。
 *
 * 依据 UE 官方文档 (Nodes in Unreal Engine):
 * "Exec wires are displayed as **white arrows** spanning from an output exec
 * pin to an input exec pin. **The direction of the arrow indicates the flow
 * of execution.**"
 *
 * 所以执行线靠**白色 + 粗 + 箭头**三件事一起表达; 数据线是细的有色线,
 * 不带箭头  数据的方向由"左进右出"的版式表达, 再加箭头反而吵。
 *
 * 加箭头是个关键差异: 之前的执行线只是"粗一点的灰线", 与数据线区分度不够,
 * 扫一眼看不出控制流走向。UE 那套之所以看得舒服, 很大一部分来自这个箭头。
 */
export interface WireStyle {
  readonly width: number;
  readonly className: string;
  /** 执行线画箭头。 */
  readonly arrow: boolean;
}

export function wireStyle(opts: {
  readonly bad: boolean;
  readonly exec: boolean;
  readonly tint?: string;
  /** 是否处于高亮 (选中节点的连线)。 */
  readonly active?: boolean;
  /** 是否被淡化 (有选中但没连到它)。 */
  readonly dimmed?: boolean;
}): WireStyle {
  const { bad, exec, tint, active, dimmed } = opts;

  if (bad) return { width: 1.6, className: "stroke-destructive", arrow: exec };

  if (exec) {
    // 执行线: 白 (前景色) + 粗 + 箭头。淡化时降到 25% 并去掉箭头
    return {
      width: active ? 3 : 2.2,
      className: dimmed ? "stroke-foreground/25" : active ? "stroke-foreground" : "stroke-foreground/75",
      arrow: !dimmed,
    };
  }

  // 数据线: 细, 有类型色就用它
  const base = tint ?? "stroke-muted-foreground/70";
  return {
    width: active ? 2.2 : 1.4,
    className: dimmed ? "stroke-muted-foreground/20" : base,
    arrow: false,
  };
}

/**
 * 箭头顶点 (三角形三点坐标)。
 *
 * 锚在**终点端口**处, 方向取终点处的切线  否则折行/绕行的边上箭头会
 * 歪向一边, 反而误导方向。
 */
export function arrowHead(a: Point, b: Point, size = 6): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  // 单位方向 + 法线
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  // 尖端略往回缩, 免得盖住端口圆点
  const tipX = b.x - ux * 1.5;
  const tipY = b.y - uy * 1.5;
  const baseX = tipX - ux * size;
  const baseY = tipY - uy * size;
  const half = size * 0.52;
  return [
    `${tipX},${tipY}`,
    `${baseX + nx * half},${baseY + ny * half}`,
    `${baseX - nx * half},${baseY - ny * half}`,
  ].join(" ");
}

/** 箭头颜色取线的颜色  用 fill 类名而不是 stroke。 */
export function arrowFillClass(w: WireStyle): string {
  return w.className.replace(/stroke-/g, "fill-");
}
