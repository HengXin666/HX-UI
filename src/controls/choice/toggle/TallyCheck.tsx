"use client";

/** 行为规格参照 catalog/micro.md 的 SpringCheck 条目 (仅作出处说明, 实现为 HX 自写). */
import { useEffect, useId, useState, type JSX } from "react";
import { PRESS_SCALE } from "../../../craft/tokens";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import type { SpringSpec } from "../../../craft/spring";
import { useSpringValue } from "../../../motion/drive/driver";
import { springFromDuration } from "../../../motion/spring/fit";
import { stepSpringExact } from "../../../motion/spring/step";
import { CHOICE_FIT, PX, SPEC_EASE_OUT, toMs, toneVar, transition, type ChoiceTone } from "../tone";

/** 本文件内重复出现的字面量, 只写一次. */
const PAREN_CLOSE = ")";

/** 一次勾选的视觉时长 (秒): 填充弹簧按它换算. */
export const TALLY_VISUAL_DURATION = 0.2;
/** 勾线在视觉时长的 84% 处画完, 略早于填充落定. */
export const TALLY_RULE_END = 0.84;
/** 填充从 35% 大小鼓到满格. */
export const TALLY_SWELL = 0.35;
/** 按下时方框缩放的过渡. */
export const TALLY_PRESS_MS = 160;
/** 完成态文字变淡的过渡. */
export const TALLY_FADE_MS = 120;
const TICK_PATH = "M6 12.5l4 4 8-9";
const VIEWBOX = "0 0 24 24";
const TICK_STROKE = 2.25;

export type TallyStrike = "left" | "right" | "none";

export interface TallyCheckProps {
	readonly label?: string;
	readonly checked?: boolean;
	readonly defaultChecked?: boolean;
	readonly onChange?: (checked: boolean) => void;
	readonly disabled?: boolean;
	/** 边框与文字色. */
	readonly tone?: ChoiceTone;
	readonly fillTone?: ChoiceTone;
	readonly checkTone?: ChoiceTone;
	readonly boxSize?: number;
	readonly boxRadius?: number;
	readonly fontSize?: number;
	/** 填充与勾线的回弹, 0 为不过冲. */
	readonly bounce?: number;
	/** 删除线比勾选晚多少秒起笔. */
	readonly strikeLag?: number;
	/** 完成态文字透明度. */
	readonly doneOpacity?: number;
	/** 删除线从哪边画起, none 不画. */
	readonly strike?: TallyStrike;
	readonly ariaLabel?: string;
	readonly className?: string;
}

/** 勾选的三根弹簧: 填充按 bounce 回弹, 勾线比填充早落定, 删除线不回弹. */
export function tallySprings(bounce: number): { fill: SpringSpec; tick: SpringSpec; strike: SpringSpec } {
	return {
		fill: springFromDuration(TALLY_VISUAL_DURATION, bounce, CHOICE_FIT),
		tick: springFromDuration(TALLY_VISUAL_DURATION * TALLY_RULE_END, bounce, CHOICE_FIT),
		strike: springFromDuration(TALLY_VISUAL_DURATION, 0, CHOICE_FIT),
	};
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * 待办式复选: 方框填充从 35% 鼓满, 勾线描出, 文字变淡并划线. 中途反选时每根弹簧从当前值回退.
 */
export function TallyCheck({
	label = "",
	checked,
	defaultChecked = false,
	onChange,
	disabled = false,
	tone = "foreground",
	fillTone = "primary",
	checkTone = "primary-foreground",
	boxSize = 28,
	boxRadius = 9,
	fontSize = 18,
	bounce = 0.2,
	strikeLag = 0.12,
	doneOpacity = 0.42,
	strike = "left",
	ariaLabel,
	className,
}: TallyCheckProps): JSX.Element {
	const reduced = useReducedMotion();
	const labelId = useId();
	const [inner, setInner] = useState(defaultChecked);
	const on = checked ?? inner;
	const [pressed, setPressed] = useState(false);
	const [fill, fillDriver] = useSpringValue(on ? 1 : 0, stepSpringExact);
	const [tick, tickDriver] = useSpringValue(on ? 1 : 0, stepSpringExact);
	const [rule, ruleDriver] = useSpringValue(on ? 1 : 0, stepSpringExact);

	useEffect(() => {
		const target = on ? 1 : 0;
		if (reduced) {
			fillDriver.jump(target);
			tickDriver.jump(target);
			ruleDriver.jump(target);
			return;
		}
		const springs = tallySprings(bounce);
		if (on && fillDriver.value < TALLY_SWELL) fillDriver.jump(TALLY_SWELL);
		fillDriver.to(target, springs.fill);
		tickDriver.to(target, springs.tick);
		ruleDriver.to(target, springs.strike, { delayMs: on ? toMs(strikeLag) : 0 });
	}, [on, reduced, bounce, strikeLag, fillDriver, tickDriver, ruleDriver]);

	const toggle = (): void => {
		if (disabled) return;
		const next = !on;
		if (checked === undefined) setInner(next);
		onChange?.(next);
	};

	const dash = clamp01(tick);
	const fadeMs = reduced ? 0 : TALLY_FADE_MS;
	return (
		<button
			type="button"
			role="checkbox"
			aria-checked={on}
			aria-label={ariaLabel}
			aria-labelledby={ariaLabel || !label ? undefined : labelId}
			disabled={disabled}
			data-slot="tally-check"
			data-state={on ? "checked" : "unchecked"}
			className={cn("group inline-flex items-center gap-3 rounded-md text-left outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className)}
			onClick={toggle}
			onPointerDown={() => setPressed(true)}
			onPointerUp={() => setPressed(false)}
			onPointerLeave={() => setPressed(false)}
			onPointerCancel={() => setPressed(false)}
		>
			<span
				aria-hidden
				className="relative inline-flex shrink-0 items-center justify-center overflow-hidden border"
				style={{
					width: boxSize + PX,
					height: boxSize + PX,
					borderRadius: boxRadius + PX,
					borderColor: toneVar(on ? fillTone : tone),
					transform: "scale(" + (pressed && !reduced ? PRESS_SCALE : 1) + PAREN_CLOSE,
					transition: transition("transform", reduced ? 0 : TALLY_PRESS_MS, SPEC_EASE_OUT),
				}}
			>
				<span className="absolute inset-0" style={{ backgroundColor: toneVar(fillTone), transform: "scale(" + Math.max(0, fill) + PAREN_CLOSE, borderRadius: boxRadius + PX }} />
				<svg viewBox={VIEWBOX} className="relative size-[70%]" fill="none">
					<path
						d={TICK_PATH}
						pathLength={1}
						stroke={toneVar(checkTone)}
						strokeWidth={TICK_STROKE}
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeDasharray="1 1"
						strokeDashoffset={1 - dash}
						opacity={dash > 0 ? 1 : 0}
					/>
				</svg>
			</span>
			{label ? (
				<span
					id={labelId}
					className="relative select-none"
					style={{ fontSize: fontSize + PX, color: toneVar(tone), opacity: on ? doneOpacity : 1, transition: transition("opacity", fadeMs) }}
				>
					{label}
					{strike === "none" ? null : (
						<span
							aria-hidden
							className="pointer-events-none absolute inset-x-0 top-1/2 h-px"
							style={{ backgroundColor: toneVar(tone), transform: "scaleX(" + clamp01(rule) + PAREN_CLOSE, transformOrigin: strike }}
						/>
					)}
				</span>
			) : null}
		</button>
	);
}
