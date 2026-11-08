"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { SpringChannels } from "../../../motion/drive/channels";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { springFromDuration } from "../../../motion/spring/fit";
import { exactStepper } from "../../../motion/spring/step";
import { MS_PER_S, RANGE_DT_CAP_MS, RANGE_FIT, toneVar, type RangeTone } from "../tokens";
import { PinSlot } from "./parts/PinSlot";
import { PIN_CHECK_DELAY, PIN_CHECK_OUT_S, PIN_CHECK_RISE, PIN_CHECK_SPRING_S, PIN_RETURN_DELAY, PIN_SINK_DELAY, PIN_SINK_FADE, PIN_SINK_SPRING_S, PIN_SINK_STEP, PIN_WASH_IN, PIN_WASH_OUT, PIN_WASH_OUT_DELAY, cleanCode, type PinStatus } from "./parts/pin-spec";

const CHECK = "check";

/*
 * 行为规格参照 catalog/micro.md 的 CodeSlots 条目. 一次性验证码格子: 字符逐格落下;
 * 校验通过时底色漫上来, 字符依次下沉变淡, 对勾从下方升起; 离开通过态时倒放.
 */

export { PIN_CHECK_DELAY, PIN_CHECK_OUT_S, PIN_CHECK_RISE, PIN_CHECK_SPRING_S, PIN_RETURN_DELAY, PIN_SINK_DELAY, PIN_SINK_FADE, PIN_SINK_SPRING_S, PIN_SINK_STEP, PIN_WASH_IN, PIN_WASH_OUT, PIN_WASH_OUT_DELAY, cleanCode, type PinStatus } from "./parts/pin-spec";

const CHECK_PATH = "M5 12.5 10 17.5 19 7.5";
const ICON_BOX = 24;
const ICON_PX = 16;

export interface PinCellsProps {
	readonly length?: number;
	readonly value?: string;
	readonly defaultValue?: string;
	readonly onChange?: (value: string) => void;
	readonly onComplete?: (value: string) => void;
	readonly status?: PinStatus;
	readonly mask?: boolean;
	readonly caret?: boolean;
	readonly disabled?: boolean;
	readonly autoFocus?: boolean;
	/** 通过态漫底色. */
	readonly accentTone?: RangeTone;
	/** 普通态字符色. */
	readonly inkTone?: RangeTone;
	readonly slotTone?: RangeTone;
	/** 漫底上的字符与对勾色. */
	readonly digitTone?: RangeTone;
	readonly dangerTone?: RangeTone;
	readonly slotSize?: number;
	readonly gap?: number;
	readonly radius?: number;
	readonly bounce?: number;
	/** 落下弹簧的时长 (秒). */
	readonly settle?: number;
	/** 字符落下的起始高度 (px). */
	readonly rise?: number;
	/** 粘贴多个字符时逐格的间隔 (毫秒). */
	readonly cascade?: number;
	readonly ariaLabel?: string;
	readonly className?: string;
}

