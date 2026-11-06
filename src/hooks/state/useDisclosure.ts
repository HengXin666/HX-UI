import { useCallback, useMemo, useRef, useState } from "react";
import { useEventCallback } from "./useEventCallback";

/** useDisclosure 的回调, 字段与 Mantine 一致. */
export interface UseDisclosureCallbacks {
  /** 由关到开时调用. */
  onOpen?: () => void;
  /** 由开到关时调用. */
  onClose?: () => void;
}

/** useDisclosure 返回的操作集合. */
export interface DisclosureHandlers {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/** useDisclosure 的返回: [是否打开, 操作集合]. */
export type UseDisclosureReturn = [boolean, DisclosureHandlers];

/**
 * 管理弹窗, 抽屉, 折叠面板这类开关状态 (对标 Mantine useDisclosure).
 *
 * @param initialState 初始是否打开, 默认 false.
 * @param callbacks 打开与关闭时的回调.
 * @returns [opened, { open, close, toggle }].
 * @example
 * const [opened, { open, close }] = useDisclosure(false, { onClose: reset });
 */
export function useDisclosure(initialState = false, callbacks: UseDisclosureCallbacks = {}): UseDisclosureReturn {
  const [opened, setOpened] = useState(initialState);
  const latest = useRef(initialState);
  const notify = useEventCallback((next: boolean) => (next ? callbacks.onOpen?.() : callbacks.onClose?.()));

  const set = useCallback(
    (next: boolean) => {
      if (latest.current === next) return;
      latest.current = next;
      setOpened(next);
      notify(next);
    },
    [notify],
  );

  const handlers = useMemo<DisclosureHandlers>(
    () => ({
      open: () => set(true),
      close: () => set(false),
      toggle: () => set(!latest.current),
    }),
    [set],
  );

  return [opened, handlers];
}
