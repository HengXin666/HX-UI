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

/** 单选项. 文字标签由调用方用 label 包裹或 htmlFor 关联. */
function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>): React.JSX.Element {
	return (
		<RadioGroupPrimitive.Item
			data-slot="radio-group-item"
			className={cn(
				"peer inline-flex aspect-square size-4 shrink-0 items-center justify-center rounded-full border border-input bg-muted outline-none",
				"transition-[border-color] duration-(--duration-fast) ease-out",
				"focus-visible:border-ring aria-invalid:border-destructive data-[state=checked]:border-primary",
				CLASSES.disabled,
				className,
			)}
			{...props}
		>
			<RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" className="flex items-center justify-center">
				<span className="size-2 rounded-full bg-primary" />
			</RadioGroupPrimitive.Indicator>
		</RadioGroupPrimitive.Item>
	);
}

export { RadioGroup, RadioGroupItem };
