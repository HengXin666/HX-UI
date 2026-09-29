"use client";

import type { ComponentProps, JSX } from "react";
import { cn } from "./utils";

/**
 * 多行文本。
 *
 * 类串与 Input 同源 (边框 / 底色 / 焦点 / 禁用 / aria-invalid 全对齐), 只加三样:
 *   field-sizing-content —— 让浏览器按内容自动长高, 省掉"手写 onInput 改 height"
 *                           那套会与 React 抢 DOM 的写法; 不支持的浏览器退化成 min-h-16。
 *   min-h-16             —— 至少四行左右的高度, 否则空 textarea 看起来像一个坏掉的输入框。
 *   resize 交给使用方      —— 默认不锁 (锁死 resize-none 会让长文本编辑很难受)。
 *
 * 为什么不给 rows 默认值: rows 与 field-sizing 同时存在时表现不一致 (有的浏览器
 * 以 rows 为准), 用 min-height 表达下限只用一条规则, 跨浏览器一致。
 */
function Textarea({ className, ...props }: ComponentProps<"textarea">): JSX.Element {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"field-sizing-content flex min-h-16 w-full rounded-lg border border-border/60 bg-transparent px-2.5 py-2 text-base shadow-none transition-[border-color,background-color] outline-none placeholder:text-muted-foreground hover:border-border focus-visible:border-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/30 disabled:opacity-50 aria-invalid:border-destructive/70 md:text-sm dark:bg-input/20 dark:disabled:bg-input/50",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };