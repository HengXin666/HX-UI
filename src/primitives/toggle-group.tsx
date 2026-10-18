"use client";

import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { VARIANT } from "../constants";
import { useRipple } from "./ripple";
import { toggleVariants } from "./toggle";
import { cn } from "./utils";

type ToggleGroupStyle = VariantProps<typeof toggleVariants> & { spacing?: number };

const ToggleGroupContext = React.createContext<ToggleGroupStyle>({ size: VARIANT.default, variant: VARIANT.default, spacing: 0 });

/**
 * 一组两态按钮: type="single" 是单选 (可取消), type="multiple" 是多选.
 *
 * variant / size 由组下发给每一项, 调用方只写一次. spacing 为 0 时各项贴合成一条,
 * 只有首尾保留圆角; 需要分开摆放时传 spacing (单位为 Tailwind 间距档).
 * 与 SegmentedControl 的区别: 那个是 "切视图" 且必有一项选中, 这个是 "开关若干个状态".
 */
function ToggleGroup({
	className,
	variant,
	size,
	spacing = 0,
	children,
	style,
	...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & ToggleGroupStyle): React.JSX.Element {
	/** Provider 在 Root 外层: asChild 时 Root 的直接子节点仍是调用方的宿主元素, 组样式与语义合并到它上面. */
	return (
		<ToggleGroupContext.Provider value={{ variant, size, spacing }}>
		<ToggleGroupPrimitive.Root
			data-slot="toggle-group"
			data-variant={variant}
			data-size={size}
			data-spacing={spacing}
			style={{ ...style, ["--gap" as string]: spacing }}
			className={cn(
				"group/toggle-group flex w-fit items-center gap-[--spacing(var(--gap))] rounded-lg",
				"data-[variant=outline]:data-[spacing=0]:shadow-none",
				className,
			)}
			{...props}
		>
			{children}
		</ToggleGroupPrimitive.Root>
		</ToggleGroupContext.Provider>
	);
}

function ToggleGroupItem({
	className,
	children,
	variant,
	size,
	ripple = true,
	onPointerDown,
	onKeyDown,
	...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
	VariantProps<typeof toggleVariants> & {
		/** 点按水波纹. 默认 true. */
		ripple?: boolean;
	}): React.JSX.Element {
	const context = React.useContext(ToggleGroupContext);
	const rippleProps = useRipple<HTMLButtonElement>({ enabled: ripple, size: VARIANT.icon, onPointerDown, onKeyDown });
	return (
		<ToggleGroupPrimitive.Item
			data-slot="toggle-group-item"
			data-variant={context.variant ?? variant}
			data-size={context.size ?? size}
			data-spacing={context.spacing}
			className={cn(
				toggleVariants({ variant: context.variant ?? variant, size: context.size ?? size }),
				"w-auto shrink-0 focus:z-10 focus-visible:z-10",
				"data-[spacing=0]:rounded-none data-[spacing=0]:first:rounded-l-lg data-[spacing=0]:last:rounded-r-lg",
				"data-[spacing=0]:data-[variant=outline]:border-l-0 data-[spacing=0]:data-[variant=outline]:first:border-l",
				className,
			)}
			{...props}
			{...rippleProps}
		>
			{children}
		</ToggleGroupPrimitive.Item>
	);
}

export { ToggleGroup, ToggleGroupItem };
