import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "./utils";
import { ARIA, VARIANT } from "../constants";

/**
 * 原生下拉选择.
 *
 * 用浏览器自己的 select: 移动端弹系统滚轮, 表单原生提交, 选项上千也不卡.
 * 外观与 SelectTrigger 对齐 (同高, 同边框, 同箭头), 箭头是叠在上面的 svg,
 * 原生箭头用 appearance-none 去掉. 需要搜索 / 自定义选项渲染时用 Select 或 Combobox.
 * 粗指针设备 (触屏) 上字号提到 16px: iOS Safari 聚焦字号小于 16px 的控件会自动放大页面.
 */
function NativeSelect({
	className,
	size = VARIANT.default,
	...props
}: Omit<React.ComponentProps<"select">, "size"> & { size?: "sm" | "default" }): React.JSX.Element {
	return (
		<div data-slot="native-select-wrapper" className="group/native-select relative w-fit has-[select:disabled]:opacity-50">
			<select
				data-slot="native-select"
				data-size={size}
				className={cn(
					"h-8 w-full min-w-0 appearance-none rounded-lg border border-border bg-card py-1 pr-8 pl-2.5 text-[12px] font-medium pointer-coarse:text-base text-foreground outline-none",
					"transition-[border-color,background-color] duration-(--duration-fast) hover:bg-accent focus-visible:border-primary/50",
					"disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-destructive data-[size=sm]:h-7",
					className,
				)}
				{...props}
			/>
			<ChevronDownIcon
				aria-hidden={ARIA.true}
				className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground select-none"
			/>
		</div>
	);
}

function NativeSelectOption(props: React.ComponentProps<"option">): React.JSX.Element {
	return <option data-slot="native-select-option" className="bg-popover text-popover-foreground" {...props} />;
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<"optgroup">): React.JSX.Element {
	return <optgroup data-slot="native-select-optgroup" className={cn("bg-popover text-popover-foreground", className)} {...props} />;
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
