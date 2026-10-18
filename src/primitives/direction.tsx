"use client";

import * as React from "react";
import { Direction as DirectionPrimitive } from "radix-ui";

/**
 * 文字方向提供者.
 *
 * radix 的菜单 / 滑块 / 标签页等按它决定方向键语义与弹出侧; 整个应用挂一次,
 * 同时给根元素写 dir, 让 CSS 的逻辑属性 (ms-* / me-*) 跟着翻转.
 */
function DirectionProvider({
	dir,
	children,
}: {
	dir: "ltr" | "rtl";
	children?: React.ReactNode;
}): React.JSX.Element {
	return <DirectionPrimitive.Provider dir={dir}>{children}</DirectionPrimitive.Provider>;
}

const useDirection = DirectionPrimitive.useDirection;

export { DirectionProvider, useDirection };
