import { useCallback, useState } from "react";
import { isUpdater } from "../../constants/hooks";
import { useEventCallback } from "./useEventCallback";

/** useControllableState 的入参, 字段与 Mantine useUncontrolled 一致. */
export interface UseControllableStateOptions<T> {
  /** 受控值: 不为 undefined 时组件处于受控模式. */
  value?: T;
  /** 非受控模式的初值. */
  defaultValue?: T;
  /** value 与 defaultValue 都缺省时的兜底值. */
  finalValue?: T;
  /** 值变化时的回调, 受控与非受控模式都会触发. */
  onChange?: (value: T) => void;
}

/** setValue 接受新值或基于当前值的更新函数. */
export type ControllableStateSetter<T> = (next: T | ((prev: T) => T)) => void;

/** useControllableState 的返回: 当前值, setter, 是否受控. */
export type UseControllableStateReturn<T> = [T, ControllableStateSetter<T>, boolean];

/**
 * 让组件同时支持受控 (value + onChange) 与非受控 (defaultValue) 两种用法 (对标 Mantine useUncontrolled).
 *
 * .agents/notes/implemented/architecture/2026-11-02-shared-hooks.md
 *
 * @param options 受控值, 初值, 兜底值与变化回调.
 * @returns [当前值, setValue, 是否受控].
 * @example
 * const [open, setOpen] = useControllableState({ value: props.open, defaultValue: false, onChange: props.onOpenChange });
 * setOpen((prev) => !prev);
 */
export function useControllableState<T>(options: UseControllableStateOptions<T>): UseControllableStateReturn<T> {
  const { value, defaultValue, finalValue, onChange } = options;
  const [inner, setInner] = useState<T>((defaultValue !== undefined ? defaultValue : finalValue) as T);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const emit = useEventCallback((next: T) => onChange?.(next));

  const setValue = useCallback<ControllableStateSetter<T>>(
    (next) => {
      const resolved = isUpdater(next) ? next(current) : next;
      if (!controlled) setInner(resolved);
      emit(resolved);
    },
    [controlled, current, emit],
  );

  return [current, setValue, controlled];
}
