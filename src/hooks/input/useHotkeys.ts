import { useEffect } from "react";
import { APPLE_PLATFORM, HOOK_EVENT, HOTKEY, HOTKEY_IGNORED_TAGS, HOTKEY_KEY_ALIAS, canUseDOM } from "../../constants/hooks";
import { useEventCallback } from "../state/useEventCallback";

/** 解析后的快捷键: 四个修饰键是否按下与主键 (小写 KeyboardEvent.key). */
export interface ParsedHotkey {
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  key: string;
}

/** 单条快捷键的选项, 与 Mantine 一致. */
export interface HotkeyItemOptions {
  /** 命中时是否调用 event.preventDefault, 默认 true. */
  preventDefault?: boolean;
}

/** 快捷键处理函数. */
export type HotkeyHandler = (event: KeyboardEvent) => void;

/** 一条快捷键: [快捷键串, 处理函数, 选项]. 快捷键串形如 "mod+K", "shift+alt+ArrowUp", "Escape". */
export type HotkeyItem = [string, HotkeyHandler, HotkeyItemOptions?];

/** 当前平台上 mod 是否对应 meta (Apple 平台) . */
function modIsMeta(): boolean {
  return canUseDOM() && APPLE_PLATFORM.test(navigator.userAgent);
}

/**
 * 把 "mod+shift+K" 形式的快捷键串解析成修饰键与主键.
 *
 * @param hotkey 快捷键串, 大小写不敏感, 以 + 分隔.
 * @returns 解析结果.
 * @example
 * parseHotkey("mod+K");
 */
export function parseHotkey(hotkey: string): ParsedHotkey {
  const parts = hotkey.toLowerCase().split(HOTKEY.separator).map((part) => part.trim());
  const isMac = modIsMeta();
  const result: ParsedHotkey = { alt: false, ctrl: false, meta: false, shift: false, key: "" };
  parts.forEach((part) => {
    if (part === HOTKEY.alt) result.alt = true;
    else if (part === HOTKEY.ctrl) result.ctrl = true;
    else if (part === HOTKEY.meta) result.meta = true;
    else if (part === HOTKEY.shift) result.shift = true;
    else if (part === HOTKEY.mod) {
      if (isMac) result.meta = true;
      else result.ctrl = true;
    } else result.key = HOTKEY_KEY_ALIAS[part] ?? part;
  });
  return result;
}

/**
 * 判断键盘事件是否命中解析后的快捷键: 四个修饰键必须完全一致, 主键比较 key 或物理键 code.
 *
 * @param parsed parseHotkey 的结果.
 * @param event 键盘事件.
 * @returns 是否命中.
 * @example
 * matchHotkey(parseHotkey("mod+S"), event);
 */
export function matchHotkey(parsed: ParsedHotkey, event: KeyboardEvent): boolean {
  if (parsed.alt !== event.altKey || parsed.ctrl !== event.ctrlKey) return false;
  if (parsed.meta !== event.metaKey || parsed.shift !== event.shiftKey) return false;
  if (!parsed.key) return false;
  const key = (event.key ?? "").toLowerCase();
  const code = (event.code ?? "").toLowerCase().replace(/^(key|digit)/, "");
  return key === parsed.key || code === parsed.key;
}

/** 依次匹配快捷键列表, 命中的条目执行处理函数. */
function dispatch(hotkeys: HotkeyItem[], event: KeyboardEvent): void {
  hotkeys.forEach(([hotkey, handler, options]) => {
    if (!matchHotkey(parseHotkey(hotkey), event)) return;
    if (options?.preventDefault ?? true) event.preventDefault();
    handler(event);
  });
}

/**
 * 生成可直接挂在元素 onKeyDown 上的快捷键处理器, 只在该元素获得焦点时生效 (对标 Mantine getHotkeyHandler).
 *
 * @param hotkeys 快捷键列表.
 * @returns React onKeyDown 处理器.
 * @example
 * <input onKeyDown={getHotkeyHandler([["mod+Enter", submit], ["Escape", cancel]])} />
 */
export function getHotkeyHandler(hotkeys: HotkeyItem[]): (event: { nativeEvent: KeyboardEvent }) => void {
  return (event) => dispatch(hotkeys, event.nativeEvent);
}

/** 焦点是否落在应忽略快捷键的元素上. */
function shouldIgnore(event: KeyboardEvent, tagsToIgnore: readonly string[], triggerOnContentEditable: boolean): boolean {
  const target = event.target as HTMLElement | null;
  if (!target || !target.tagName) return false;
  if (!triggerOnContentEditable && target.isContentEditable) return true;
  return tagsToIgnore.includes(target.tagName);
}

/**
 * 在 document 上注册全局键盘快捷键, mod 在 Apple 平台映射为 Cmd, 其余平台映射为 Ctrl (对标 Mantine useHotkeys).
 *
 * .agents/notes/implemented/architecture/2026-11-02-shared-hooks.md
 *
 * @param hotkeys 快捷键列表, 每项为 [快捷键串, 处理函数, 选项].
 * @param tagsToIgnore 焦点在这些标签上时不触发, 默认 INPUT, TEXTAREA, SELECT.
 * @param triggerOnContentEditable 焦点在 contentEditable 元素上时是否仍触发, 默认 false.
 * @example
 * useHotkeys([
 * ["mod+K", () => setSearchOpen(true)],
 * ["Escape", () => setSearchOpen(false), { preventDefault: false }],
 * ]);
 */
export function useHotkeys(
  hotkeys: HotkeyItem[],
  tagsToIgnore: readonly string[] = HOTKEY_IGNORED_TAGS,
  triggerOnContentEditable = false,
): void {
  const onKeyDown = useEventCallback((event: KeyboardEvent) => {
    if (shouldIgnore(event, tagsToIgnore, triggerOnContentEditable)) return;
    dispatch(hotkeys, event);
  });

  useEffect(() => {
    document.documentElement.addEventListener(HOOK_EVENT.keydown, onKeyDown);
    return () => document.documentElement.removeEventListener(HOOK_EVENT.keydown, onKeyDown);
  }, [onKeyDown]);
}
