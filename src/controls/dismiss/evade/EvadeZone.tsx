"use client";

// 行为规格参照 docs/research/catalog/micro.md 的 DodgeField 条目, 仅作出处说明; 实现与命名为 HX 自有.
import { useEffect, useRef, useState, type CSSProperties, type JSX, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { makeAxis, snapAxis, stepAxis } from "../../../motion/drive/axis";
import { springFromVisualDuration } from "../../../motion/spring/fit";
import { DISMISS_EASE_OUT, EVADE } from "../tokens";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { crossedCountLine, fleeOffset, keepInside, type EvadeAxis, type EvadeWall } from "./evade-math";

/** 本文件内重复出现的字面量, 只写一次. */
const TWO = 2;

export interface EvadeZoneProps {
	children?: ReactNode;
	taunts?: readonly string[];
	/** 放弃躲闪后显示的提示; 空串时沿用最后一句. */
	notice?: string;
	fieldHeight?: number;
	reach?: number;
	radius?: number;
	falloff?: number;
	fleeDuration?: number;
	returnDuration?: number;
	returnBounce?: number;
	axis?: EvadeAxis;
	wall?: EvadeWall;
	/** 躲闪多少次后放弃. */
	patience?: number;
	disabled?: boolean;
	onDodge?: (count: number) => void;
	onRelent?: () => void;
	onCatch?: () => void;
	className?: string;
	style?: CSSProperties;
}

const DEFAULT_TAUNTS: readonly string[] = ["Too slow", "Nope", "Almost", "Fine, you win"];
const MS = 1000;

/**
 * 指针靠近时目标逃开的场地. 只对指针生效: 键盘聚焦后回车总能点到, 减弱动效时目标不动.
 * 躲闪 patience 次后放弃, 被点中停住 CAUGHT_HOLD_MS 再复位.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-dismiss.md
 */
export function EvadeZone({
	children,
	taunts = DEFAULT_TAUNTS,
	notice = "",
	fieldHeight = EVADE.fieldHeight,
	reach = EVADE.reach,
	radius = EVADE.radius,
	falloff = EVADE.falloff,
	fleeDuration = EVADE.fleeDuration,
	returnDuration = EVADE.returnDuration,
	returnBounce = EVADE.returnBounce,
	axis = "both",
	wall = "clamp",
	patience = EVADE.patience,
	disabled = false,
	onDodge,
	onRelent,
	onCatch,
	className,
	style,
}: EvadeZoneProps): JSX.Element {
	const reduced = useReducedMotion();
	const fieldRef = useRef<HTMLDivElement>(null);
	const targetRef = useRef<HTMLDivElement>(null);
	const x = useRef(makeAxis());
	const y = useRef(makeAxis());
	const fleeing = useRef(false);
	const strength = useRef(0);
	const last = useRef<{ x: number; y: number } | null>(null);
	const [dodges, setDodges] = useState(0);
	const [relented, setRelented] = useState(false);
	const [caught, setCaught] = useState(false);
	const idle = reduced || disabled || relented || caught;

	const paint = (): void => {
		if (targetRef.current) targetRef.current.style.transform = `translate3d(calc(-50% + ${x.current.current}px), calc(-50% + ${y.current.current}px), 0)`;
	};

	const frame = useFrameLoop((dtMs) => {
		const spec = fleeing.current
			? springFromVisualDuration(fleeDuration / MS, 0)
			: springFromVisualDuration(returnDuration / MS, returnBounce);
		const a = stepAxis(x.current, spec, dtMs);
		const b = stepAxis(y.current, spec, dtMs);
		paint();
		return !a.resting || !b.resting;
	});

	const goHome = (): void => {
		fleeing.current = false;
		strength.current = 0;
		last.current = null;
		x.current.target = 0;
		y.current.target = 0;
		if (reduced) {
			snapAxis(x.current, 0);
			snapAxis(y.current, 0);
			paint();
		} else frame.wake();
	};

	useEffect(() => {
		if (idle) goHome();
	}, [idle]);

	useEffect(() => {
		const away = (): void => goHome();
		window.addEventListener("blur", away);
		window.addEventListener("scroll", away, { passive: true });
		return () => {
			window.removeEventListener("blur", away);
			window.removeEventListener("scroll", away);
		};
	}, []);

	const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
		if (idle || event.pointerType === "touch") return;
		const field = fieldRef.current;
		const target = targetRef.current;
		if (!field || !target) return;
		const prev = last.current;
		if (prev && Math.hypot(event.clientX - prev.x, event.clientY - prev.y) < EVADE.deadZonePx) return;
		last.current = { x: event.clientX, y: event.clientY };
		const rect = field.getBoundingClientRect();
		const size = { x: rect.width, y: rect.height };
		const home = { x: size.x / TWO, y: size.y / TWO };
		const half = { x: target.offsetWidth / TWO, y: target.offsetHeight / TWO };
		const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
		const flee = fleeOffset(pointer, home, { radius, reach, falloff, axis });
		const center = keepInside({ x: home.x + flee.offset.x, y: home.y + flee.offset.y }, half, size, wall);
		fleeing.current = flee.strength >= strength.current && flee.strength > 0;
		if (crossedCountLine(strength.current, flee.strength)) {
			const count = dodges + 1;
			setDodges(count);
			onDodge?.(count);
			if (count >= patience) {
				setRelented(true);
				onRelent?.();
			}
		}
		strength.current = flee.strength;
		x.current.target = center.x - home.x;
		y.current.target = center.y - home.y;
		frame.wake();
	};

	const onCatchClick = (): void => {
		if (disabled || caught) return;
		setCaught(true);
		onCatch?.();
		window.setTimeout(() => {
			setCaught(false);
			setDodges(0);
			setRelented(false);
		}, EVADE.caughtHoldMs);
	};

	const taunt = dodges > 0 ? taunts[(dodges - 1) % Math.max(1, taunts.length)] : "";
	const message = relented && notice ? notice : taunt;
	return (
		<div
			ref={fieldRef}
			data-slot="evade-zone"
			data-relented={relented ? "" : undefined}
			data-caught={caught ? "" : undefined}
			onPointerMove={onPointerMove}
			onPointerLeave={goHome}
			className={cn("relative w-full overflow-hidden rounded-xl border border-border bg-muted text-foreground", className)}
			style={{ height: fieldHeight, ...style }}
		>
			<p
				aria-live="polite"
				className="pointer-events-none absolute inset-x-0 top-3 text-center text-xs text-muted-foreground motion-reduce:transition-none"
				style={{ opacity: message ? 1 : 0, filter: message ? "blur(0px)" : "blur(2px)", transition: `opacity ${EVADE.noticeMs}ms ease, filter ${EVADE.noticeMs}ms ease` }}
			>
				{message}
			</p>
			<div
				ref={targetRef}
				onClickCapture={onCatchClick}
				className={cn(
					"absolute left-1/2 top-1/2 rounded-md",
					caught ? "bg-foreground text-background" : "text-foreground",
				)}
				style={{
					transform: "translate3d(-50%, -50%, 0)",
					transition: `background-color ${EVADE.colorMs}ms ease, color ${EVADE.colorMs}ms ease`,
				}}
			>
				{children ?? (
					<button
						type="button"
						disabled={disabled}
						className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium active:scale-[0.97] motion-reduce:transition-none"
						style={{ transition: `transform ${EVADE.pressMs}ms ${DISMISS_EASE_OUT}` }}
					>
						{caught ? "Caught" : "Catch me"}
					</button>
				)}
			</div>
		</div>
	);
}
