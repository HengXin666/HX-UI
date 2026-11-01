"use client";

import type { ComponentPropsWithoutRef, JSX } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { GLASS_BLUR, GLASS_TINT } from "../constants/effects";
import { cn } from "../primitives/utils";

/**
 * 毛玻璃面板的变体. 模糊档走 Tailwind 的 backdrop-blur 工具类, 底色, 1px 描边与内高光在
 * effects.css 的 .hx-glass 里从语义令牌混出; 不支持 backdrop-filter 的环境回退为不透明表面.
 */
export const glassVariants = cva("hx-glass relative rounded-xl border", {
	variants: {
		blur: {
			[GLASS_BLUR.sm]: "backdrop-blur-sm",
			[GLASS_BLUR.md]: "backdrop-blur-md",
			[GLASS_BLUR.lg]: "backdrop-blur-xl",
		},
		tint: {
			[GLASS_TINT.neutral]: "",
			[GLASS_TINT.primary]: "hx-glass-primary",
		},
	},
	defaultVariants: { blur: GLASS_BLUR.md, tint: GLASS_TINT.neutral },
});

export interface GlassPanelProps extends ComponentPropsWithoutRef<"div">, VariantProps<typeof glassVariants> {}

/** 毛玻璃面板: 压在 Backdrop, 图片或渐变上时才看得出效果, 纯色底上等同半透明卡片. */
export function GlassPanel({ className, blur, tint, ...props }: GlassPanelProps): JSX.Element {
	return <div {...props} className={cn(glassVariants({ blur, tint }), className)} />;
}
