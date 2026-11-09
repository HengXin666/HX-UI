/**
 * kits/stack 测试共用: 沿用导航族的减弱动效开关, 手动 rAF 队列与 animate 探针, 另补可手动触发的 IntersectionObserver.
 */
import { vi } from "vitest";

export { manualFrames, mockReducedMotion, spyAnimate } from "../support";

export interface FakeObserver {
  /** 让给定元素进入或离开视口. */
  readonly fire: (targets: readonly Element[], intersecting: boolean) => void;
}

/** 装一个假 IntersectionObserver; fire 依次回调所有观察了这些元素的实例. */
export function fakeIntersection(): FakeObserver {
  const all: Array<{ cb: IntersectionObserverCallback; watched: Set<Element> }> = [];
  class FakeIO {
    private readonly entry: { cb: IntersectionObserverCallback; watched: Set<Element> };
    constructor(cb: IntersectionObserverCallback) {
      this.entry = { cb, watched: new Set() };
      all.push(this.entry);
    }
    observe(el: Element): void {
      this.entry.watched.add(el);
    }
    unobserve(el: Element): void {
      this.entry.watched.delete(el);
    }
    disconnect(): void {
      this.entry.watched.clear();
    }
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", FakeIO);
  return {
    fire: (targets, intersecting) => {
      for (const { cb, watched } of all) {
        const hits = targets.filter((t) => watched.has(t)).map((target) => ({ target, isIntersecting: intersecting }) as unknown as IntersectionObserverEntry);
        if (hits.length) cb(hits, {} as IntersectionObserver);
      }
    },
  };
}
