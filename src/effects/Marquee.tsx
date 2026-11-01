"use client";

import type { ComponentPropsWithoutRef, CSSProperties, JSX } from "react";
import { ORIENTATION } from "../constants";
import { EFFECT_DEFAULTS, EFFECT_VAR, MARQUEE_MIN_REPEAT } from "../constants/effects";
import { cn } from "../primitives/utils";

export interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
	/** 指针悬停时暂停. 键盘焦点落在里面时总是暂停. */
	readonly pauseOnHover?: boolean;
	/** 反向滚动 (横向从左往右, 纵向从上往下). */
	readonly reverse?: boolean;
	/** 纵向滚动. */
	readonly vertical?: boolean;
	/** 内容复制份数, 至少 2. 内容很短时调大, 避免出现空档. */
	readonly repeat?: number;
	/** 滚完一份的时长 (秒). 不传用 effects.css 的默认值. */
	readonly duration?: number;
	/** 项与项, 份与份之间的间距, 任意 CSS 长度. */
	readonly gap?: string;
	/** 两端渐隐. */
	readonly fade?: boolean;
}

/**
 * 无限滚动跑马灯.
 *
 * 内容渲染 repeat 份, 每份同步平移 "一份宽度 + 间距", 回到起点时与下一份重合, 视觉上无缝.
 * 只有第一份进入可访问性树: 复制件带 aria-hidden 与 inert, 屏幕阅读器不会重复朗读,
 * Tab 也不会走进复制件里的链接. 减弱动效时停止滚动, 隐藏复制件, 改为可手动横向滚动.
 */
export function Marquee({
	pauseOnHover = false,
	reverse = false,
	vertical = false,
	repeat = EFFECT_DEFAULTS.marqueeRepeat,
	duration,
	gap,
	fade = false,
	className,
	style,
	children,
	...props
}: MarqueeProps): JSX.Element {
	const copies = Math.max(MARQUEE_MIN_REPEAT, Math.floor(repeat));
	const vars: Record<string, string> = {};
	if (duration !== undefined) vars[EFFECT_VAR.marqueeDuration] = `${duration}s`;
	if (gap !== undefined) vars[EFFECT_VAR.marqueeGap] = gap;
	return (
		<div
			{...props}
			className={cn("hx-marquee", className)}
			data-orientation={vertical ? ORIENTATION.vertical : ORIENTATION.horizontal}
			data-pause-on-hover={pauseOnHover || undefined}
			data-reverse={reverse || undefined}
			data-fade={fade || undefined}
			style={{ ...vars, ...style } as CSSProperties}
		>
			{Array.from({ length: copies }, (_, index) => (
				<div key={index} className="hx-marquee-track" aria-hidden={index > 0 || undefined} inert={index > 0 || undefined}>
					{children}
				</div>
			))}
		</div>
	);
}
