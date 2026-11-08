"use client";

/** 行为规格参照 catalog/micro.md 的 RubberSegment 条目 (仅作出处说明, 实现为 HX 自写). */
import { useEffect, useLayoutEffect, useReducer, useRef, useState, type JSX, type KeyboardEvent } from "react";
import { PRESS_SCALE } from "../../../craft/tokens";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { SpringDriver } from "../../../motion/drive/driver";
import { stepSpringExact } from "../../../motion/spring/step";
import { PROP_COLOR, PROP_OPACITY, PROP_TRANSFORM, PX, SPEC_EASE_OUT, toneVar, transition, type ChoiceTone } from "../tone";
import { elasticUiSpring, glideEdges, type ElasticEdges } from "./parts/elastic-edges";
import { ELASTIC_MS, ELASTIC_SIZES, elasticThumbBox, type ElasticItem, type ElasticSize, type ElasticSlot } from "./parts/elastic-spec";
import { useElasticDrag } from "./parts/use-elastic-drag";

export { ELASTIC_DEADZONE, ELASTIC_DILATE, ELASTIC_FLICK, ELASTIC_HANDOFF, ELASTIC_MAX_VELOCITY, ELASTIC_MS, ELASTIC_RUBBER, ELASTIC_SLOP, ELASTIC_SPRING_MOMENTUM, ELASTIC_SPRING_RELAX, ELASTIC_SPRING_UI, elasticRelease, elasticRubber, elasticTime, type ElasticItem, type ElasticSize } from "./parts/elastic-spec";

const RADIUS = 10;
const HALF = 2;
const BACK = -1;

export interface ElasticSegmentProps {
	readonly items: readonly ElasticItem[];
	readonly value?: string;
	readonly defaultValue?: string;
	readonly onChange?: (value: string) => void;
	readonly trackTone?: ChoiceTone;
	readonly thumbTone?: ChoiceTone;
	readonly textTone?: ChoiceTone;
	readonly activeTextTone?: ChoiceTone;
	readonly size?: ElasticSize;
	readonly radius?: number;
	readonly inset?: number;
	readonly equalSlots?: boolean;
	/** 尾边延迟与拉伸上限的百分比, 0 为整块平移. */
	readonly stretch?: number;
	/** 尾边落定时反向压过目标的像素. */
	readonly squash?: number;
	readonly speed?: number;
	/** 尾边继承头边速度的百分比. */
	readonly glide?: number;
	readonly draggable?: boolean;
	readonly disabled?: boolean;
	readonly ariaLabel?: string;
	readonly className?: string;
}

/**
 * 橡皮分段: 拇指的头边先走, 尾边晚一拍并带着头边的部分速度追上, 落定时压一下再回弹.
 * 可拖动, 越界有阻尼, 甩动按速度跳到下一档.
 */
