"use client";

import { motion } from "motion/react";
import { useId, type JSX, type SetStateAction } from "react";
import { rippleAttribute, useRipple } from "../primitives/ripple";

function cn(...parts: Array<string | false | null | undefined>): string {
	return parts.filter(Boolean).join(" ");
}

export interface SegmentedControlItem<T extends string> {
	key: T;
	label: string;
	icon?: string;
	/** 可选未读小红点（>0 显示） */
	badge?: number;
}

/**
 * 选项列表的类型。
 *
 * 这里**不能**用 `NoInfer`: 加上它之后, `items={[{key:"a"},{key:"b"}]} value="a"`
 * 这种字面量写法会因为没有推断依据而把 T 推成 "a", 于是 "b" 报错。
 * 这条路走不通  T 必须能从 items 的 key 推出来。
 */
export interface SegmentedControlProps<T extends string> {
	/** 选项列表。T 由各项的 key 推导, 因此 items 也参与泛型推断。 */
	items: SegmentedControlItem<T>[];
	value: T;
	/**
	 * 选中项变化的回调。
	 *
	 * 参数类型写成 `T | ((prev: T) => T)` 而不是 T, 是为了让 React 的
	 * `setState` (Dispatch<SetStateAction<T>>) 能**直接传进来**:
	 * `<SegmentedControl value={tab} onChange={setTab} />` 是最常见的写法,
	 * 只声明 `(value: T) => void` 会逼调用方写一层无意义的包装。
	 * 组件内部只按"传一个 T 进去"调用, 分发函数由 React 自己处理。
	 */
	onChange: (value: T | ((prev: T) => T)) => void;
	className?: string;
	/** 容器尺寸正在变化时设为 true，禁用指示器的 layout 动画，避免抖动 */
	suppressLayoutAnimation?: boolean;
	/** 点按水波纹. 默认 true. */
	ripple?: boolean;
}

/** 分段按钮里的波纹裁剪层; 只认按钮的直接子节点. */
const RIPPLE_LAYER_SELECTOR = ":scope > [data-ripple]";

export function SegmentedControl<T extends string>({
	items,
	value,
	onChange,
	className,
	suppressLayoutAnimation = false,
	ripple = true,
}: SegmentedControlProps<T>): JSX.Element {
	const layoutId = useId();
	/*
	 * 波纹插进按钮里铺满的裁剪层, 而不是按钮本身: 按钮挂 data-ripple 会被加上
	 * overflow: hidden, 选中滑块 (layoutId 共享布局) 从旧分段滑过来的途中落在新按钮
	 * 外的部分会被裁掉, 只剩新分段边缘里冒出的半截.
	 */
	const rippleProps = useRipple<HTMLButtonElement>({
		enabled: ripple,
		container: (host) => host.querySelector<HTMLElement>(RIPPLE_LAYER_SELECTOR),
	});

	return (
		<div
			className={cn(
				"relative inline-flex shrink-0 rounded-[8px] bg-black/[0.06] p-[2px] dark:bg-white/[0.08]",
				className,
			)}
		>
			{items.map(({ key, label, icon, badge }) => {
				const active = value === key;
				return (
					<button
						key={key}
						type="button"
						onClick={() => onChange(key)}
						{...rippleProps}
						className={cn(
							"relative flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-[6px] px-2.5 py-[3px] text-[11px] font-medium leading-[16px] transition-colors duration-150 select-none",
							active ? "text-foreground" : "text-muted-foreground hover:text-foreground/70",
						)}
					>
						{active && (
							<motion.span
								layoutId={`seg-indicator-${layoutId}`}
								className="absolute inset-0 rounded-[6px] bg-background shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_0.5px_rgba(0,0,0,0.04)] ring-[0.5px] ring-inset ring-primary/30 dark:bg-white/[0.12] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
								transition={
									suppressLayoutAnimation
										? { duration: 0 }
										: { type: "spring", stiffness: 480, damping: 32, mass: 0.8 }
								}
							/>
						)}
						{ripple && (
							<span
								aria-hidden
								data-ripple={rippleAttribute()}
								className="pointer-events-none absolute inset-0 rounded-[6px]"
							/>
						)}
						<motion.span
							className="relative z-10 flex items-center gap-1"
							whileTap={{ scale: 0.93 }}
							transition={{ type: "spring", stiffness: 500, damping: 24 }}
						>
							{icon && <span className={cn(icon, "h-3 w-3")} />}
							{label}
							{badge && badge > 0 ? (
								<span className="ml-0.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-danger-emphasis px-1 text-[9px] font-semibold leading-none text-destructive-foreground">
									{badge > 99 ? "99+" : badge}
								</span>
							) : null}
						</motion.span>
					</button>
				);
			})}
		</div>
	);
}