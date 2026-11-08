/** DriftSelect 的弹出列表: 弹簧高亮块与选项行, 状态全由父组件持有. */
import type { JSX, RefObject } from "react";
import { cn } from "../../../../primitives/utils";
import { PROP_OPACITY, PX, toneVar, transition, type ChoiceTone } from "../../tone";
import { DRIFT_GAP, DRIFT_MENU_GAP, DRIFT_MS, DRIFT_NONE, DRIFT_PAD, type DriftOption } from "./drift-spec";

const BOTTOM = "bottom";

interface DriftMenuProps {
	readonly menuRef: RefObject<HTMLDivElement | null>;
	readonly listId: string;
	readonly optionId: (i: number) => string;
	readonly options: readonly DriftOption[];
	readonly selected: number;
	readonly active: number;
	/** 高亮块当前纵向位置 (弹簧值). */
	readonly y: number;
	readonly ariaLabel: string;
	readonly showTags: boolean;
	readonly surfaceTone: ChoiceTone;
	readonly highlightTone: ChoiceTone;
	readonly textTone: ChoiceTone;
	readonly menuWidth: number;
	readonly radius: number;
	readonly placement: "bottom" | "top";
	readonly align: "left" | "right";
	readonly optionHeight: number;
	readonly padX: number;
	readonly fontSize: number;
	readonly onHover: (i: number) => void;
	readonly onChoose: (i: number) => void;
}

export function DriftMenu({
	menuRef,
	listId,
	optionId,
	options,
	selected,
	active,
	y,
	ariaLabel,
	showTags,
	surfaceTone,
	highlightTone,
	textTone,
	menuWidth,
	radius,
	placement,
	align,
	optionHeight,
	padX,
	fontSize,
	onHover,
	onChoose,
}: DriftMenuProps): JSX.Element {
	return (
		<div
			ref={menuRef}
			id={listId}
			role="listbox"
			aria-label={ariaLabel}
			className="absolute z-50 border border-border shadow-md"
			style={{
				width: menuWidth + PX,
				padding: DRIFT_PAD + PX,
				borderRadius: radius + PX,
				backgroundColor: toneVar(surfaceTone),
				color: toneVar(textTone),
				[placement === BOTTOM ? "top" : BOTTOM]: "calc(100% + " + DRIFT_MENU_GAP + PX + ")",
				[align]: 0,
				transformOrigin: (placement === BOTTOM ? "top " : "bottom ") + align,
			}}
		>
			<span
				aria-hidden
				className="pointer-events-none absolute"
				style={{
					left: DRIFT_PAD + PX,
					right: DRIFT_PAD + PX,
					top: 0,
					height: optionHeight + PX,
					borderRadius: Math.max(0, radius - DRIFT_PAD) + PX,
					backgroundColor: toneVar(highlightTone),
					transform: "translateY(" + y + PX + ")",
					opacity: active === DRIFT_NONE ? 0 : 1,
					transition: transition(PROP_OPACITY, DRIFT_MS.optionColor),
				}}
			/>
			{options.map((option, i) => (
				<div
					key={option.value}
					id={optionId(i)}
					role="option"
					aria-selected={i === selected}
					aria-disabled={option.disabled || undefined}
					onPointerEnter={() => !option.disabled && onHover(i)}
					onPointerDown={(event) => event.preventDefault()}
					onClick={() => onChoose(i)}
					className={cn("relative flex cursor-pointer items-center justify-between gap-2", option.disabled && "cursor-not-allowed opacity-40")}
					style={{ height: optionHeight + PX, marginTop: i === 0 ? 0 : DRIFT_GAP + PX, paddingInline: padX + PX, fontSize: fontSize + PX }}
				>
					<span className="truncate">{option.label}</span>
					{showTags && option.tag ? (
						<span className="shrink-0 text-muted-foreground" style={{ fontSize: fontSize - 1 + PX, opacity: i === active ? 1 : 0.7, transition: transition(PROP_OPACITY, DRIFT_MS.tagFade) }}>
							{option.tag}
						</span>
					) : null}
				</div>
			))}
		</div>
	);
}
