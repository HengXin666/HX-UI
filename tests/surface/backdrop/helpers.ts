/**
 * 背景测试的公共夹具: 假时钟, 减弱动效开关, 可控的 IntersectionObserver 与假 2d 上下文.
 */
import { vi } from "vitest";

export { mockReducedMotion, useFakeClock } from "../../controls/press/helpers";

type IoCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

/** 装一个可手动触发的 IntersectionObserver, 返回切换可见性的函数. */
export function mockIntersection(): (visible: boolean) => void {
  const callbacks = new Set<IoCallback>();
  class FakeIo {
    private readonly cb: IoCallback;
    constructor(cb: IoCallback) {
      this.cb = cb;
    }
    observe(): void {
      callbacks.add(this.cb);
      this.cb([{ isIntersecting: true }]);
    }
    disconnect(): void {
      callbacks.delete(this.cb);
    }
    unobserve(): void {}
  }
  vi.stubGlobal("IntersectionObserver", FakeIo);
  return (visible) => callbacks.forEach((cb) => cb([{ isIntersecting: visible }]));
}

/** 让画布的 2d 上下文返回一个空壳, webgl2 返回 null. 返回还原函数. */
export function mockCanvas2d(): () => void {
  const original = HTMLCanvasElement.prototype.getContext;
  const stub = new Proxy({}, { get: () => () => undefined, set: () => true });
  HTMLCanvasElement.prototype.getContext = function getContext(kind: string) {
    return kind === "2d" ? stub : null;
  } as typeof original;
  return () => {
    HTMLCanvasElement.prototype.getContext = original;
  };
}

/** 让 webgl2 返回一个记录调用名的假上下文 (每个方法都返回真值), 用来走通多通道调度. 返回还原函数. */
export function mockWebgl2(calls: string[]): () => void {
  const original = HTMLCanvasElement.prototype.getContext;
  const gl = new Proxy({}, {
    get: (_target, key) => (..._args: unknown[]) => {
      calls.push(String(key));
      return {};
    },
  });
  HTMLCanvasElement.prototype.getContext = function getContext(kind: string) {
    return kind === "webgl2" ? gl : null;
  } as typeof original;
  return () => {
    HTMLCanvasElement.prototype.getContext = original;
  };
}
