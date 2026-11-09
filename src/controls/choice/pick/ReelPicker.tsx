"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 OptionWheel 条目, 实现为 HX 自有.

import { useEffect, useId, useRef, useState, type JSX, type KeyboardEvent } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { FOCUS_RING } from "../../../craft/tokens";
import { cn } from "../../../primitives/utils";
import { useSpringValue } from "../../../motion/drive/driver";
import { PROP_COLOR, toneVar, transition, type ChoiceTone } from "../tone";
import { useReelDrag } from "./parts/use-reel-drag";
import { REEL_DEFAULTS, REEL_DEFAULT_ITEMS, REEL_LINE_PX, REEL_REACH, REEL_WHEEL_STEP_PX, reelDistance, reelIndex, reelItems, reelKeyTarget, reelPose, reelSeek, reelSpring, type ReelItem, type ReelSide } from "./parts/reel-spec";

export { REEL_DEFAULTS, REEL_DT_CAP_S, REEL_OMEGA_PER_TAU, reelDistance, reelIndex, reelPose, reelRubber, reelSpring, type ReelItem, type ReelSide } from "./parts/reel-spec";

const COLOR_MS = 200;
const LINE_MODE = 1;

export interface ReelPickerProps {
	readonly items?: readonly (string | ReelItem)[];
	readonly value?: string;
	readonly defaultValue?: string;
	readonly onChange?: (value: string, index: number) => void;
	readonly textTone?: ChoiceTone;
	readonly activeTone?: ChoiceTone;
	/** 锚定侧: 文字贴这一侧排, 远行朝这一侧退开. */
	readonly side?: ReelSide;
	/** 字号 (rem). */
	readonly fontSize?: number;
	/** 行距, 字号的倍数. */
	readonly spacing?: number;
	readonly curve?: number;
	/** 每行倾斜的度数. */
	readonly tilt?: number;
	/** 每行模糊的像素. */
	readonly blur?: number;
	/** 每行透明度递减量. */
	readonly fade?: number;
	readonly minOpacity?: number;
	/** 跟随的时间常数 (ms). */
	readonly smoothing?: number;
	/** 锚定侧的内边距 (px). */
	readonly inset?: number;
	/** 可见行数, 决定高度. */
	readonly rows?: number;
	readonly loop?: boolean;
	readonly draggable?: boolean;
	/** 换项时播放的提示音地址, 空串不播. */
	readonly soundUrl?: string;
	readonly soundVolume?: number;
	readonly disabled?: boolean;
	readonly ariaLabel?: string;
	readonly className?: string;
}

/**
 * 滚轮选项列: 当前项停在中线, 上下各行沿弧线退开, 倾斜, 变淡, 变模糊.
 * 滚轮, 拖动, 点击与方向键都会换项; 位置由临界阻尼弹簧跟随, 中途换目标保留速度.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-choice.md
 */
