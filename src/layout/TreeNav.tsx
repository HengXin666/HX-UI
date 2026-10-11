"use client";

import { useCallback, useMemo, useRef, useState, type JSX, type KeyboardEvent } from "react";
import { cn } from "../primitives/utils";
import { INDENT_VARS, TreeRow, flattenTree, type FlatNode, type TreeNode } from "./tree-parts";

export type { TreeNode, FlatNode } from "./tree-parts";
export type { SessionStatus } from "./SessionStatusDot";

/**
 * 通用树导航 (文件树 / 目录树 / 组织树共用)。
 *
 * ## 最小可用示例
 *
 * ```tsx
 * import { FolderIcon, FileIcon } from "lucide-react";
 * import { TreeNav, type TreeNode } from "@hx/ui";
 *
 * const nodes: TreeNode[] = [
 *   { id: "src", label: "src", icon: FolderIcon, children: [
 *     { id: "src/a.ts", label: "a.ts", icon: FileIcon, meta: "1.2 KB" },
 *   ]},
 * ];
 *
 * // 非受控: 展开状态由树自己记
 * <TreeNav nodes={nodes} defaultExpanded={["src"]} onSelect={(n) => open(n.id)} />
 *
 * // 行首状态 + 行尾附加: [状态点] [图标] 标签 … [trailing]
 * const running: TreeNode[] = [
 *   { id: "build", label: "构建", icon: HammerIcon, status: "running" },
 *   { id: "lint",  label: "静态检查", status: "unread", trailing: "2 分钟前" },
 * ];
 *
 * // 受控: 展开状态由调用方持有 (需要持久化, 或与外部筛选联动时)
 * <TreeNav
 *   nodes={nodes}
 *   expandedIds={openIds}
 *   onToggle={(id, next) => setOpenIds(next ? [...openIds, id] : openIds.filter((x) => x !== id))}
 * />
 * ```
 *
 * ## 为什么是"摊平 + 只渲染可见行"
 *
 * 键盘导航要求"上一行 / 下一行"是**视觉相邻的那一行**。嵌套 DOM 里相邻关系是
 * 深度优先的, 靠 `nextElementSibling` 找不到; 而"全部渲染、用 CSS 隐藏折叠项"
 * 又会把隐藏项留在无障碍树里  屏幕阅读器会念出用户看不见的条目。
 *
 * 摊平成一条可见列表之后: 上/下箭头就是数组下标 +-1, 折叠项**根本不进 DOM**,
 * 无障碍树与视觉树天然一致。
 */

export interface TreeNavProps {
  readonly nodes: readonly TreeNode[];
  /** 受控展开集。传了它就必须同时用 `onToggle` 更新, 组件不再自己记状态。 */
  readonly expandedIds?: readonly string[];
  readonly onToggle?: (id: string, expanded: boolean) => void;
  readonly selectedId?: string | null;
  readonly onSelect?: (node: TreeNode) => void;
  /** 非受控初始展开集。与 `expandedIds` 同时给出时后者优先。 */
  readonly defaultExpanded?: readonly string[];
  readonly className?: string;
  /** 无障碍名称。树没有可见标题时由它给出。 */
  readonly ariaLabel?: string;
}

export function TreeNav({
  nodes,
  expandedIds,
  onToggle,
  selectedId,
  onSelect,
  defaultExpanded,
  className,
  ariaLabel = "树",
}: TreeNavProps): JSX.Element {
  const [uncontrolled, setUncontrolled] = useState<readonly string[]>(defaultExpanded ?? []);
  const controlled = expandedIds !== undefined;
  const expanded = useMemo(
    () => new Set(controlled ? expandedIds : uncontrolled),
    [controlled, expandedIds, uncontrolled],
  );
  const flat = useMemo(() => flattenTree(nodes, expanded), [nodes, expanded]);

  const containerRef = useRef<HTMLDivElement>(null);
  /** roving tabindex: 整棵树只占一个 Tab 位, 焦点在行之间移动。 */
  const [focusIndex, setFocusIndex] = useState(0);
  const activeIndex = Math.min(focusIndex, Math.max(flat.length - 1, 0));

  const toggle = useCallback((id: string, next: boolean) => {
    if (!controlled) {
      setUncontrolled((prev) => (next ? [...prev, id] : prev.filter((x) => x !== id)));
    }
    onToggle?.(id, next);
  }, [controlled, onToggle]);

  const moveFocus = useCallback((index: number) => {
    setFocusIndex(index);
    containerRef.current?.querySelectorAll<HTMLElement>("[data-tree-index]")[index]?.focus();
  }, []);

  /** 行被点击或回车: 有子节点就先开合, 然后一律上报选中。 */
  const activate = (entry: FlatNode) => {
    if (entry.node.disabled) return;
    if (entry.node.children?.length) toggle(entry.node.id, !expanded.has(entry.node.id));
    onSelect?.(entry.node);
  };

  const toggleClick = (entry: FlatNode) => {
    if (entry.node.disabled) return;
    toggle(entry.node.id, !expanded.has(entry.node.id));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, entry: FlatNode) => {
    const index = flat.indexOf(entry);
    const { node } = entry;
    const hasChildren = Boolean(node.children?.length);
    const last = flat.length - 1;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveFocus(Math.min(index + 1, last));
        break;
      case "ArrowUp":
        event.preventDefault();
        moveFocus(Math.max(index - 1, 0));
        break;
      /* 右: 合着就展开; 已经展开则下移一行 (文件树的通行惯例)。 */
      case "ArrowRight":
        event.preventDefault();
        if (hasChildren && !expanded.has(node.id)) toggle(node.id, true);
        else moveFocus(Math.min(index + 1, last));
        break;
      /* 左: 开着就合上; 已经合上则上移到父节点。 */
      case "ArrowLeft":
        event.preventDefault();
        if (hasChildren && expanded.has(node.id)) {
          toggle(node.id, false);
        } else if (entry.parentId) {
          const parent = flat.findIndex((item) => item.node.id === entry.parentId);
          if (parent >= 0) moveFocus(parent);
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        activate(entry);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      role="tree"
      aria-label={ariaLabel}
      style={INDENT_VARS}
      className={cn("flex flex-col gap-0.5 outline-none", className)}
    >
      {flat.map((entry, index) => (
        <TreeRow
          key={entry.node.id}
          entry={entry}
          selected={entry.node.id === selectedId}
          expanded={expanded.has(entry.node.id)}
          focusable={index === activeIndex}
          onActivate={activate}
          onToggleClick={toggleClick}
          onKeyDown={handleKeyDown}
        />
      ))}
    </div>
  );
}
