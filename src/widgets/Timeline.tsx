"use client";

import { createContext, useContext, type JSX, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { UI_CLASSES } from "../constants";
import { cn } from "../primitives/utils";
import { TIMELINE_CLASSES as C, TONE_CLASSES, WIDGET_CLASSES, WIDGET_MOTION, WIDGET_TONE, type WidgetTone } from "../constants/widgets";

/** 父级是否开了入场动画. 子项只读这一位, 交错节奏由父级的 variants 统一下发. */
const AnimatedContext = createContext(false);

const HIDDEN = "timeline-hidden";
const SHOWN = "timeline-shown";

const LIST_VARIANTS: Variants = {
	[HIDDEN]: {},
	[SHOWN]: { transition: { staggerChildren: WIDGET_MOTION.stagger } },
};

const ITEM_VARIANTS: Variants = {
	[HIDDEN]: { opacity: 0, y: WIDGET_MOTION.rise },
	[SHOWN]: { opacity: 1, y: 0 },
};

export interface TimelineProps {
	readonly children: ReactNode;
	/** 入场时子项自上而下交错淡入. 系统开启减弱动效时自动关闭. 默认 false. */
	readonly animated?: boolean;
	/** 列表的可访问名, 例如 "部署记录". */
	readonly label?: string;
	readonly className?: string;
}

/**
 * 纵向时间线. 语义上是有序列表 (ol), 先后顺序本身就是信息, 屏幕阅读器会念出第几项.
 * 竖线由每个子项自己画到下一项为止, 末项不画, 所以增删子项不需要父级重新计算高度.
 */
export function Timeline({ children, animated = false, label, className }: TimelineProps): JSX.Element {
	const reduced = useReducedMotion() === true;
	const play = animated && !reduced;
	return (
		<AnimatedContext.Provider value={play}>
			<motion.ol
				aria-label={label}
				className={cn(C.list, className)}
				variants={LIST_VARIANTS}
				initial={play ? HIDDEN : false}
				animate={SHOWN}
			>
				{children}
			</motion.ol>
		</AnimatedContext.Provider>
	);
}

export interface TimelineItemProps {
	/** 事件标题. */
	readonly title: ReactNode;
	/** 时间或其他元信息, 显示在标题右侧. 建议传 time 元素以便机器读取. */
	readonly time?: ReactNode;
	/** 标题下方的说明. */
	readonly description?: ReactNode;
	/** 语义色调, 决定圆点颜色: neutral / primary / success / warning / danger. 默认 neutral. */
	readonly tone?: WidgetTone;
	/** 用图标替代圆点 (Iconify 类名), 图标跟随 tone 着色. */
	readonly icon?: string;
	/** 是否末项. 末项不画向下的连接线. */
	readonly last?: boolean;
	/** 额外内容, 例如附件或操作按钮, 排在说明之后. */
	readonly children?: ReactNode;
	readonly className?: string;
}

/** 时间线的一项. 圆点颜色只来自语义色调, 状态 (成功, 警告, 失败) 一眼可辨. */
export function TimelineItem({
	title,
	time,
	description,
	tone = WIDGET_TONE.neutral,
	icon,
	last = false,
	children,
	className,
}: TimelineItemProps): JSX.Element {
	const animated = useContext(AnimatedContext);
	const palette = TONE_CLASSES[tone];
	return (
		<motion.li
			variants={animated ? ITEM_VARIANTS : undefined}
			className={cn(C.item, className)}
			data-tone={tone}
		>
			{!last && <span aria-hidden className={C.line} />}
			<span aria-hidden className={C.marker}>
				{icon ? (
					<span className={cn(C.badge, palette.soft)}>
						<span className={cn(icon, WIDGET_CLASSES.iconSm, palette.text)} />
					</span>
				) : (
					<span className={cn(C.dot, palette.dot)} />
				)}
			</span>
			<div className={C.body}>
				<div className={C.head}>
					<span className={C.title}>{title}</span>
					{time != null && <span className={cn(C.time, WIDGET_CLASSES.nums, WIDGET_CLASSES.hint)}>{time}</span>}
				</div>
				{description != null && <p className={UI_CLASSES.description}>{description}</p>}
				{children}
			</div>
		</motion.li>
	);
}
