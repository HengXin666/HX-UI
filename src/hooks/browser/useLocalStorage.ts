import { useCallback, useEffect, useRef, useState } from "react";
import { HOOK_EVENT, LOCAL_STORAGE_SYNC_EVENT, canUseDOM, isFunction, isUpdater } from "../../constants/hooks";
import { useEventCallback } from "../state/useEventCallback";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

/** useLocalStorage 的选项, 与 usehooks-ts 一致. */
export interface UseLocalStorageOptions<T> {
  /** 把值写成字符串, 默认 JSON.stringify. */
  serializer?: (value: T) => string;
  /** 把字符串读回值, 默认 JSON.parse. */
  deserializer?: (raw: string) => T;
  /** 为 true (默认) 时首次渲染就同步读取存储; 服务端渲染需要首帧一致时设为 false, 挂载后再读. */
  initializeWithValue?: boolean;
}

/** useLocalStorage 的返回: [当前值, setter, 删除该键]. */
export type UseLocalStorageReturn<T> = [T, (next: T | ((prev: T) => T)) => void, () => void];

/** 同标签页同步事件的载荷. */
interface SyncDetail {
  key: string;
}

/** 展开初值: 传入函数时按惰性初值调用. */
function resolveInitial<T>(initialValue: T | (() => T)): T {
  return isFunction(initialValue) ? (initialValue as () => T)() : (initialValue as T);
}

/** 读取存储中的值, 缺键或读取失败时返回初值. */
function readStorage<T>(key: string, initialValue: T | (() => T), deserializer?: (raw: string) => T): T {
  if (!canUseDOM()) return resolveInitial(initialValue);
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return resolveInitial(initialValue);
    return deserializer ? deserializer(raw) : (JSON.parse(raw) as T);
  } catch {
    return resolveInitial(initialValue);
  }
}

/** 通知同一标签页里订阅同一键的其他实例. */
function broadcast(key: string): void {
  window.dispatchEvent(new CustomEvent<SyncDetail>(LOCAL_STORAGE_SYNC_EVENT, { detail: { key } }));
}

/**
 * 把状态持久化到 localStorage, 并在同一标签页的其他实例与其他标签页之间保持同步 (对标 usehooks-ts useLocalStorage).
 * 读写异常 (隐私模式, 配额已满, 内容不是合法 JSON) 时退回内存值, 不抛出.
 *
 * .agents/notes/implemented/architecture/2026-11-02-shared-hooks.md
 *
 * @param key 存储键.
 * @param initialValue 存储中没有该键时的初值, 可传惰性函数.
 * @param options 序列化与首帧读取选项.
 * @returns [value, setValue, removeValue].
 * @example
 * const [theme, setTheme, clearTheme] = useLocalStorage("hx-theme", "dark");
 * setTheme((prev) => (prev === "dark" ? "light" : "dark"));
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: UseLocalStorageOptions<T> = {},
): UseLocalStorageReturn<T> {
  const initializeWithValue = options.initializeWithValue ?? true;
  const latest = useRef({ initialValue, options });

  useIsomorphicLayoutEffect(() => {
    latest.current = { initialValue, options };
  });

  const read = useCallback(
    (): T => readStorage(key, latest.current.initialValue, latest.current.options.deserializer),
    [key],
  );

  const [stored, setStored] = useState<T>(() =>
    initializeWithValue ? readStorage(key, initialValue, options.deserializer) : resolveInitial(initialValue),
  );

  const setValue = useEventCallback((next: T | ((prev: T) => T)) => {
    const resolved = isUpdater(next) ? next(read()) : next;
    const serializer = latest.current.options.serializer;
    try {
      window.localStorage.setItem(key, serializer ? serializer(resolved) : JSON.stringify(resolved));
    } catch {
      /* 存储不可写时只保留内存值 */
    }
    setStored(resolved);
    broadcast(key);
  });

  const removeValue = useEventCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* 存储不可写时只复位内存值 */
    }
    setStored(resolveInitial(latest.current.initialValue));
    broadcast(key);
  });

  useEffect(() => {
    setStored(read());
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === key) setStored(read());
    };
    const onSync = (event: Event) => {
      if ((event as CustomEvent<SyncDetail>).detail?.key === key) setStored(read());
    };
    window.addEventListener(HOOK_EVENT.storage, onStorage);
    window.addEventListener(LOCAL_STORAGE_SYNC_EVENT, onSync);
    return () => {
      window.removeEventListener(HOOK_EVENT.storage, onStorage);
      window.removeEventListener(LOCAL_STORAGE_SYNC_EVENT, onSync);
    };
  }, [key, read]);

  return [stored, setValue, removeValue];
}
