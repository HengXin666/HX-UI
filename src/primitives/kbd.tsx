import * as React from "react";
import { cn } from "./utils";

/**
 * 键盘按键标记.
 *
 * 语义上用原生 kbd; 底边多一道 1px 内阴影做出按键的厚度, 颜色取 border token,
 * 换肤时跟着走. 组合键写成多个 Kbd 并排: `<Kbd>Ctrl</Kbd><Kbd>K</Kbd>`.
 */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">): React.JSX.Element {
	return (
		<kbd
			data-slot="kbd"
			className={cn(
				"inline-flex h-5 min-w-5 select-none items-center justify-center gap-0.5 rounded-[4px] border border-border bg-muted px-1",
				"font-mono text-[11px] font-medium leading-none text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]",
				"[&_svg:not([class*='size-'])]:size-3",
				className,
			)}
			{...props}
		/>
	);
}

/** 一组按键: 只负责间距, 让组合键之间不需要调用方手写空格. */
function KbdGroup({ className, ...props }: React.ComponentProps<"span">): React.JSX.Element {
	return <span data-slot="kbd-group" className={cn("inline-flex items-center gap-1", className)} {...props} />;
}

export { Kbd, KbdGroup };
