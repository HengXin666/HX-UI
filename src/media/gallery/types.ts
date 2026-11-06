/**
 * 画廊与灯箱共用的条目类型. 地址全部由调用方传入.
 */
import type { ReactNode } from "react";

export interface MediaItem {
	/** 原图地址 (灯箱里显示). */
	src: string;
	alt: string;
	srcSet?: string;
	/** 画廊格子里的 sizes, 例: "(min-width: 768px) 33vw, 100vw". */
	sizes?: string;
	/** 画廊格子用的缩略图; 不传用 src. */
	thumbSrc?: string;
	thumbSrcSet?: string;
	/** 低清 data URI 或 "color" / "none", 见 Image.placeholder. */
	placeholder?: string;
	/** 焦点裁切, 见 Image.objectPosition. */
	objectPosition?: string;
	/** 画廊下方与灯箱标题里的说明. */
	caption?: ReactNode;
	/** 列表 key; 不传用 src. */
	id?: string;
}

/** 灯箱当前序号的变更回调: null 表示关闭. */
export type LightboxIndexChange = (index: number | null) => void;
