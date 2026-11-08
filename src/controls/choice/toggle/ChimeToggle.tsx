"use client";

/** 行为规格参照 catalog/micro.md 的 BellToggle 条目 (仅作出处说明, 实现为 HX 自写). */
import { useEffect, useLayoutEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { PRESS_SCALE } from "../../../craft/tokens";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { useSpringValue } from "../../../motion/drive/driver";
import { springFromDuration } from "../../../motion/spring/fit";
import { stepSpringExact } from "../../../motion/spring/step";
import { CHOICE_FIT, EASE_PLAIN_OUT, PROP_BACKGROUND, PROP_COLOR, PROP_OPACITY, PROP_TRANSFORM, PX, SPEC_EASE_OUT, toneVar, transition, type ChoiceTone } from "../tone";
import { ChimeBell } from "./parts/ChimeBell";
import { CHIME_CLAPPER_DELAY_MS, CHIME_MS, CHIME_REVEAL_DURATION, CHIME_SIZES, CHIME_WAVE_MS, CHIME_WAVE_SHIFT_PX, CHIME_WOBBLE, type ChimeSize } from "./parts/chime-spec";
import { chimeFrames, chimePassOffset, currentAngle } from "./parts/chime-swing";

export { CHIME_BELL_BODY, CHIME_CLAPPER_DELAY_MS, CHIME_MS, CHIME_REVEAL_DURATION, CHIME_SIZES, CHIME_WARP, CHIME_WAVE_MS, CHIME_WOBBLE, type ChimeSize } from "./parts/chime-spec";
export { chimeFrames, chimePassOffset } from "./parts/chime-swing";

const LIST_SEP = ", ";
const CLOSE = ")";
const LABEL_SHIFT_EM = 0.35;
const HALF = 2;
const HIDE = 0;
const BACK = -1;

export interface ChimeToggleProps {
	readonly offLabel?: string;
	readonly onLabel?: string;
	/** 换掉铃铛. 给了就不画铃舌. */
	readonly icon?: ReactNode;
	/** 可访问名. 不给时读当前文字. */
	readonly label?: string;
	readonly tone?: ChoiceTone;
	readonly backgroundTone?: ChoiceTone;
	readonly onTone?: ChoiceTone;
	readonly onBackgroundTone?: ChoiceTone;
	readonly size?: ChimeSize;
	readonly radius?: number;
	readonly ringAmplitude?: number;
	readonly ringPasses?: number;
	readonly ringDecay?: number;
	readonly ringDuration?: number;
	/** 摆动支点离图标顶部的百分比. */
	readonly ringPivot?: number;
	readonly crossfadeMs?: number;
	readonly revealBounce?: number;
	readonly count?: number;
	readonly badge?: boolean;
	readonly badgeTone?: ChoiceTone;
	readonly badgeTextTone?: ChoiceTone;
	readonly waves?: boolean;
	readonly clapper?: boolean;
	readonly pressed?: boolean;
	readonly defaultPressed?: boolean;
	readonly onPressedChange?: (pressed: boolean) => void;
	readonly disabled?: boolean;
	readonly className?: string;
}

/**
 * 订阅铃: 打开时铃铛按衰减摆动并放声波, 文字交叉淡入, 胶囊宽度跟弹簧展开; 关掉时轻晃一下.
 */
export function ChimeToggle({
	offLabel = "Notify me",
	onLabel = "You'll be notified",
	icon,
	label,
	tone = "foreground",
	backgroundTone = "muted",
	onTone = "background",
	onBackgroundTone = "foreground",
	size = "md",
	radius = 22,
	ringAmplitude = 17,
	ringPasses = 5,
	ringDecay = 1,
	ringDuration = 820,
	ringPivot = 16,
	crossfadeMs = 200,
	revealBounce = 0,
	count = 0,
	badge = true,
	badgeTone = "destructive",
	badgeTextTone = "destructive-foreground",
	waves = true,
	clapper = false,
	pressed,
	defaultPressed = false,
	onPressedChange,
	disabled = false,
	className,
}: ChimeToggleProps): JSX.Element {
	const reduced = useReducedMotion();
	const [inner, setInner] = useState(defaultPressed);
	const on = pressed ?? inner;
	const [down, setDown] = useState(false);
	const [height, fontSize, iconSize, badgeSize, gap] = CHIME_SIZES[size];
	const bell = useRef<SVGGElement>(null);
	const tongue = useRef<SVGGElement>(null);
	const waveLeft = useRef<HTMLSpanElement>(null);
	const waveRight = useRef<HTMLSpanElement>(null);
	const measureOff = useRef<HTMLSpanElement>(null);
	const measureOn = useRef<HTMLSpanElement>(null);
	const [width, widthDriver] = useSpringValue(0, stepSpringExact);
	const first = useRef(true);

	const labelWidth = (state: boolean): number => (state ? measureOn.current : measureOff.current)?.offsetWidth ?? 0;

	useLayoutEffect(() => {
		const target = labelWidth(on);
		if (first.current || reduced) {
			first.current = false;
			widthDriver.jump(target);
			return;
		}
		widthDriver.to(target, springFromDuration(CHIME_REVEAL_DURATION, revealBounce, CHOICE_FIT));
		// 只在开关或文案变化时重新量
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [on, offLabel, onLabel, size, reduced]);

	const swing = (el: SVGGElement | null, frames: Keyframe[], duration: number, delay: number): void => {
		if (!el?.animate) return;
		for (const running of el.getAnimations?.() ?? []) running.cancel();
		el.animate(frames, { duration, delay, fill: "none" });
	};

	const pulse = (k: number, passes: number, duration: number): void => {
		const el = k % HALF === 1 ? waveRight.current : waveLeft.current;
		if (!el?.animate) return;
		const out = (k % HALF === 1 ? 1 : BACK) * CHIME_WAVE_SHIFT_PX;
		el.animate(
			[
				{ opacity: 0, transform: "translateX(0)" },
				{ opacity: 1, offset: 0.3 },
				{ opacity: 0, transform: "translateX(" + out + PX + CLOSE },
			],
			{ duration: CHIME_WAVE_MS, delay: chimePassOffset(k, passes) * duration, easing: EASE_PLAIN_OUT },
		);
	};

	const ring = (next: boolean): void => {
		if (reduced || icon) return;
		const from = bell.current ? currentAngle(bell.current) : 0;
		if (next) {
			const frames = chimeFrames(from, ringAmplitude, ringPasses, ringDecay);
			swing(bell.current, frames, ringDuration, 0);
			if (clapper) swing(tongue.current, frames, ringDuration, CHIME_CLAPPER_DELAY_MS);
			if (waves) for (let k = 1; k <= ringPasses; k += 1) pulse(k, ringPasses + 1, ringDuration);
			return;
		}
		const frames = chimeFrames(from, ringAmplitude * CHIME_WOBBLE.amplitude, CHIME_WOBBLE.passes, ringDecay);
		swing(bell.current, frames, CHIME_WOBBLE.duration, 0);
		if (clapper) swing(tongue.current, frames, CHIME_WOBBLE.duration, CHIME_CLAPPER_DELAY_MS);
	};

	useEffect(() => {
		const el = bell.current;
		return () => {
			for (const running of el?.getAnimations?.() ?? []) running.cancel();
		};
	}, []);

	const toggle = (): void => {
		if (disabled) return;
		const next = !on;
		if (pressed === undefined) setInner(next);
		onPressedChange?.(next);
		ring(next);
	};

	const pad = (height - iconSize) / HALF;
	const labelMove = reduced ? 0 : CHIME_MS.labelMove;
	const fade = [transition(PROP_OPACITY, CHIME_MS.labelFade), transition(PROP_TRANSFORM, labelMove, SPEC_EASE_OUT)].join(LIST_SEP);
	const showBadge = badge && count > 0;
	const text = (state: boolean): JSX.Element => {
		const active = state === on;
		const shift = active || reduced ? 0 : (state ? 1 : BACK) * LABEL_SHIFT_EM;
		return (
			<span
				aria-hidden={!active}
				className="absolute left-0 top-1/2 whitespace-nowrap"
				style={{ opacity: active ? 1 : HIDE, transform: "translateY(calc(-50% + " + shift + "em))", transition: fade }}
			>
				{state ? onLabel : offLabel}
			</span>
		);
	};

	return (
		<button
			type="button"
			aria-pressed={on}
			aria-label={label}
			disabled={disabled}
			data-slot="chime-toggle"
			data-state={on ? "on" : "off"}
			className={cn("relative inline-flex select-none items-center border border-border font-medium outline-none focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50", className)}
			style={{
				height: height + PX,
				borderRadius: radius + PX,
				paddingInline: pad + PX,
				gap: gap + PX,
				fontSize: fontSize + PX,
				color: toneVar(on ? onTone : tone),
				backgroundColor: toneVar(on ? onBackgroundTone : backgroundTone),
				transform: "scale(" + (down && !reduced ? PRESS_SCALE : 1) + CLOSE,
				transition: [transition(PROP_BACKGROUND, crossfadeMs), transition(PROP_COLOR, crossfadeMs), transition(PROP_TRANSFORM, reduced ? 0 : CHIME_MS.press, SPEC_EASE_OUT)].join(LIST_SEP),
			}}
			onClick={toggle}
			onPointerDown={() => setDown(true)}
			onPointerUp={() => setDown(false)}
			onPointerLeave={() => setDown(false)}
			onPointerCancel={() => setDown(false)}
		>
			<ChimeBell
				bell={bell}
				tongue={tongue}
				waveLeft={waveLeft}
				waveRight={waveRight}
				icon={icon}
				iconSize={iconSize}
				badgeSize={badgeSize}
				ringPivot={ringPivot}
				clapper={clapper}
				waves={waves}
				count={count}
				showBadge={showBadge}
				badgeTone={badgeTone}
				badgeTextTone={badgeTextTone}
				reduced={reduced}
			/>
			<span className="relative inline-block h-full overflow-hidden" style={{ width: Math.max(0, width) + PX }}>
				{text(false)}
				{text(true)}
			</span>
			<span aria-hidden className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap">
				<span ref={measureOff}>{offLabel}</span>
			</span>
			<span aria-hidden className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap">
				<span ref={measureOn}>{onLabel}</span>
			</span>
		</button>
	);
}
