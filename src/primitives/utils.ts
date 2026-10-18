import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type { ClassValue };

export function cn(...parts: ClassValue[]): string {
	return twMerge(clsx(parts));
}

/** 可编辑控件的选择器: 键盘快捷键遇到这些目标时让位, 光标移动与输入法不被组件吞掉. */
const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable]:not([contenteditable='false'])";

/**
 * 事件目标是否是可编辑控件 (输入框, 文本域, 下拉框, contentEditable).
 * 组件级快捷键 (侧栏 Cmd/Ctrl+B, 轮播方向键) 先用它判断, 命中时不处理.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof Element)) {
		return false;
	}
	return (target instanceof HTMLElement && target.isContentEditable) || target.closest(EDITABLE_SELECTOR) !== null;
}
