"use client";

// 行为规格参照 docs/research/catalog/micro.md 的 PaperCrumple 条目, 仅作出处说明; 实现与命名为 HX 自有.
import { useEffect, useId, useRef, useState, type CSSProperties, type JSX, type KeyboardEvent, type PointerEvent } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { clamp, makeAxis, snapAxis, springFromSettle, stepAxis, type Axis } from "../feel";
import { CRUSH } from "../tokens";
import { useFrameLoop } from "../use-frame";
import { creaseWeight, crushLighting, crushScale } from "./discard-math";

/** 本文件内重复出现的字面量, 只写一次. */
const ARIA_TRUE = "true";
const STR_ZERO = "0";

export type CrushRelease = "restore" | "keep";

export interface CrushSheetProps {
	src: string;
	alt?: string;
	/** 揉皱时从折痕里透出的背面图. */
	backSrc?: string;
	width?: number;
	height?: number;
	sceneHeight?: number;
	imageFit?: CSSProperties["objectFit"];
	releaseBehavior?: CrushRelease;
	crumpleAmount?: number;
	crumpleDuration?: number;
	releaseDuration?: number;
	foldCount?: number;
	foldSharpness?: number;
	wrinkleDepth?: number;
	creaseStrength?: number;
	roughness?: number;
	paperTexture?: number;
	lightIntensity?: number;
	lightAngle?: number;
	shadow?: boolean;
	shadowOpacity?: number;
	draggable?: boolean;
	dragRotation?: number;
	onCrumpleChange?: (crumpled: boolean) => void;
	className?: string;
}

const KEYS = new Set([" ", "Enter"]);
const MS = 1000;
const PERCENT = 100;
const OCTAVES = 3;

