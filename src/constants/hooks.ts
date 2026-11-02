/**
 * 共享 hooks 层 (src/hooks/) 的取值: DOM 事件名, 媒体查询, 断点档, 快捷键修饰键与默认时长.
 */

/**
 * SSR 判据: window 与 document 在服务端未声明, 只能用 typeof 探测, 比较值只在这里出现.
 *
 * .agents/notes/implemented/architecture/2026-11-02-shared-hooks.md
 */
export const canUseDOM = (): boolean => typeof window !== "undefined" && typeof document !== "undefined";

/** 函数判据: typeof 收窄必须写字面量, 所以以 type guard 形式收在这里. */
export const isFunction = (value: unknown): value is (...args: never[]) => unknown => typeof value === "function";

/** setState 式更新函数判据: 区分 "新值" 与 "基于旧值计算新值的函数". */
export const isUpdater = <T>(value: T | ((prev: T) => T)): value is (prev: T) => T => isFunction(value);

/** hooks 层订阅的 DOM 事件名. */
export const HOOK_EVENT = {
  mousedown: "mousedown",
  touchstart: "touchstart",
  keydown: "keydown",
  change: "change",
  storage: "storage",
} as const;

/** useLocalStorage 同一标签页内多处实例互相通知用的自定义事件名 (原生 storage 事件只在其他标签页触发). */
export const LOCAL_STORAGE_SYNC_EVENT = "hx:local-storage";

/** 系统 "减弱动效" 的媒体查询. */
export const HOOK_MEDIA_REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** 断点档 (px, min-width), 与 Tailwind 默认断点同值, 低于最小档时为 BREAKPOINT_BASE. */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/** 视口宽度低于全部断点时 useBreakpoint 的返回值. */
export const BREAKPOINT_BASE = "base";

/** useClipboard 复制成功后 copied 回落为 false 的默认时长 (ms), 与 Mantine 一致. */
export const CLIPBOARD_RESET_MS = 2000;

/** useClickOutside 默认监听的事件: 鼠标按下与触摸开始, 早于 click 触发, 不会被拖拽误判. */
export const CLICK_OUTSIDE_EVENTS: readonly string[] = [HOOK_EVENT.mousedown, HOOK_EVENT.touchstart];

/** 快捷键串的分隔符与修饰键名; mod 在 Apple 平台是 meta, 其余平台是 ctrl. */
export const HOTKEY = {
  separator: "+",
  mod: "mod",
  ctrl: "ctrl",
  alt: "alt",
  shift: "shift",
  meta: "meta",
} as const;

/** useHotkeys 默认忽略的焦点元素标签: 在输入框里打字不应触发全局快捷键. */
export const HOTKEY_IGNORED_TAGS: readonly string[] = ["INPUT", "TEXTAREA", "SELECT"];

/** 快捷键键名别名: 让 "mod+space" / "esc" 这类写法与 KeyboardEvent.key 对上. */
export const HOTKEY_KEY_ALIAS: Readonly<Record<string, string>> = {
  space: " ",
  esc: "escape",
  plus: "+",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
};

/** 识别 Apple 平台 (mod 映射到 meta) 的 UA 片段. */
export const APPLE_PLATFORM = /mac|iphone|ipad|ipod/i;
