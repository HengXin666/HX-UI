import { useLayoutEffect, useRef, useState } from "react";

/** 一段扇环: 起止角 (弧度, 0 在 12 点, 顺时针), 内外半径, 透明度 */
export interface Arc { a0: number; a1: number; r0: number; r1: number; o: number }

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * 按 key 补间一组扇环. motion 补不了 path 的 d, 所以自己用 rAF 插值几何参数.
 * enter(target) 给新扇环的起点, exit(current) 给退场的终点; 退场完成后从结果里删掉.
 * 减少动态时几何直接跳到目标, 只有透明度淡入淡出.
 */
export function useArcTween(
  target: Map<string, Arc>,
  { enter, exit, reduced, duration = 480 }: { enter: (a: Arc, k: string) => Arc; exit: (a: Arc, k: string) => Arc; reduced: boolean; duration?: number },
) {
  const [frame, setFrame] = useState<Map<string, Arc>>(() => new Map());
  const cur = useRef(frame);
  cur.current = frame;
  const fns = useRef({ enter, exit });
  fns.current = { enter, exit };

  useLayoutEffect(() => {
    const from = new Map(cur.current);
    const to = new Map(target);
    for (const [k, a] of target) if (!from.has(k)) from.set(k, reduced ? { ...a, o: 0 } : fns.current.enter(a, k));
    for (const [k, a] of from) if (!to.has(k)) to.set(k, reduced ? { ...a, o: 0 } : fns.current.exit(a, k));
    if (reduced) for (const [k, a] of target) { const f = from.get(k)!; from.set(k, { ...a, o: f.o }); }
    const dur = reduced ? 200 : duration;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur), e = ease(t);
      const f = new Map<string, Arc>();
      for (const [k, b] of to) {
        const a = from.get(k) ?? b;
        f.set(k, { a0: lerp(a.a0, b.a0, e), a1: lerp(a.a1, b.a1, e), r0: lerp(a.r0, b.r0, e), r1: lerp(a.r1, b.r1, e), o: lerp(a.o, b.o, e) });
      }
      if (t >= 1) for (const k of [...f.keys()]) if (!target.has(k)) f.delete(k);
      setFrame(f);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced, duration]);

  return frame;
}
