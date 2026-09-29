import * as React from "react";
import { cn } from "./utils";

/**
 * 骨架屏。
 *
 * 只做一件事: 占住位置。**不要**用它模拟真实内容的形状细节 —— 那会变成一份要跟着
 * 真实布局同步维护的赝品, 界面一改就对不上。宽度用比例 (w-2/3) 而不是像素,
 * 这样它嵌进任何宽度的容器都不会溢出。
 *
 * animate-pulse 是 Tailwind 内置的 opacity 关键帧 (合成器动画, 不占主线程),
 * 与 README 里"常驻指示动画不用 CSS 关键帧"那条约束不冲突 —— 那条针对的是
 * 呼吸/波纹这类**常驻**指示器, 骨架屏是加载期的一次性占位。
 */
function Skeleton({
	className,
	...props
}: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="skeleton"
			aria-hidden
			className={cn("animate-pulse rounded-md bg-muted/60", className)}
			{...props}
		/>
	);
}

/** 多行文本骨架。末行短一截, 否则看起来像一块实心砖。 */
function SkeletonText({
	lines = 3,
	className,
}: {
	lines?: number;
	className?: string;
}): React.JSX.Element {
	return (
		<div data-slot="skeleton-text" className={cn("flex flex-col gap-2", className)}>
			{Array.from({ length: lines }, (_, i) => (
				<Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
			))}
		</div>
	);
}

export { Skeleton, SkeletonText };