export function PinCells({
	length = 6,
	value,
	defaultValue = "",
	onChange,
	onComplete,
	status = "idle",
	mask = false,
	caret = true,
	disabled = false,
	autoFocus = false,
	accentTone = "foreground",
	inkTone = "foreground",
	slotTone = "muted",
	digitTone = "background",
	dangerTone = "destructive",
	slotSize = 44,
	gap = 8,
	radius = 12,
	bounce = 0.2,
	settle = 0.3,
	rise = 8,
	cascade = 20,
	ariaLabel = "One-time code",
	className,
}: PinCellsProps): JSX.Element {
	const reduced = useReducedMotion();
	const [inner, setInner] = useState(() => cleanCode(defaultValue, length));
	const code = cleanCode(value ?? inner, length);
	const [focused, setFocused] = useState(false);
	const channels = useRef(new SpringChannels(exactStepper(RANGE_DT_CAP_MS)));
	const loop = useFrameLoop();
	const glyphs = useRef<Array<HTMLSpanElement | null>>([]);
	const check = useRef<SVGSVGElement>(null);
	const prevCode = useRef(code);
	const prevStatus = useRef<PinStatus>("idle");
	const success = status === "success";
	const dropSpring = springFromDuration(settle, bounce, RANGE_FIT);
	const sinkSpring = springFromDuration(PIN_SINK_SPRING_S, 0, RANGE_FIT);

	const paint = (): void => {
		const ch = channels.current;
		glyphs.current.forEach((el, i) => {
			if (!el) return;
			const drop = ch.value(`d${i}`, 1);
			const sink = ch.value(`s${i}`);
			el.style.transform = `translate3d(0, ${(drop - 1) * rise + sink * rise}px, 0)`;
			el.style.opacity = String(Math.min(1, Math.max(0, drop)) * (1 - sink * (1 - PIN_SINK_FADE)));
		});
		if (check.current) {
			const c = ch.value(CHECK);
			check.current.style.transform = `translate3d(-50%, calc(-50% + ${(1 - c) * PIN_CHECK_RISE}px), 0)`;
			check.current.style.opacity = String(Math.max(0, Math.min(1, c)));
		}
	};

	const run = (): void => {
		if (reduced) {
			loop.stop();
			paint();
			return;
		}
		loop.start((dt, now) => {
			const busy = channels.current.step(dt, now);
			paint();
			return busy;
		});
	};

	useEffect(() => {
		const ch = channels.current;
		const now = performance.now();
		const before = prevCode.current;
		prevCode.current = code;
		let batch = 0;
		for (let i = 0; i < length; i += 1) {
			const had = i < before.length && before[i] === code[i];
			if (i >= code.length || had) continue;
			if (reduced) ch.jump(`d${i}`, 1, dropSpring);
			else ch.aim(`d${i}`, 1, dropSpring, { now, delayMs: batch * cascade, from: 0 });
			batch += 1;
		}
		run();
	}, [code]);

	useEffect(() => {
		const ch = channels.current;
		const now = performance.now();
		const was = prevStatus.current;
		prevStatus.current = status;
		if (reduced) {
			for (let k = 0; k < length; k += 1) ch.jump(`s${k}`, success ? 1 : 0, sinkSpring);
			ch.jump(CHECK, success ? 1 : 0, sinkSpring);
		} else if (success) {
			for (let k = 0; k < length; k += 1) ch.aim(`s${k}`, 1, sinkSpring, { now, delayMs: (PIN_SINK_DELAY + k * PIN_SINK_STEP) * MS_PER_S });
			ch.aim(CHECK, 1, springFromDuration(PIN_CHECK_SPRING_S, bounce, RANGE_FIT), { now, delayMs: PIN_CHECK_DELAY * MS_PER_S });
		} else if (was === "success") {
			ch.aim(CHECK, 0, springFromDuration(PIN_CHECK_OUT_S, 0, RANGE_FIT), { now });
			for (let k = 0; k < length; k += 1) ch.aim(`s${k}`, 0, sinkSpring, { now, delayMs: PIN_RETURN_DELAY * MS_PER_S });
		}
		run();
	}, [status, reduced]);

	const change = (raw: string): void => {
		const next = cleanCode(raw, length);
		if (value === undefined) setInner(next);
		onChange?.(next);
		if (next.length === length && code.length < length) onComplete?.(next);
	};

	const danger = status === "error";
	const active = Math.min(code.length, length - 1);
	const washMs = success ? PIN_WASH_IN * MS_PER_S : PIN_WASH_OUT * MS_PER_S;
	const washDelay = success ? 0 : PIN_WASH_OUT_DELAY * MS_PER_S;

	return (
		<div
			data-slot="pin-cells"
			data-status={status}
			className={cn("relative inline-flex", disabled && "opacity-50", className)}
			style={{ gap }}
		>
			{Array.from({ length }, (_, i) => (
				<PinSlot
					key={i}
					char={code[i]}
					glyphRef={(node) => {
						glyphs.current[i] = node;
					}}
					mask={mask}
					success={success}
					danger={danger}
					ringed={focused && i === active}
					showCaret={caret && focused && !disabled && i === code.length}
					reduced={reduced}
					washMs={washMs}
					washDelay={washDelay}
					size={slotSize}
					radius={radius}
					accentTone={accentTone}
					inkTone={inkTone}
					slotTone={slotTone}
					digitTone={digitTone}
					dangerTone={dangerTone}
				/>
			))}
			<svg
				ref={check}
				aria-hidden
				viewBox={`0 0 ${ICON_BOX} ${ICON_BOX}`}
				width={ICON_PX}
				height={ICON_PX}
				className="pointer-events-none absolute left-1/2 top-1/2 opacity-0"
			>
				<path d={CHECK_PATH} fill="none" stroke={toneVar(digitTone)} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
			</svg>
			<input
				type="text"
				inputMode="numeric"
				autoComplete="one-time-code"
				aria-label={ariaLabel}
				aria-invalid={danger || undefined}
				maxLength={length}
				value={code}
				disabled={disabled}
				autoFocus={autoFocus}
				onChange={(event) => change(event.currentTarget.value)}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				className="absolute inset-0 h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed"
			/>
		</div>
	);
}
