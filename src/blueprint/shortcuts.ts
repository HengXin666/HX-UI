/**
 * 蓝图编辑器的快捷键  对齐 UE5。
 *
 * ## 键位来源
 *
 * Epic 官方 Cheat Sheet (Blueprint Editor) 与 Graph Editor 文档, 加上社区
 * UE5 的键位变化照抄官方与社区结论, 查不到的 (对齐/整理) 用社区沿用键位
 * 沿用键位并在 SHORTCUTS 表里标注 `official: false`。
 *
 * ## 三条边界 (不遵守会把编辑器做成没法用)
 *
 * 1. **输入框里不拦**。在注释标题里按 Delete 要删的是字, 不是节点。
 * 所有编辑器都守这条线。
 * 2. **没有选中时不吞键**。按 Ctrl+D 但没选节点, 应该让浏览器收到
 * (加书签), 而不是静默什么都不做  那会让人以为键盘坏了。
 * 3. **preventDefault 只在真的处理了之后调**。否则 Ctrl+F 这类
 * 浏览器原生功能会被永久挡死。
 */

export interface ShortcutDef {
  readonly id: string;
  /** 显示用的键位串, 如 "Ctrl+D"。 */
  readonly keys: string;
  readonly label: string;
  /** 是否有 Epic 官方文档依据。false = 社区沿用/本库自定义。 */
  readonly official: boolean;
  /** 分组, 用于帮助面板。 */
  readonly group: "编辑" | "视图" | "选择" | "节点";
}

/**
 * 快捷键全表。
 *
 * 它是**唯一事实源**: 帮助面板照它渲染, 处理器照它分派, e2e 照它断言。
 * 分开写三份必然漂移  那就是"文档说支持、实际不支持"的来源。
 */
export const SHORTCUTS: readonly ShortcutDef[] = [
  // ── 编辑 ──
  { id: "delete", keys: "Delete", label: "删除选中", official: true, group: "编辑" },
  { id: "duplicate", keys: "Ctrl+D", label: "复制选中 (UE5 由 Ctrl+W 改来)", official: true, group: "编辑" },
  { id: "copy", keys: "Ctrl+C", label: "复制", official: true, group: "编辑" },
  { id: "cut", keys: "Ctrl+X", label: "剪切", official: true, group: "编辑" },
  { id: "paste", keys: "Ctrl+V", label: "粘贴", official: true, group: "编辑" },
  { id: "undo", keys: "Ctrl+Z", label: "撤销", official: true, group: "编辑" },
  { id: "redo", keys: "Ctrl+Y / Ctrl+Shift+Z", label: "重做", official: true, group: "编辑" },
  { id: "comment", keys: "C", label: "给选中区域加注释框", official: false, group: "编辑" },

  // ── 视图 ──
  { id: "fit", keys: "Home", label: "缩放到适应选中", official: true, group: "视图" },
  { id: "zoomIn", keys: "Ctrl+=", label: "放大", official: false, group: "视图" },
  { id: "zoomOut", keys: "Ctrl+-", label: "缩小", official: false, group: "视图" },
  { id: "zoomReset", keys: "Ctrl+0", label: "重置为 1:1", official: false, group: "视图" },

  // ── 选择 ──
  { id: "selectAll", keys: "Ctrl+A", label: "全选", official: false, group: "选择" },
  { id: "escape", keys: "Esc", label: "取消选择 / 关闭浮层", official: true, group: "选择" },

  // ── 节点 ──
  { id: "search", keys: "Tab", label: "打开节点搜索菜单", official: true, group: "节点" },
  { id: "tidy", keys: "Q", label: "整理排列 (拉直连线)", official: false, group: "节点" },
  { id: "rename", keys: "F2", label: "重命名节点 / 编辑注释", official: false, group: "节点" },
  { id: "enterSubgraph", keys: "PageDown", label: "进入子图", official: true, group: "节点" },
  { id: "exitSubgraph", keys: "PageUp", label: "回到父图", official: true, group: "节点" },
  { id: "alignLeft", keys: "Shift+A", label: "左对齐", official: false, group: "节点" },
  { id: "alignRight", keys: "Shift+D", label: "右对齐", official: false, group: "节点" },
  { id: "alignTop", keys: "Shift+W", label: "顶对齐", official: false, group: "节点" },
  { id: "alignBottom", keys: "Shift+S", label: "底对齐", official: false, group: "节点" },
];

/**
 * 从一次键盘事件里认出是哪个快捷键。
 *
 * 抽成纯函数是**为了可测**: 键位识别是最容易写错的地方
 * (Mac 上 metaKey、大小写、Shift 组合), 而它埋在 DOM 事件回调里没法单测。
 *
 * @param e 只要 { key, ctrlKey, metaKey, shiftKey, altKey } 的形状,
 * 这样测试里可以造普通对象, 不必造 KeyboardEvent。
 */
export function matchShortcut(e: {
  readonly key: string;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
  readonly altKey?: boolean;
}): string | null {
  const mod = !!(e.ctrlKey || e.metaKey);
  /**
   * 键名归一: **一律**小写。
   *
   * 必须对所有键生效, 不能只处理单字符键  "Delete" / "Escape" / "Tab"
   * 这些是多字符键, 若不做归一, 它们与下面小写常量的比对永远不成立,
   * 那几个键会全部静默失效。
   */
  const k = e.key.toLowerCase();

  if (!mod && !e.shiftKey) {
    if (k === "delete" || k === "backspace") return "delete";
    if (k === "escape") return "escape";
    if (k === "c") return "comment";
    if (k === "q") return "tidy";
    if (k === "tab") return "search";
    if (k === "home") return "fit";
    if (k === "f2") return "rename";
    if (k === "pagedown") return "enterSubgraph";
    if (k === "pageup") return "exitSubgraph";
    return null;
  }

  if (mod && !e.shiftKey) {
    if (k === "d") return "duplicate";
    if (k === "c") return "copy";
    if (k === "x") return "cut";
    if (k === "v") return "paste";
    if (k === "z") return "undo";
    if (k === "y") return "redo";
    if (k === "a") return "selectAll";
    if (k === "=" || k === "+") return "zoomIn";
    if (k === "-") return "zoomOut";
    if (k === "0") return "zoomReset";
    return null;
  }

  // Shift 组合 (对齐)。注意 Shift+W/A/S/D 与 Tab 不冲突
  if (!mod && e.shiftKey) {
    if (k === "w") return "alignTop";
    if (k === "a") return "alignLeft";
    if (k === "s") return "alignBottom";
    if (k === "d") return "alignRight";
    return null;
  }

  if (mod && e.shiftKey) {
    if (k === "z") return "redo";
    return null;
  }

  return null;
}

/**
 * 这个快捷键该不该被拦下。
 *
 * 只有**真的能执行**时才返回 true  没选中节点时按 Ctrl+D 不该吞掉
 * 浏览器的"加书签", 否则用户会觉得键盘失灵。
 */
export function shouldHandle(id: string, ctx: { readonly hasSelection: boolean }): boolean {
  switch (id) {
    case "delete":
    case "duplicate":
    case "copy":
    case "cut":
    case "comment":
    case "rename":
      return ctx.hasSelection;
    case "paste":
      return true; // 剪贴板有内容由处理器再判
    default:
      return true;
  }
}

/** 焦点是否落在可输入元素里  在里面的按键不该被编辑器劫持。 */
export function isTypingTarget(t: { readonly tagName?: string; readonly isContentEditable?: boolean } | null): boolean {
  if (!t) return false;
  if (t.isContentEditable) return true;
  return /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName ?? "");
}
