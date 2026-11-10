/**
 * cursor 族测试夹具: 内核量宿主矩形是在挂载时, 所以要在 render 之前把所有元素的矩形钉住.
 */
import { vi } from "vitest";

export function fixRect(width = 200, height = 200): void {
	const box = { left: 0, top: 0, width, height, x: 0, y: 0, right: width, bottom: height, toJSON: () => ({}) } as DOMRect;
	vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(box);
}
