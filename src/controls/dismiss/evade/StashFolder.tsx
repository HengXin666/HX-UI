"use client";

// 行为规格参照 docs/research/catalog/micro.md 的 FolderFloat 条目, 仅作出处说明; 实现与命名为 HX 自有.
import { useEffect, useId, useMemo, useRef, useState, type JSX, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { makeAxis, stepAxis } from "../../../motion/drive/axis";
import { springFromVisualDuration } from "../../../motion/spring/fit";
import { DISMISS_EASE_OUT, STASH } from "../tokens";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { closeDelays, driftForce, layoutChips, liveDelay, openCurve } from "./evade-math";
import { FolderFace } from "./parts/FolderFace";
import { STASH_CLOSE_MS, STASH_OPEN_MS, chipTransform, chipTransition } from "./parts/stash-motion";
import { useStashDrag, type StashChip } from "./parts/use-stash-drag";
import { FOCUS_RING } from "../../../craft/tokens";

/** 本文件内重复出现的字面量, 只写一次. */
const STR_ONE = "1";

export interface StashItem {
	readonly id: string;
	readonly label: string;
	readonly icon?: ReactNode;
}

export interface StashFolderProps {
	items?: readonly StashItem[];
	label?: string;
	sublabel?: string;
	trigger?: "hover" | "click";
	open?: boolean;
	defaultOpen?: boolean;
	closeOnSelect?: boolean;
	/** 全部纸片入场后交给漂移物理; 关掉则只做 CSS 呼吸. */
	physics?: boolean;
	drift?: number;
	onSelect?: (item: StashItem) => void;
	onOpenChange?: (open: boolean) => void;
	width?: number;
	height?: number;
	radius?: number;
	spread?: number;
	lift?: number;
	tilt?: number;
	flapAngle?: number;
	restAngle?: number;
	/** 打开回弹的 bounce, 0.3 对应曲线控制点 1.57. */
	bounce?: number;
	stagger?: number;
	className?: string;
}

const DEFAULT_ITEMS: readonly StashItem[] = [
	{ id: "spacing", label: "Spacing" },
	{ id: "contrast", label: "Contrast" },
	{ id: "copy", label: "Copy tone" },
	{ id: "icons", label: "Icon weight" },
];

/** 漂移力的像素尺度与质量基数 (规格用 matter-js 的面积质量, 这里按纸片宽度折算). */
const DRIFT_PX = 40;
const MASS_PX = 100;
/** 纸片回到槽位的弹簧: 规格交给 matter-js 约束, 未给数值, 这里取 0.6s, bounce 0.2. */
const HOME_SPRING = springFromVisualDuration(0.6, 0.2);
const MS = 1000;
const FOLD_SCALE = 0.6;
const BREATH_PX = 3;

/** 文件夹: 悬停或点击打开, 纸片按错开节奏飞出, 入场后漂浮可拖; 选中一张触发 onSelect. */
export function StashFolder({
	items = DEFAULT_ITEMS,
	label = "Design feedback",
	sublabel = "",
	trigger = "hover",
	open,
	defaultOpen = false,
	closeOnSelect = true,
	physics = true,
	drift = STASH.drift,
	onSelect,
	onOpenChange,
	width = STASH.width,
	height = STASH.height,
	radius = STASH.radius,
	spread = STASH.spread,
	lift = STASH.lift,
	tilt = STASH.tilt,
	flapAngle = STASH.flapAngle,
	restAngle = STASH.restAngle,
	bounce = STASH.bounce,
	stagger = STASH.stagger,
	className,
}: StashFolderProps): JSX.Element {
	const reduced = useReducedMotion();
	const menuId = useId();
	const [innerOpen, setInnerOpen] = useState(defaultOpen);
	const [live, setLive] = useState(false);
	const isOpen = open ?? innerOpen;
	const slots = useMemo(() => layoutChips(items.map((item) => item.label), spread, lift, tilt), [items, spread, lift, tilt]);
	const chipEls = useRef<Array<HTMLButtonElement | null>>([]);
	const chips = useRef<StashChip[]>([]);
	const clock = useRef(0);
	const curve = openCurve(bounce);

	chips.current = slots.map(
		(slot, i) => chips.current[i] ?? { x: makeAxis(slot.x), y: makeAxis(slot.y), phase: i * STASH.driftPhaseS, mass: slot.width / MASS_PX },
	);

	const setOpen = (next: boolean): void => {
		if (open === undefined) setInnerOpen(next);
		if (next !== isOpen) onOpenChange?.(next);
	};

	const paint = (i: number): void => {
		const el = chipEls.current[i];
		const chip = chips.current[i];
		if (!el || !chip) return;
		el.style.transform = `translate3d(calc(-50% + ${chip.x.current}px), ${chip.y.current}px, 0) rotate(${slots[i].angle}deg)`;
	};

	const frame = useFrameLoop((dtMs) => {
		const dt = Math.min(STASH.maxDtMs, dtMs);
		clock.current += dt / MS;
		const k = drift * DRIFT_PX;
		chips.current.forEach((chip, i) => {
			if (hold.current?.index === i) return;
			const force = driftForce(clock.current, chip.phase, k, chip.mass);
			chip.x.target = slots[i].x + force.x;
			chip.y.target = slots[i].y + force.y;
			stepAxis(chip.x, HOME_SPRING, dt);
			stepAxis(chip.y, HOME_SPRING, dt);
			paint(i);
		});
		return live;
	});

	useEffect(() => {
		if (!isOpen || !physics || reduced) {
			setLive(false);
			return undefined;
		}
		const timer = window.setTimeout(() => setLive(true), liveDelay(STASH_OPEN_MS, items.length, stagger));
		return () => window.clearTimeout(timer);
	}, [isOpen, physics, reduced, items.length, stagger]);

	useEffect(() => {
		if (live) frame.wake();
		else frame.stop();
	}, [live, frame]);

	useEffect(() => {
		if (!isOpen || physics || reduced) return undefined;
		const runs = chipEls.current.map((el, i) =>
			el?.firstElementChild?.animate?.(
				[{ transform: "translateY(0px)" }, { transform: `translateY(-${BREATH_PX}px)` }, { transform: "translateY(0px)" }],
				{ duration: STASH.driftS * MS, delay: -i * STASH.driftPhaseS * MS, iterations: Infinity, easing: "ease-in-out" },
			),
		);
		return () => runs.forEach((run) => run?.cancel());
	}, [isOpen, physics, reduced, items.length]);

	const select = (item: StashItem, i: number): void => {
		if (!reduced) chipEls.current[i]?.animate?.([{ scale: STR_ONE }, { scale: "1.08" }, { scale: STR_ONE }], { duration: STASH.popMs, easing: DISMISS_EASE_OUT });
		onSelect?.(item);
		if (closeOnSelect) setOpen(false);
	};

	const { hold, onChipDown, onChipMove, onChipUp, cancel } = useStashDrag<StashItem>({ chips, slots, spread, lift, live, paint, select });

	const onMenuKey = (event: KeyboardEvent<HTMLDivElement>): void => {
		const at = chipEls.current.findIndex((el) => el === document.activeElement);
		if (event.key === "Escape") setOpen(false);
		else if (event.key === "ArrowRight" || event.key === "ArrowDown") chipEls.current[(at + 1) % items.length]?.focus();
		else if (event.key === "ArrowLeft" || event.key === "ArrowUp") chipEls.current[(at - 1 + items.length) % items.length]?.focus();
		else return;
		event.preventDefault();
	};

	const hover = trigger === "hover";
	return (
		<div
			data-slot="stash-folder"
			data-open={isOpen ? "" : undefined}
			onPointerEnter={hover ? () => setOpen(true) : undefined}
			onPointerLeave={hover ? () => setOpen(false) : undefined}
			className={cn("relative inline-block", className)}
			style={{ width, height, perspective: 800 }}
		>
			<div id={menuId} role="menu" aria-label={label} aria-hidden={isOpen ? undefined : true} onKeyDown={onMenuKey} className="absolute left-1/2 top-0 z-10">
				{items.map((item, i) => {
					const delay = isOpen ? i * stagger : closeDelays(i, items.length, stagger, STASH_CLOSE_MS).move;
					const fadeDelay = isOpen ? i * stagger : closeDelays(i, items.length, stagger, STASH_CLOSE_MS).fade;
					const slot = slots[i];
					return (
						<button
							key={item.id}
							type="button"
							role="menuitem"
							tabIndex={isOpen ? 0 : -1}
							ref={(el) => {
								chipEls.current[i] = el;
							}}
							onPointerDown={(event) => onChipDown(event, i)}
							onPointerMove={(event) => onChipMove(event, i)}
							onPointerUp={(event) => onChipUp(event, item, i)}
							onPointerCancel={cancel}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									select(item, i);
								}
							}}
							className={cn("absolute left-0 top-0 flex touch-none items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-card-foreground shadow-sm", FOCUS_RING, "motion-reduce:transition-none")}
							style={{
								width: slot.width,
								transform: chipTransform(slot, isOpen),
								scale: isOpen ? STR_ONE : String(FOLD_SCALE),
								opacity: isOpen ? 1 : 0,
								pointerEvents: isOpen ? undefined : "none",
								transition: chipTransition(live, isOpen, curve, delay, fadeDelay),
							}}
						>
							<span className="flex items-center gap-1.5">
								{item.icon}
								{item.label}
							</span>
						</button>
					);
				})}
			</div>
			<FolderFace
				menuId={menuId}
				open={isOpen}
				setOpen={setOpen}
				label={label}
				sublabel={sublabel}
				radius={radius}
				lift={lift}
				flapAngle={flapAngle}
				restAngle={restAngle}
				curve={curve}
				openMs={STASH_OPEN_MS}
				closeMs={STASH_CLOSE_MS}
			/>
		</div>
	);
}
