import * as React from "react";
import { Separator as SeparatorPrimitive } from "radix-ui";
import { cn } from "./utils";

/**
 * 分隔线。
 *
 * 全局 1px —— 想强调就去改颜色深度, 不要加粗 (README 的硬约定之一)。
 * decorative 默认 true: 绝大多数分隔线只是排版留白, 让它进无障碍树反而会给读屏
 * 软件多播报一堆无意义的 "separator"。只有真正在**切分两个语义区**时才传 false。
 */
function Separator({
	className,
	orientation = "horizontal",
	decorative = true,
	...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>): React.JSX.Element {
	return (
		<SeparatorPrimitive.Root
			data-slot="separator"
			decorative={decorative}
			orientation={orientation}
			className={cn(
				"shrink-0 bg-border",
				orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
				className,
			)}
			{...props}
		/>
	);
}

export { Separator };