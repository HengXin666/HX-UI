/** CueTip 开着时的收起条件: 滚动, 缩放, 切后台, 点别处与 Esc. */
import { useEffect, type RefObject } from "react";

const KEY_ESCAPE = "Escape";
const EVT_SCROLL = "scroll";
const EVT_RESIZE = "resize";
const EVT_KEYDOWN = "keydown";
const EVT_POINTERDOWN = "pointerdown";
const EVT_VISIBILITY = "visibilitychange";

export function useCueDismiss(open: boolean, wrapRef: RefObject<HTMLElement | null>, hide: () => void): void {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === KEY_ESCAPE) hide();
    };
    const onDown = (e: PointerEvent): void => {
      if (!wrapRef.current?.contains(e.target as Node)) hide();
    };
    const onHidden = (): void => {
      if (document.hidden) hide();
    };
    window.addEventListener(EVT_SCROLL, hide, true);
    window.addEventListener(EVT_RESIZE, hide);
    window.addEventListener(EVT_KEYDOWN, onKey);
    document.addEventListener(EVT_POINTERDOWN, onDown);
    document.addEventListener(EVT_VISIBILITY, onHidden);
    return () => {
      window.removeEventListener(EVT_SCROLL, hide, true);
      window.removeEventListener(EVT_RESIZE, hide);
      window.removeEventListener(EVT_KEYDOWN, onKey);
      document.removeEventListener(EVT_POINTERDOWN, onDown);
      document.removeEventListener(EVT_VISIBILITY, onHidden);
    };
  }, [open, hide, wrapRef]);
}
