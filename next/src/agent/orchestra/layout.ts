/**
 * 多 Agent 视图的几何计算 (纯函数, 无 "use client"): 图的分层布局与边, 泳道的时间刻度.
 */
import { flattenAgentTree, type AgentLink, type AgentTree } from "../model/agents";
import { GRAPH } from "./constants";

export interface Point {
  x: number;
  y: number;
}

/** 三次贝塞尔: 起点, 两个控制点, 终点 */
export type Cubic = readonly [Point, Point, Point, Point];

export interface GraphBox {
  id: string;
  x: number;
  y: number;
  depth: number;
}

export interface GraphEdge {
  id: string;
  kind: "spawn" | "handoff";
  from: string;
  to: string;
  curve: Cubic;
}

export interface GraphLayout {
  boxes: Map<string, GraphBox>;
  edges: GraphEdge[];
  width: number;
  height: number;
}

type Size = { nodeW: number; nodeH: number; colGap: number; rowGap: number; pad: number };

export const cubicPath = ([a, b, c, d]: Cubic) => `M${a.x},${a.y} C${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`;

/** 贝塞尔上均匀取 n+1 个点 (光点的关键帧) */
export function sampleCubic([a, b, c, d]: Cubic, n = 24): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    const k0 = u * u * u, k1 = 3 * u * u * t, k2 = 3 * u * t * t, k3 = t * t * t;
    out.push({ x: k0 * a.x + k1 * b.x + k2 * c.x + k3 * d.x, y: k0 * a.y + k1 * b.y + k2 * c.y + k3 * d.y });
  }
  return out;
}

const reverse = ([a, b, c, d]: Cubic): Cubic => [d, c, b, a];

/**
 * 分层布局: 父在左, 子按层向右排开. 叶子按先序依次占行, 父节点竖直居中于第一个与最后一个子节点之间.
 * 交接边画在两个节点右侧的弧上 (同一列时) 或两节点之间的 S 形曲线上.
 */
export function layoutAgentGraph(tree: AgentTree, size: Size = GRAPH): GraphLayout {
  const { nodeW, nodeH, colGap, rowGap, pad } = size;
  const flat = flattenAgentTree(tree);
  const depthOf = new Map(flat.map((f) => [f.node.id, f.depth]));
  const rows = new Map<string, number>();
  let next = 0;
  const place = (id: string): number => {
    const kids = (tree.nodes[id]?.children ?? []).filter((c) => depthOf.get(c) === (depthOf.get(id) ?? 0) + 1 && !rows.has(c));
    if (!kids.length) {
      rows.set(id, next);
      return next++;
    }
    const r = kids.map(place);
    const row = (r[0] + r[r.length - 1]) / 2;
    rows.set(id, row);
    return row;
  };
  for (const f of flat) if (f.depth === 0) place(f.node.id);
  for (const f of flat) if (!rows.has(f.node.id)) rows.set(f.node.id, next++);

  const boxes = new Map<string, GraphBox>();
  let maxDepth = 0;
  for (const f of flat) {
    maxDepth = Math.max(maxDepth, f.depth);
    boxes.set(f.node.id, { id: f.node.id, depth: f.depth, x: pad + f.depth * (nodeW + colGap), y: pad + (rows.get(f.node.id) ?? 0) * (nodeH + rowGap) });
  }

  const edges: GraphEdge[] = [];
  for (const f of flat) {
    const pid = f.node.parentId;
    const p = pid ? boxes.get(pid) : undefined;
    const c = boxes.get(f.node.id);
    if (!p || !c || !pid) continue;
    const a = { x: p.x + nodeW, y: p.y + nodeH / 2 };
    const d = { x: c.x, y: c.y + nodeH / 2 };
    const mx = (a.x + d.x) / 2;
    edges.push({ id: `spawn:${pid}>${f.node.id}`, kind: "spawn", from: pid, to: f.node.id, curve: [a, { x: mx, y: a.y }, { x: mx, y: d.y }, d] });
  }
  const seen = new Set<string>();
  for (const l of tree.links) {
    if (l.kind !== "handoff") continue;
    const key = `handoff:${l.from}>${l.to}`;
    const a = boxes.get(l.from);
    const b = boxes.get(l.to);
    if (seen.has(key) || !a || !b) continue;
    seen.add(key);
    edges.push({ id: key, kind: "handoff", from: l.from, to: l.to, curve: handoffCurve(a, b, nodeW, nodeH, colGap) });
  }

  const rowCount = Math.max(1, next);
  return {
    boxes,
    edges,
    width: pad * 2 + (maxDepth + 1) * nodeW + maxDepth * colGap + colGap / 2,
    height: pad * 2 + rowCount * nodeH + (rowCount - 1) * rowGap,
  };
}

