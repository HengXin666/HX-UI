"use client";
// 行为规格参照 docs/research/catalog/components-2.md 的 Stepper 条目, 实现为 HX 自有.

import { Children, useEffect, useLayoutEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { FOCUS_RING } from "../../../craft/tokens";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { useSpringValue } from "../../../motion/drive/driver";
import { EASE_PLAIN, PROP_BACKGROUND, PROP_COLOR, PROP_OPACITY, PROP_TRANSFORM, toneVar, transition, type ChoiceTone } from "../tone";
import { TrailDot } from "./parts/TrailDot";
import { TRAIL_DEFAULTS, TRAIL_MS, TRAIL_SLIDE_PX, TRAIL_SPRINGS, trailClamp, trailFill, trailState } from "./parts/trail-spec";

export { TRAIL_ACTIVE_SCALE, TRAIL_BOUNCE, TRAIL_EASE_SETTLE, TRAIL_EASE_SPRING, TRAIL_MS, TRAIL_SLIDE_PX, TRAIL_SPRING_S, trailClamp, trailFill, trailState, type TrailState } from "./parts/trail-spec";

export interface StepTrailProps {
	/** 每个子节点是一步的内容. */
	readonly children?: ReactNode;
	/** 受控的当前步 (从 1 数); 总步数 + 1 表示已完成. */
	readonly step?: number;
	readonly initialStep?: number;
	readonly onStepChange?: (step: number) => void;
	/** 最后一步按下完成键时调用. */
	readonly onComplete?: () => void;
	readonly backLabel?: ReactNode;
	readonly nextLabel?: ReactNode;
	readonly completeLabel?: ReactNode;
	/** 当前步还不能前进 (例如表单未填完). */
	readonly nextDisabled?: boolean;
	/** 点指示点直接跳步. */
	readonly clickableDots?: boolean;
	readonly activeTone?: ChoiceTone;
	readonly activeTextTone?: ChoiceTone;
	readonly idleTone?: ChoiceTone;
	readonly idleTextTone?: ChoiceTone;
	readonly lineTone?: ChoiceTone;
	readonly ariaLabel?: string;
	readonly className?: string;
}

const BUTTON_CLASS = `inline-flex h-9 items-center rounded-md px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-[0.45] ${FOCUS_RING}`;

/**
 * 分步流程: 一排指示点由连线串起, 下方是当前步的内容和上一步 / 下一步键.
 * 连线填充, 内容高度与换步滑入都由可中断弹簧驱动, 中途连点会从当前位置与速度接着走.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-choice.md
 */
export function StepTrail({
	children,
	step,
	initialStep = TRAIL_DEFAULTS.initialStep,
	onStepChange,
	onComplete,
	backLabel = "Back",
	nextLabel = "Continue",
	completeLabel = "Complete",
	nextDisabled = false,
	clickableDots = true,
	activeTone = "primary",
	activeTextTone = "primary-foreground",
	idleTone = "muted",
	idleTextTone = "muted-foreground",
	lineTone = "border",
	ariaLabel = "Progress",
	className,
}: StepTrailProps): JSX.Element {
	const panels = Children.toArray(children);
	const count = panels.length;
	const reduced = useReducedMotion();
	const [inner, setInner] = useState(() => trailClamp(initialStep, count));
	const current = trailClamp(step ?? inner, count);
	const done = current > count;
	const [progress, fill] = useSpringValue(current - 1);
	const [height, grow] = useSpringValue(0);
	const [slide, shift] = useSpringValue(0);
	const [measured, setMeasured] = useState(false);
	const content = useRef<HTMLDivElement>(null);
	const previous = useRef(current);

	const go = (next: number): void => {
		const target = trailClamp(next, count);
		if (target === current) return;
		if (step === undefined) setInner(target);
		onStepChange?.(target);
		if (target > count) onComplete?.();
	};

	useEffect(() => {
		const dir = Math.sign(current - previous.current);
		previous.current = current;
		if (reduced) {
			fill.jump(current - 1);
			shift.jump(0);
			return;
		}
		fill.to(current - 1, TRAIL_SPRINGS.fill);
		if (dir !== 0 && !done) {
			shift.jump(dir);
			shift.to(0, TRAIL_SPRINGS.slide);
		}
		// 驱动器实例稳定, 只随步数与减弱动效变化
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [current, reduced, done]);

	useLayoutEffect(() => {
		const node = content.current;
		if (!node) return undefined;
		const measure = (): void => {
			const target = done ? 0 : node.scrollHeight;
			if (!measured || reduced) grow.jump(target);
			else grow.to(target, TRAIL_SPRINGS.height);
			setMeasured(true);
		};
		measure();
		if (typeof ResizeObserver === "undefined") return undefined;
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
		// 驱动器实例稳定; measured 只决定首帧是否直接落位
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [current, done, reduced]);

	const ms = (n: number): number => (reduced ? 0 : n);
	const buttonTransition = [transition(PROP_BACKGROUND, ms(TRAIL_MS.button)), transition(PROP_COLOR, ms(TRAIL_MS.button)), transition(PROP_OPACITY, ms(TRAIL_MS.button))].join(", ");

	return (
		<div data-slot="step-trail" data-state={done ? "complete" : "active"} className={cn("flex w-full flex-col gap-4", className)}>
			<ol aria-label={ariaLabel} className="flex items-center">
				{panels.map((_, k) => {
					const i = k + 1;
					return (
						<li key={i} className={cn("flex items-center", i < count && "flex-1")}>
							<TrailDot
								index={i}
								state={trailState(i, current)}
								clickable={clickableDots && !done}
								reduced={reduced}
								onSelect={() => go(i)}
								tones={{ activeTone, activeTextTone, idleTone, idleTextTone }}
							/>
							{i < count ? (
								<span aria-hidden className="relative mx-2 h-px flex-1 overflow-hidden" style={{ backgroundColor: toneVar(lineTone), transition: transition(PROP_BACKGROUND, ms(TRAIL_MS.track)) }}>
									<span data-slot="step-trail-fill" className="absolute inset-0 origin-left" style={{ backgroundColor: toneVar(activeTone), transform: `scaleX(${trailFill(i, progress)})` }} />
								</span>
							) : null}
						</li>
					);
				})}
			</ol>
			<div data-slot="step-trail-viewport" className="overflow-hidden" style={{ height: measured ? Math.max(0, height) : undefined }} aria-hidden={done || undefined}>
				<div
					ref={content}
					role="group"
					aria-label={`${current > count ? count : current} / ${count}`}
					style={{ transform: `translateX(${slide * TRAIL_SLIDE_PX}px)`, opacity: 1 - Math.min(1, Math.abs(slide)) }}
				>
					{done ? null : panels[current - 1]}
				</div>
			</div>
			{done ? null : (
				<div className={cn("flex items-center", current > 1 ? "justify-between" : "justify-end")}>
					{current > 1 ? (
						<button type="button" data-slot="step-trail-back" onClick={() => go(current - 1)} className={cn(BUTTON_CLASS, "text-muted-foreground hover:text-foreground")} style={{ transition: buttonTransition }}>
							{backLabel}
						</button>
					) : null}
					<button
						type="button"
						data-slot="step-trail-next"
						disabled={nextDisabled}
						onClick={() => go(current + 1)}
						className={BUTTON_CLASS}
						style={{ backgroundColor: toneVar(activeTone), color: toneVar(activeTextTone), transition: [buttonTransition, transition(PROP_TRANSFORM, ms(TRAIL_MS.button), EASE_PLAIN)].join(", ") }}
					>
						{current === count ? completeLabel : nextLabel}
					</button>
				</div>
			)}
		</div>
	);
}
