"use client";

import type { CSSProperties, JSX, KeyboardEvent, ReactNode } from "react";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "../primitives/utils";
import { IconSlot, type IconSource } from "./Icon";
import { SidebarNavBadgeView, type SidebarNavBadge } from "./SidebarNav";

/**
 * 树的**行渲染件**  与 {@link ./TreeNav} 的键盘/状态逻辑分开。
 *
 * 拆开的理由: 行里要塞下"箭头 + 图标 + 文字 + 附加信息 + 角标"五段, 而树本身
 * 还要管展开集、受控/非受控、roving 焦点。两者放一个文件会双双超过单文件行数
 * 上限, 而它们本来就可以独立读懂: 这里只回答"一行长什么样"。
 */

export interface TreeNode {
  readonly id: string;
  readonly label: string;
  /** 行首图标。省略即不占位。 */
  readonly icon?: IconSource;
  /** 复用侧栏角标 (计数 / 短文本)。 */
  readonly badge?: SidebarNavBadge;
  /** 右侧附加信息 (计数、大小、状态文字)。 */
  readonly meta?: ReactNode;
  readonly children?: readonly TreeNode[];
  /** 置灰且不可选中。仍可展开  展开是浏览行为, 选中才是动作。 */
  readonly disabled?: boolean;
}

export interface FlatNode {
  readonly node: TreeNode;
  readonly level: number;
  readonly parentId: string | null;
}

/** 每一层的缩进步长 (rem)。 */
const INDENT_STEP_REM = 0.75;
/** 预生成的层数上限。超过它的层级退回最大档  真实树深极少超过 8 层。 */
export const MAX_LEVEL = 12;

/**
 * 每一层的缩进量。
 *
 * 预生成而不是运行时拼类名: Tailwind 的产物只包含**源码里出现过**的类名,
 * 运行时拼出来的 `pl-[...]` 不会被生成, 表现为"缩进完全没生效"且不报错。
 * 因此这里给每一层一个变量, 组件只按层级取值。
 */
export const INDENT_VARS = {
  "--tree-indent": `${INDENT_STEP_REM}rem`,
  ...Object.fromEntries(
    Array.from({ length: MAX_LEVEL + 1 }, (_, i) => [`--tree-level-${i}`, `${i * INDENT_STEP_REM}rem`]),
  ),
} as CSSProperties;

/** 只把**展开的**节点收进可见列表  折叠项不进 DOM, 因此也不进无障碍树。 */
export function flattenTree(
  nodes: readonly TreeNode[],
  expanded: ReadonlySet<string>,
  out: FlatNode[] = [],
  level = 0,
  parentId: string | null = null,
): FlatNode[] {
  for (const node of nodes) {
    out.push({ node, level, parentId });
    if (node.children?.length && expanded.has(node.id)) {
      flattenTree(node.children, expanded, out, level + 1, node.id);
    }
  }
  return out;
}

/** 缩进量按层级取变量, 超出上限取最大档。 */
export function indentFor(level: number): string {
  return `var(--tree-level-${Math.min(level, MAX_LEVEL)})`;
}

/**
 * 单行视图。
 *
 * ## 最小可用示例
 *
 * ```tsx
 * import { TreeRow } from "@hx/ui";
 *
 * <TreeRow
 *   entry={{ node: { id: "a", label: "a.ts" }, level: 1, parentId: "src" }}
 *   selected={false} expanded={false} focusable={false}
 *   onActivate={fn} onToggleClick={fn} onKeyDown={fn}
 * />
 * ```
 *
 * 通常不需要直接用: {@link ./TreeNav} 已经把这些回调与 ARIA 属性接好了。
 * 只有在自定义导航容器 (例如与虚拟滚动配合) 时才单独用它。
 */
export interface TreeRowProps {
  readonly entry: FlatNode;
  readonly selected: boolean;
  readonly expanded: boolean;
  /** roving tabindex: 整棵树只有一行是可 Tab 到的。 */
  readonly focusable: boolean;
  readonly onActivate: (entry: FlatNode) => void;
  readonly onToggleClick: (entry: FlatNode) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLDivElement>, entry: FlatNode) => void;
}

export function TreeRow({ entry, selected, expanded, focusable, onActivate, onToggleClick, onKeyDown }: TreeRowProps): JSX.Element {
  const { node, level } = entry;
  const hasChildren = Boolean(node.children?.length);

  return (
    <div
      role="treeitem"
      aria-level={level + 1}
      aria-selected={selected}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-disabled={node.disabled || undefined}
      tabIndex={focusable ? 0 : -1}
      data-tree-index=""
      title={node.label}
      style={{ paddingLeft: `calc(${indentFor(level)} + 0.25rem)` }}
      onClick={() => onActivate(entry)}
      onKeyDown={(event) => onKeyDown(event, entry)}
      className={cn(
        "flex cursor-pointer select-none items-center gap-1.5 rounded-md py-1 pr-2 text-[13px] transition-colors",
        selected ? "bg-accent font-medium text-foreground" : "text-foreground hover:bg-accent/50",
        node.disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {hasChildren ? (
        <button
          type="button"
          /* 展开箭头是行的从属控件: 它不接受 Tab 焦点 (roving 焦点归行), 只响应指针。 */
          tabIndex={-1}
          aria-label={expanded ? "折叠" : "展开"}
          onClick={(event) => {
            event.stopPropagation();
            onToggleClick(entry);
          }}
          className="grid size-4 shrink-0 place-items-center rounded-sm text-muted-foreground"
        >
          <ChevronRightIcon className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
        </button>
      ) : (
        /* 无子节点时保留箭头列宽, 让同一层的图标纵向对齐。 */
        <span aria-hidden className="block size-4 shrink-0" />
      )}
      <IconSlot source={node.icon} />
      <span className="min-w-0 flex-1 truncate text-left">{node.label}</span>
      {node.meta ? <span className="shrink-0 text-[length:var(--fs-2xs)] text-muted-foreground">{node.meta}</span> : null}
      {node.badge ? <SidebarNavBadgeView badge={node.badge} /> : null}
    </div>
  );
}
