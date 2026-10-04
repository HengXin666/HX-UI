import { useEffect } from "react";
import { isTypingTarget } from "./shortcuts";

/**
 * 画布的 Esc: 只清**画布私有**的状态。
 *
 * ## 为什么只剩这些
 *
 * Delete 曾经也在这里处理一份, 而编辑器层的 useShortcuts 也处理一份 ——
 * 两条路径都会触发 onRemoveNodes。第二次提交时图已经变了, 结果历史栈里
 * 多压一步空操作, 表现为"撤销一次只撤掉一半"。现在删除统一归 useShortcuts。
 *
 * ## 为什么 Esc 要留在这儿
 *
 * link / marquee / maximized 是画布的私有状态, 编辑器层根本看不见它们,
 * 没法代为清理。所以 Esc 是**两处协作**: 这里清画布私有态, 编辑器层清
 * 选择与浮层。两者职责不重叠 —— 靠一处猜另一处的状态迟早猜错。
 */
export function useCanvasEscape(h: {
  readonly setLink: (v: null) => void;
  readonly setMarquee: (v: null) => void;
  readonly setPaletteAt: (v: null) => void;
  readonly setMaximized: (v: boolean) => void;
  readonly maximized: boolean;
  /** Tab 打开的那个搜索菜单是**受控**的 (编辑器层的状态), 这里只能请求关闭。 */
  readonly setPickerOpen?: (v: boolean) => void;
}): void {
  const { setLink, setMarquee, setPaletteAt, setMaximized, maximized, setPickerOpen } = h;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target as HTMLElement | null)) return;
      if (e.key !== "Escape") return;
      setLink(null);
      setMarquee(null);
      setPaletteAt(null);
      // Tab 菜单是受控的: 不在这里清, 用户按 Esc 会看到"浮层纹丝不动"
      setPickerOpen?.(false);
      // 真全屏时浏览器自己处理 Esc; 回退的 fixed 覆盖层得自己退
      if (maximized) setMaximized(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setLink, setMarquee, setPaletteAt, setMaximized, maximized, setPickerOpen]);
}
