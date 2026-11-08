// DrawerRow 行下的动作抽屉: 动作按钮按语义色铺开, 最后一个吃满剩余宽度, 划开时文字淡入.
import type { JSX, ReactNode, RefObject } from "react";
import { cn } from "../../../../primitives/utils";
import { DISMISS_EASE_OUT, ROW } from "../../tokens";

export type DismissTone = "destructive" | "primary" | "neutral";

export interface DrawerRowAction {
	readonly id: string;
	readonly label: string;
	readonly icon?: ReactNode;
	readonly tone?: DismissTone;
}

export const TONE_CLASS: Record<DismissTone, string> = {
	destructive: "bg-destructive text-destructive-foreground",
	primary: "bg-primary text-primary-foreground",
	neutral: "bg-secondary text-secondary-foreground",
};

interface DrawerActionsProps {
	readonly drawerRef: RefObject<HTMLDivElement | null>;
	readonly actions: readonly DrawerRowAction[];
	readonly actionTone: DismissTone;
	readonly actionWidth: number;
	readonly fromLeft: boolean;
	readonly open: boolean;
	readonly revealed: boolean;
	readonly disabled: boolean;
	readonly onRun: (action: DrawerRowAction) => void;
}

export function DrawerActions({ drawerRef, actions, actionTone, actionWidth, fromLeft, open, revealed, disabled, onRun }: DrawerActionsProps): JSX.Element {
	return (
		<div
			ref={drawerRef}
			data-slot="drawer-row-actions"
			aria-hidden={open ? undefined : true}
			className={cn("absolute inset-y-0 flex", fromLeft ? "right-0 flex-row" : "left-0 flex-row-reverse")}
			style={{ width: actions.length * actionWidth }}
		>
			{actions.map((action, index) => (
				<button
					key={action.id}
					type="button"
					tabIndex={open ? 0 : -1}
					disabled={disabled}
					onClick={() => onRun(action)}
					className={cn(
						"flex h-full min-w-0 items-center justify-center gap-1.5 text-sm font-medium outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset active:scale-[0.96] motion-reduce:transition-none",
						TONE_CLASS[action.tone ?? actionTone],
						index === actions.length - 1 ? "flex-1" : "shrink-0",
					)}
					style={{ width: actionWidth, transition: `transform ${ROW.pressMs}ms ${DISMISS_EASE_OUT}` }}
				>
					<span
						className="flex items-center gap-1.5 motion-reduce:transition-none"
						style={{ opacity: revealed || open ? 1 : 0, transition: `opacity ${ROW.fadeMs}ms ease` }}
					>
						{action.icon}
						{action.label}
					</span>
				</button>
			))}
		</div>
	);
}
