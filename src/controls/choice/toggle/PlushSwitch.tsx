"use client";

/** 行为规格参照 catalog/micro.md 的 SquishSwitch 条目 (仅作出处说明, 实现为 HX 自写). */
import { useEffect, useId, useRef, useState, type JSX, type PointerEvent } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { SpringDriver } from "../physics";
import { PX, toneVar, transition, type ChoiceTone } from "../tone";
import { PLUSH_FLOW_SPRING, PLUSH_STRETCH_SPEED, PLUSH_SWELL_SPRING, PLUSH_TAP_SLOP, PLUSH_THUMB_INSET, plushPositionSpring, plushStretchFor, plushThumbBox, plushTrack } from "./parts/plush-physics";

export { PLUSH_FLOW_SPRING, PLUSH_MAX_STRETCH, PLUSH_STRETCH_SPEED, PLUSH_SWELL_SPRING, PLUSH_TAP_SLOP, plushPositionSpring, plushStretchFor } from "./parts/plush-physics";

/** 减弱动效时颜色过渡缩到 1ms, 等于直接换色但保留 transitionend. */
const REDUCED_MS = 1;
const HALF = 2;
const TOUCH = "touch";

export interface PlushSwitchProps {
	readonly checked?: boolean;
	readonly defaultChecked?: boolean;
	readonly onChange?: (checked: boolean) => void;
	readonly label?: string;
	readonly disabled?: boolean;
	readonly trackTone?: ChoiceTone;
	readonly trackOnTone?: ChoiceTone;
	readonly thumbTone?: ChoiceTone;
	readonly thumbOnTone?: ChoiceTone;
	readonly width?: number;
	readonly height?: number;
	readonly radius?: number;
	/** 0 到 100, 越大位置弹簧越硬. */
	readonly speed?: number;
	/** 满速时拇指拉长的百分比. */
	readonly stretch?: number;
	readonly hoverScale?: number;
	readonly colorDuration?: number;
	readonly ariaLabel?: string;
	readonly className?: string;
	readonly id?: string;
}

interface Drag {
	readonly pointerX: number;
	readonly originX: number;
	readonly slop: number;
	lastX: number;
	lastT: number;
	velocity: number;
	dragging: boolean;
}

/**
 * 软胶开关: 拇指跟位置弹簧走, 移动越快拉得越长, 按下鼓起, 可拖动也可轻点.
 * 中途反向时位置和速度都保留, 不从端点重播.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-choice.md
 */