function handoffCurve(a: GraphBox, b: GraphBox, nodeW: number, nodeH: number, colGap: number): Cubic {
  if (a.depth === b.depth) {
    // 同一列: 从右侧绕一个弧
    const x = a.x + nodeW;
    const bulge = colGap / 2;
    return [{ x, y: a.y + nodeH / 2 }, { x: x + bulge, y: a.y + nodeH / 2 }, { x: x + bulge, y: b.y + nodeH / 2 }, { x, y: b.y + nodeH / 2 }];
  }
  const left = a.x < b.x;
  const s = { x: left ? a.x + nodeW : a.x, y: a.y + nodeH / 2 };
  const e = { x: left ? b.x : b.x + nodeW, y: b.y + nodeH / 2 };
  const mx = (s.x + e.x) / 2;
  return [s, { x: mx, y: s.y }, { x: mx, y: e.y }, e];
}

/** 一条消息 / 交接的光点路线: 优先沿已有的边 (正向或反向), 没有边就在两节点之间拉一条曲线 */
export function linkRoute(layout: GraphLayout, link: Pick<AgentLink, "from" | "to">, nodeW = GRAPH.nodeW, nodeH = GRAPH.nodeH): Cubic | null {
  for (const e of layout.edges) {
    if (e.from === link.from && e.to === link.to) return e.curve;
    if (e.from === link.to && e.to === link.from) return reverse(e.curve);
  }
  const a = layout.boxes.get(link.from);
  const b = layout.boxes.get(link.to);
  if (!a || !b) return null;
  return handoffCurve(a, b, nodeW, nodeH, GRAPH.colGap);
}

/* ---------------- 泳道: 时间刻度 ---------------- */

const STEPS = [250, 500, 1000, 2000, 5000, 10_000, 15_000, 30_000, 60_000, 120_000, 300_000, 600_000, 900_000, 1_800_000, 3_600_000];

/** 跨度 span 毫秒, 大约 target 个刻度: 返回每个刻度相对起点的毫秒数 */
export function timeTicks(span: number, target = 6): number[] {
  const want = Math.max(1, span) / Math.max(1, target);
  const step = STEPS.find((s) => s >= want) ?? STEPS[STEPS.length - 1] * Math.ceil(want / STEPS[STEPS.length - 1]);
  const out: number[] = [];
  for (let t = 0; t <= span + 1; t += step) out.push(t);
  return out;
}

/** 刻度文字: 0s / 15s / 1:30 / 1:05:00 */
export function formatOffset(ms: number): string {
  if (ms < 1000 && ms > 0) return `${(ms / 1000).toFixed(1)}s`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  if (m < 60) return `${m}:${ss}`;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${ss}`;
}

/** 字符截断 (SVG 文字没有 text-overflow); 中日韩字符算两个宽 */
export function clip(text: string, width: number): string {
  let w = 0;
  let i = 0;
  for (; i < text.length; i++) {
    w += text.charCodeAt(i) > 0x2e80 ? 2 : 1;
    if (w > width) break;
  }
  return i < text.length ? `${text.slice(0, Math.max(0, i - 1))}…` : text;
}
