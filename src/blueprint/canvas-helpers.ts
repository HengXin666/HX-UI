/**
 * 画布的小工具函数。
 *
 * 单独成文件: canvas-parts.tsx 超了 tsx 行上限 (250), 而这些是纯逻辑,
 * 与展示组件没有纠缠。
 */
import type { BlueprintGraph, BlueprintRegistry } from "./types";
import { nodeHeight, nodeWidth } from "./geometry";
import { graphToHash } from "./sync";

/** 标题条高度 (图坐标) —— 只有它能拖动整块注释。 */
export const COMMENT_BAR_H = 22;

/** 右下角 resize 热区边长 (图坐标)。 */
export const COMMENT_HANDLE = 14;

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
    /**
     * 命中范围 = **标题条 + 右下角 resize 热区**, 不是整个框。
     *
     * 为什么: 整个框命中会和框里的节点抢指针 —— 用户报"框选的内容在里面
     * 不能再移动", 就是这么来的。框体区域留给节点, 注释只认自己那两个
     * "把手"位置。UE5 也是这样: 拖标题条搬整块注释。
     */
    const inBar = p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + COMMENT_BAR_H;
    const inHandle =
      p.x >= c.x + c.w - COMMENT_HANDLE && p.x <= c.x + c.w &&
      p.y >= c.y + c.h - COMMENT_HANDLE && p.y <= c.y + c.h;
    if (inBar || inHandle) {
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

/** 稳定哈希: 同一条边每次得到同一个绕行车道, 避免多条回边重叠成一条。 */
export function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * 把视口的三个命令打包交给外层。
 *
 * 视口 (平移/缩放) 是画布的私有状态, 外层复制一份必然漂移 —— 所以只传命令。
 * 快捷键 (Ctrl+= 放大 / Ctrl+0 重置 / Home 适应) 靠它工作。
 *
 * 为什么放这儿而不是画布里: BlueprintCanvas.tsx 是**冻结文件** (棘轮只许降),
 * 而这是一段独立的、与主流程无纠缠的小逻辑。
 */
export function makeViewportCommands(
  setView: (fn: (v: { x: number; y: number; zoom: number }) => { x: number; y: number; zoom: number }) => void,
  fitRef: { current: () => void }
): {
  readonly zoomBy: (delta: number) => void;
  readonly resetView: () => void;
  readonly fit: () => void;
} {
  return {
    // 函数式更新: 不捕获外层 view, 连按多次也不会互相覆盖
    zoomBy: (delta) => setView((v) => ({ ...v, zoom: Math.min(2.5, Math.max(0.25, v.zoom + delta)) })),
    resetView: () => setView(() => ({ x: 0, y: 0, zoom: 1 })),
    fit: () => fitRef.current(),
  };
}

/**
 * 点一个节点之后的选择集 —— UE5 的修饰键语义。
 *
 *   Ctrl/Cmd + 点击 = **切换** (已选则取消)
 *   Shift    + 点击 = **加选**
 *   无修饰           = 只选它 (若它已在多选里, 保持整个多选以便整组拖动)
 *
 * ⚠️ 曾经这里完全不认修饰键, 永远是单选。而"对齐"类快捷键要求选中两个以上
 *    节点才可能生效 (`sel.length < 2` 直接返回) —— 于是 Shift+W/A/S/D 四个键
 *    在真实交互里**根本用不出来**: 选不中两个, 按下就静默返回。
 *    功能写了、键位表也写了, 但用户用不出来 —— 这类失效只能靠交互测试抓。
 *
 * 抽成纯函数是为了可断言: 它是最容易写漏分支的地方。
 */
export function nextSelection(
  selected: readonly string[],
  id: string,
  e: { readonly ctrlKey?: boolean; readonly metaKey?: boolean; readonly shiftKey?: boolean }
): string[] {
  const cur = new Set(selected);
  if (e.ctrlKey || e.metaKey) {
    if (cur.has(id)) cur.delete(id);
    else cur.add(id);
    return [...cur];
  }
  if (e.shiftKey) {
    cur.add(id);
    return [...cur];
  }
  return selected.includes(id) && selected.length > 1 ? [...selected] : [id];
}

/**
 * 算出"独立整页画布"的链接。
 *
 * 图编码进 hash, 新标签页打开就有内容, 不用等同步; 太大就只带频道名,
 * 靠 BroadcastChannel 拿。
 *
 * 放回这里是因为 BlueprintCanvas.tsx 被行预算棘轮冻结 (只许降)。
 */
export function makeExpandHref(o: {
  readonly standaloneHref?: string;
  readonly standalonePageHref?: string;
  readonly graph: BlueprintGraph;
  readonly syncChannel?: string;
}): string | null {
  if (o.standaloneHref) return o.standaloneHref;
  if (!o.standalonePageHref) return null;
  const ch = encodeURIComponent(o.syncChannel ?? "hx-blueprint");
  const enc = graphToHash(o.graph);
  return enc
    ? `${o.standalonePageHref}#src=demo&channel=${ch}&graph=${enc}`
    : `${o.standalonePageHref}#src=demo&channel=${ch}`;
}

/**
 * 这次 pointerdown 是不是落在**浮层上的交互元素**里。
 *
 * ## 为什么必须判这个
 *
 * 画布在 pointerdown 里会 `setPointerCapture` —— 一旦捕获, 后续所有指针
 * 事件都归画布, 目标元素**再也收不到 click**。而左上角工具条的"独立页面"
 * 是个链接, 它就浮在画布上面: 真实鼠标点下去, 画布先捕获指针, 那个链接
 * 永远不会收到 click —— 表现就是"点了没反应"。
 *
 * 实测踩到过: 用 `element.click()` 直接派发是绕过命中测试的, 所以那样写的
 * e2e 会通过; 真实鼠标走完整链路必失败。**判据必须走真实输入**。
 *
 * @param target 事件目标。用 EventTarget 而不是 HTMLElement, 是为了让单测
 *               能塞一个只有 closest 的假对象进来。
 */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as { closest?: (s: string) => unknown } | null;
  if (!el || typeof el.closest !== "function") return false;
  return !!el.closest("a,button,input,select,textarea,[role='button']");
}
