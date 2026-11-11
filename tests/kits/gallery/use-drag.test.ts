/**
 * kits/gallery: useDrag. 起拖阈值, 指针捕获, 累计位移, 平滑速度, 取消与 "刚拖过" 判定.
 */
import { renderHook } from "@testing-library/react";
import type { PointerEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { useDrag } from "@src/kits/gallery/parts/use-drag";
import { DRAG_THRESHOLD_PX } from "@src/kits/tokens";

function target() {
  let held = false;
  return {
    setPointerCapture: vi.fn(() => {
      held = true;
    }),
    hasPointerCapture: vi.fn(() => held),
    releasePointerCapture: vi.fn(() => {
      held = false;
    }),
  };
}

type Target = ReturnType<typeof target>;

function ev(el: Target, x: number, y: number, t: number, extra: { pointerId?: number; button?: number } = {}): PointerEvent<HTMLElement> {
  return { pointerId: extra.pointerId ?? 1, button: extra.button ?? 0, clientX: x, clientY: y, timeStamp: t, currentTarget: el } as unknown as PointerEvent<HTMLElement>;
}

function setup(enabled = true) {
  const handlers = { onStart: vi.fn(), onMove: vi.fn(), onEnd: vi.fn() };
  const { result } = renderHook(() => useDrag(handlers, enabled));
  return { handlers, drag: result.current, el: target() };
}

describe("useDrag", () => {
  it("没过阈值的点按: 不起拖, 不回调, 不算拖过", () => {
    const { handlers, drag, el } = setup();
    drag.bind.onPointerDown(ev(el, 0, 0, 0));
    drag.bind.onPointerMove(ev(el, DRAG_THRESHOLD_PX - 1, 0, 8));
    drag.bind.onPointerUp(ev(el, DRAG_THRESHOLD_PX - 1, 0, 16));
    expect(handlers.onStart).not.toHaveBeenCalled();
    expect(handlers.onMove).not.toHaveBeenCalled();
    expect(handlers.onEnd).not.toHaveBeenCalled();
    expect(el.setPointerCapture).not.toHaveBeenCalled();
    expect(drag.dragged()).toBe(false);
  });

  it("过阈值起拖: 抓住指针, 位移按起点累计, 松手带平滑速度并放开指针", () => {
    const { handlers, drag, el } = setup();
    drag.bind.onPointerDown(ev(el, 0, 0, 0));
    drag.bind.onPointerMove(ev(el, 10, 0, 10));
    drag.bind.onPointerMove(ev(el, 20, 4, 20));
    expect(handlers.onStart).toHaveBeenCalledTimes(1);
    expect(el.setPointerCapture).toHaveBeenCalledWith(1);
    expect(handlers.onMove).toHaveBeenNthCalledWith(1, 10, 0);
    expect(handlers.onMove).toHaveBeenNthCalledWith(2, 20, 4);
    drag.bind.onPointerUp(ev(el, 20, 4, 30));
    // 新样本占 0.3: vx 0.3 -> 0.3 + (1 - 0.3) 0.3 = 0.51; vy 0 -> 0.4 x 0.3 = 0.12.
    const [vx, vy] = handlers.onEnd.mock.calls[0] as [number, number];
    expect(vx).toBeCloseTo(0.51, 9);
    expect(vy).toBeCloseTo(0.12, 9);
    expect(el.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(drag.dragged()).toBe(true);
    expect(drag.dragged()).toBe(false);
  });

  it("pointercancel 与 pointerup 同样收尾", () => {
    const { handlers, drag, el } = setup();
    drag.bind.onPointerDown(ev(el, 0, 0, 0));
    drag.bind.onPointerMove(ev(el, 0, 12, 10));
    drag.bind.onPointerCancel(ev(el, 0, 12, 12));
    expect(handlers.onEnd).toHaveBeenCalledTimes(1);
    expect(el.releasePointerCapture).toHaveBeenCalledTimes(1);
    drag.bind.onPointerUp(ev(el, 0, 12, 14));
    expect(handlers.onEnd).toHaveBeenCalledTimes(1);
  });

  it("别的指针, 非主键, 关闭时都不理会", () => {
    const off = setup(false);
    off.drag.bind.onPointerDown(ev(off.el, 0, 0, 0));
    off.drag.bind.onPointerMove(ev(off.el, 40, 0, 10));
    expect(off.handlers.onStart).not.toHaveBeenCalled();

    const { handlers, drag, el } = setup();
    drag.bind.onPointerDown(ev(el, 0, 0, 0, { button: 2 }));
    drag.bind.onPointerMove(ev(el, 40, 0, 10));
    expect(handlers.onStart).not.toHaveBeenCalled();
    drag.bind.onPointerDown(ev(el, 0, 0, 0));
    drag.bind.onPointerMove(ev(el, 40, 0, 10, { pointerId: 2 }));
    drag.bind.onPointerUp(ev(el, 40, 0, 12, { pointerId: 2 }));
    expect(handlers.onStart).not.toHaveBeenCalled();
    expect(handlers.onEnd).not.toHaveBeenCalled();
  });
});