export function ReelPicker({
	items: rawItems = REEL_DEFAULT_ITEMS,
	value,
	defaultValue,
	onChange,
	textTone = "muted-foreground",
	activeTone = "foreground",
	side = "left",
	fontSize = REEL_DEFAULTS.fontSize,
	spacing = REEL_DEFAULTS.spacing,
	curve = REEL_DEFAULTS.curve,
	tilt = REEL_DEFAULTS.tilt,
	blur = REEL_DEFAULTS.blur,
	fade = REEL_DEFAULTS.fade,
	minOpacity = REEL_DEFAULTS.minOpacity,
	smoothing = REEL_DEFAULTS.smoothing,
	inset = REEL_DEFAULTS.inset,
	rows = REEL_DEFAULTS.rows,
	loop = false,
	draggable = true,
	soundUrl = "",
	soundVolume = REEL_DEFAULTS.soundVolume,
	disabled = false,
	ariaLabel,
	className,
}: ReelPickerProps): JSX.Element {
	const items = reelItems(rawItems);
	const count = items.length;
	const reduced = useReducedMotion();
	const baseId = useId();
	const [inner, setInner] = useState(defaultValue ?? items[Math.min(REEL_DEFAULTS.defaultIndex, count - 1)]?.value);
	const current = value ?? inner;
	const index = Math.max(0, items.findIndex((item) => item.value === current));
	const [pos, driver] = useSpringValue(index);
	const root = useRef<HTMLDivElement>(null);
	const wheelAcc = useRef(0);
	const audio = useRef<HTMLAudioElement | null>(null);

	const settle = (target: number, velocity?: number): void => {
		const goal = driver.value + reelDistance(target, driver.value, count, loop);
		if (reduced) driver.jump(goal);
		else driver.to(goal, reelSpring(smoothing), velocity === undefined ? {} : { velocity });
	};

	useEffect(() => {
		if (!dragging.current?.active) settle(index);
		// 只随选中项与减弱动效切换重新落位
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [index, reduced]);

	const tick = (): void => {
		if (!soundUrl || typeof Audio === "undefined") return;
		if (!audio.current) audio.current = new Audio(soundUrl);
		audio.current.volume = soundVolume;
		audio.current.currentTime = 0;
		void audio.current.play()?.catch(() => undefined);
	};

	const select = (i: number): void => {
		const item = items[i];
		if (!item || item.disabled || disabled) return;
		if (i === index) return;
		if (value === undefined) setInner(item.value);
		onChange?.(item.value, i);
		tick();
	};

	const move = (step: number): void => select(reelSeek(items, index, step, loop));

	const latestMove = useRef(move);
	latestMove.current = move;
	useEffect(() => {
		const node = root.current;
		if (!node) return undefined;
		const onWheel = (event: WheelEvent): void => {
			if (disabled) return;
			event.preventDefault();
			wheelAcc.current += event.deltaMode === LINE_MODE ? event.deltaY * REEL_LINE_PX : event.deltaY;
			if (Math.abs(wheelAcc.current) < REEL_WHEEL_STEP_PX) return;
			latestMove.current(Math.sign(wheelAcc.current));
			wheelAcc.current = 0;
		};
		node.addEventListener("wheel", onWheel, { passive: false });
		return () => node.removeEventListener("wheel", onWheel);
	}, [disabled]);

	const rowPx = (): number => (root.current?.clientHeight ?? 0) / Math.max(1, rows);

	const { dragging, swallow, onPointerDown, onPointerMove, endDrag } = useReelDrag({
		driver,
		enabled: draggable && !disabled,
		loop,
		count,
		rowPx,
		release: (projected, velocity) => {
			let target = reelIndex(projected, count, loop);
			if (items[target]?.disabled) target = index;
			select(target);
			settle(target, velocity);
		},
	});

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		if (disabled) return;
		const target = reelKeyTarget(event.key, items, index, loop);
		if (target === null) return;
		event.preventDefault();
		select(target);
	};

	const shape = { spacing, curve, tilt, blur, fade, minOpacity, side };
	const colorMs = reduced ? 0 : COLOR_MS;

	return (
		<div
			ref={root}
			role="listbox"
			tabIndex={disabled ? -1 : 0}
			aria-label={ariaLabel}
			aria-disabled={disabled || undefined}
			aria-activedescendant={count > 0 ? `${baseId}-${index}` : undefined}
			data-slot="reel-picker"
			onKeyDown={onKeyDown}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={() => endDrag(false)}
			onPointerCancel={() => endDrag(true)}
			className={cn("relative touch-none select-none overflow-hidden", FOCUS_RING, disabled && "pointer-events-none opacity-[0.45]", className)}
			style={{ fontSize: `${fontSize}rem`, height: `${rows * spacing}em`, lineHeight: 1 }}
		>
			{items.map((item, i) => {
				const d = reelDistance(i, pos, count, loop);
				const p = reelPose(d, shape);
				const active = i === index;
				return (
					<div
						key={item.value}
						id={`${baseId}-${i}`}
						role="option"
						aria-selected={active}
						aria-disabled={item.disabled || undefined}
						onClick={() => {
							if (swallow.current) swallow.current = false;
							else select(i);
						}}
						className={cn("absolute top-1/2 whitespace-nowrap font-medium", item.disabled ? "cursor-not-allowed" : "cursor-pointer")}
						style={{
							[side]: inset,
							transformOrigin: side,
							transform: `translateY(-50%) translate(${p.x}em, ${p.y}em) rotate(${p.rotate}deg)`,
							opacity: item.disabled ? p.opacity * minOpacity : p.opacity,
							filter: p.blur > 0 ? `blur(${p.blur}px)` : undefined,
							visibility: Math.abs(d) > REEL_REACH ? "hidden" : undefined,
							color: toneVar(active ? activeTone : textTone),
							transition: transition(PROP_COLOR, colorMs),
						}}
					>
						{item.label}
					</div>
				);
			})}
		</div>
	);
}
