import { useCallback, useMemo, useRef, useState } from "react";
import type { BlueprintGraph } from "./types";

/**
 * 撤销 / 重做。
 *
 * ## 三条设计取舍
 *
 *   1. **存快照, 不存操作**。
 *      存操作 (命令模式) 要为每个操作写一个逆操作, 而蓝图的操作有二十来个,
 *      漏写或写错一个逆操作就是静默的状态损坏。存快照则**天然正确** ——
 *      撤销就是把上一份整图放回去。代价是内存, 但蓝图是 JSON, 几十个节点
 *      一份快照才几 KB; 限制栈深 (默认 50) 后完全可控。
 *
 *   2. **合并连续的同类改动** (拖动 / 连续输入参数)。
 *      拖一个节点每帧都产生一份快照, 撤销一次只退 1px 等于没有撤销。
 *      所以给每次提交打一个 `tag`: 同 tag 且间隔很短的连续提交合并成一步。
 *      拖动用 "move" 这个 tag, 松手后换 tag 就自然断开了。
 *
 *   3. **不给"重做"设歧义**: 新提交会清空重做栈 —— 这是所有编辑器的共识行为,
 *      不遵守会让用户按了重做却得到"另一条时间线"的东西。
 */

export interface HistoryEntry {
  readonly graph: BlueprintGraph;
  /** 这一步叫什么, 显示在 UI 上 ("移动节点" / "添加节点")。 */
  readonly label?: string;
  readonly at: number;
}

export interface UseHistoryOptions {
  /** 栈深上限。超出丢最旧的。 */
  readonly limit?: number;
  /**
   * 合并窗口 (ms)。同一个 tag 在这个窗口内的连续提交会被合并成一步。
   * 设 0 则不合并。
   */
  readonly coalesceMs?: number;
}

export interface HistoryApi {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** 撤销一步, 返回要恢复的图; 没有可撤的返回 null。 */
  undo(): BlueprintGraph | null;
  /** 重做一步, 返回要恢复的图; 没有可重的返回 null。 */
  redo(): BlueprintGraph | null;
  /**
   * 提交**改动之后**的新状态。
   *
   * ⚠️ 参数是**改动之后**的新状态, 不是旧状态 —— 内部会把"上一个状态"
   * 推进 past。传反了不报错, 但撤销恢复的是同一份旧图, 看起来毫无反应。
   *
   * @param tag 同类连续改动的标识 (如 "move" / "param")。给 null 表示不合并。
   */
  push(next: BlueprintGraph, opts?: { readonly tag?: string | null; readonly label?: string }): void;
  /** 重置 (换了图/导入时用)。 */
  reset(graph?: BlueprintGraph): void;
  /** 当前栈里的步数, 调试与 UI 用。 */
  readonly depth: { readonly past: number; readonly future: number };
  /** 下一步撤销的是什么 (用于按钮 tooltip)。 */
  readonly nextUndoLabel: string | null;
  readonly nextRedoLabel: string | null;
  /**
   * 跟踪一张图: 它变了就记一步历史。
   *
   * 为什么提供这个而不是让调用方手动 push: 受控模式下, 调用方在"改图命令
   * 之后"立刻读到的仍是**旧** graph (React 还没重渲染), 手动 push 进去的
   * 前后是同一份, 历史栈会一直是空的。
   *
   * 用 effect 监听 graph 引用, 则无论改动来自哪个入口 (面板点击 / 拖拽 /
   * 折叠 / 导入), 也无论时序如何, 都能可靠地记一步。
   */
  track(graph: BlueprintGraph, opts?: { readonly tag?: string | null; readonly label?: string }): void;
}

/**
 * 是否该把这次提交并入上一步。
 *
 * 抽成纯函数是为了可测 —— 合并逻辑是撤销/重做里最容易写错的地方
 * (判据反了会导致"拖一次撤不动"或"所有改动粘成一步"), 而它在 hook 内部
 * 时没法单独验证。
 *
 * 三条全满足才合并:
 *   1. 两步都给了 tag (tag 为 null 表示"这一步必须独立可撤")
 *   2. tag 相同
 *   3. 间隔在窗口内
 */
export function shouldCoalesce(
  last: { tag: string | null; at: number } | null,
  next: { tag: string | null; at: number },
  windowMs: number
): boolean {
  if (next.tag === null) return false;
  if (!last || last.tag === null) return false;
  if (last.tag !== next.tag) return false;
  return next.at - last.at < windowMs;
}

