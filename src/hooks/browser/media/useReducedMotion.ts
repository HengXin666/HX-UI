import { HOOK_MEDIA_REDUCED_MOTION } from "../../../constants/hooks";
import { useMediaQuery, type UseMediaQueryOptions } from "./useMediaQuery";

/**
 * 读取系统 "减弱动效" 偏好 (prefers-reduced-motion: reduce), 用于关闭或弱化动画 (对标 Mantine useReducedMotion).
 *
 * @param initialValue 服务端渲染与首帧使用的值.
 * @param options getInitialValueInEffect 选项.
 * @returns 用户是否要求减弱动效.
 * @example
 * const reduce = useReducedMotion();
 * const duration = reduce ? 0 : 240;
 */
export function useReducedMotion(initialValue?: boolean, options?: UseMediaQueryOptions): boolean {
  return useMediaQuery(HOOK_MEDIA_REDUCED_MOTION, initialValue, options);
}
