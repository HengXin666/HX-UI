/**
 * The ONE shortcut table. The keyboard handler matches against it and the help sheet ("?") renders it,
 * so they cannot drift. Keys are scoped to the focused editor (no window listeners).
 *
 * Key syntax: "Mod" = Ctrl or Cmd, letters match by physical key (KeyW), anything else by `event.key`.
 */

export type CommandId =
  | "undo" | "redo" | "copy" | "cut" | "paste" | "duplicate" | "delete" | "rename" | "comment" | "collapse"
  | "selectAll" | "escape" | "fit" | "menu" | "help" | "exit"
  | "straighten" | "alignTop" | "alignBottom" | "alignLeft" | "alignRight" | "alignMiddle" | "alignCenter"
  | "distributeX" | "distributeY"
  | "nudge" | "nudgeFine" | "focusNode" | "activate" | "find" | "breakpoint" | "run" | "step" | "stop"
  | "enter" | "clearBreakpoints" | "runToCursor";

export interface Shortcut {
  readonly id: CommandId;
  readonly keys: readonly string[];
  readonly label: string;
  readonly group: "编辑" | "选择与视图" | "布局" | "调试";
  /** Handled by the browser's copy / cut / paste events, not by keydown. */
  readonly native?: boolean;
  /** What the help sheet shows instead of the first key. */
  readonly display?: string;
}

