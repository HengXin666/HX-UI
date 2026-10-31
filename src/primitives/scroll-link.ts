import { scrollProgress } from "./motion-math";

/**
 * 把滚动位置收成 0 到 1. 进度相对这个元素自己的可滚距离, 不是相对页面写死的高度.
 */
export function bindScrollProgress(el: HTMLElement, onProgress: (progress: number) => void): () => void {
	const read = (): void => {
		onProgress(scrollProgress(el.scrollTop, el.scrollHeight - el.clientHeight));
	};
	el.addEventListener("scroll", read, { passive: true });
	read();
	return () => el.removeEventListener("scroll", read);
}
