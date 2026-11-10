"use client";

/** 行为规格参照 catalog/micro.md 的 PeekRating 条目 (仅作出处说明, 实现为 HX 自写). */
import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { PROP_COLOR, PROP_OPACITY, PROP_TRANSFORM, PX, SPEC_EASE_OUT, toneVar, transition, type ChoiceTone } from "../tone";
import { FOCUS_RING } from "../../../craft/tokens";

/** 选中时的弹跳: 300ms 内 1 到 popScale (35% 处) 再回 1, 两段都用规格 ease-out. */
export const LIFT_POP_MS = 300;
export const LIFT_POP_PEAK = 0.35;
/** 规格里的 CSS 过渡: 颜色 160ms, 提示 180ms 淡入淡出. */
export const LIFT_MS = { color: 160, tip: 180 } as const;
const VIEWBOX = "0 0 24 24";
const CENTRE = 12;
const STAR_POINTS = 5;
const STAR_OUTER = 10;
const STAR_INNER = 4.2;
const HEART_PATH = "M12 20.5s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.6a4.5 4.5 0 0 1 7.5 2.9c0 5.4-7.5 10-7.5 10z";
const CIRCLE_R = 8;
const BACK = -1;
const HALF = 2;
const DECIMALS = 2;

export type LiftShape = "star" | "heart" | "circle";

/** 五角星路径, 由外圈和内圈半径交替生成. */
export function starPath(points = STAR_POINTS, outer = STAR_OUTER, inner = STAR_INNER): string {
	const parts: string[] = [];
	for (let i = 0; i < points * HALF; i += 1) {
		const r = i % HALF === 0 ? outer : inner;
		const angle = (Math.PI / points) * i - Math.PI / HALF;
		parts.push((i === 0 ? "M" : "L") + (CENTRE + r * Math.cos(angle)).toFixed(DECIMALS) + " " + (CENTRE + r * Math.sin(angle)).toFixed(DECIMALS));
	}
	return parts.join("") + "Z";
}

/** 选中弹跳的关键帧. */
export function liftPopFrames(popScale: number): Keyframe[] {
	return [
		{ transform: "scale(1)", easing: SPEC_EASE_OUT },
		{ transform: "scale(" + popScale + ")", offset: LIFT_POP_PEAK, easing: SPEC_EASE_OUT },
		{ transform: "scale(1)" },
	];
}

const STAR = starPath();

function Glyph({ shape }: { readonly shape: LiftShape }): JSX.Element {
	return (
		<svg viewBox={VIEWBOX} className="size-full" fill="currentColor" aria-hidden>
			{shape === "circle" ? <circle cx={CENTRE} cy={CENTRE} r={CIRCLE_R} /> : <path d={shape === "heart" ? HEART_PATH : STAR} />}
		</svg>
	);
}

export interface LiftRatingProps {
	readonly value?: number;
	readonly defaultValue?: number;
	readonly onChange?: (value: number) => void;
	/** 悬停或聚焦预览的分值, 离开时回报当前值. */
	readonly onPreview?: (value: number) => void;
	readonly count?: number;
	readonly shape?: LiftShape;
	readonly icon?: ReactNode;
	/** 每档的提示文字, 缺省时显示数字. */
	readonly labels?: readonly string[];
	readonly activeTone?: ChoiceTone;
	readonly idleTone?: ChoiceTone;
	readonly tipTone?: ChoiceTone;
	readonly tipTextTone?: ChoiceTone;
	readonly size?: number;
	/** 悬停那颗抬起的像素. */
	readonly lift?: number;
	readonly magnify?: number;
	readonly riseDuration?: number;
	readonly popScale?: number;
	readonly showTip?: boolean;
	readonly allowClear?: boolean;
	readonly readOnly?: boolean;
	readonly disabled?: boolean;
	readonly ariaLabel?: string;
	readonly className?: string;
}

/**
 * 探头评分: 悬停的那颗抬起放大, 上方探出提示, 左侧同时点亮作预览; 选中时弹一下.
 * radiogroup + roving tabindex, 方向键移动即选中, Backspace / Delete 清零.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-choice.md
 */
