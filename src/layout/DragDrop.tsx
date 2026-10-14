import type { DragEvent, ReactNode } from "react";
import { useCallback, useState } from "react";
import { cn } from "../primitives/utils";

/**
 * 拖放容器 —— 把一棵树里的节点拖到另一个节点上。
 *
 * ## 为什么用原生 HTML5 拖放而不是指针事件
 * 原生的 `draggable` + `dataTransfer` 自带三件很难自己写对的东西: 拖拽影像
 * (ghost image)、跨窗口投递、以及"松开即放置"的语义。用指针事件重写等于把这三点
 * 都重做一遍。代价是**触屏不支持** —— 这一点必须让调用方知道, 所以本组件不假装
 * 它通用: 触屏上要另给按钮入口 (树的行内菜单提供了同样的动作)。
 *
 * ## 为什么把"能不能放"做成回调而不是布尔
 * "A 能不能拖到 B 上"通常不是 B 的静态属性, 而是**两者的关系**: 同一层才能排序,
 * 不同类型的节点不能互放。所以 `canDrop(dragId, dropId)` 拿到双方 id 自己判。
 *
 * ## 放下之后不自己改数据
 * `onDrop` 只把 (dragId, dropId) 交出去。数据怎么变由调用方决定 —— 本组件不知道
 * "拖到另一个容器"在业务上意味着改哪个字段.
 */

/** 拖拽用的 MIME。自定义类型可以避免接住从别处拖来的文本/文件。 */
const MIME = "application/x-hx-node";

/** 展开到元素上的拖放属性。 */
export interface DragBindings {
  draggable: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
  "data-over": boolean;
}

export interface DragDropState {
  /** 正在被拖的 id; 没有拖拽时为 null。 */
  readonly draggingId: string | null;
  /** 当前悬停在其上、且允许放下的 id; 没有则为 null。 */
  readonly overId: string | null;
  /** 把一个 id 绑成可拖可放: `<div {...bind(id)} />`。 */
  readonly bind: (id: string, opts?: { draggable?: boolean }) => DragBindings;
}

export interface DragDropProps {
  readonly children: (state: DragDropState) => ReactNode;
  /**
   * A 能否放到 B 上。**必须**排除自己 (返回 false), 否则原地拖放会触发一次
   * 无意义的写入。
   */
  readonly canDrop: (dragId: string, dropId: string) => boolean;
  readonly onDrop: (dragId: string, dropId: string) => void;
  readonly className?: string;
}

/**
 * 拖放绑定: 把 (dragId, dropId) 交给调用方, 数据怎么变由调用方决定.
 *
 * .agents/notes/implemented/feature/2026-10-12-tree-drag-and-drop.md
 */
export function DragDrop({ children, canDrop, onDrop, className }: DragDropProps): ReactNode {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const bind = useCallback(
    (id: string, opts?: { draggable?: boolean }): DragBindings => ({
      draggable: opts?.draggable ?? true,
      onDragStart: (e: DragEvent) => {
        e.dataTransfer.setData(MIME, id);
        // 有些浏览器要求设置 effectAllowed 才会显示"可放置"光标。
        e.dataTransfer.effectAllowed = "move";
        setDraggingId(id);
      },
      onDragEnd: () => {
        setDraggingId(null);
        setOverId(null);
      },
      onDragOver: (e: DragEvent) => {
        // 🔴 必须 preventDefault, 否则 onDrop 永远不会触发 (HTML5 的默认行为是
        // "不接受放置")。这是原生拖放最常见的坑: 拖起来了, 松手没反应, 且无报错。
        if (draggingId === null || !canDrop(draggingId, id)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (overId !== id) setOverId(id);
      },
      onDragLeave: () => {
        if (overId === id) setOverId(null);
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        const dragId = e.dataTransfer.getData(MIME) || draggingId;
        setDraggingId(null);
        setOverId(null);
        if (dragId === null || dragId === "" || dragId === id) return;
        if (!canDrop(dragId, id)) return;
        onDrop(dragId, id);
      },
      "data-over": overId === id,
    }),
    [draggingId, overId, canDrop, onDrop],
  );

  return (
    <div
      className={cn("flex min-h-0 flex-col", className)}
      data-dragging={draggingId !== null}
    >
      {children({ draggingId, overId, bind })}
    </div>
  );
}
