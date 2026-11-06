import { useCallback, useEffect, useRef, useState } from "react";

/** useDebouncedValue 的选项, 与 Mantine 一致. */
export interface UseDebouncedValueOptions {
  /** 为 true 时一串变化的第一次立即生效, 之后再按 wait 防抖. */
  leading?: boolean;
}

/** useDebouncedValue 的返回: [防抖后的值, 取消尚未生效的更新]. */
export type UseDebouncedValueReturn<T> = [T, () => void];

/**
 * 返回 value 在停止变化 wait 毫秒后才更新的副本, 用于搜索框这类高频输入 (对标 Mantine useDebouncedValue).
 *
 * @param value 需要防抖的源值.
 * @param wait 静默时长 (ms).
 * @param options leading 选项.
 * @returns [debounced, cancel].
 * @example
 * const [query, setQuery] = useState("");
 * const [debounced] = useDebouncedValue(query, 300);
 * useEffect(() => { search(debounced); }, [debounced]);
 */
export function useDebouncedValue<T>(value: T, wait: number, options: UseDebouncedValueOptions = {}): UseDebouncedValueReturn<T> {
  const leading = options.leading ?? false;
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldown = useRef(false);

  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    cooldown.current = false;
  }, []);

  useEffect(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    if (leading && !cooldown.current) {
      cooldown.current = true;
      setDebounced(value);
      timer.current = setTimeout(() => {
        cooldown.current = false;
        timer.current = null;
      }, wait);
      return;
    }
    timer.current = setTimeout(() => {
      cooldown.current = false;
      timer.current = null;
      setDebounced(value);
    }, wait);
  }, [value, wait, leading]);

  useEffect(() => cancel, [cancel]);

  return [debounced, cancel];
}