export function LiftRating({
	value,
	defaultValue = 0,
	onChange,
	onPreview,
	count = 5,
	shape = "star",
	icon,
	labels = [],
	activeTone = "warning",
	idleTone = "muted-foreground",
	tipTone = "foreground",
	tipTextTone = "background",
	size = 28,
	lift = 6,
	magnify = 1.15,
	riseDuration = 320,
	popScale = 1.3,
	showTip = true,
	allowClear = true,
	readOnly = false,
	disabled = false,
	ariaLabel = "Rating",
	className,
}: LiftRatingProps): JSX.Element {
	const reduced = useReducedMotion();
	const [inner, setInner] = useState(defaultValue);
	const current = value ?? inner;
	const [peek, setPeek] = useState<number | null>(null);
	const refs = useRef<Array<HTMLButtonElement | null>>([]);
	const glyphs = useRef<Array<HTMLSpanElement | null>>([]);
	const inert = readOnly || disabled;

	useEffect(() => {
		const reset = (): void => setPeek(null);
		const hidden = (): void => {
			if (document.visibilityState === "hidden") reset();
		};
		window.addEventListener("blur", reset);
		document.addEventListener("visibilitychange", hidden);
		return () => {
			window.removeEventListener("blur", reset);
			document.removeEventListener("visibilitychange", hidden);
		};
	}, []);

	const preview = (next: number | null): void => {
		setPeek(next);
		onPreview?.(next ?? current);
	};

	const commit = (next: number): void => {
		if (value === undefined) setInner(next);
		onChange?.(next);
		if (next > 0 && !reduced) glyphs.current[next - 1]?.animate?.(liftPopFrames(popScale), { duration: LIFT_POP_MS });
	};

	const pick = (star: number): void => {
		if (inert) return;
		commit(allowClear && star === current ? 0 : star);
	};

	const moveTo = (star: number): void => {
		const clamped = Math.min(count, Math.max(1, star));
		commit(clamped);
		refs.current[clamped - 1]?.focus();
	};

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		if (inert) return;
		const key = event.key;
		if (key === "ArrowRight" || key === "ArrowUp") moveTo(current + 1);
		else if (key === "ArrowLeft" || key === "ArrowDown") moveTo(current + BACK);
		else if (key === "Home") moveTo(1);
		else if (key === "End") moveTo(count);
		else if (allowClear && (key === "Backspace" || key === "Delete")) commit(0);
		else return;
		event.preventDefault();
	};

	const shown = peek ?? current;
	const tabStop = current > 0 ? current : 1;
	const riseMs = reduced ? 0 : riseDuration;
	const colorMs = reduced ? 0 : LIFT_MS.color;

	return (
		<div
			role="radiogroup"
			aria-label={ariaLabel}
			aria-readonly={readOnly || undefined}
			aria-disabled={disabled || undefined}
			data-slot="lift-rating"
			onKeyDown={onKeyDown}
			onPointerLeave={() => preview(null)}
			className={cn("inline-flex items-end gap-1", disabled && "opacity-50", className)}
			style={{ paddingTop: lift + PX }}
		>
			{Array.from({ length: count }, (_, index) => {
				const star = index + 1;
				const lit = star <= shown;
				const peeking = peek === star;
				const tip = labels[index] ?? String(star);
				return (
					<button
						key={star}
						ref={(node) => {
							refs.current[index] = node;
						}}
						type="button"
						role="radio"
						aria-checked={star === current}
						aria-label={tip}
						tabIndex={star === tabStop && !disabled ? 0 : BACK}
						disabled={disabled}
						onClick={() => pick(star)}
						onPointerEnter={() => !inert && preview(star)}
						onFocus={() => !inert && preview(star)}
						onBlur={() => preview(null)}
						className={cn("relative rounded-sm", FOCUS_RING, inert ? "cursor-default" : "cursor-pointer")}
						style={{
							width: size + PX,
							height: size + PX,
							color: toneVar(lit ? activeTone : idleTone),
							transform: peeking && !reduced ? "translateY(" + -lift + PX + ") scale(" + magnify + ")" : "none",
							transition: [transition(PROP_TRANSFORM, riseMs, SPEC_EASE_OUT), transition(PROP_COLOR, colorMs)].join(", "),
						}}
					>
						<span
							ref={(node) => {
								glyphs.current[index] = node;
							}}
							className="block size-full"
						>
							{icon ?? <Glyph shape={shape} />}
						</span>
						{showTip ? (
							<span
								aria-hidden
								className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs"
								style={{ backgroundColor: toneVar(tipTone), color: toneVar(tipTextTone), opacity: peeking ? 1 : 0, transition: transition(PROP_OPACITY, LIFT_MS.tip) }}
							>
								{tip}
							</span>
						) : null}
					</button>
				);
			})}
		</div>
	);
}
