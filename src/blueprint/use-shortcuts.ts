import { useCallback, useEffect, useRef } from "react";
import type { BlueprintGraph } from "./types";
import { matchShortcut, shouldHandle, isTypingTarget } from "./shortcuts";
import { copySelection, pasteClip, isEmptyClip, alignNodes, type ClipboardPayload } from "./clipboard";

/**
 * 把 UE5 那套快捷键接到编辑器上。
 *
 * ## 为什么分派函数与 hook 分离
 *
 * `runShortcut` 是**纯函数** (接受上下文对象), hook 只负责把它接到 window 上。
 * 这样两件事成为可能:
 *   1. 单测可以直接调 runShortcut, 不必挂载 React 或伪造 DOM 事件。
 *   2. "某个键位到底有没有实现"可以被**探测** —— 用探针上下文跑一次,
 *      看它有没有碰到任何状态。这个返回值必须真实反映实现 —— 若它恒为空,
 *      "帮助面板写了但按下去没反应"这类失效就没有任何机制能发现。
 *
 * ## 为什么用 ref 拿最新状态
 *
 * 键盘监听器只在挂载时注册一次 (依赖里放 graph 会导致每次改动都重新绑定,
 * 频繁 add/removeEventListener 本身就是问题)。但处理器要读**最新**的图与
 * 选区 —— 闭包会捕获注册那一刻的旧值。
 *
 * 这个坑在受控模式下尤其致命: 读到的旧 graph 会被当成"当前状态"提交回去,
 * 于是改动被悄悄回滚, 表现为"按了快捷键没反应"。
 */

/**
 * 画布交给编辑器的视口命令。
 *
 * 视口 (平移/缩放) 只存在于画布内部, 随手势每帧变化。编辑器不该自己存一份
 * —— 存了就是两份真相, 必然漂移。所以画布注册这个对象, 快捷键只做转发。
 */
export interface CanvasViewportApi {
  readonly zoomBy: (delta: number) => void;
  readonly resetView: () => void;
  readonly fit: () => void;
}

export interface UseShortcutsOptions {
  /** 当前编辑的图 (可能是子图层)。 */
  readonly getGraph: () => BlueprintGraph;
  /** 提交一份新图, 并声明这一步的历史标签。 */
  readonly commit: (
    next: Pick<BlueprintGraph, "nodes" | "edges">,
    tag: string | null,
    label?: string
  ) => void;
  readonly getSelection: () => readonly string[];
  readonly setSelection: (ids: readonly string[]) => void;
  readonly undo: () => void;
  readonly redo: () => void;
  /** 加注释框 (包住当前选区)。 */
  readonly onComment: (ids: readonly string[]) => void;
  /** 整理布局。 */
  readonly onTidy: () => void;
  /** 打开节点搜索菜单 (Tab)。 */
  readonly onSearch: () => void;
  /** F2 重命名。 */
  readonly onRename: (id: string) => void;
  /** Esc 时顺手关掉浮层。 */
  readonly onSearchClose?: () => void;
  readonly onEnterSubgraph?: () => void;
  readonly onExitSubgraph?: () => void;
  readonly getViewport?: () => CanvasViewportApi | null;
  /**
   * 剪贴板。放在上下文里而不是 hook 的 ref 里, 是为了让 runShortcut 成为
   * 纯函数 —— 于是"某个键有没有实现"可以被探测, 也能被单测直接调用。
   */
  clipboard?: ClipboardPayload | null;
  /** 是否启用。只读展示时关掉。 */
  readonly enabled?: boolean;
}

export interface ShortcutsApi {
  readonly hasClip: () => boolean;
  readonly run: (id: string) => void;
  /** 这个 id 是否真的有行为 (帮助面板与实现是否一致靠它守)。 */
  readonly implements_: (id: string) => boolean;
}

