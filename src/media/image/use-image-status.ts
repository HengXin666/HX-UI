/**
 * 图片加载状态: loading -> loaded / error. src 变化时回到 loading.
 * 服务端渲染时图片可能在水合前就已加载完, 回调 ref 里读 complete 补齐状态, 避免永远停在 loading.
 */
import { useCallback, useState, type SyntheticEvent } from "react";
import { IMAGE_STATUS, type ImageStatus } from "../../constants/media";

export interface UseImageStatusReturn {
	status: ImageStatus;
	ref: (node: HTMLImageElement | null) => void;
	onLoad: (event: SyntheticEvent<HTMLImageElement>) => void;
	onError: (event: SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * 跟踪一张图片的加载状态. 状态与 src 绑定存储, 换图时无需 effect 重置.
 */
export function useImageStatus(src: string | undefined): UseImageStatusReturn {
	const [entry, setEntry] = useState<{ src: string | undefined; status: ImageStatus }>({ src, status: IMAGE_STATUS.loading });
	const status = entry.src === src ? entry.status : IMAGE_STATUS.loading;
	const set = useCallback((next: ImageStatus) => setEntry({ src, status: next }), [src]);

	const ref = useCallback(
		(node: HTMLImageElement | null) => {
			if (!node || !node.complete) return;
			set(node.naturalWidth > 0 ? IMAGE_STATUS.loaded : IMAGE_STATUS.error);
		},
		[set],
	);
	const onLoad = useCallback(() => set(IMAGE_STATUS.loaded), [set]);
	const onError = useCallback(() => set(IMAGE_STATUS.error), [set]);
	return { status: src ? status : IMAGE_STATUS.error, ref, onLoad, onError };
}
