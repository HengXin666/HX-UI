import { useEffect, useState } from "react";
import { MEDIA_DOC } from "../../../src/constants/media";

/** 示例图的一组地址: 两档宽度的 srcSet, 低清占位, 原图. */
export interface DemoImage {
	src: string;
	srcSet: string;
	placeholder: string;
	width: number;
	height: number;
}

/** 从语义 token 读颜色 (示例页不写色值), 读不到时回退为当前文字色. */
function token(name: string): string {
	const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	return value || getComputedStyle(document.body).color;
}

function draw(width: number, height: number, label: string, tone: string): string {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) return "";
	const gradient = ctx.createLinearGradient(0, 0, width, height);
	gradient.addColorStop(0, token(tone));
	gradient.addColorStop(1, token("--muted"));
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = token("--foreground");
	ctx.font = `600 ${Math.round(height / 8)}px system-ui`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(label, width / 2, height / 2);
	return canvas.toDataURL();
}

/**
 * 文档页示例图: 在浏览器里用 canvas 按语义 token 现画, 不依赖任何外部地址或静态资源.
 * 生成两档宽度 (srcSet 的 w 描述符) 与 16px 宽的低清占位, 足以演示 Image 的全部行为.
 *
 * .agents/notes/implemented/feature/2026-11-02-media-primitives.md
 */
export function useDemoImages(labels: readonly string[], tone = "--primary"): DemoImage[] {
	const [images, setImages] = useState<DemoImage[]>([]);
	const key = labels.join("|");
	useEffect(() => {
		const height = (w: number) => Math.round((w * MEDIA_DOC.demoHeight) / MEDIA_DOC.demoWidth);
		setImages(
			labels.map((label) => {
				const [small, large] = MEDIA_DOC.widths;
				const largeUri = draw(large, height(large), label, tone);
				return {
					src: largeUri,
					srcSet: `${draw(small, height(small), label, tone)} ${small}w, ${largeUri} ${large}w`,
					placeholder: draw(MEDIA_DOC.placeholderWidth, height(MEDIA_DOC.placeholderWidth), "", tone),
					width: MEDIA_DOC.demoWidth,
					height: MEDIA_DOC.demoHeight,
				};
			}),
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, tone]);
	return images;
}
