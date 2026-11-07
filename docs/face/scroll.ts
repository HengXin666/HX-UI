import { useEffect, useState, type RefObject } from "react";

/** 元素穿过视口的进度, 0 到 1. 往回滚, 数值跟着减. */
export function useScroll(ref: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const read = (): void => {
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const view = window.innerHeight;
      const total = rect.height + view;
      setProgress(Math.min(1, Math.max(0, (view - rect.top) / total)));
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [ref]);
  return progress;
}
