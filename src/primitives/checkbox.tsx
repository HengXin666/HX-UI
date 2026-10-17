"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { CheckIcon, MinusIcon } from "lucide-react";
import { CLASSES } from "../constants";
import { cn } from "./utils";

/**
 * 复选框.
 *
 * 建在 radix Checkbox 上: 键盘 Space 切换, checked 支持 "indeterminate" 半选.
 * 未选是内嵌层底色 + 1px 输入框边框, 选中改为 primary 实底; 两种图标都渲染,
 * 由 data-state 决定显示哪一个, 半选不需要调用方额外传图标.
 * 不加水波纹: 勾选框面积太小, 状态变化本身就是反馈.
 */
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>): React.JSX.Element {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={cn(
				"peer group/checkbox inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input bg-muted text-primary-foreground outline-none",
				"transition-[background-color,border-color] duration-(--duration-fast) ease-out",
				"focus-visible:border-ring aria-invalid:border-destructive",
				"data-[state=checked]:border-primary data-[state=checked]:bg-primary",
				"data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
				CLASSES.disabled,
				className,
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="flex items-center justify-center">
				<CheckIcon className="size-3 group-data-[state=indeterminate]/checkbox:hidden" />
				<MinusIcon className="hidden size-3 group-data-[state=indeterminate]/checkbox:block" />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
