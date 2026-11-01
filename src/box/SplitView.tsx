"use client";

import { useId, useMemo, type JSX, type ReactNode } from "react";
import { useDefaultLayout, type Layout, type LayoutStorage } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../primitives/resizable";
import { cn } from "../primitives/utils";
import { ORIENTATION, ROLE } from "../constants/ui";
import { BOX_SLOT, SPLIT_VIEW } from "../constants/box";

/** 什么都不存的存储: 没给 autoSaveId, 或运行环境没有 localStorage (SSR, 隐私模式) 时用. */
const MEMORY_ONLY: LayoutStorage = { getItem: () => null, setItem: () => undefined };

/**
 * 浏览器 localStorage 的安全包装: 读写异常 (配额满, 隐私模式, SSR) 一律吞掉退回不持久化,
 * 分栏照常可拖, 只是刷新后回到默认尺寸.
 */
function browserStorage(): LayoutStorage {
  if (!("localStorage" in globalThis)) return MEMORY_ONLY;
  return {
    getItem: (key) => {
      try {
        return globalThis.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        globalThis.localStorage.setItem(key, value);
      } catch {
        /* 配额满或被禁用: 放弃本次保存 */
      }
    },
  };
}

export interface SplitViewProps {
  /** 首栏与次栏的内容 (横向时是左右, 纵向时是上下). */
  readonly start: ReactNode;
  readonly end: ReactNode;
  /** 分栏方向, 默认 horizontal (左右). */
  readonly orientation?: (typeof ORIENTATION)[keyof typeof ORIENTATION];
  /** 首栏默认尺寸 (百分比), 默认 30. 有已保存的尺寸时以保存的为准. */
  readonly defaultSize?: number;
  /** 首栏尺寸上下限 (百分比), 默认 15 到 85. */
  readonly minSize?: number;
  readonly maxSize?: number;
  /** 首栏可拖到收起. */
  readonly collapsible?: boolean;
  /**
   * 持久化键. 给了就把用户拖出的尺寸存进 storage (组 id 为 hx-split:<autoSaveId>, 实际键由库再加前缀与栏 id), 刷新后恢复;
   * 同一页面多个 SplitView 需各给不同的键. 不给则只在本次会话内有效.
   */
  readonly autoSaveId?: string;
  /** 自定义存储 (sessionStorage, 或写 cookie 的实现). 默认 localStorage. */
  readonly storage?: LayoutStorage;
  /** 首栏与次栏的可访问名称, 渲染成 role={ROLE.region} 的 aria-label. */
  readonly startLabel?: string;
  readonly endLabel?: string;
  /** 拖拽条的可访问名称, 默认 "调整分栏大小". */
  readonly handleLabel?: string;
  /** 拖拽条中间显示握把. */
  readonly withHandle?: boolean;
  /** 拖拽结束 (含键盘调整) 后回调首栏百分比. */
  readonly onResizeEnd?: (startPercent: number) => void;
  readonly className?: string;
}

/**
 * 可记忆尺寸的双栏: 包一层 primitives/resizable (react-resizable-panels).
 *
 * 持久化用库自带的 useDefaultLayout: 读 storage 得到 defaultLayout 喂给 Group,
 * onLayoutChanged 只在用户真的拖动或用键盘调整后写回 (onlySaveAfterUserInteractions),
 * 窗口缩放引起的约束重算不会覆盖用户的选择.
 * 键盘: 拖拽条是 role="separator" 且可聚焦, 方向键微调, Home / End 到上下限, Enter 收起 (collapsible 时).
 */
export function SplitView({
  start,
  end,
  orientation = ORIENTATION.horizontal,
  defaultSize = SPLIT_VIEW.defaultStart,
  minSize = SPLIT_VIEW.minStart,
  maxSize = SPLIT_VIEW.maxStart,
  collapsible = false,
  autoSaveId,
  storage,
  startLabel,
  endLabel,
  handleLabel = SPLIT_VIEW.handleLabel,
  withHandle = false,
  onResizeEnd,
  className,
}: SplitViewProps): JSX.Element {
  const fallbackId = useId();
  const groupId = autoSaveId === undefined ? fallbackId : `${SPLIT_VIEW.storagePrefix}${autoSaveId}`;
  const startId = `${groupId}${SPLIT_VIEW.startSuffix}`;
  const endId = `${groupId}${SPLIT_VIEW.endSuffix}`;
  const store = useMemo(() => (autoSaveId === undefined ? MEMORY_ONLY : (storage ?? browserStorage())), [autoSaveId, storage]);
  const saved = useDefaultLayout({ id: groupId, storage: store, panelIds: [startId, endId], onlySaveAfterUserInteractions: true });

  const handleChanged = (layout: Layout, meta: Parameters<typeof saved.onLayoutChanged>[1]): void => {
    saved.onLayoutChanged(layout, meta);
    const size = layout[startId];
    if (meta.isUserInteraction && size !== undefined) onResizeEnd?.(size);
  };

  return (
    <ResizablePanelGroup
      id={groupId}
      data-slot={BOX_SLOT.splitView}
      orientation={orientation}
      defaultLayout={saved.defaultLayout}
      onLayoutChanged={handleChanged}
      className={cn("min-h-0", className)}
    >
      <ResizablePanel
        id={startId}
        role={ROLE.region}
        aria-label={startLabel}
        defaultSize={String(defaultSize)}
        minSize={String(minSize)}
        maxSize={String(maxSize)}
        collapsible={collapsible}
        className="min-h-0 min-w-0"
      >
        {start}
      </ResizablePanel>
      <ResizableHandle withHandle={withHandle} aria-label={handleLabel} />
      <ResizablePanel id={endId} role={ROLE.region} aria-label={endLabel} className="min-h-0 min-w-0">
        {end}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
