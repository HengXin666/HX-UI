import { useCallback, useState } from "react";
import type { BlueprintGraph, BlueprintRegistry } from "./types";
import type { Point } from "./geometry";
import type { Viewport } from "./BlueprintCanvas";
import { hitComment, COMMENT_HANDLE } from "./canvas-helpers";

/**
 * 注释的指针交互: 命中分发 / 整块拖动 / 右下角改尺寸。
 *
 * 单独成 hook 的两个原因:
 *   1. BlueprintCanvas.tsx 已被行预算**冻结且只许降** (802 行), 把这块
 *      塞进去就超了。而它本身是内聚的 —— 三个状态 + 三条指针分支。
 *   2. 它有一套自己的坐标约定 (全部用图坐标), 集中在一处才不易搞错。
 *
 * ## 为什么 resize 的热区判据在**画布**里, 而不是给把手元素挂事件
 *
 * 把手元素不适合自己挂 onPointerDown: 它嵌在画布的 transform 层与页面
 * 滚动容器里, DOM 层级与裁剪会让点击命中不到它。放进画布统一的命中测试
 * 就没有这类问题 —— 坐标是同一套图坐标, 不依赖 DOM 嵌套与层级。
 * 那个 12px 的把手仍然画出来 —— 它是**给人看的提示**, 不是事件目标。
 */
export interface CommentInteraction {
  /** 命中测试。返回 null 表示没点到注释 (继续走节点/框选分支)。 */
  readonly hit: (p: Point) => { id: string; x: number; y: number; w: number; h: number } | null;
  /** 在 hit 命中之后调用: 决定这次是拖动还是改尺寸。 */
  readonly begin: (p: Point, onCapture: () => void) => void;
  /** 指针移动。返回 true 表示这次移动被注释消费了。 */
  readonly move: (p: Point) => boolean;
  /** 指针抬起, 清状态。 */
  readonly end: () => void;
  /** 有注释交互在进行中 —— 画布据此跳过其它分支。 */
  readonly active: boolean;
}

export function useCommentInteraction(opts: {
  readonly registry: BlueprintRegistry;
  readonly graph: BlueprintGraph;
  readonly view: Viewport;
  readonly onMove?: (id: string, at: { x: number; y: number }) => void;
  readonly onResize?: (id: string, box: { x: number; y: number; w: number; h: number }) => void;
}): CommentInteraction {
  const { graph, onMove, onResize } = opts;

  const [drag, setDrag] = useState<{
    readonly id: string;
    readonly start: Point;
    readonly origin: Point;
  } | null>(null);

  const [resize, setResize] = useState<{
    readonly id: string;
    readonly start: Point;
    readonly box: { x: number; y: number; w: number; h: number };
  } | null>(null);

  const hit = useCallback((p: Point) => hitComment(graph.comments, p), [graph.comments]);

  const begin = useCallback(
    (p: Point, onCapture: () => void) => {
      const c = hitComment(graph.comments, p);
      if (!c) return;
      // 右下角热区内 = 改尺寸; 其它位置 = 拖动整块 (UE5 的行为)
      const onHandle = p.x >= c.x + c.w - COMMENT_HANDLE && p.y >= c.y + c.h - COMMENT_HANDLE;
      if (onHandle && onResize) {
        setResize({ id: c.id, start: p, box: { x: c.x, y: c.y, w: c.w, h: c.h } });
      } else {
        setDrag({ id: c.id, start: p, origin: { x: c.x, y: c.y } });
      }
      onCapture();
    },
    [graph.comments, onResize]
  );

  const move = useCallback(
    (p: Point): boolean => {
      if (resize) {
        onResize?.(resize.id, {
          x: resize.box.x,
          y: resize.box.y,
          w: Math.max(60, resize.box.w + (p.x - resize.start.x)),
          h: Math.max(40, resize.box.h + (p.y - resize.start.y)),
        });
        return true;
      }
      if (drag) {
        // 绝对坐标而不是增量: 增量被每帧累加会指数放大 ("一拖就飞")
        onMove?.(drag.id, {
          x: drag.origin.x + (p.x - drag.start.x),
          y: drag.origin.y + (p.y - drag.start.y),
        });
        return true;
      }
      return false;
    },
    [drag, resize, onMove, onResize]
  );

  const end = useCallback(() => {
    setDrag(null);
    setResize(null);
  }, []);

  return { hit, begin, move, end, active: drag !== null || resize !== null };
}