export const SHORTCUTS: readonly Shortcut[] = [
  { id: "undo", keys: ["Mod+Z"], label: "撤销", group: "编辑" },
  { id: "redo", keys: ["Mod+Y", "Mod+Shift+Z"], label: "重做", group: "编辑" },
  { id: "copy", keys: ["Mod+C"], label: "复制为文本", group: "编辑", native: true },
  { id: "cut", keys: ["Mod+X"], label: "剪切", group: "编辑", native: true },
  { id: "paste", keys: ["Mod+V"], label: "粘贴到光标处", group: "编辑", native: true },
  { id: "duplicate", keys: ["Mod+D"], label: "原地复制", group: "编辑" },
  { id: "delete", keys: ["Delete", "Backspace"], label: "删除节点、注释或连线", group: "编辑" },
  { id: "rename", keys: ["F2"], label: "重命名", group: "编辑" },
  { id: "comment", keys: ["C"], label: "给选中节点加注释框", group: "编辑" },
  { id: "collapse", keys: ["Mod+G"], label: "折叠为子图", group: "编辑" },
  { id: "nudge", keys: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"], label: "按网格微移选中项", group: "编辑", display: "↑ ↓ ← →" },
  { id: "nudgeFine", keys: ["Shift+ArrowUp", "Shift+ArrowDown", "Shift+ArrowLeft", "Shift+ArrowRight"], label: "逐单位微移", group: "编辑", display: "Shift ↑ ↓ ← →" },
  { id: "selectAll", keys: ["Mod+A"], label: "全选", group: "选择与视图" },
  { id: "escape", keys: ["Escape"], label: "取消选择、关闭菜单", group: "选择与视图" },
  { id: "fit", keys: ["Home"], label: "适配选区（无选区时适配全部）", group: "选择与视图" },
  { id: "focusNode", keys: ["Alt+ArrowUp", "Alt+ArrowDown", "Alt+ArrowLeft", "Alt+ArrowRight"], label: "切换到该方向最近的节点", group: "选择与视图", display: "Alt ↑ ↓ ← →" },
  { id: "activate", keys: ["Enter"], label: "进入折叠图，或重命名节点", group: "选择与视图" },
  { id: "find", keys: ["Mod+F"], label: "查找节点", group: "选择与视图" },
  { id: "menu", keys: ["Tab"], label: "在光标处打开操作菜单（Shift Tab 移出编辑器）", group: "选择与视图" },
  { id: "enter", keys: ["PageDown"], label: "进入选中的折叠图、函数或宏", group: "选择与视图" },
  { id: "exit", keys: ["PageUp"], label: "返回上一层图", group: "选择与视图" },
  { id: "help", keys: ["?"], label: "快捷键一览", group: "选择与视图" },
  { id: "straighten", keys: ["Q"], label: "拉直选中节点的连线", group: "布局" },
  { id: "alignTop", keys: ["Shift+W"], label: "顶端对齐", group: "布局" },
  { id: "alignBottom", keys: ["Shift+S"], label: "底端对齐", group: "布局" },
  { id: "alignLeft", keys: ["Shift+A"], label: "左对齐", group: "布局" },
  { id: "alignRight", keys: ["Shift+D"], label: "右对齐", group: "布局" },
  { id: "alignMiddle", keys: ["Alt+Shift+W"], label: "垂直居中对齐", group: "布局" },
  { id: "alignCenter", keys: ["Alt+Shift+S"], label: "水平居中对齐", group: "布局" },
  { id: "distributeX", keys: ["Shift+H"], label: "水平均分", group: "布局" },
  { id: "distributeY", keys: ["Shift+V"], label: "垂直均分", group: "布局" },
  { id: "breakpoint", keys: ["F9"], label: "切换断点", group: "调试" },
  { id: "run", keys: ["F5"], label: "运行或继续", group: "调试" },
  { id: "step", keys: ["F10"], label: "单步", group: "调试" },
  { id: "stop", keys: ["Shift+F5"], label: "停止运行", group: "调试" },
  { id: "runToCursor", keys: ["Mod+F10"], label: "运行到选中节点", group: "调试" },
  { id: "clearBreakpoints", keys: ["Mod+Shift+F9"], label: "删除所有断点", group: "调试" },
];

/** Pointer gestures, shown in the help sheet next to the keys. */
export const GESTURES: readonly { readonly keys: string; readonly label: string }[] = [
  { keys: "右键 / 中键 / 空格 + 拖动", label: "平移画布" },
  { keys: "Ctrl + 滚轮", label: "以光标为中心缩放（编辑器获得焦点后直接滚轮）" },
  { keys: "空白处右键", label: "全部操作菜单" },
  { keys: "从引脚拖出", label: "连线；拖到空白处按类型筛选并自动连上" },
  { keys: "Ctrl + 拖引脚", label: "整体移动这个引脚的连线" },
  { keys: "Alt + 点击引脚", label: "断开这个引脚的连线" },
  { keys: "双击连线", label: "插入转接点" },
  { keys: "空白处拖动", label: "框选（Shift 追加，Ctrl 移除）" },
  { keys: "双击折叠图", label: "进入子图" },
  { keys: "右键引脚", label: "监视引脚的值" },
  { keys: "拖入变量（Alt 拖入）", label: "获取节点（设置节点）" },
  { keys: "按住 B / S / D + 单击", label: "放置分支 / 序列 / 延迟节点" },
  { keys: "拖入函数或宏", label: "调用节点" },
];

interface Combo { mod: boolean; shift: boolean; alt: boolean; key: string }

function parse(k: string): Combo {
  const parts = k.split("+");
  const key = parts[parts.length - 1]!;
  return { mod: parts.includes("Mod"), shift: parts.includes("Shift"), alt: parts.includes("Alt"), key };
}

const PARSED = SHORTCUTS.map((s) => ({ s, combos: s.keys.map(parse) }));

function hit(c: Combo, e: KeyboardEvent): boolean {
  const mod = e.ctrlKey || e.metaKey;
  if (c.mod !== mod || c.alt !== e.altKey) return false;
  if (/^[A-Z]$/.test(c.key)) return c.shift === e.shiftKey && e.code === `Key${c.key}`;
  // symbols like "?" already imply Shift on most layouts
  if (c.key.length === 1) return e.key === c.key;
  return c.shift === e.shiftKey && e.key === c.key;
}

/** Shortcut for a key event, or undefined. */
export function matchShortcut(e: KeyboardEvent): Shortcut | undefined {
  return PARSED.find(({ combos }) => combos.some((c) => hit(c, e)))?.s;
}

const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/** "Mod+Shift+Z" -> "Ctrl Shift Z" (or "⌘ ⇧ Z" on Mac) for display. */
export function keyLabel(k: string): string[] {
  const ARROW: Record<string, string> = { ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→" };
  return k.split("+").map((p) => (p === "Mod" ? (IS_MAC ? "⌘" : "Ctrl") : p === "Shift" && IS_MAC ? "⇧" : p === "Alt" && IS_MAC ? "⌥" : p === "Escape" ? "Esc" : ARROW[p] ?? p));
}

/** Typing in a field: only Escape reaches the editor. */
export function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
}
