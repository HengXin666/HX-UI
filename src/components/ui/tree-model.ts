/**
 * Tree 的纯逻辑: 摊平可见行, 键盘导航 (WAI-ARIA treeview), 字母跳转, 选中 (单选 / 多选 / 级联勾选).
 * 不带 "use client": 组件 (tree.tsx) 和自检脚本 (scripts/ui-check.ts) 共用, 服务端也能 import.
 *
 * 为什么摊平: 上下键要的是"视觉上的下一行". 嵌套 DOM 里下一行可能是孩子, 兄弟, 或某个祖先的兄弟,
 * 摊平成一条可见列表后就是下标 ±1; 折叠的子树不进列表也不进 DOM, 无障碍树和看到的一致.
 */
import type * as React from "react";

export interface TreeNode<T = unknown> {
  /** 全树唯一 */
  id: string;
  label: React.ReactNode;
  /** 纯文本名: 字母跳转与读屏用. label 是字符串时可省 */
  textValue?: string;
  /** 行首图标 */
  icon?: React.ReactNode;
  /** 展开时换的图标 (文件夹开合); 不给就一直用 icon */
  iconExpanded?: React.ReactNode;
  /** 行尾附加内容: 计数, 徽标, 大小, 时间 */
  trailing?: React.ReactNode;
  children?: readonly TreeNode<T>[];
  /** 有孩子但还没加载 (children 为空或未给): 第一次展开时调用 Tree 的 loadChildren */
  hasChildren?: boolean;
  /** 可聚焦但不能选中 / 展开 */
  disabled?: boolean;
  /** 业务数据, 原样带回回调 */
  data?: T;
}

/** 摊平后的一行 */
export interface TreeRow<T = unknown> {
  node: TreeNode<T>;
  /** 0 起 */
  depth: number;
  parentId: string | null;
  /** 在兄弟里的位置 (1 起) 与兄弟数, 给 aria-posinset / aria-setsize */
  pos: number;
  size: number;
  /** 是否是枝 (有孩子或待加载) */
  branch: boolean;
  expanded: boolean;
  /** 每一层祖先之后是否还有兄弟 (连接线: 有就画竖线贯穿) */
  guides: readonly boolean[];
  /** 自己是不是最后一个兄弟 (连接线拐角) */
  last: boolean;
}

export const isBranch = (n: TreeNode<unknown>): boolean => Boolean(n.children?.length) || Boolean(n.hasChildren);
export const textOf = (n: TreeNode<unknown>): string => n.textValue ?? (typeof n.label === "string" || typeof n.label === "number" ? String(n.label) : n.id);

/** 只摊平看得见的行: 折起的枝不往下走 */
export function flattenVisible<T>(nodes: readonly TreeNode<T>[], expanded: ReadonlySet<string>): TreeRow<T>[] {
  const out: TreeRow<T>[] = [];
  const walk = (list: readonly TreeNode<T>[], depth: number, parentId: string | null, guides: readonly boolean[]) => {
    list.forEach((node, i) => {
      const branch = isBranch(node);
      const open = branch && expanded.has(node.id);
      const last = i === list.length - 1;
      out.push({ node, depth, parentId, pos: i + 1, size: list.length, branch, expanded: open, guides, last });
      if (open && node.children?.length) walk(node.children, depth + 1, node.id, [...guides, !last]);
    });
  };
  walk(nodes, 0, null, []);
  return out;
}

/** 全树索引: id -> 节点 / 父 id */
export function indexTree<T>(nodes: readonly TreeNode<T>[]): { byId: Map<string, TreeNode<T>>; parentOf: Map<string, string | null> } {
  const byId = new Map<string, TreeNode<T>>();
  const parentOf = new Map<string, string | null>();
  const walk = (list: readonly TreeNode<T>[], parent: string | null) => {
    for (const n of list) {
      byId.set(n.id, n);
      parentOf.set(n.id, parent);
      if (n.children) walk(n.children, n.id);
    }
  };
  walk(nodes, null);
  return { byId, parentOf };
}

/** 节点自己 + 已加载的全部后代 */
export function subtreeIds(node: TreeNode<unknown>): string[] {
  const out: string[] = [node.id];
  for (const c of node.children ?? []) out.push(...subtreeIds(c));
  return out;
}

/** 全部枝的 id (展开全部用) */
export function branchIds(nodes: readonly TreeNode<unknown>[]): string[] {
  const out: string[] = [];
  const walk = (list: readonly TreeNode<unknown>[]) => {
    for (const n of list) {
      if (n.children?.length) {
        out.push(n.id);
        walk(n.children);
      }
    }
  };
  walk(nodes);
  return out;
}

/** 方向键等导航的结果: 焦点移到哪, 以及要不要展开 / 收起谁 */
export type TreeMove =
  | { kind: "focus"; id: string }
  | { kind: "expand"; id: string }
  | { kind: "collapse"; id: string }
  | { kind: "expandSiblings"; ids: string[] }
  | { kind: "none" };

export const TREE_KEYS = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End", "*"] as const;

