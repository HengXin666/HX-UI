/** 右下角 resize 热区边长 (图坐标)。 */
export const COMMENT_HANDLE = 14;

import type { BlueprintGraph, BlueprintRegistry } from "./types";
import { nodeHeight, nodeWidth } from "./geometry";

/**
 * 画布的小工具函数。
 *
 * 单独成文件: canvas-parts.tsx 超了 tsx 行上限 (250), 而这些是纯逻辑,
 * 与展示组件没有纠缠。
 */

/** 命中注释的**整个框** (不只是标题条)。倒序: 后加的在上面。 */
/** reason -> 人话。UI 靠 reason 而不是 message: message 是英文的。 */
export function reasonText(reason?: string): string {
  switch (reason) {
    case "type-mismatch": return "类型不匹配";
    case "self-loop": return "不能连回自己";
    case "duplicate": return "已经连过了";
    case "occupied": return "该输入口已占用";
    case "direction": return "执行流与数据流不能互连";
    case "missing-port": return "端口不存在";
    default: return "不能这样连";
  }
}

/** 命中注释的**整个框**。倒序: 后加的在上面。 */
export function hitComment(
  comments: readonly { id: string; x: number; y: number; w: number; h: number }[] | undefined,
  p: { x: number; y: number }
): { id: string; x: number; y: number; w: number; h: number } | undefined {
  if (!comments) return undefined;
  for (let i = comments.length - 1; i >= 0; i--) {
    const c = comments[i];
    if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) {
      // 一并返回 w/h: 调用方要用它判断"是否按在右下角热区"
      return { id: c.id, x: c.x, y: c.y, w: c.w, h: c.h };
    }
  }
  return undefined;
}

/** 把拖拽的两点归一成矩形。 */
export function normRect(r: { x0: number; y0: number; x1: number; y1: number }) {
  return {
    x: Math.min(r.x0, r.x1),
    y: Math.min(r.y0, r.y1),
    w: Math.abs(r.x1 - r.x0),
    h: Math.abs(r.y1 - r.y0),
  };
}

/** 完全落在矩形里的节点 —— 与"拖动会带走哪些"同一判据。 */
export function containedIds(
  reg: BlueprintRegistry,
  graph: Pick<BlueprintGraph, "nodes">,
  box: { x: number; y: number; w: number; h: number }
): string[] {
  return graph.nodes
    .filter((n) => {
      const w = nodeWidth(reg, n);
      const h = nodeHeight(reg, n);
      return n.x >= box.x && n.y >= box.y && n.x + w <= box.x + box.w && n.y + h <= box.y + box.h;
    })
    .map((n) => n.id);
}

const COMMENT_BAR_H = 22;

/** 稳定哈希: 同一条边每次得到同一个绕行车道, 避免多条回边重叠成一条。 */
export function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
