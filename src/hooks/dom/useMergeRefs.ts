import { useCallback, type Ref, type RefCallback } from "react";
import { isFunction } from "../../constants/hooks";

/** 可合并的 ref: 回调 ref, ref 对象, 或缺省. */
export type PossibleRef<T> = Ref<T> | undefined;

/**
 * 把一个值写进任意形态的 ref (对标 Mantine assignRef).
 *
 * @param ref 目标 ref.
 * @param value 要写入的节点或值.
 * @example
 * assignRef(forwardedRef, node);
 */
export function assignRef<T>(ref: PossibleRef<T>, value: T | null): void {
  if (isFunction(ref)) (ref as RefCallback<T>)(value);
  else if (ref !== null && ref !== undefined) (ref as { current: T | null }).current = value;
}

/**
 * 把多个 ref 合成一个回调 ref, 不带 memo, 可在 hook 之外使用 (对标 Mantine mergeRefs).
 *
 * @param refs 需要同步指向同一节点的 ref 列表.
 * @returns 合并后的回调 ref.
 * @example
 * <div ref={mergeRefs(localRef, props.ref)} />
 */
export function mergeRefs<T>(...refs: PossibleRef<T>[]): RefCallback<T> {
  return (node: T | null) => {
    refs.forEach((ref) => assignRef(ref, node));
  };
}

/**
 * 把多个 ref 合成一个引用稳定的回调 ref, 常用于同时保留内部 ref 与外部转发的 ref (对标 Mantine useMergedRef).
 *
 * @param refs 需要同步指向同一节点的 ref 列表.
 * @returns 合并后的回调 ref, refs 不变时引用不变.
 * @example
 * const local = useRef<HTMLInputElement>(null);
 * const ref = useMergeRefs(local, props.ref);
 * return <input ref={ref} />;
 */
export function useMergeRefs<T>(...refs: PossibleRef<T>[]): RefCallback<T> {
  return useCallback(mergeRefs(...refs), refs);
}