export function ElasticSegment({
	items,
	value,
	defaultValue,
	onChange,
	trackTone = "muted",
	thumbTone = "background",
	textTone = "muted-foreground",
	activeTextTone = "foreground",
	size = "md",
	radius = RADIUS,
	inset = 3,
	equalSlots = true,
	stretch = 100,
	squash = 3,
	speed = 1,
	glide = 75,
	draggable = true,
	disabled = false,
	ariaLabel,
	className,
}: ElasticSegmentProps): JSX.Element {
	const reduced = useReducedMotion();
	const [inner, setInner] = useState(defaultValue ?? items[0]?.value);
	const current = value ?? inner;
	const index = Math.max(0, items.findIndex((item) => item.value === current));
	const [height, fontSize, padX] = ELASTIC_SIZES[size];
	const [, redraw] = useReducer((n: number) => n + 1, 0);
	const edges = useRef<ElasticEdges | null>(null);
	if (!edges.current) edges.current = { left: new SpringDriver(0, redraw, stepSpringExact), right: new SpringDriver(0, redraw, stepSpringExact) };
	const track = useRef<HTMLDivElement>(null);
	const refs = useRef<Array<HTMLButtonElement | null>>([]);
	const placed = useRef(false);
	const flickVelocity = useRef<number | null>(null);

	useEffect(() => {
		const e = edges.current;
		return () => {
			e?.left.stop();
			e?.right.stop();
		};
	}, []);

	const slot = (i: number): ElasticSlot => {
		const node = refs.current[i];
		return node ? { left: node.offsetLeft, right: node.offsetLeft + node.offsetWidth } : { left: 0, right: 0 };
	};

	useLayoutEffect(() => {
		const e = edges.current;
		if (!e) return;
		const to = slot(index);
		const velocity = flickVelocity.current;
		flickVelocity.current = null;
		if (!placed.current || reduced) {
			placed.current = to.right > 0;
			e.left.jump(to.left);
			e.right.jump(to.right);
			return;
		}
		glideEdges(e, to, { velocity, speed, stretch, squash, glide });
		// value 是唯一驱动, 量的是最新布局
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [index, reduced, size, equalSlots, items.length]);

	const select = (i: number, velocity: number | null = null): void => {
		const item = items[i];
		if (!item || item.disabled || disabled) return;
		flickVelocity.current = velocity;
		if (value === undefined) setInner(item.value);
		if (item.value !== current) onChange?.(item.value);
		else if (velocity !== null || dragging.current) {
			flickVelocity.current = null;
			const e = edges.current;
			const to = slot(i);
			const spec = elasticUiSpring(speed);
			e?.left.to(to.left, spec);
			e?.right.to(to.right, spec);
		}
	};

	const nearest = (centre: number): number => {
		let best = index;
		let distance = Infinity;
		items.forEach((item, i) => {
			if (item.disabled) return;
			const s = slot(i);
			const d = Math.abs((s.left + s.right) / HALF - centre);
			if (d < distance) {
				best = i;
				distance = d;
			}
		});
		return best;
	};

	const { pressed, dragging, swallowClick, onPointerDown, onPointerMove, endDrag } = useElasticDrag({
		edges,
		track,
		enabled: draggable && !disabled,
		count: items.length,
		index,
		slot,
		nearest,
		select,
	});

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		if (disabled) return;
		let step = 0;
		if (event.key === "ArrowRight" || event.key === "ArrowDown") step = 1;
		else if (event.key === "ArrowLeft" || event.key === "ArrowUp") step = BACK;
		else return;
		event.preventDefault();
		for (let i = 1; i <= items.length; i += 1) {
			const next = (index + step * i + items.length * i) % items.length;
			if (!items[next]?.disabled) {
				select(next);
				refs.current[next]?.focus();
				return;
			}
		}
	};

	const e = edges.current;
	const trackWidth = track.current?.clientWidth ?? 0;
	const { left, width } = elasticThumbBox(e.left.value, e.right.value, slot(index).right - slot(index).left, trackWidth, stretch);
	const labelMs = reduced ? 0 : ELASTIC_MS.label;

	return (
		<div
			ref={track}
			role="radiogroup"
			aria-label={ariaLabel}
			aria-disabled={disabled || undefined}
			data-slot="elastic-segment"
			onKeyDown={onKeyDown}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={() => endDrag(false)}
			onPointerCancel={() => endDrag(true)}
			className={cn(equalSlots ? "inline-grid grid-flow-col auto-cols-fr" : "inline-flex", "relative touch-none select-none items-center border border-border", disabled && "opacity-50", className)}
			style={{ padding: inset + PX, borderRadius: radius + PX, backgroundColor: toneVar(trackTone) }}
		>
			<span
				aria-hidden
				className="pointer-events-none absolute left-0 border border-border"
				style={{
					top: inset + PX,
					height: height + PX,
					width: Math.max(0, width) + PX,
					transform: "translateX(" + left + PX + ") scale(" + (pressed && !reduced ? PRESS_SCALE : 1) + ")",
					borderRadius: Math.max(0, radius - inset) + PX,
					backgroundColor: toneVar(thumbTone),
				}}
			/>
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
						onClick={() => {
							if (swallowClick.current) {
								swallowClick.current = false;
								return;
							}
							select(i);
						}}
						className="relative z-[1] whitespace-nowrap font-medium outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
						style={{
							height: height + PX,
							paddingInline: padX + PX,
							fontSize: fontSize + PX,
							borderRadius: Math.max(0, radius - inset) + PX,
							color: toneVar(active ? activeTextTone : textTone),
							transition: [transition(PROP_OPACITY, labelMs), transition(PROP_TRANSFORM, labelMs, SPEC_EASE_OUT), transition(PROP_COLOR, labelMs)].join(", "),
						}}
					>
						{item.label}
					</button>
				);
			})}
		</div>
	);
}
