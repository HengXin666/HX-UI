// 行为规格参照 docs/research/catalog/components-1.md 的 ElasticSlider 条目, 实现为 HX 自有.
// 两端带图标的滑杆: 拖过两端时轨道像橡皮筋被拉长, 松手弹回; 悬停或拖动时轨道变粗变实.
"use client";

import { Volume1Icon, Volume2Icon } from "lucide-react";
import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { FOCUS_RING } from "../../../craft/tokens";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { stepSpringExact } from "../../../motion/spring/step";
import { snap } from "../math";
import { DURATION_VAR, RANGE_DT_CAP_MS, RANGE_EASE } from "../tokens";
import { keyStep } from "./keys";
import { STRETCH_FULL_RADIUS, focusVisible, type StretchSliderProps } from "./parts/stretch-props";
import { useWheelStep } from "./parts/use-wheel-step";
import { STRETCH_ICON_POP, fillSpan, mix, ratioOf, readAxis, rubberBand, stretchScale, stretchSprings, tickRatios } from "./parts/stretch-track";

const PCT = 100;
export type { StretchSliderProps };
export function StretchSlider({
	value,
	defaultValue = 50,
	min = 0,
	max = 100,
	stepped = false,
	step = 1,
	onChange,
	onChangeEnd,
	orientation = "horizontal",
	startIcon = <Volume1Icon aria-hidden className="size-5" />,
	endIcon = <Volume2Icon aria-hidden className="size-5" />,
	valuePosition = "top",
	formatValue = (v) => String(Math.round(v)),
	ticks = false,
	thumb = false,
	fillFrom,
	thickness = 6,
	activeThickness = 12,
	radius = STRETCH_FULL_RADIUS,
	restOpacity = 0.7,
	growOnHover = true,
	maxStretch = 50,
	bounce = 0.5,
	disabled = false,
	ariaLabel = "Value",
	className,
}: StretchSliderProps): JSX.Element {
	const reduced = useReducedMotion();
	const vertical = orientation === "vertical";
	const [inner, setInner] = useState(() => snap(defaultValue, min, max, stepped ? step : 0));
	const current = value ?? inner;
	const [hover, setHover] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [focused, setFocused] = useState(false);
	const hitRef = useRef<HTMLDivElement>(null);
	const bodyRef = useRef<HTMLDivElement>(null);
	const fillRef = useRef<HTMLDivElement>(null);
	const thumbRef = useRef<HTMLSpanElement>(null);
	const iconRefs = useRef<Array<HTMLSpanElement | null>>([null, null]);
	const sim = useRef({ p: { x: ratioOf(current, min, max), v: 0 }, s: { x: 0, v: 0 }, a: { x: 0, v: 0 }, pull: 0 });
	const latest = useRef(current);
	latest.current = current;
	const loop = useFrameLoop();
	const springs = stretchSprings(bounce);
	const origin = fillFrom === undefined ? undefined : ratioOf(fillFrom, min, max);
	const engaged = dragging || focused || (hover && growOnHover);

	const paint = (): void => {
		const { p, s, a } = sim.current;
		const length = (vertical ? hitRef.current?.clientHeight : hitRef.current?.clientWidth) ?? 0;
		const scale = stretchScale(s.x, length, maxStretch);
		const body = bodyRef.current;
		if (body) {
			const size = `${mix(thickness, activeThickness, a.x)}px`;
			body.style[vertical ? "width" : "height"] = size;
			body.style.opacity = String(mix(restOpacity, 1, a.x));
			const lowEnd = s.x < 0;
			body.style.transformOrigin = vertical ? (lowEnd ? "top" : "bottom") : lowEnd ? "right" : "left";
			body.style.transform = vertical ? `scale(${scale.across}, ${scale.along})` : `scale(${scale.along}, ${scale.across})`;
		}
		const [lo, hi] = fillSpan(p.x, origin);
		const fill = fillRef.current;
		if (fill) {
			fill.style[vertical ? "bottom" : "left"] = `${lo * PCT}%`;
			fill.style[vertical ? "height" : "width"] = `${(hi - lo) * PCT}%`;
		}
		if (thumbRef.current) thumbRef.current.style[vertical ? "bottom" : "left"] = `${p.x * PCT}%`;
		iconRefs.current.forEach((icon, side) => {
			if (!icon) return;
			const pulled = side === 0 ? Math.min(0, s.x) : Math.max(0, s.x);
			const shift = vertical ? `translateY(${-pulled}px)` : `translateX(${pulled}px)`;
			icon.style.transform = `${shift} scale(${1 + (STRETCH_ICON_POP * Math.abs(pulled)) / Math.max(1, maxStretch)})`;
		});
	};

	const run = (): void => {
		const target = ratioOf(latest.current, min, max);
		const st = sim.current;
		const goal = engaged ? 1 : 0;
		if (reduced) {
			loop.stop();
			sim.current = { p: { x: target, v: 0 }, s: { x: 0, v: 0 }, a: { x: goal, v: 0 }, pull: 0 };
			paint();
			return;
		}
		loop.start((dt) => {
			const step1 = (o: { x: number; v: number }, to: number, spec: typeof springs.fill) => {
				const r = stepSpringExact(o.x, o.v, to, spec, dt, RANGE_DT_CAP_MS);
				o.x = r.current;
				o.v = r.velocity;
				return r.resting;
			};
			let rest = step1(st.a, goal, springs.active);
			if (dragging) {
				st.p = { x: ratioOf(latest.current, min, max), v: 0 };
				st.s = { x: st.pull, v: 0 };
			} else {
				rest = step1(st.p, ratioOf(latest.current, min, max), springs.fill) && rest;
				rest = step1(st.s, 0, springs.recoil) && rest;
			}
			paint();
			return dragging || !rest;
		});
	};

	useEffect(run, [current, engaged, dragging, reduced, vertical, thickness, activeThickness, restOpacity, maxStretch, bounce, min, max, origin]);

	const commit = (raw: number): number => {
		const next = snap(raw, min, max, stepped ? step : 0);
		if (next !== latest.current) {
			latest.current = next;
			if (value === undefined) setInner(next);
			onChange?.(next);
		}
		return next;
	};

	useWheelStep(hitRef, disabled, (direction) => {
		// 先 commit 再回调: 写成 onChangeEnd?.(commit(...)) 时, 没传 onChangeEnd 会连 commit 一起短路掉.
		const next = commit(latest.current + direction * step);
		onChangeEnd?.(next);
	});

	const fromPointer = (event: PointerEvent<HTMLDivElement>): void => {
		const rect = event.currentTarget.getBoundingClientRect();
		const reading = vertical ? readAxis(event.clientY, rect.top, rect.height, true) : readAxis(event.clientX, rect.left, rect.width, false);
		sim.current.pull = reduced ? 0 : rubberBand(reading.overflow, maxStretch);
		commit(min + reading.ratio * (max - min));
		if (!reduced) loop.wake();
	};

	const release = (): void => {
		if (!dragging) return;
		setDragging(false);
		sim.current.pull = 0;
		onChangeEnd?.(latest.current);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		if (disabled) return;
		const next = keyStep(event.key, latest.current, min, max, step);
		if (next === undefined) return;
		event.preventDefault();
		commit(next);
	};

	const label = formatValue(current);
	const tickList = stepped && ticks ? tickRatios(min, max, step) : [];
	const output = <output className="text-xs font-medium tabular-nums text-muted-foreground">{label}</output>;
	const icon = (node: ReactNode, side: 0 | 1) =>
		node === null ? null : (
			<span aria-hidden ref={(el) => { iconRefs.current[side] = el; }} className="inline-flex shrink-0 text-muted-foreground">
				{node}
			</span>
		);
	const fillPos = vertical ? "inset-x-0" : "inset-y-0";

	return (
		<div data-slot="stretch-slider" data-orientation={orientation} className={cn("inline-flex flex-col items-center gap-2", vertical ? "h-48" : "w-full", className)}>
			{valuePosition === "top" ? output : null}
			<div className={cn("flex items-center gap-3", vertical ? "h-full flex-col-reverse" : "w-full")}>
				{icon(startIcon, 0)}
				<div
					ref={hitRef}
					role="slider"
					tabIndex={disabled ? -1 : 0}
					aria-label={ariaLabel}
					aria-orientation={orientation}
					aria-valuemin={min}
					aria-valuemax={max}
					aria-valuenow={current}
					aria-valuetext={label}
					aria-disabled={disabled || undefined}
					data-active={engaged || undefined}
					onKeyDown={onKeyDown}
					onKeyUp={(event) => {
						if (!disabled && keyStep(event.key, latest.current, min, max, step) !== undefined) onChangeEnd?.(latest.current);
					}}
					onFocus={(event) => setFocused(focusVisible(event.currentTarget))}
					onBlur={() => setFocused(false)}
					onPointerEnter={() => setHover(true)}
					onPointerLeave={() => setHover(false)}
					onPointerDown={(event) => {
						if (disabled || event.button !== 0) return;
						event.currentTarget.setPointerCapture?.(event.pointerId);
						setDragging(true);
						fromPointer(event);
					}}
					onPointerMove={(event) => {
						if (dragging) fromPointer(event);
					}}
					onPointerUp={release}
					onPointerCancel={release}
					className={cn(
						"relative flex flex-1 cursor-pointer touch-none select-none items-center justify-center rounded-full aria-disabled:cursor-not-allowed aria-disabled:opacity-45",
						FOCUS_RING,
						vertical ? "w-6 self-stretch" : "h-6 w-full",
					)}
				>
					<div ref={bodyRef} className={cn("relative overflow-hidden bg-input", vertical ? "h-full" : "w-full")} style={{ borderRadius: radius, [vertical ? "width" : "height"]: thickness, opacity: restOpacity }}>
						<div ref={fillRef} className={cn("absolute bg-foreground", fillPos)} />
						{tickList.map((t) => (
							<span key={t} aria-hidden className={cn("absolute bg-background/40", vertical ? "inset-x-0 h-px" : "inset-y-0 w-px")} style={{ [vertical ? "bottom" : "left"]: `${t * PCT}%` }} />
						))}
					</div>
					{thumb ? (
						<span
							ref={thumbRef}
							aria-hidden
							className={cn("pointer-events-none absolute size-4", vertical ? "left-1/2 -translate-x-1/2 translate-y-1/2" : "top-1/2 -translate-x-1/2 -translate-y-1/2")}
						>
							<span
								className={cn("block size-full rounded-full border border-border bg-background", dragging && "scale-[0.92]")}
								style={{ transitionProperty: "transform", transitionDuration: reduced ? "0ms" : DURATION_VAR.fast, transitionTimingFunction: RANGE_EASE.out }}
							/>
						</span>
					) : null}
				</div>
				{icon(endIcon, 1)}
			</div>
			{valuePosition === "bottom" ? output : null}
		</div>
	);
}
