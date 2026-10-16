"use client";

import * as React from "react";
import { Slot } from "radix-ui";
import { ARIA, HALF_DIVISOR, KEY, RIPPLE, VARIANT } from "../constants";

/** 宿主属性: CSS 由它挂上 position: relative 与 overflow: hidden. */
type RippleAttribute = { "data-ripple"?: string };

/** 波纹尺寸档: default 用于常规控件, icon 用于纯图标控件. */
type RippleSize = typeof VARIANT.default | typeof VARIANT.icon;

interface UseRippleOptions<T extends HTMLElement> {
	/** 为 false 时不产生波纹, 也不挂宿主属性. 默认 true. */
	enabled?: boolean;
	/** 图标尺寸用更淡的波纹. */
	size?: RippleSize;
	/** 调用方自己的按下回调, 会先于波纹执行. */
	onPointerDown?: React.PointerEventHandler<T>;
	/** 调用方自己的按键回调, 会先于波纹执行. */
	onKeyDown?: React.KeyboardEventHandler<T>;
}

type RippleProps<T extends HTMLElement> = RippleAttribute & {
	onPointerDown?: React.PointerEventHandler<T>;
	onKeyDown?: React.KeyboardEventHandler<T>;
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const KEYS_THAT_ACTIVATE: ReadonlyArray<string> = [KEY.enter, KEY.space];
const PRIMARY_BUTTON = 0;

/** 只在事件回调里调用, 此时一定在浏览器; matchMedia 缺失 (旧测试环境) 时按未开启处理. */
function prefersReducedMotion(): boolean {
	return window.matchMedia?.(REDUCED_MOTION).matches === true;
}

/** 宿主处于禁用态时不出波纹: 原生 disabled, aria-disabled 与 radix 的 data-disabled 都算. */
function isInert(host: HTMLElement): boolean {
	return (
		(host as HTMLButtonElement).disabled === true ||
		host.getAttribute(ARIA.disabled) === ARIA.true ||
		host.hasAttribute("data-disabled")
	);
}

/**
 * 在宿主内 (x, y) 处插入一个波纹 span, 动画结束后自行移除.
 *
 * 直接操作 DOM 而不是放进 React state: 波纹是纯装饰, 不参与渲染结果,
 * 走 state 会让每次点击都多一次宿主重渲染, 且 asChild 时没有地方放子节点.
 * 坐标相对宿主的 border box, 所以宿主必须是定位容器 (data-ripple 的 CSS 负责).
 */
function spawnRipple(host: HTMLElement, clientX: number, clientY: number): void {
	if (isInert(host) || prefersReducedMotion()) {
		return;
	}
	const rect = host.getBoundingClientRect();
	const diameter = Math.hypot(rect.width, rect.height) * RIPPLE.diameterFactor;
	const span = document.createElement("span");
	span.className = RIPPLE.className;
	span.setAttribute(ARIA.hidden, ARIA.true);
	span.style.width = `${diameter}px`;
	span.style.height = `${diameter}px`;
	span.style.left = `${clientX - rect.left - diameter / HALF_DIVISOR}px`;
	span.style.top = `${clientY - rect.top - diameter / HALF_DIVISOR}px`;
	const remove = (): void => span.remove();
	span.addEventListener("animationend", remove, { once: true });
	span.addEventListener("animationcancel", remove, { once: true });
	host.appendChild(span);
}

/**
 * 水波纹 hook: 返回要展开到宿主元素上的属性 (data-ripple 与两个事件回调).
 *
 * 指针按下从按下点扩散; 键盘 Enter / Space 从中心扩散, 长按的自动重复不叠加.
 * 系统要求减弱动效时不产生波纹. 调用方自己的 onPointerDown / onKeyDown
 * 先执行, 其中 preventDefault 会同时取消波纹.
 *
 * .agents/notes/implemented/feature/2026-10-17-dark-dimmed-retheme.md
 */
function useRipple<T extends HTMLElement>({
	enabled = true,
	size = VARIANT.default,
	onPointerDown,
	onKeyDown,
}: UseRippleOptions<T> = {}): RippleProps<T> {
	if (!enabled) {
		return { onPointerDown, onKeyDown };
	}
	return {
		"data-ripple": size === VARIANT.icon ? RIPPLE.icon : RIPPLE.on,
		onPointerDown: (event) => {
			onPointerDown?.(event);
			if (event.defaultPrevented || event.button !== PRIMARY_BUTTON) {
				return;
			}
			spawnRipple(event.currentTarget, event.clientX, event.clientY);
		},
		onKeyDown: (event) => {
			onKeyDown?.(event);
			if (event.defaultPrevented || event.repeat || !KEYS_THAT_ACTIVATE.includes(event.key)) {
				return;
			}
			const rect = event.currentTarget.getBoundingClientRect();
			spawnRipple(event.currentTarget, rect.left + rect.width / HALF_DIVISOR, rect.top + rect.height / HALF_DIVISOR);
		},
	};
}

type RippleComponentProps = React.ComponentProps<typeof Slot.Root> & {
	/** 设为 false 关闭波纹. 默认 true. */
	ripple?: boolean;
	size?: RippleSize;
};

/**
 * 给任意单个子元素加水波纹, 不改它的结构: `<Ripple><button type="button" /></Ripple>`.
 * 子元素自己的事件回调由 Slot 合并, 仍然生效.
 */
function Ripple({ ripple = true, size, onPointerDown, onKeyDown, ...props }: RippleComponentProps): React.JSX.Element {
	const rippleProps = useRipple<HTMLElement>({ enabled: ripple, size, onPointerDown, onKeyDown });
	return <Slot.Root {...props} {...rippleProps} />;
}

export { Ripple, spawnRipple, useRipple };
export type { RippleComponentProps, RippleSize, UseRippleOptions };