export function useHistory(opts: UseHistoryOptions = {}): HistoryApi {
  const limit = opts.limit ?? 50;
  const coalesceMs = opts.coalesceMs ?? 400;

  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);

  /** 最近一次提交的 tag 与时间 —— 判断是否该合并。 */
  const lastRef = useRef<{ tag: string | null; at: number } | null>(null);
  /** 当前图。撤销/重做时需要在栈之间搬移它。 */
  const currentRef = useRef<BlueprintGraph | null>(null);

  /**
   * push 的语义: "graph 变成了这个新状态"。
   * 所以要把**旧状态**推进 past —— 但旧状态只在合并判断失败时才需要,
   * 合并时保留更旧的那份即可 (中间态没有意义)。
   */
  const push = useCallback(
    (next: BlueprintGraph, o?: { readonly tag?: string | null; readonly label?: string }) => {
      const tag = o?.tag ?? null;
      const now = Date.now();
      const prev = currentRef.current;
      currentRef.current = next;

      // 第一次提交: 没有"旧状态"可存, 只记基线
      if (prev === null) {
        lastRef.current = { tag, at: now };
        return;
      }

      // 合并判定: 同 tag 且在窗口内
      const last = lastRef.current;
      const coalesce = shouldCoalesce(last, { tag, at: now }, coalesceMs);

      if (coalesce) {
        // 不改 past —— 已经存了更旧的那份, 中间态丢弃
        lastRef.current = { tag, at: now };
      } else {
        setPast((p) => {
          const next = [...p, { graph: prev, ...(o?.label ? { label: o.label } : {}), at: now }];
          return next.length > limit ? next.slice(next.length - limit) : next;
        });
        lastRef.current = { tag, at: now };
      }

      // 新提交清空重做栈
      setFuture((f) => (f.length ? [] : f));
    },
    [limit, coalesceMs]
  );

  /**
   * 撤销。
   *
   * ⚠️ 要返回的东西必须**同步**从 past 里取, 不能靠 setState 的 updater
   *    赋值 —— updater 是延迟执行的, 函数体 return 时那个变量还是 null,
   *    于是 undo() 永远返回 null。而返回类型允许 null, 所以不会报错。
   *
   *    这里 setState 只负责写, 读与写分开。
   */
  /**
   * "上一次见到的图" —— 只用于**去重**, 绝不用于判断"是不是第一次"。
   *
   * 两个 ref 表达同一个概念却没有同步机制就会出错, 所以: 去重交给
   * seenRef, "是否是第一次提交"完全交给 push 内部的 currentRef。
   */
  const seenRef = useRef<BlueprintGraph | null>(null);

  const undo = useCallback((): BlueprintGraph | null => {
    if (past.length === 0) return null;
    const last = past[past.length - 1];
    const cur = currentRef.current;

    setPast((p) => p.slice(0, -1));
    if (cur !== null) {
      setFuture((f) => [{ graph: cur, ...(last.label ? { label: last.label } : {}), at: Date.now() }, ...f].slice(0, limit));
    }
    currentRef.current = last.graph;
    seenRef.current = last.graph; // 标记已见, 免得 track 把它又记成一步新改动
    lastRef.current = null;       // 断开合并链

    return last.graph;
  }, [past, limit]);

  const redo = useCallback((): BlueprintGraph | null => {
    if (future.length === 0) return null;
    const first = future[0];
    const cur = currentRef.current;

    setFuture((f) => f.slice(1));
    if (cur !== null) {
      setPast((p) => [...p, { graph: cur, ...(first.label ? { label: first.label } : {}), at: Date.now() }].slice(-limit));
    }
    currentRef.current = first.graph;
    seenRef.current = first.graph;
    lastRef.current = null;

    return first.graph;
  }, [future, limit]);


  const track = useCallback(
    (graph: BlueprintGraph, o?: { readonly tag?: string | null; readonly label?: string }) => {
      if (seenRef.current === graph) return; // 引用没变 = 没改
      seenRef.current = graph;
      // 无条件交给 push —— 由它统一处理"第一次只记基线"与合并判定
      push(graph, o);
    },
    [push]
  );

  const reset = useCallback((graph?: BlueprintGraph) => {
    setPast([]);
    setFuture([]);
    lastRef.current = null;
    seenRef.current = graph ?? null;
    currentRef.current = graph ?? null;
  }, []);

  const nextUndoLabel = past.length ? past[past.length - 1].label ?? null : null;
  const nextRedoLabel = future.length ? future[0].label ?? null : null;

  return useMemo(
    () => ({
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      undo,
      redo,
      push,
      track,
      reset,
      depth: { past: past.length, future: future.length },
      nextUndoLabel,
      nextRedoLabel,
    }),
    [past.length, future.length, undo, redo, push, track, reset, nextUndoLabel, nextRedoLabel]
  );
}
