import * as React from "react";
import { Loader2Icon } from "lucide-react";
import { cn } from "./utils";
import { ARIA } from "../constants";

/**
 * 轻量旋转指示 (对标 shadcn Spinner): 一个 lucide 图标加 animate-spin, 尺寸随字号.
 *
 * 放进按钮 / 输入组这类行内位置用它; 需要多种形态 (LDRS) 与尺寸档时用 Spin.
 * 系统要求减弱动效时改为缓慢呼吸, 仍能看出 "在忙".
 */
function Spinner({ className, ...props }: React.ComponentProps<"svg">): React.JSX.Element {
	return (
		<Loader2Icon
			role={ARIA.status}
			aria-label="加载中"
			data-slot="spinner"
			className={cn("size-4 animate-spin motion-reduce:animate-pulse", className)}
			{...props}
		/>
	);
}

export { Spinner };