export function PlushSwitch({
	checked,
	defaultChecked = false,
	onChange,
	label = "",
	disabled = false,
	trackTone = "muted",
	trackOnTone = "primary",
	thumbTone = "background",
	thumbOnTone = "primary-foreground",
	width = 76,
	height = 38,
	radius = 19,
	speed = 50,
	stretch = 36,
	hoverScale = 1.035,
	colorDuration = 320,
	ariaLabel,
	className,
	id,
}: PlushSwitchProps): JSX.Element {
	const reduced = useReducedMotion();
	const labelId = useId();
	const [inner, setInner] = useState(defaultChecked);
	const on = checked ?? inner;
	const { thumb, travel } = plushTrack(width, height);
	const [x, setX] = useState(on ? travel : 0);
	const [stretched, setStretched] = useState(0);
	const [swell, setSwell] = useState(1);
	const [scale, setScale] = useState(1);
	const stretchRef = useRef(stretch);
	stretchRef.current = stretch;
	const drivers = useRef<{ x: SpringDriver; stretch: SpringDriver; swell: SpringDriver; scale: SpringDriver } | null>(null);
	if (!drivers.current) {
		const stretchDriver = new SpringDriver(0, setStretched);
		const xDriver: SpringDriver = new SpringDriver(x, (value) => {
			setX(value);
			stretchDriver.to(plushStretchFor(xDriver.velocity, stretchRef.current), PLUSH_FLOW_SPRING);
		});
		drivers.current = { x: xDriver, stretch: stretchDriver, swell: new SpringDriver(1, setSwell), scale: new SpringDriver(1, setScale) };
	}
	const drag = useRef<Drag | null>(null);
	const swallowClick = useRef(false);

	useEffect(() => {
		const d = drivers.current;
		return () => {
			if (!d) return;
			for (const driver of Object.values(d)) driver.stop();
		};
	}, []);

	useEffect(() => {
		const d = drivers.current;
		if (!d || drag.current?.dragging) return;
		const target = on ? travel : 0;
		if (reduced) d.x.jump(target);
		else d.x.to(target, plushPositionSpring(speed));
	}, [on, travel, reduced, speed]);

	const commit = (next: boolean): void => {
		if (checked === undefined) setInner(next);
		if (next !== on) onChange?.(next);
	};

	const settle = (next: boolean): void => {
		const d = drivers.current;
		if (!d) return;
		const target = next ? travel : 0;
		if (reduced) d.x.jump(target);
		else d.x.to(target, plushPositionSpring(speed));
	};

	const press = (down: boolean): void => {
		const d = drivers.current;
		if (!d) return;
		const target = down ? 1 + plushStretchFor(PLUSH_STRETCH_SPEED, stretch) : 1;
		if (reduced) d.swell.jump(1);
		else d.swell.to(target, PLUSH_SWELL_SPRING);
	};

	const hover = (inside: boolean): void => {
		const d = drivers.current;
		if (!d || disabled) return;
		if (reduced) d.scale.jump(1);
		else d.scale.to(inside ? hoverScale : 1, PLUSH_SWELL_SPRING);
	};

	const onPointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
		if (disabled || event.button !== 0) return;
		event.currentTarget.setPointerCapture?.(event.pointerId);
		const slop = event.pointerType === TOUCH ? PLUSH_TAP_SLOP.coarse : PLUSH_TAP_SLOP.fine;
		drag.current = { pointerX: event.clientX, originX: drivers.current?.x.value ?? 0, slop, lastX: event.clientX, lastT: event.timeStamp, velocity: 0, dragging: false };
		press(true);
	};

	const onPointerMove = (event: PointerEvent<HTMLButtonElement>): void => {
		const d = drivers.current;
		const g = drag.current;
		if (!d || !g) return;
		const dx = event.clientX - g.pointerX;
		if (!g.dragging && Math.abs(dx) < g.slop) return;
		g.dragging = true;
		const dt = event.timeStamp - g.lastT;
		if (dt > 0) g.velocity = ((event.clientX - g.lastX) / dt) * 1000;
		g.lastX = event.clientX;
		g.lastT = event.timeStamp;
		d.x.jump(Math.min(travel, Math.max(0, g.originX + dx)));
		d.x.velocity = g.velocity;
		if (reduced) return;
		d.stretch.to(plushStretchFor(g.velocity, stretch), PLUSH_FLOW_SPRING);
	};

	const onPointerUp = (): void => {
		const d = drivers.current;
		const g = drag.current;
		drag.current = null;
		press(false);
		if (!d || !g) return;
		swallowClick.current = true;
		const next = g.dragging ? d.x.value > travel / HALF : !on;
		commit(next);
		settle(next);
	};

	const onPointerCancel = (): void => {
		drag.current = null;
		press(false);
		settle(on);
	};

	const { left, width: thumbWidth } = plushThumbBox(x, stretched * swell, drivers.current?.x.velocity ?? 0, thumb, width);
	const colorMs = reduced ? REDUCED_MS : colorDuration;
	const trackColor = transition("background-color", colorMs);

	return (
		<span className={cn("inline-flex items-center gap-3", disabled && "cursor-not-allowed opacity-50", className)}>
			<button
				id={id}
				type="button"
				role="switch"
				aria-checked={on}
				aria-label={ariaLabel}
				aria-labelledby={ariaLabel || !label ? undefined : labelId}
				disabled={disabled}
				data-slot="plush-switch"
				data-state={on ? "checked" : "unchecked"}
				className="relative shrink-0 touch-none border border-border outline-none focus-visible:border-ring disabled:cursor-not-allowed"
				style={{
					width: width + PX,
					height: height + PX,
					borderRadius: radius + PX,
					backgroundColor: toneVar(on ? trackOnTone : trackTone),
					transition: trackColor,
					transform: "scale(" + scale + ")",
				}}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerCancel}
				onPointerEnter={() => hover(true)}
				onPointerLeave={() => hover(false)}
				onClick={() => {
					if (swallowClick.current) {
						swallowClick.current = false;
						return;
					}
					commit(!on);
				}}
			>
				<span
					aria-hidden
					data-slot="plush-switch-thumb"
					className="pointer-events-none absolute"
					style={{
						top: PLUSH_THUMB_INSET - 1 + PX,
						left: left - 1 + PX,
						width: thumbWidth + PX,
						height: thumb + PX,
						borderRadius: Math.max(0, radius - PLUSH_THUMB_INSET) + PX,
						backgroundColor: toneVar(on ? thumbOnTone : thumbTone),
						transition: trackColor,
					}}
				/>
			</button>
			{label ? (
				<span id={labelId} className="select-none text-sm text-foreground">
					{label}
				</span>
			) : null}
		</span>
	);
}
