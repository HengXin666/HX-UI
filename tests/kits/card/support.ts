/**
 * kits/card 测试共用: 沿用 kits 公共测试支持的减弱动效开关, 手动 rAF 队列, animate 探针与假 IntersectionObserver.
 */
export { fakeIntersection, manualFrames, mockReducedMotion, spyAnimate } from "../support";

/** 给元素一个固定的 getBoundingClientRect 与 client 尺寸. */
export function boxOf(el: Element, left: number, top: number, width: number, height: number): void {
  Object.defineProperty(el, "getBoundingClientRect", { configurable: true, value: () => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) });
  Object.defineProperty(el, "clientWidth", { configurable: true, value: width });
  Object.defineProperty(el, "clientHeight", { configurable: true, value: height });
}
