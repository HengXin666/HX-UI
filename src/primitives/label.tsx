"use client";

import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "./utils";
import { SLOT } from "../constants";

/**
 * 表单标签.
 *
 * 建在 radix Label 上: 点击标签聚焦或切换关联控件. 关联控件禁用时
 * (peer-disabled 或外层 data-disabled) 标签同步变淡, 不需要调用方再写一遍.
 */
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>): React.JSX.Element {
	return (
		<LabelPrimitive.Root
			data-slot={SLOT.label}
			className={cn(
				"flex items-center gap-2 text-[13px] leading-none font-medium text-foreground select-none",
				"group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
				"peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

export { Label };
