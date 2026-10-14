"use client";

import type { ComponentType, JSX, ReactNode } from "react";
import { cn } from "../primitives/utils";

/**
 * 图标槽  本库**唯一**的图标渲染入口。
 *
 * ## 最小可用示例
 *
 * ```tsx
 * import { FolderIcon } from "lucide-react";
 * import { IconSlot } from "@hx/ui";
 *
 * <IconSlot source={FolderIcon} />                        // 组件
 * <IconSlot source={<FolderIcon className="size-4" />} />  // 任意节点
 * <IconSlot source="icon-[solar--folder-linear]" />        // Iconify 类串
 * <IconSlot source={undefined} />                          // 不渲染, 不占位
 * ```
 *
 * ## 三种来源为什么要合到一个槽里
 *
 * 调用方拿到的图标形态本来就不统一: 有的宿主只有 Iconify 类串, 有的用图标组件
 * (本库已依赖 lucide), 有的直接给一个自绘的 svg 节点。如果每个消费组件各自判定,
 * 同一套规则会被复制到侧栏、树、按钮、表格里, 而**复制出来的判据迟早分叉**
 * 某一处补了空值分支、另一处没有, 表现是同一个图标在不同位置一个留白一个有图。
 *
 * 所以这里把"来源 -> DOM"收敛成一处: 消费组件只声明 `icon?: IconSource`,
 * 渲染交给 IconSlot。
 *
 * ## 空值不占位是刻意的
 *
 * `null` 与空串返回 `null` 而不是渲染一个空 span。图标槽的父级通常是
 * `flex items-center gap-2`, 一个空的 size-4 span 会照样吃掉 gap  看起来
 * 就是"图标位置莫名其妙空了一块"。没有图标时, 整行应该像从没写过图标一样。
 */

/**
 * 图标来源。
 *
 * - `string`             Iconify 类串 (形如 `icon-[solar--folder-linear]`)。
 * 走 mask-image, 因此跟随 currentColor, 选中态改个文字色
 * 就能整体变色, 不必换图。这是向后兼容的那条路径。
 * - `ComponentType`      图标组件 (lucide 等)。这类组件的 props 只要含
 * `className`, 就能被本槽统一控制尺寸与颜色。
 * - `ReactNode`          任意节点 (自绘 svg / 图片 / 文本徽记)。
 *
 * .agents/notes/implemented/feature/2026-10-12-icon-slot-and-tree-primitives.md
 */
export type IconSource = string | ComponentType<{ className?: string }> | ReactNode;

/**
 * 判定"这是不是一个图标组件"。
 *
 * `typeof === "function"` 不够: React 19 里 `forwardRef` 与 `memo` 产出的都是
 * **对象** (`{ $$typeof, render }`), 而 lucide 的图标正是 forwardRef。
 * 只判函数会把 lucide 图标漏进 ReactNode 分支, 于是它被包进一个 flex span
 * 尺寸不再由本槽统一控制  这是"看起来能跑但尺寸失控"的那类静默错误。
 *
 * 反向风险是"把普通对象当组件渲染"。用 `isValidElement` 先排除真正的元素
 * (元素对象同样不是函数, 但它必须走 ReactNode 分支), 剩下的对象里只有带
 * `$$typeof` 的才是 React 的组件类型标记。
 */
function isComponentSource(source: IconSource): source is ComponentType<{ className?: string }> {
  if (typeof source === "function") return true;
  if (source === null || typeof source !== "object") return false;
  // 真正的 React 元素交给 ReactNode 分支, 不要当组件调用
  if ("$$typeof" in source && "type" in source && "props" in source) return false;
  return "$$typeof" in source;
}

export interface IconSlotProps {
  /** 图标来源。省略或传空串时**不渲染任何节点**。 */
  readonly source?: IconSource;
  /** 追加类名。尺寸默认 size-4, 需要别的尺寸时在这里覆盖。 */
  readonly className?: string;
}

/**
 * 图标槽。按来源形态分派, 四条分支互斥且顺序固定。
 *
 * 尺寸与收缩行为写死 `size-4 shrink-0` 是刻意的: 图标在 flex 行里被压扁
 * (`shrink` 默认为 1) 是最常见的图标变形, 而它只在文字很长时才出现,
 * 很容易漏测。要别的尺寸由 `className` 覆盖, tailwind-merge 会处理冲突。
 */
export function IconSlot({ source, className }: IconSlotProps): JSX.Element | null {
  if (source === null || source === undefined || source === "") return null;

  if (typeof source === "string") {
    return <span aria-hidden className={cn(source, "size-4 shrink-0 bg-current", className)} />;
  }

  if (isComponentSource(source)) {
    const Source = source;
    return <Source className={cn("size-4 shrink-0", className)} />;
  }

  return (
    <span className={cn("inline-flex size-4 shrink-0 items-center justify-center", className)}>
      {source as ReactNode}
    </span>
  );
}
