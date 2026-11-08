/** ChimeToggle 的图标区: 铃身与铃舌, 两侧声波, 计数徽标. 动画由父组件对 ref 驱动. */
import type { JSX, ReactNode, RefObject } from "react";
import { PROP_OPACITY, PROP_TRANSFORM, PX, SPEC_EASE_POP, toneVar, transition, type ChoiceTone } from "../../tone";
import { CHIME_BELL_BODY, CHIME_MS } from "./chime-spec";

const NONE = "none";
const HALF = 2;
const HIDE = 0;

interface ChimeBellProps {
	readonly bell: RefObject<SVGGElement | null>;
	readonly tongue: RefObject<SVGGElement | null>;
	readonly waveLeft: RefObject<HTMLSpanElement | null>;
	readonly waveRight: RefObject<HTMLSpanElement | null>;
	readonly icon?: ReactNode;
	readonly iconSize: number;
	readonly badgeSize: number;
	readonly ringPivot: number;
	readonly clapper: boolean;
	readonly waves: boolean;
	readonly count: number;
	readonly showBadge: boolean;
	readonly badgeTone: ChoiceTone;
	readonly badgeTextTone: ChoiceTone;
	readonly reduced: boolean;
}

export function ChimeBell({ bell, tongue, waveLeft, waveRight, icon, iconSize, badgeSize, ringPivot, clapper, waves, count, showBadge, badgeTone, badgeTextTone, reduced }: ChimeBellProps): JSX.Element {
	const pivot = { transformOrigin: "50% " + ringPivot + "%", transformBox: "view-box" } as const;
	return (
		<span aria-hidden className="relative inline-flex shrink-0" style={{ width: iconSize + PX, height: iconSize + PX }}>
			{icon ?? (
				<svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill={NONE} stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round">
					<g ref={bell} style={pivot}>
						<path d={CHIME_BELL_BODY} />
						{clapper ? (
							<g ref={tongue} style={pivot}>
								<circle cx={12} cy={20.5} r={1.6} fill="currentColor" stroke={NONE} />
							</g>
						) : null}
					</g>
				</svg>
			)}
			{waves && !icon ? (
				<>
					<span ref={waveLeft} className="pointer-events-none absolute -left-1 top-0 h-full w-1 rounded-l-full border-l border-current opacity-0" />
					<span ref={waveRight} className="pointer-events-none absolute -right-1 top-0 h-full w-1 rounded-r-full border-r border-current opacity-0" />
				</>
			) : null}
			<span
				className="absolute -right-1.5 -top-1.5 inline-flex items-center justify-center rounded-full px-1 font-semibold leading-none tabular-nums"
				style={{
					minWidth: badgeSize + PX,
					height: badgeSize + PX,
					fontSize: badgeSize / HALF + PX,
					backgroundColor: toneVar(badgeTone),
					color: toneVar(badgeTextTone),
					opacity: showBadge ? 1 : HIDE,
					transform: "scale(" + (showBadge || reduced ? 1 : HIDE) + ")",
					transition: [transition(PROP_TRANSFORM, reduced ? 0 : CHIME_MS.badgeMove, SPEC_EASE_POP), transition(PROP_OPACITY, CHIME_MS.badgeFade)].join(", "),
				}}
			>
				{count > 0 ? count : null}
			</span>
		</span>
	);
}
