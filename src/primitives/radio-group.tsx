"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { CLASSES } from "../constants";
import { cn } from "./utils";

/**
 * 单选组.
 *
 * radix RadioGroup 负责方向键漫游与 aria; 这里只给样式, 与 Checkbox 同一套边框与底色.
 * 选中态是 primary 实心圆点, 外圈边框同步变 primary.
 */
function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>): React.JSX.Element {
	return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("grid gap-2", className)} {...props} />;
}

/** 默认指示器: primary 实心圆点. */
const DOT = <span className="size-2 rounded-full bg-primary" />;

/** 默认外形 (圆圈); 关掉指示器时不套, 整块外观由调用方给. */
const ITEM_SHAPE = "inline-flex aspect-square size-4 shrink-0 items-center justify-center rounded-full border border-input bg-muted";

type RadioGroupItemProps = React.ComponentProps<typeof RadioGroupPrimitive.Item> & {
	/**
	 * 选中指示器. 不给时是默认圆点; 给节点则替换圆点; false 不渲染指示器也不套圆圈外形,
	 * 调用方用 children 与 data-[state=checked] 自己画整张卡. 方向键漫游与 aria 仍由 RadioGroup 管.
	 */
	indicator?: React.ReactNode | false;
};

/**
 * 单选项. 文字标签由调用方用 label 包裹或 htmlFor 关联.
 *
 * .agents/notes/implemented/feature/2026-11-08-library-gaps.md
 */
function RadioGroupItem({ className, indicator, children, ...props }: RadioGroupItemProps): React.JSX.Element {
	const bare = indicator === false;
	return (
		<RadioGroupPrimitive.Item
			data-slot="radio-group-item"
			className={cn(
				"peer outline-none",
				!bare && ITEM_SHAPE,
				"transition-[border-color] duration-(--duration-fast) ease-out",
				"focus-visible:border-ring aria-invalid:border-destructive data-[state=checked]:border-primary",
				CLASSES.disabled,
				className,
			)}
			{...props}
		>
			{bare ? null : (
				<RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" className="flex items-center justify-center">
					{indicator ?? DOT}
				</RadioGroupPrimitive.Indicator>
			)}
			{children}
		</RadioGroupPrimitive.Item>
	);
}

export { RadioGroup, RadioGroupItem };
