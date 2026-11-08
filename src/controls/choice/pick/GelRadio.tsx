"use client";

/** 行为规格参照 catalog/micro.md 的 JellyRadio 条目 (仅作出处说明, 实现为 HX 自写). */
import { useEffect, useLayoutEffect, useReducer, useRef, useState, type JSX, type KeyboardEvent } from "react";
import { PRESS_SCALE } from "../../../craft/tokens";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import type { SpringSpec } from "../../../craft/spring";
import { SpringDriver } from "../../../motion/drive/driver";
import { springFromStiffness } from "../../../motion/spring/fit";
import { stepSpringExact } from "../../../motion/spring/step";
import { PROP_BACKGROUND, PROP_COLOR, PROP_OPACITY, PROP_TRANSFORM, PX, SPEC_EASE_OUT, toneVar, transition, type ChoiceTone } from "../tone";

/** 尺寸档: [高, 字号, 横向内边距]. */
export const GEL_SIZES = { sm: [28, 12, 12], md: [36, 13, 16], lg: [44, 14, 20] } as const;
/** 每跨一项, 起步延后 22ms. */
export const GEL_STAGGER_MS = 22;
export const GEL_STIFFNESS = 580;
/** 规格未给 bounce 默认值, 取 0.2. */
export const GEL_BOUNCE = 0.2;
/** 位置弹簧的质量 0.9; 层 j 的质量减 0.1j, 竖向缩放质量加 0.05j. */
export const GEL_MASS = 0.9;
/** 跨得越远刚度越软: 每跨一项减 12%, 最多算 3 项. */
export const GEL_FAR_SOFTEN = 0.12;
export const GEL_FAR_CAP = 3;
/** 层 j 的位置刚度 x (1 + 0.24j), 回弹 + 0.3j 且不超过 0.85; 竖向缩放刚度 x (1 - 0.14j), 起步再晚 0.05j 秒. */
export const GEL_LAYER = { stiffen: 0.24, massStep: 0.1, bounceStep: 0.3, bounceCap: 0.85, squashSoften: 0.14, squashMassStep: 0.05, squashDelayS: 0.05 } as const;
/** 规格只给了竖向缩放的弹簧, 没给目标; 这里每跨一项压扁 6%, 落定后回到 1. */
const SQUASH_PER_STEP = 0.06;
/** 规格里的 CSS 过渡. */
export const GEL_MS = { press: 160, color: 200, focus: 160 } as const;
const LAYERS = [0, 1, 2] as const;
const LAYER_ALPHA = [1, 0.35, 0.18] as const;
const MS_PER_S = 1000;
const BACK = -1;

export type GelSize = keyof typeof GEL_SIZES;

export interface GelItem {
	readonly value: string;
	readonly label: string;
	readonly disabled?: boolean;
}

/** 一次跨 far 项的三层弹簧与起步延迟 (秒). inFlight 时不再错峰. */
export function gelPlan(far: number, stiffness: number, bounce: number, stagger: number, inFlight: boolean): {
	readonly delayS: number;
	readonly layers: ReadonlyArray<{ x: SpringSpec; squash: SpringSpec; squashDelayS: number }>;
} {
	const k = stiffness * (1 - GEL_FAR_SOFTEN * Math.min(far, GEL_FAR_CAP));
	const delayS = inFlight ? 0 : (far * stagger) / MS_PER_S;
	return {
		delayS,
		layers: LAYERS.map((j) => ({
			x: springFromStiffness(k * (1 + GEL_LAYER.stiffen * j), Math.min(GEL_LAYER.bounceCap, bounce + GEL_LAYER.bounceStep * j), { mass: GEL_MASS - GEL_LAYER.massStep * j }),
			squash: springFromStiffness(k * (1 - GEL_LAYER.squashSoften * j), bounce, { mass: GEL_MASS + GEL_LAYER.squashMassStep * j }),
			squashDelayS: delayS + GEL_LAYER.squashDelayS * j,
		})),
	};
}

interface Layer {
	readonly x: SpringDriver;
	readonly w: SpringDriver;
	readonly sy: SpringDriver;
}

export interface GelRadioProps {
	readonly items: readonly GelItem[];
	readonly value?: string;
	readonly defaultValue?: string;
	readonly onChange?: (value: string) => void;
	readonly size?: GelSize;
	readonly stagger?: number;
	readonly stiffness?: number;
	readonly bounce?: number;
	readonly tone?: ChoiceTone;
	readonly textTone?: ChoiceTone;
	readonly activeTextTone?: ChoiceTone;
	readonly disabled?: boolean;
	readonly ariaLabel?: string;
	readonly className?: string;
}

/**
 * 果冻单选: 选中块由三层叠成, 每层刚度, 质量和回弹不同, 跨得越远越软, 拖出一条果冻尾巴.
 * 方向键漫游即选中; 中途再选时从当前位置和速度接上.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-choice.md
 */
