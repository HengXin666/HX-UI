"use client";

// 行为规格参照 docs/research/catalog/micro.md 的 SwipeToast 条目, 仅作出处说明; 实现与命名为 HX 自有.
import { useEffect, useLayoutEffect, useRef, useState, type JSX, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { makeAxis, snapAxis } from "../../../motion/drive/axis";
import { DISMISS_EASE_OUT, NOTICE } from "../tokens";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { NoticeCard, type NoticeFuse, type NoticeTone } from "./parts/NoticeCard";
import { fuseLeft, noticeFadeOpacity, stepNoticeY } from "./parts/notice-motion";
import { useNoticeDrag } from "./parts/use-notice-drag";
import { noticeTimings } from "./swipe-math";

export type { NoticeFuse, NoticeTone } from "./parts/NoticeCard";

/** 本文件内重复出现的字面量, 只写一次. */
const ENTER = "enter";
const GONE = "gone";
const CLOSE = "close";
const EXIT = "exit";
const OPEN = "open";
const SWIPE = "swipe";

export type NoticeCloseReason = "swipe" | "timeout" | "close" | "action" | "escape";

export interface FlickNoticeProps {
	title?: ReactNode;
	description?: ReactNode;
	icon?: ReactNode;
	actionLabel?: string;
	onAction?: () => void;
	open?: boolean;
	onClose?: (reason: NoticeCloseReason) => void;
	/** 引信条的语义色 (规格 fuseColor). 卡片底色与文字固定走 popover token. */
	fuseTone?: NoticeTone;
	width?: number;
	radius?: number;
	slideMs?: number;
	settleBounce?: number;
	swipeDistance?: number;
	/** 自动关闭毫秒数, 0 表示不自动关闭. */
	duration?: number;
	fuse?: NoticeFuse;
	pauseOnHover?: boolean;
	closeButton?: boolean;
	/** 为真时在文档流里渲染, 否则固定在视口底部居中. */
	inline?: boolean;
	dismissible?: boolean;
	className?: string;
}

type Phase = "enter" | "open" | "exit" | "gone";

/** 可下划关闭的通知卡. 引信条显示剩余时间, 悬停, 聚焦, 拖动或切到后台时暂停. */
export function FlickNotice({
	title = "File archived",
	description,
	icon,
	actionLabel,
	onAction,
	open = true,
	onClose,
	fuseTone = "warning",
	width = NOTICE.width,
	radius = NOTICE.radius,
	slideMs = NOTICE.slideMs,
	settleBounce = NOTICE.settleBounce,
	swipeDistance = NOTICE.swipeDistance,
	duration = NOTICE.duration,
	fuse = "bottom",
	pauseOnHover = true,
	closeButton = false,
	inline = false,
	dismissible = true,
	className,
}: FlickNoticeProps): JSX.Element | null {
	const reduced = useReducedMotion();
	const [phase, setPhase] = useState<Phase>(open ? ENTER : GONE);
	const cardRef = useRef<HTMLDivElement>(null);
	const fuseRef = useRef<HTMLSpanElement>(null);
	const y = useRef(makeAxis());
	const fade = useRef({ start: 0, active: false });
	const throwing = useRef(false);
	const elapsed = useRef(0);
	const holds = useRef({ hover: false, focus: false, drag: false });
	const reason = useRef<NoticeCloseReason>(CLOSE);
	const timings = noticeTimings(slideMs);

	const paint = (): void => {
		const card = cardRef.current;
		if (!card) return;
		card.style.transform = `translate3d(0, ${y.current.current}px, 0)`;
		if (fade.current.active) card.style.opacity = String(noticeFadeOpacity(fade.current.start, performance.now()));
	};

	const finish = (why: NoticeCloseReason): void => {
		reason.current = why;
		throwing.current = false;
		setPhase(EXIT);
	};

	const paused = (): boolean =>
		holds.current.drag || holds.current.focus || (pauseOnHover && holds.current.hover) || document.visibilityState === "hidden";

	const loop = useFrameLoop((dt, now) => {
		let busy = stepNoticeY(y.current, throwing.current, holds.current.drag, settleBounce, dt);
		if (fade.current.active) {
			busy = true;
			if (now - fade.current.start >= NOTICE.fadeMs) {
				fade.current.active = false;
				finish(SWIPE);
			}
		}
		paint();
		if (phase === OPEN && duration > 0 && !throwing.current) {
			if (!paused()) elapsed.current += dt;
			if (fuseRef.current) fuseRef.current.style.transform = `scaleX(${fuseLeft(elapsed.current, duration)})`;
			if (elapsed.current >= duration) {
				finish("timeout");
				return false;
			}
			busy = true;
		}
		return busy;
	});

	useLayoutEffect(() => {
		if (open && phase === GONE) {
			elapsed.current = 0;
			snapAxis(y.current, 0);
			setPhase(ENTER);
		} else if (!open && (phase === OPEN || phase === ENTER)) {
			reason.current = CLOSE;
			setPhase(EXIT);
		}
	}, [open, phase]);

	useEffect(() => {
		if (phase === ENTER) {
			const id = requestAnimationFrame(() => setPhase(OPEN));
			return () => cancelAnimationFrame(id);
		}
		if (phase === OPEN) loop.wake();
		if (phase !== EXIT) return undefined;
		const ms = reduced ? 0 : timings.exit + NOTICE.collapseMs;
		const timer = window.setTimeout(() => {
			setPhase(GONE);
			if (open || reason.current !== CLOSE) onClose?.(reason.current);
		}, ms);
		return () => window.clearTimeout(timer);
		// 阶段机只由 phase 推进; 回调与时长读最新值即可
	}, [phase]);

	useEffect(() => {
		const onVisible = (): void => loop.wake();
		document.addEventListener("visibilitychange", onVisible);
		return () => document.removeEventListener("visibilitychange", onVisible);
	}, [loop]);

	const enabled = dismissible && phase === OPEN;
	const { onPointerDown, onPointerMove, onPointerEnd } = useNoticeDrag({ y, cardRef, holds, throwing, fade, enabled, reduced, swipeDistance, paint, wake: () => loop.wake(), finishSwipe: () => finish(SWIPE) });

	if (phase === GONE) return null;

	const dismiss = (why: NoticeCloseReason): void => {
		if (phase === EXIT) return;
		finish(why);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		if (event.key === "Escape" && dismissible) {
			event.preventDefault();
			dismiss("escape");
		}
	};

	const shown = phase === OPEN;
	const leaving = phase === EXIT;
	const outer = leaving ? timings.exit : timings.enter;
	const opacityMs = leaving ? timings.exitFade : timings.enterFade;
	return (
		<div
			data-slot="flick-notice"
			data-phase={phase}
			className={cn(inline ? "relative" : "fixed inset-x-0 bottom-4 z-(--z-toast) flex justify-center", "pointer-events-none")}
			style={{
				display: "grid",
				gridTemplateRows: leaving ? "0fr" : "1fr",
				transition: reduced ? undefined : `grid-template-rows ${NOTICE.collapseMs}ms ${DISMISS_EASE_OUT} ${leaving ? outer : 0}ms`,
			}}
		>
			<div className="min-h-0">
				<div
					role="status"
					aria-live="polite"
					aria-atomic="true"
					tabIndex={-1}
					onPointerEnter={() => {
						holds.current.hover = true;
					}}
					onPointerLeave={() => {
						holds.current.hover = false;
					}}
					onFocus={() => {
						holds.current.focus = true;
					}}
					onBlur={() => {
						holds.current.focus = false;
					}}
					onKeyDown={onKeyDown}
					className="pointer-events-auto mx-auto motion-reduce:transition-none"
					style={{
						width,
						transform: shown ? "translate3d(0, 0, 0)" : "translate3d(0, calc(100% + 16px), 0)",
						opacity: shown ? 1 : 0,
						transition: reduced ? undefined : `transform ${outer}ms ${DISMISS_EASE_OUT}, opacity ${opacityMs}ms ease`,
					}}
				>
					<NoticeCard
						cardRef={cardRef}
						fuseRef={fuseRef}
						title={title}
						description={description}
						icon={icon}
						actionLabel={actionLabel}
						closeButton={closeButton}
						fuse={fuse}
						fuseTone={fuseTone}
						showFuse={fuse !== "none" && duration > 0}
						radius={radius}
						onAction={() => {
							onAction?.();
							dismiss("action");
						}}
						onClose={() => dismiss(CLOSE)}
						onPointerDown={onPointerDown}
						onPointerMove={onPointerMove}
						onPointerEnd={onPointerEnd}
					/>
				</div>
			</div>
		</div>
	);
}
