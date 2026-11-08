// FlickNotice 的卡片本体: 图标, 标题与描述, 动作键, 关闭键, 剩余时间引信条. 指针事件交给父组件的拖动处理.
import type { JSX, PointerEvent, ReactNode, RefObject } from "react";
import { cn } from "../../../../primitives/utils";
import { DISMISS_EASE_OUT, NOTICE } from "../../tokens";

export type NoticeFuse = "bottom" | "top" | "none";
export type NoticeTone = "neutral" | "warning" | "primary" | "destructive";

const FUSE_CLASS: Record<NoticeTone, string> = {
	neutral: "bg-muted-foreground",
	warning: "bg-warning",
	primary: "bg-primary",
	destructive: "bg-destructive",
};

const BUTTON = "button";

type CardPointer = (event: PointerEvent<HTMLDivElement>) => void;

interface NoticeCardProps {
	readonly cardRef: RefObject<HTMLDivElement | null>;
	readonly fuseRef: RefObject<HTMLSpanElement | null>;
	readonly title: ReactNode;
	readonly description?: ReactNode;
	readonly icon?: ReactNode;
	readonly actionLabel?: string;
	readonly closeButton: boolean;
	readonly fuse: NoticeFuse;
	readonly fuseTone: NoticeTone;
	readonly showFuse: boolean;
	readonly radius: number;
	readonly onAction: () => void;
	readonly onClose: () => void;
	readonly onPointerDown: CardPointer;
	readonly onPointerMove: CardPointer;
	readonly onPointerEnd: CardPointer;
}

export function NoticeCard(props: NoticeCardProps): JSX.Element {
	const { cardRef, fuseRef, title, description, icon, actionLabel, closeButton, fuse, fuseTone, showFuse, radius, onAction, onClose, onPointerDown, onPointerMove, onPointerEnd } = props;
	return (
		<div
			ref={cardRef}
			data-slot="flick-notice-card"
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerEnd}
			onPointerCancel={onPointerEnd}
			className="relative flex touch-none select-none items-start gap-3 overflow-hidden border border-border bg-popover px-4 py-3 text-popover-foreground shadow-lg"
			style={{ borderRadius: radius }}
		>
			{icon ? <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span> : null}
			<div className="min-w-0 flex-1">
				<div className="text-sm font-medium">{title}</div>
				{description ? <div className="mt-0.5 text-xs text-muted-foreground">{description}</div> : null}
			</div>
			{actionLabel ? (
				<button
					type={BUTTON}
					onClick={onAction}
					className="shrink-0 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent active:scale-[0.97] motion-reduce:transition-none"
					style={{ transition: `transform ${NOTICE.buttonMs}ms ${DISMISS_EASE_OUT}, background-color ${NOTICE.buttonMs}ms ease` }}
				>
					{actionLabel}
				</button>
			) : null}
			{closeButton ? (
				<button
					type={BUTTON}
					aria-label="Close"
					onClick={onClose}
					className="shrink-0 rounded-md px-1 text-muted-foreground hover:text-foreground"
					style={{ transition: `color ${NOTICE.buttonMs}ms ease` }}
				>
					<span aria-hidden="true">x</span>
				</button>
			) : null}
			{showFuse ? (
				<span
					ref={fuseRef}
					aria-hidden="true"
					data-slot="flick-notice-fuse"
					className={cn("absolute inset-x-0 h-px origin-left", fuse === "top" ? "top-0" : "bottom-0", FUSE_CLASS[fuseTone])}
				/>
			) : null}
		</div>
	);
}
