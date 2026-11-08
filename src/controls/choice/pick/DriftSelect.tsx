"use client";

/** 行为规格参照 catalog/micro.md 的 GlideSelect 条目 (仅作出处说明, 实现为 HX 自写). */
import { useEffect, useId, useRef, useState, type JSX, type KeyboardEvent } from "react";
import { PRESS_SCALE } from "../../../craft/tokens";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { useSpringValue } from "../../../motion/drive/driver";
import { springFromDuration } from "../../../motion/spring/fit";
import { stepSpringExact } from "../../../motion/spring/step";
import { CHOICE_FIT, EASE_PLAIN, MS_PER_S, PROP_BACKGROUND, PROP_TRANSFORM, PX, SPEC_EASE_OUT, toneVar, transition, type ChoiceTone } from "../tone";
import { DriftMenu } from "./parts/DriftMenu";
import { DRIFT_MS, DRIFT_NONE, DRIFT_PAD, DRIFT_SHIFT_PX, DRIFT_SIZES, driftOffset, type DriftOption, type DriftSize } from "./parts/drift-spec";
import { useDriftPop } from "./parts/use-drift-pop";

const PAREN_CLOSE = ")";
const FLIP = 180;
const CHEVRON_PX = 14;
const NONE = DRIFT_NONE;

export { DRIFT_GAP, DRIFT_MENU_GAP, DRIFT_MS, DRIFT_PAD, driftOffset, type DriftOption, type DriftSize } from "./parts/drift-spec";

export interface DriftSelectProps {
	readonly options: readonly DriftOption[];
	readonly value?: string;
	readonly defaultValue?: string;
	readonly onChange?: (value: string) => void;
	readonly placeholder?: string;
	readonly showTags?: boolean;
	readonly accentTone?: ChoiceTone;
	readonly surfaceTone?: ChoiceTone;
	readonly highlightTone?: ChoiceTone;
	readonly textTone?: ChoiceTone;
	readonly size?: DriftSize;
	readonly radius?: number;
	readonly menuWidth?: number;
	readonly placement?: "bottom" | "top";
	readonly align?: "left" | "right";
	readonly popDuration?: number;
	readonly glideDuration?: number;
	/** 打开时高亮从上次停留处起滑, 而不是从顶部出现. */
	readonly rememberPosition?: boolean;
	readonly disabled?: boolean;
	readonly ariaLabel?: string;
	readonly className?: string;
}

/**
 * 滑行下拉: 触发器是 select-only combobox, 菜单弹出时高亮块按弹簧在选项间滑行, 选中值换字时轻推一下.
 * 关闭途中再打开, 弹出动画原地倒放, 不跳帧.
 */