/** 按住揉皱, 松手展开 (或保持). 按住时可拖动, 拖动速度带出倾斜. 键盘按住空格或回车同样生效, 直接落到终态. */
export function CrushSheet({
	src,
	alt = "Crumplable image",
	backSrc = "",
	width = CRUSH.width,
	height = CRUSH.height,
	sceneHeight = CRUSH.sceneHeight,
	imageFit = "cover",
	releaseBehavior = "restore",
	crumpleAmount = CRUSH.crumpleAmount,
	crumpleDuration = CRUSH.crumpleDuration,
	releaseDuration = CRUSH.releaseDuration,
	foldCount = CRUSH.foldCount,
	foldSharpness = CRUSH.foldSharpness,
	wrinkleDepth = CRUSH.wrinkleDepth,
	creaseStrength = CRUSH.creaseStrength,
	roughness = CRUSH.roughness,
	paperTexture = CRUSH.paperTexture,
	lightIntensity = CRUSH.lightIntensity,
	lightAngle = CRUSH.lightAngle,
	shadow = true,
	shadowOpacity = CRUSH.shadowOpacity,
	draggable = true,
	dragRotation = CRUSH.dragRotation,
	onCrumpleChange,
	className,
}: CrushSheetProps): JSX.Element {
	const reduced = useReducedMotion();
	const filterId = `hx-crush-${useId().replace(/:/g, "")}`;
	const sheetRef = useRef<HTMLDivElement>(null);
	const creaseRef = useRef<HTMLDivElement>(null);
	const backRef = useRef<HTMLImageElement>(null);
	const mapRef = useRef<SVGFEDisplacementMapElement>(null);
	const amount = useRef(makeAxis());
	const memory = useRef(makeAxis());
	const light = useRef(makeAxis());
	const pos = useRef({ x: makeAxis(), y: makeAxis(), r: makeAxis() });
	const held = useRef(false);
	const [crumpled, setCrumpled] = useState(false);
	const keyboard = useRef(false);
	const pointer = useRef<{ id: number; x0: number; y0: number; lx: number; t: number } | null>(null);

	const paint = (): void => {
		const a = amount.current.current;
		const p = pos.current;
		const lit = light.current.current;
		if (sheetRef.current) {
			sheetRef.current.style.transform = `translate3d(${p.x.current}px, ${p.y.current}px, 0) rotate(${p.r.current}deg) scale(${crushScale(a, crumpleAmount)})`;
			if (shadow) {
				const alpha = clamp(shadowOpacity * (1 + a * 2), 0, 1) * PERCENT;
				sheetRef.current.style.boxShadow = `0 ${4 + a * 12}px ${16 + a * 24}px color-mix(in srgb, var(--foreground) ${alpha}%, transparent)`;
			}
		}
		mapRef.current?.setAttribute("scale", String(a * crumpleAmount * wrinkleDepth * CRUSH.displacePx));
		if (creaseRef.current) {
			const weight = creaseWeight(CRUSH.creaseEdge + a * (CRUSH.creaseTop - CRUSH.creaseEdge), foldSharpness);
			creaseRef.current.style.opacity = String(clamp(lit * creaseStrength * lightIntensity * (1 + weight), 0, 1));
		}
		if (backRef.current) backRef.current.style.opacity = String(a * memory.current.current * 0.5);
	};

	const loop = useFrameLoop((dtMs) => {
		const main = springFromSettle(held.current ? crumpleDuration : releaseDuration, CRUSH.settleRate, CRUSH.settleFloorS);
		const side = springFromSettle(CRUSH.sideDurationS, CRUSH.settleRate, CRUSH.settleFloorS);
		light.current.target = crushLighting(amount.current.current, memory.current.current);
		let moving = false;
		for (const [axis, spec] of [
			[amount.current, main],
			[memory.current, main],
			[light.current, side],
			[pos.current.x, side],
			[pos.current.y, side],
			[pos.current.r, side],
		] as Array<[Axis, typeof main]>) {
			if (!stepAxis(axis, spec, dtMs).resting) moving = true;
		}
		paint();
		return moving;
	});

	const setHeld = (next: boolean, instant: boolean): void => {
		if (held.current === next) return;
		held.current = next;
		const target = next || releaseBehavior === "keep" ? 1 : 0;
		amount.current.target = target;
		memory.current.target = target;
		if (!next) {
			pos.current.x.target = 0;
			pos.current.y.target = 0;
			pos.current.r.target = 0;
		}
		if ((target === 1) !== crumpled) {
			setCrumpled(target === 1);
			onCrumpleChange?.(target === 1);
		}
		if (reduced || instant) {
			snapAxis(amount.current, target);
			snapAxis(memory.current, target);
			snapAxis(light.current, crushLighting(target, target));
			if (!next) for (const axis of [pos.current.x, pos.current.y, pos.current.r]) snapAxis(axis, 0);
			paint();
			return;
		}
		loop.wake();
	};

	useEffect(() => paint());

	const onPointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
		if (event.button !== 0) return;
		event.currentTarget.setPointerCapture?.(event.pointerId);
		pointer.current = { id: event.pointerId, x0: event.clientX, y0: event.clientY, lx: event.clientX, t: event.timeStamp };
		keyboard.current = false;
		setHeld(true, false);
	};

	const onPointerMove = (event: PointerEvent<HTMLButtonElement>): void => {
		const pt = pointer.current;
		if (!pt || pt.id !== event.pointerId || !draggable) return;
		const dt = Math.max(CRUSH.dragMinDtS, (event.timeStamp - pt.t) / MS);
		const vx = (event.clientX - pt.lx) / dt;
		pt.lx = event.clientX;
		pt.t = event.timeStamp;
		const p = pos.current;
		p.x.target = event.clientX - pt.x0;
		p.y.target = event.clientY - pt.y0;
		p.r.target = clamp(vx / MS, -1, 1) * dragRotation;
		if (reduced) {
			snapAxis(p.x, p.x.target);
			snapAxis(p.y, p.y.target);
			paint();
		} else loop.wake();
	};

	const onPointerEnd = (event: PointerEvent<HTMLButtonElement>): void => {
		if (pointer.current?.id !== event.pointerId) return;
		pointer.current = null;
		setHeld(false, false);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
		if (!KEYS.has(event.key)) return;
		event.preventDefault();
		if (event.repeat) return;
		keyboard.current = true;
		setHeld(true, true);
	};

	const onKeyUp = (event: KeyboardEvent<HTMLButtonElement>): void => {
		if (!KEYS.has(event.key) || !keyboard.current) return;
		event.preventDefault();
		setHeld(false, true);
	};

	const stripe = PERCENT / Math.max(1, foldCount);
	const edge = stripe * (1 - foldSharpness) * 0.5;
	return (
		<div data-slot="crush-sheet" className={cn("relative flex items-center justify-center", className)} style={{ height: sceneHeight }}>
			<svg aria-hidden={ARIA_TRUE} width={STR_ZERO} height={STR_ZERO} className="absolute">
				<filter id={filterId}>
					<feTurbulence type="fractalNoise" baseFrequency={CRUSH.baseFrequency * foldCount} numOctaves={Math.max(1, Math.round(roughness * OCTAVES))} seed={foldCount} />
					<feDisplacementMap ref={mapRef} in="SourceGraphic" scale={STR_ZERO} xChannelSelector="R" yChannelSelector="G" />
				</filter>
			</svg>
			<button
				type="button"
				aria-label={alt}
				aria-pressed={crumpled}
				aria-keyshortcuts="Space Enter"
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerEnd}
				onPointerCancel={onPointerEnd}
				onLostPointerCapture={onPointerEnd}
				onKeyDown={onKeyDown}
				onKeyUp={onKeyUp}
				onBlur={() => {
					if (held.current) setHeld(false, true);
				}}
				className="relative touch-none rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
			>
				<div ref={sheetRef} className="relative overflow-hidden rounded-sm bg-card" style={{ width, height, filter: `url(#${filterId})` }}>
					<img src={src} alt="" draggable={false} className="size-full" style={{ objectFit: imageFit }} />
					{backSrc ? <img ref={backRef} src={backSrc} alt="" draggable={false} className="absolute inset-0 size-full opacity-0" style={{ objectFit: imageFit }} /> : null}
					<div
						ref={creaseRef}
						aria-hidden={ARIA_TRUE}
						className="pointer-events-none absolute inset-0 opacity-0"
						style={{
							backgroundImage: `repeating-linear-gradient(${lightAngle}deg, color-mix(in srgb, var(--background) 60%, transparent) 0%, transparent ${edge}%, color-mix(in srgb, var(--foreground) 50%, transparent) ${stripe}%)`,
						}}
					/>
					<div aria-hidden={ARIA_TRUE} className="pointer-events-none absolute inset-0 bg-foreground mix-blend-overlay" style={{ opacity: paperTexture }} />
				</div>
			</button>
		</div>
	);
}