/** WAI-ARIA treeview 的方向键: 上下走可见行, 右开 / 进第一个孩子, 左收 / 回父, Home / End 首尾, * 展开同级 */
export function moveFocus<T>(rows: readonly TreeRow<T>[], focusId: string | null, key: string): TreeMove {
  if (!rows.length) return { kind: "none" };
  const i = Math.max(0, rows.findIndex((r) => r.node.id === focusId));
  const row = rows[i];
  switch (key) {
    case "ArrowDown":
      return i < rows.length - 1 ? { kind: "focus", id: rows[i + 1].node.id } : { kind: "none" };
    case "ArrowUp":
      return i > 0 ? { kind: "focus", id: rows[i - 1].node.id } : { kind: "none" };
    case "Home":
      return { kind: "focus", id: rows[0].node.id };
    case "End":
      return { kind: "focus", id: rows[rows.length - 1].node.id };
    case "ArrowRight":
      if (!row.branch || row.node.disabled) return { kind: "none" };
      if (!row.expanded) return { kind: "expand", id: row.node.id };
      return rows[i + 1]?.parentId === row.node.id ? { kind: "focus", id: rows[i + 1].node.id } : { kind: "none" };
    case "ArrowLeft":
      if (row.branch && row.expanded && !row.node.disabled) return { kind: "collapse", id: row.node.id };
      return row.parentId ? { kind: "focus", id: row.parentId } : { kind: "none" };
    case "*": {
      const ids = rows.filter((r) => r.parentId === row.parentId && r.branch && !r.expanded && !r.node.disabled).map((r) => r.node.id);
      return ids.length ? { kind: "expandSiblings", ids } : { kind: "none" };
    }
    default:
      return { kind: "none" };
  }
}

/** 字母跳转: 从当前行的下一行起循环找第一个以 query 开头的行 (不分大小写); 找不到返回 null */
export function typeahead<T>(rows: readonly TreeRow<T>[], focusId: string | null, query: string): string | null {
  if (!rows.length || !query) return null;
  const q = query.toLocaleLowerCase();
  const start = rows.findIndex((r) => r.node.id === focusId);
  // 同一个字母连按: 在同字母开头的行之间轮转; 多个字母: 从当前行起匹配 (当前行本身也算)
  const repeat = q.length > 1 && [...q].every((c) => c === q[0]);
  const needle = repeat ? q[0] : q;
  const from = q.length > 1 && !repeat ? Math.max(start, 0) : start + 1;
  for (let k = 0; k < rows.length; k++) {
    const r = rows[(from + k) % rows.length];
    if (textOf(r.node).toLocaleLowerCase().startsWith(needle)) return r.node.id;
  }
  return null;
}

/** 展开集合的增删 (保持原顺序, 不重复) */
export function setExpanded(list: readonly string[], ids: readonly string[], open: boolean): string[] {
  if (open) return [...list, ...ids.filter((id) => !list.includes(id))];
  const drop = new Set(ids);
  return list.filter((id) => !drop.has(id));
}

/** 普通多选: 切换一项 */
export function toggleOne(selected: readonly string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
}

/** 连选: 可见行里 anchor 到 id 之间 (含两端, 跳过禁用) */
export function rangeIds<T>(rows: readonly TreeRow<T>[], anchor: string, id: string): string[] {
  const a = rows.findIndex((r) => r.node.id === anchor);
  const b = rows.findIndex((r) => r.node.id === id);
  if (a < 0 || b < 0) return [id];
  const [lo, hi] = a < b ? [a, b] : [b, a];
  return rows.slice(lo, hi + 1).filter((r) => !r.node.disabled).map((r) => r.node.id);
}

/** 勾选状态: 叶子看自己; 枝看已加载的后代 (全选 = 选中, 部分 = 半选) */
export type CheckState = boolean | "indeterminate";
export function checkState(node: TreeNode<unknown>, selected: ReadonlySet<string>): CheckState {
  const kids = node.children ?? [];
  if (!kids.length) return selected.has(node.id);
  const states = kids.filter((k) => !k.disabled).map((k) => checkState(k, selected));
  if (!states.length) return selected.has(node.id);
  if (states.every((s) => s === true)) return true;
  if (states.some((s) => s !== false)) return "indeterminate";
  return false;
}

/** 级联勾选: 勾 / 取消一个枝 = 它和全部未禁用的后代一起; 之后按孩子回填祖先 (全选则勾上, 否则取消) */
export function toggleCascade<T>(nodes: readonly TreeNode<T>[], selected: readonly string[], id: string): string[] {
  const { byId, parentOf } = indexTree(nodes);
  const node = byId.get(id);
  if (!node || node.disabled) return [...selected];
  const set = new Set(selected);
  const on = checkState(node, set) !== true;
  const walk = (n: TreeNode<T>) => {
    if (n.disabled) return;
    if (on) set.add(n.id);
    else set.delete(n.id);
    for (const c of n.children ?? []) walk(c);
  };
  walk(node);
  for (let p = parentOf.get(id) ?? null; p; p = parentOf.get(p) ?? null) {
    const pn = byId.get(p);
    if (!pn) break;
    if (checkState(pn, set) === true) set.add(p);
    else set.delete(p);
  }
  return [...set];
}
