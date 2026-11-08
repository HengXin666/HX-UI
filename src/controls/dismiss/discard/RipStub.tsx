"use client";

// 行为规格参照 docs/research/catalog/micro.md 的 TearTicket 条目, 仅作出处说明; 实现与命名为 HX 自有.
import { useEffect, useRef, useState, type JSX, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { RIP } from "../tokens";
import { useFrameLoop } from "../use-frame";
import { RipPerforation } from "./parts/rip/RipPerforation";
import { jagged } from "./parts/rip/rip-shape";
import { freshRipSim, releaseStub, stepRipSim, type RipSim } from "./parts/rip/rip-sim";
import { useRipDrag } from "./parts/rip/use-rip-drag";

/** 本文件内重复出现的字面量, 只写一次. */
const TWO = 2;
const HEIGHT = "height";
const WIDTH = "width";
const HALF_OFFSET = 0.5;
const PERCENT = 100;

export type RipOrientation = "horizontal" | "vertical";

export interface RipStubProps {
	children?: ReactNode;
	stub?: ReactNode;
	image?: string;
	imageAlt?: string;
	scrim?: boolean;
	imageRadius?: number;
	orientation?: RipOrientation;
	torn?: boolean;
	defaultTorn?: boolean;
	onTear?: () => void;
	width?: number;
	height?: number;
	stubSize?: number;
	radius?: number;
	holes?: number;
	holeSize?: number;
	/** 撕口两端半圆缺口的直径, 以 holeSize 为单位. */
	notch?: number;
	/** 撕开边缘的锯齿幅度 0 到 1. */
	roughness?: number;
	tearAngle?: number;
	stretch?: number;
	resistance?: number;
	rotate?: number;
	tilt?: boolean;
	tiltMax?: number;
	tearLabel?: string;
	className?: string;
}

/** 带撕口的票: 拖动存根超过 stretch 撕下, 撕下后受重力落出; 未撕开松手则回弹并带动票身反冲. */
export function RipStub({
	children = null,
	stub = null,
	image = "",
	imageAlt = "",
	scrim = true,
	imageRadius = RIP.imageRadius,
	orientation = "horizontal",
	torn,
	defaultTorn = false,
	onTear,
	width = RIP.width,
	height = RIP.height,
	stubSize = RIP.stubSize,
	radius = RIP.radius,
	holes = RIP.holes,
	holeSize = RIP.holeSize,
	notch = RIP.notch,
	roughness = 0,
	tearAngle = RIP.tearAngle,
	stretch = RIP.stretch,
	resistance = RIP.resistance,
	rotate = RIP.rotate,
	tilt = true,
	tiltMax = RIP.tiltMax,
	tearLabel = "Tear off stub",
	className,
}: RipStubProps): JSX.Element {
	const reduced = useReducedMotion();
	const vertical = orientation === "vertical";
	const [innerTorn, setInnerTorn] = useState(defaultTorn);
	const [gone, setGone] = useState(defaultTorn);
	const isTorn = torn ?? innerTorn;
	const rootRef = useRef<HTMLDivElement>(null);
	const bodyRef = useRef<HTMLDivElement>(null);
	const stubRef = useRef<HTMLDivElement>(null);
	const sim = useRef<RipSim>(freshRipSim());

	const paint = (): void => {
		const s = sim.current;
		if (rootRef.current) rootRef.current.style.transform = `perspective(900px) rotateX(${s.tx.current}deg) rotateY(${s.ty.current}deg)`;
		if (bodyRef.current) bodyRef.current.style.transform = vertical ? `translate3d(0, ${s.bx}px, 0)` : `translate3d(${s.bx}px, 0, 0)`;
		if (stubRef.current) {
			const x = s.free ? s.x : s.sx;
			const y = s.free ? s.y : s.sy;
			stubRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${s.theta}deg)`;
		}
	};

	const tear = (): void => {
		releaseStub(sim.current);
		if (torn === undefined) setInnerTorn(true);
		onTear?.();
		if (reduced) setGone(true);
	};

	const { grip, dragged, onStubDown, onStubMove, onStubUp } = useRipDrag({
		sim,
		vertical,
		torn: isTorn,
		holeSize,
		resistance,
		stretch,
		tearAngle,
		rotate,
		wake: () => frame.wake(),
		tear,
	});

	const frame = useFrameLoop((dtMs) => {
		const { busy, fellOut } = stepRipSim(sim.current, dtMs, gone, grip.current !== null, tearAngle);
		if (fellOut) setGone(true);
		paint();
		return busy;
	});

	useEffect(() => {
		if (torn === false && sim.current.free) {
			sim.current.free = false;
			sim.current.sx = 0;
			sim.current.sy = 0;
			sim.current.theta = 0;
			setGone(false);
			paint();
		}
	});

	const onTilt = (event: PointerEvent<HTMLDivElement>): void => {
		if (!tilt || reduced) return;
		const rect = event.currentTarget.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return;
		const nx = (event.clientX - rect.left) / rect.width - HALF_OFFSET;
		const ny = (event.clientY - rect.top) / rect.height - HALF_OFFSET;
		sim.current.tiltTo = { x: -ny * TWO * tiltMax, y: nx * TWO * tiltMax };
		frame.wake();
	};

	const notchSize = holeSize * notch;
	const bodySize = (vertical ? height : width) - stubSize;
	return (
		<div
			data-slot="rip-stub"
			data-torn={isTorn ? "" : undefined}
			onPointerMove={onTilt}
			onPointerLeave={() => {
				sim.current.tiltTo = { x: 0, y: 0 };
				frame.wake();
			}}
			className={cn("relative", className)}
			style={{ width, height }}
		>
			<div ref={rootRef} className="relative size-full" style={{ transformStyle: "preserve-3d" }}>
				<div
					ref={bodyRef}
					className={cn("absolute overflow-hidden border border-border bg-card text-card-foreground", vertical ? "inset-x-0 top-0" : "inset-y-0 left-0")}
					style={{
						[vertical ? HEIGHT : WIDTH]: bodySize,
						borderRadius: radius,
						clipPath: isTorn ? jagged(roughness, "end", vertical) : undefined,
					}}
				>
					{image ? (
						<img
							src={image}
							alt={imageAlt}
							className="absolute object-cover"
							style={{
								inset: RIP.artInset,
								[vertical ? HEIGHT : WIDTH]: `${RIP.artSpan * PERCENT}%`,
								borderRadius: imageRadius,
								filter: isTorn ? "saturate(1.15)" : "saturate(1)",
								transition: `filter ${RIP.filterMs}ms ease`,
							}}
						/>
					) : null}
					{image && scrim ? <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" /> : null}
					<div className="relative size-full p-4">{children}</div>
				</div>
				<RipPerforation bodySize={bodySize} holes={holes} holeSize={holeSize} notchSize={notchSize} vertical={vertical} torn={isTorn} />
				{gone ? null : (
					<div
						ref={stubRef}
						onPointerDown={onStubDown}
						onPointerMove={onStubMove}
						onPointerUp={onStubUp}
						onPointerCancel={onStubUp}
						className={cn("absolute touch-none overflow-hidden border border-border bg-card text-card-foreground", vertical ? "inset-x-0 bottom-0" : "inset-y-0 right-0")}
						style={{
							[vertical ? HEIGHT : WIDTH]: stubSize,
							borderRadius: radius,
							transformOrigin: vertical ? "50% 0%" : "0% 50%",
							opacity: isTorn ? 0 : 1,
							transition: `opacity ${RIP.fadeMs}ms ease`,
							clipPath: isTorn ? jagged(roughness, "start", vertical) : undefined,
						}}
					>
						<button
							type="button"
							disabled={isTorn}
							aria-label={tearLabel}
							onClick={() => {
								if (isTorn || dragged.current) {
									dragged.current = false;
									return;
								}
								sim.current.pvy = vertical ? RIP.gravity / 10 : 0;
								sim.current.pvx = vertical ? 0 : RIP.gravity / 10;
								tear();
								frame.wake();
							}}
							className="size-full p-3 text-left outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset"
						>
							{stub}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
