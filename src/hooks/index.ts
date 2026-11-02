/**
 * 共享 hooks 桶文件: state / dom / browser / input 四类, 名字逐个写出, 不用 export *.
 */

/**
 * 状态类: 受控与非受控, 开关, 防抖, 稳定回调.
 * .agents/notes/implemented/architecture/2026-11-02-shared-hooks.md
 */
export { useControllableState } from "./state/useControllableState";
export type { ControllableStateSetter, UseControllableStateOptions, UseControllableStateReturn } from "./state/useControllableState";
export { useDisclosure } from "./state/useDisclosure";
export type { DisclosureHandlers, UseDisclosureCallbacks, UseDisclosureReturn } from "./state/useDisclosure";
export { useDebouncedValue } from "./state/useDebouncedValue";
export type { UseDebouncedValueOptions, UseDebouncedValueReturn } from "./state/useDebouncedValue";
export { useEventCallback } from "./state/useEventCallback";
export type { EventCallback } from "./state/useEventCallback";

/** DOM 类: ref 合并, 尺寸观察, 事件订阅, 点击外部. */
export { assignRef, mergeRefs, useMergeRefs } from "./dom/useMergeRefs";
export type { PossibleRef } from "./dom/useMergeRefs";
export { useResizeObserver } from "./dom/useResizeObserver";
export type { ObserverRect, UseResizeObserverReturn } from "./dom/useResizeObserver";
export { useEventListener } from "./dom/useEventListener";
export type { EventListenerTarget } from "./dom/useEventListener";
export { useClickOutside } from "./dom/useClickOutside";

/** 浏览器类: 媒体查询, 断点, 减弱动效, 本地存储, 剪贴板, 相交观察, 同构 layout effect. */
export { useMediaQuery } from "./browser/media/useMediaQuery";
export type { UseMediaQueryOptions } from "./browser/media/useMediaQuery";
export { useBreakpoint } from "./browser/media/useBreakpoint";
export type { BreakpointMap, BreakpointName, BreakpointValue } from "./browser/media/useBreakpoint";
export { useReducedMotion } from "./browser/media/useReducedMotion";
export { useLocalStorage } from "./browser/useLocalStorage";
export type { UseLocalStorageOptions, UseLocalStorageReturn } from "./browser/useLocalStorage";
export { useClipboard } from "./browser/useClipboard";
export type { UseClipboardOptions, UseClipboardReturn } from "./browser/useClipboard";
export { useIntersection } from "./browser/useIntersection";
export type { UseIntersectionReturn } from "./browser/useIntersection";
export { useIsomorphicLayoutEffect } from "./browser/useIsomorphicLayoutEffect";

/** 输入类: 全局快捷键与元素级快捷键处理器. */
export { getHotkeyHandler, matchHotkey, parseHotkey, useHotkeys } from "./input/useHotkeys";
export type { HotkeyHandler, HotkeyItem, HotkeyItemOptions, ParsedHotkey } from "./input/useHotkeys";