export function GelRadio({
	items,
	value,
	defaultValue,
	onChange,
	size = "md",
	stagger = GEL_STAGGER_MS,
	stiffness = GEL_STIFFNESS,
	bounce = GEL_BOUNCE,
	tone = "primary",
	textTone = "muted-foreground",
	activeTextTone = "primary-foreground",
	disabled = false,
	ariaLabel,
	className,
}: GelRadioProps): JSX.Element {
	const reduced = useReducedMotion();
	const [inner, setInner] = useState(defaultValue ?? items[0]?.value);
	const current = value ?? inner;
	const index = Math.max(0, items.findIndex((item) => item.value === current));
	const [height, fontSize, padX] = GEL_SIZES[size];
	const [, redraw] = useReducer((n: number) => n + 1, 0);
	const layers = useRef<Layer[] | null>(null);
	if (!layers.current) layers.current = LAYERS.map(() => ({ x: new SpringDriver(0, redraw, stepSpringExact), w: new SpringDriver(0, redraw, stepSpringExact), sy: new SpringDriver(1, redraw, stepSpringExact) }));
	const refs = useRef<Array<HTMLButtonElement | null>>([]);
	const previous = useRef<number | null>(null);
	const [pressed, setPressed] = useState<number | null>(null);

	useEffect(() => {
		const all = layers.current;
		return () => all?.forEach((layer) => [layer.x, layer.w, layer.sy].forEach((driver) => driver.stop()));
	}, []);

	useLayoutEffect(() => {
		const node = refs.current[index];
		const all = layers.current;
		if (!node || !all) return;
		const x = node.offsetLeft;
		const w = node.offsetWidth;
		const from = previous.current;
		previous.current = index;
		if (from === null || reduced) {
			all.forEach((layer) => {
				layer.x.jump(x);
				layer.w.jump(w);
				layer.sy.jump(1);
			});
			return;
		}
		const far = Math.abs(index - from);
		const inFlight = all.some((layer) => layer.x.moving);
		const plan = gelPlan(far, stiffness, bounce, stagger, inFlight);
		const squash = 1 - SQUASH_PER_STEP * Math.min(far, GEL_FAR_CAP);
		all.forEach((layer, j) => {
			const spec = plan.layers[j];
			const delayMs = plan.delayS * MS_PER_S;
			layer.x.to(x, spec.x, { delayMs });
			layer.w.to(w, spec.x, { delayMs });
			layer.sy.to(squash, spec.squash, { delayMs: spec.squashDelayS * MS_PER_S, onRest: () => layer.sy.to(1, spec.squash) });
		});
	}, [index, reduced, stiffness, bounce, stagger, size, items.length]);

	const select = (next: number): void => {
		const item = items[next];
		if (!item || item.disabled || disabled) return;
		if (value === undefined) setInner(item.value);
		if (item.value !== current) onChange?.(item.value);
	};

	const move = (from: number, step: number): void => {
		for (let i = 1; i <= items.length; i += 1) {
			const next = (from + step * i + items.length * i) % items.length;
			if (!items[next]?.disabled) {
				select(next);
				refs.current[next]?.focus();
				return;
			}
		}
	};

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		if (disabled) return;
		if (event.key === "ArrowRight" || event.key === "ArrowDown") move(index, 1);
		else if (event.key === "ArrowLeft" || event.key === "ArrowUp") move(index, BACK);
		else if (event.key === "Home") move(items.length - 1, 1);
		else if (event.key === "End") move(0, BACK);
		else return;
		event.preventDefault();
	};

	const colorMs = reduced ? 0 : GEL_MS.color;
	return (
		<div
			role="radiogroup"
			aria-label={ariaLabel}
			aria-disabled={disabled || undefined}
			data-slot="gel-radio"
			onKeyDown={onKeyDown}
			className={cn("relative inline-flex items-center gap-1 rounded-full border border-border bg-muted p-1", disabled && "opacity-50", className)}
		>
			{[...LAYERS].reverse().map((j) => {
				const layer = layers.current?.[j];
				if (!layer) return null;
				return (
					<span
						key={j}
						aria-hidden
						className="pointer-events-none absolute left-0 top-1 rounded-full"
						style={{
							width: Math.max(0, layer.w.value) + PX,
							height: height + PX,
							opacity: LAYER_ALPHA[j],
							backgroundColor: toneVar(tone),
							transform: "translateX(" + layer.x.value + PX + ") scaleY(" + layer.sy.value + ")",
						}}
					/>
				);
			})}
			{items.map((item, i) => {
				const active = i === index;
				return (
					<button
						key={item.value}
						ref={(node) => {
							refs.current[i] = node;
						}}
						type="button"
						role="radio"
						aria-checked={active}
						tabIndex={active && !disabled ? 0 : BACK}
						disabled={disabled || item.disabled}
						className="relative z-[1] whitespace-nowrap rounded-full font-medium outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
						style={{
							height: height + PX,
							paddingInline: padX + PX,
							fontSize: fontSize + PX,
							color: toneVar(active ? activeTextTone : textTone),
							transform: "scale(" + (pressed === i && !reduced ? PRESS_SCALE : 1) + ")",
							transition: [
								transition(PROP_TRANSFORM, reduced ? 0 : GEL_MS.press, SPEC_EASE_OUT),
								transition(PROP_BACKGROUND, colorMs),
								transition(PROP_COLOR, colorMs),
								transition(PROP_OPACITY, GEL_MS.focus),
							].join(", "),
						}}
						onClick={() => select(i)}
						onPointerDown={() => setPressed(i)}
						onPointerUp={() => setPressed(null)}
						onPointerLeave={() => setPressed(null)}
						onPointerCancel={() => setPressed(null)}
					>
						{item.label}
					</button>
				);
			})}
		</div>
	);
}