/** 从一张图里去掉这些节点, 并带走挂在其上的边。 */
function withoutNodes(graph: BlueprintGraph, ids: readonly string[]): Pick<BlueprintGraph, "nodes" | "edges"> {
  const set = new Set(ids);
  return {
    nodes: graph.nodes.filter((n) => !set.has(n.id)),
    edges: graph.edges.filter((e) => !set.has(e.from.node) && !set.has(e.to.node)),
  };
}

/**
 * 快捷键的真正分派。
 *
 * 每个 case 要么改图、要么改选择、要么调一个外部命令 —— **没有静默返回的实现**。
 * 落到 default 的就是"表里有、实际没行为"的死键, 由 implements_ 抓出来。
 */
export function runShortcut(id: string, o: UseShortcutsOptions): void {
  const graph = o.getGraph();
  const sel = o.getSelection();

  switch (id) {
    case "delete": {
      if (!sel.length) return;
      o.commit(withoutNodes(graph, sel), null, "删除节点");
      o.setSelection([]);
      return;
    }

    case "duplicate": {
      // UE5: Ctrl+D。带**内部连线**一起复制, 位移 (24,24) 免得盖住原节点
      if (!sel.length) return;
      const { graph: next, ids } = pasteClip(graph, copySelection(graph, sel));
      o.commit({ nodes: next.nodes, edges: next.edges }, null, "复制节点");
      o.setSelection(ids);
      return;
    }

    case "copy":
    case "cut": {
      if (!sel.length) return;
      o.clipboard = copySelection(graph, sel);
      if (id === "cut") {
        o.commit(withoutNodes(graph, sel), null, "剪切节点");
        o.setSelection([]);
      }
      return;
    }

    case "paste": {
      const clip = o.clipboard;
      if (isEmptyClip(clip)) return;
      const { graph: next, ids } = pasteClip(graph, clip!);
      o.commit({ nodes: next.nodes, edges: next.edges }, null, "粘贴节点");
      o.setSelection(ids);
      return;
    }

    case "undo": o.undo(); return;
    case "redo": o.redo(); return;

    case "selectAll":
      o.setSelection(graph.nodes.map((n) => n.id));
      return;

    case "comment":
      if (!sel.length) return;
      o.onComment(sel);
      return;

    case "tidy": o.onTidy(); return;
    case "search": o.onSearch(); return;

    case "rename": {
      const first = sel[0];
      if (first) o.onRename(first);
      return;
    }

    case "escape":
      // 重命名中的 Esc 由输入框自己拦 (stopPropagation), 走不到这里 ——
      // 局部意图必须局部处理, 全局猜不准。
      o.setSelection([]);
      o.onSearchClose?.();
      return;

    case "alignLeft":
    case "alignRight":
    case "alignTop":
    case "alignBottom": {
      if (sel.length < 2) return;
      const edge =
        id === "alignLeft" ? "left" : id === "alignRight" ? "right" : id === "alignTop" ? "top" : "bottom";
      const next = alignNodes(graph, sel, edge);
      o.commit({ nodes: next.nodes, edges: next.edges }, null, "对齐节点");
      return;
    }

    case "zoomIn": o.getViewport?.()?.zoomBy(0.1); return;
    case "zoomOut": o.getViewport?.()?.zoomBy(-0.1); return;
    case "zoomReset": o.getViewport?.()?.resetView(); return;
    case "fit": o.getViewport?.()?.fit(); return;

    case "enterSubgraph": o.onEnterSubgraph?.(); return;
    case "exitSubgraph": o.onExitSubgraph?.(); return;

    default:
      return;
  }
}