export function DriftSelect({
	options,
	value,
	defaultValue,
	onChange,
	placeholder = "Select…",
	showTags = true,
	accentTone = "foreground",
	surfaceTone = "popover",
	highlightTone = "accent",
	textTone = "popover-foreground",
	size = "md",
	radius = 10,
	menuWidth = 176,
	placement = "bottom",
	align = "left",
	popDuration = 180,
	glideDuration = 220,
	rememberPosition = true,
	disabled = false,
	ariaLabel = "Select",
	className,
}: DriftSelectProps): JSX.Element {
	const reduced = useReducedMotion();
	const id = useId();
	const [inner, setInner] = useState(defaultValue);
	const current = value ?? inner;
	const selected = options.findIndex((option) => option.value === current);
	const [height, fontSize, padX, optionHeight] = DRIFT_SIZES[size];
	const [open, setOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [active, setActive] = useState(NONE);
	const [pressed, setPressed] = useState(false);
	const [y, yDriver] = useSpringValue(DRIFT_PAD, stepSpringExact);
	const root = useRef<HTMLDivElement>(null);
	const menu = useRef<HTMLDivElement>(null);
	const valueText = useRef<HTMLSpanElement>(null);
	const remembered = useRef(NONE);
	const lastValue = useRef(current);

	const glide = (i: number, instant: boolean): void => {
		setActive(i);
		if (i === NONE) return;
		remembered.current = i;
		const target = driftOffset(i, optionHeight);
		if (instant || reduced) yDriver.jump(target);
		else yDriver.to(target, springFromDuration(glideDuration / MS_PER_S, 0, CHOICE_FIT));
	};

	const show = (): void => {
		if (disabled) return;
		setMounted(true);
		setOpen(true);
		const start = rememberPosition && remembered.current !== NONE ? remembered.current : selected;
		const land = selected === NONE ? Math.max(0, start) : selected;
		if (rememberPosition && start !== NONE) {
			yDriver.jump(driftOffset(start, optionHeight));
			glide(land, false);
		} else glide(land, true);
	};

	const hide = (): void => setOpen(false);

	useDriftPop({ menu, root, open, mounted, setMounted, placement, reduced, popDuration });

	useEffect(() => {
		if (!open) return;
		const outside = (event: globalThis.PointerEvent): void => {
			if (root.current && !root.current.contains(event.target as Node)) hide();
		};
		document.addEventListener("pointerdown", outside);
		return () => document.removeEventListener("pointerdown", outside);
	}, [open]);

	useEffect(() => {
		if (lastValue.current === current) return;
		lastValue.current = current;
		if (reduced) return;
		valueText.current?.animate?.([{ opacity: 0, transform: "translateY(" + DRIFT_SHIFT_PX + PX + PAREN_CLOSE }, { opacity: 1, transform: "none" }], { duration: DRIFT_MS.swap, easing: EASE_PLAIN });
	}, [current, reduced]);

	const choose = (i: number): void => {
		const option = options[i];
		if (!option || option.disabled) return;
		if (value === undefined) setInner(option.value);
		if (option.value !== current) onChange?.(option.value);
		hide();
	};

	const step = (from: number, dir: number): void => {
		for (let k = 1; k <= options.length; k += 1) {
			const next = (from + dir * k + options.length * k) % options.length;
			if (!options[next]?.disabled) {
				glide(next, false);
				return;
			}
		}
	};

	const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
		const key = event.key;
		if (!open) {
			if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
				event.preventDefault();
				show();
			}
			return;
		}
		if (key === "ArrowDown") step(active, 1);
		else if (key === "ArrowUp") step(active === NONE ? 0 : active, NONE);
		else if (key === "Home") step(options.length - 1, 1);
		else if (key === "End") step(0, NONE);
		else if (key === "Enter" || key === " ") choose(active);
		else if (key === "Escape") hide();
		else if (key === "Tab") {
			hide();
			return;
		} else return;
		event.preventDefault();
	};

	const listId = id + "-list";
	const optionId = (i: number): string => id + "-opt-" + i;
	const shown = options[selected];
	const triggerMs = reduced ? 0 : DRIFT_MS.press;

	return (
		<div ref={root} className={cn("relative inline-block", className)} data-slot="drift-select">
			<button
				type="button"
				role="combobox"
				aria-label={ariaLabel}
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={listId}
				aria-activedescendant={open && active !== NONE ? optionId(active) : undefined}
				disabled={disabled}
				onClick={() => (open ? hide() : show())}
				onKeyDown={onKeyDown}
				onPointerDown={() => setPressed(true)}
				onPointerUp={() => setPressed(false)}
				onPointerLeave={() => setPressed(false)}
				onPointerCancel={() => setPressed(false)}
				className="inline-flex items-center justify-between gap-2 border border-border font-medium outline-none hover:bg-accent focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
				style={{
					height: height + PX,
					minWidth: menuWidth + PX,
					paddingInline: padX + PX,
					borderRadius: radius + PX,
					fontSize: fontSize + PX,
					color: toneVar(accentTone),
					backgroundColor: open ? toneVar(highlightTone) : toneVar(surfaceTone),
					transform: "scale(" + (pressed && !reduced ? PRESS_SCALE : 1) + PAREN_CLOSE,
					transition: [transition(PROP_BACKGROUND, DRIFT_MS.triggerColor), transition(PROP_TRANSFORM, triggerMs, SPEC_EASE_OUT)].join(", "),
				}}
			>
				<span ref={valueText} className={cn("truncate", !shown && "text-muted-foreground")}>
					{shown ? shown.label : placeholder}
				</span>
				<svg
					aria-hidden
					viewBox="0 0 16 16"
					width={CHEVRON_PX}
					height={CHEVRON_PX}
					fill="none"
					stroke="currentColor"
					strokeWidth={1}
					style={{ transform: "rotate(" + (open ? FLIP : 0) + "deg)", transition: transition(PROP_TRANSFORM, reduced ? 0 : DRIFT_MS.chevron, SPEC_EASE_OUT) }}
				>
					<path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</button>
			{mounted ? (
				<DriftMenu
					menuRef={menu}
					listId={listId}
					optionId={optionId}
					options={options}
					selected={selected}
					active={active}
					y={y}
					ariaLabel={ariaLabel}
					showTags={showTags}
					surfaceTone={surfaceTone}
					highlightTone={highlightTone}
					textTone={textTone}
					menuWidth={menuWidth}
					radius={radius}
					placement={placement}
					align={align}
					optionHeight={optionHeight}
					padX={padX}
					fontSize={fontSize}
					onHover={(i) => glide(i, false)}
					onChoose={choose}
				/>
			) : null}
		</div>
	);
}
