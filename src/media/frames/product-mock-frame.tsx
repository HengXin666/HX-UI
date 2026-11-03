"use client";

import * as React from "react";
import { cn } from "../../primitives/utils";
import { MaskFade } from "../../effects/MaskFade";
import {
	PRODUCT_MOCK_CLASSES, PRODUCT_MOCK_DEFAULT, PRODUCT_MOCK_FADE, PRODUCT_MOCK_VAR,
	type ProductMockFade, type ProductMockFrameSlot, type SlotClassNames, type SlotStyles,
} from "../../constants/media";
import { clamp, mergeStyle, resolveSlots } from "../slots";
import { Image } from "../image/image";
import { ThemedImage } from "../image/themed-image";

/** 一张产品截图: 地址由调用方传入, 组件内不写任何路径. */
export interface ProductMockMedia {
	src: string;
	srcSet?: string;
	/** 替代文字, 装饰图传空串. */
	alt: string;
	/** 宽高比 (宽 / 高), 不传取 PRODUCT_MOCK_DEFAULT.ratio. */
	ratio?: number;
}

export type ProductMockFrameProps = React.ComponentProps<"div"> & {
	/** 绕 X 轴的倾斜角 (deg), 正值顶边远离观者; 默认 0 (平贴). 夹在 minTilt 到 maxTilt. prefers-reduced-motion 时不倾斜. */
	tilt?: number;
	/** 透视距离 (px), 越小畸变越强; 默认 1200. */
	perspective?: number;
	/** 渐隐的边: top / bottom / none, 默认 bottom. */
	fade?: ProductMockFade;
	/** 渐隐长度, 透传 MaskFade length (数字按 px). */
	fadeLength?: number | string;
	/** 亮暗双图. 两张都给时经 ThemedImage 随 data-mode 切换, 只给一张时直接渲染. children 优先于它. */
	themed?: { light?: ProductMockMedia; dark?: ProductMockMedia };
	/** 截图是否为首屏关键图 (eager + fetchpriority=high). */
	priority?: boolean;
	/** 整体缩放, 默认 1. */
	scale?: number;
	classNames?: SlotClassNames<ProductMockFrameSlot, { fade: ProductMockFade }>;
	styles?: SlotStyles<ProductMockFrameSlot, { fade: ProductMockFade }>;
};

/** 截图节点: 双图走 ThemedImage, 单图走 Image, 都没有时返回 null. */
function ThemedShot({ themed, priority }: Pick<ProductMockFrameProps, "themed" | "priority">): React.ReactNode {
	const light = themed?.light;
	const dark = themed?.dark;
	const ratio = dark?.ratio ?? light?.ratio ?? PRODUCT_MOCK_DEFAULT.ratio;
	if (light && dark) {
		return <ThemedImage lightSrc={light.src} darkSrc={dark.src} lightSrcSet={light.srcSet} darkSrcSet={dark.srcSet} alt={dark.alt || light.alt} ratio={ratio} priority={priority} />;
	}
	const one = dark ?? light;
	return one ? <Image src={one.src} srcSet={one.srcSet} alt={one.alt} ratio={ratio} priority={priority} /> : null;
}

/**
 * 产品界面容器: 把任意子节点 (通常是一张产品截图, 也可以是 DOM 绘制的产品 mock) 装进带透视倾斜的舞台,
 * 再用 MaskFade 让顶边或底边渐隐融入背景.
 *
 * 为什么需要这一层: linear / vercel / stripe / supabase / mantine 的首屏产品界面都不是平贴的矩形,
 * 小角度透视让截图向后倾, 一侧渐隐到背景色, 首屏才有纵深, 而不是 "页面里贴了一张图".
 * BrowserFrame / DeviceFrame 只给外壳, 不管空间关系; 这一层只管空间关系, 可以和它们嵌套.
 *
 * 透视写在根上 (perspective), 倾斜与缩放写在舞台上 (rotateX + scale), 变换原点贴着不渐隐的那条边,
 * 保证清晰的一侧留在原位. 倾斜经 CSS 变量拼进类名, prefers-reduced-motion 时只保留 scale 与渐隐, 不倾斜.
 * 遮罩只用 alpha, 亮暗主题都成立. 不画任何颜色与线条. 内层 data-slot="product-mock-surface" (classNames / styles 的 stage 槽).
 * ref 指向根 div.
 *
 * .agents/notes/implemented/feature/2026-11-02-media-primitives.md
 */
export function ProductMockFrame({
	tilt = PRODUCT_MOCK_DEFAULT.tilt, perspective = PRODUCT_MOCK_DEFAULT.perspective, fade = PRODUCT_MOCK_FADE.bottom, fadeLength,
	themed, priority, scale = PRODUCT_MOCK_DEFAULT.scale, classNames, styles, className, style, children, ...props
}: ProductMockFrameProps): React.JSX.Element {
	const slot = resolveSlots(classNames, styles, { fade });
	const angle = clamp(tilt, PRODUCT_MOCK_DEFAULT.minTilt, PRODUCT_MOCK_DEFAULT.maxTilt);
	const origin = fade === PRODUCT_MOCK_FADE.top ? "50% 100%" : "50% 0%";
	const content = (
		<div data-slot="product-mock-frame-content" className={cn("relative w-full", slot.className("content"))} style={slot.style("content")}>
			{children ?? <ThemedShot themed={themed} priority={priority} />}
		</div>
	);
	return (
		<div
			{...props}
			data-slot="product-mock-frame"
			data-fade={fade}
			className={cn("relative w-full", slot.className("root"), className)}
			style={mergeStyle(mergeStyle({ perspective: `${perspective}px` }, slot.style("root")), style)}
		>
			<div
				data-slot="product-mock-surface"
				data-tilt={angle}
				className={cn(PRODUCT_MOCK_CLASSES.surface, slot.className("stage"))}
				style={mergeStyle({ [PRODUCT_MOCK_VAR.tilt]: `${angle}deg`, [PRODUCT_MOCK_VAR.scale]: String(scale), transformOrigin: origin } as React.CSSProperties, slot.style("stage"))}
			>
				{fade === PRODUCT_MOCK_FADE.none ? content : (
					<MaskFade data-slot="product-mock-frame-fade" direction={fade} length={fadeLength} className={slot.className("fade")} style={slot.style("fade")}>
						{content}
					</MaskFade>
				)}
			</div>
		</div>
	);
}