/**
 * 探某个快捷键 id 有没有实现 —— **唯一的判据实现**。
 *
 * ## 为什么必须只有一份
 *
 * 之前 hook 里有一份、check-blueprint 里另写一份, 于是很快就不一致了:
 * hook 那份用 `{...ref.current, clipboard: 值}` 造探针 —— 展开访问器取的是
 * **值** (null), 于是"只写剪贴板、不改图"的 Ctrl+C 永远被判成死键;
 * 而单测那份带了访问器, 判它已实现。同一个键, 两个答案。
 *
 * 现在 hook 与单测共用这一个工厂, 不可能再漂。
 *
 * ## 判据
 *
 * 用探针上下文跑一次 runShortcut, 看它有没有碰到**任何**东西:
 * 改图 / 改选择 / 写剪贴板 / 撤销重做 / 调外部命令 / 动视口, 都算。
 * 只有落到 `default` 的分支什么都不碰 —— 那就是"表里有、实际没行为"的死键。
 */
export function probeImplements(id: string): boolean {
  let touched = false;
  const hit = () => { touched = true; };

  // 剪贴板必须用访问器: 复制是"往里写", 粘贴是"往外读"。
  // 用普通属性就探测不到复制那一下 —— Ctrl+C 会被误判成死键。
  let clip: ClipboardPayload | null = {
    nodes: [{ id: "__p__", type: "__p__", x: 0, y: 0 }],
    edges: [],
  };
  const probe: UseShortcutsOptions = {
    get clipboard() { return clip; },
    set clipboard(v: ClipboardPayload | null) { clip = v; touched = true; },
    // 给两个节点: 让"需要选中 2 个以上"的对齐类分支不会提前 return
    getGraph: () => ({
      nodes: [
        { id: "__a__", type: "__p__", x: 0, y: 0 },
        { id: "__b__", type: "__p__", x: 40, y: 40 },
      ],
      edges: [],
    }),
    getSelection: () => ["__a__", "__b__"],
    setSelection: hit,
    commit: hit,
    undo: hit,
    redo: hit,
    onComment: hit,
    onTidy: hit,
    onSearch: hit,
    onRename: hit,
    onEnterSubgraph: hit,
    onExitSubgraph: hit,
    getViewport: () => ({ zoomBy: hit, resetView: hit, fit: hit }),
  };

  runShortcut(id, probe);
  return touched;
}

export function useShortcuts(opts: UseShortcutsOptions): ShortcutsApi {
  /**
   * 剪贴板存在 hook 内部的 ref 里, 但**对外仍表现为 opts.clipboard**。
   *
   * ⚠️ 访问器**不能**靠展开对象传递: `{...obj}` 会取值而不是复制访问器,
   *    于是剪贴板变成一次性的 —— 第一次粘贴有效, 第二次读到 null。
   *
   * 现在: 存储归 ref (稳定), 对外包一层**每次 render 重建但访问器指向同一
   * 个 ref** 的对象。读写都落到 ref, 多次粘贴自然可用。
   */
  const clipRef = useRef<ClipboardPayload | null>(opts.clipboard ?? null);
  const ref = useRef<UseShortcutsOptions>(opts);
  ref.current = {
    ...opts,
    get clipboard() { return clipRef.current; },
    set clipboard(v: ClipboardPayload | null) { clipRef.current = v; },
  };

  const run = useCallback((id: string) => {
    runShortcut(id, ref.current);
  }, []);

  useEffect(() => {
    if (opts.enabled === false) return;
    const onKey = (e: KeyboardEvent) => {
      // 1. 输入框里一律不拦 —— 在那里 Delete 删的是字
      if (isTypingTarget(e.target as HTMLElement | null)) return;

      const id = matchShortcut(e);
      if (!id) return;

      // 2. 没选中时不吞键 (Ctrl+D 无选区应留给浏览器的"加书签")
      const hasSelection = ref.current.getSelection().length > 0;
      if (!shouldHandle(id, { hasSelection })) return;

      // 3. 认领了才 preventDefault —— 否则会永久挡死浏览器原生功能
      e.preventDefault();
      run(id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run, opts.enabled]);

  const implements_ = useCallback((id: string) => probeImplements(id), []);

  return {
    hasClip: () => !isEmptyClip(clipRef.current),
    run,
    implements_,
  };
}
