"use client";

// 行为规格参照 docs/research/catalog/micro.md 的 SwipeRow 条目, 仅作出处说明; 实现与命名为 HX 自有.
import { useEffect, useRef, useState, type CSSProperties, type JSX, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { makeAxis, snapAxis } from "../../../motion/drive/axis";
import { DISMISS_EASE_OUT, ROW } from "../tokens";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { DrawerActions, type DismissTone, type DrawerRowAction } from "./parts/DrawerActions";
import { DRAWER_IDLE, drawerSpring, stepDrawerMotion, type DrawerMotion } from "./parts/drawer-motion";
import { useDrawerDrag } from "./parts/use-drawer-drag";
import { rowSign, type RowDirection } from "./swipe-math";

export { TONE_CLASS, type DismissTone, type DrawerRowAction } from "./parts/DrawerActions";

const LEFT = "left";

export interface DrawerRowProps {
	children?: ReactNode;
	actions?: readonly DrawerRowAction[];
	/** 动作底色的语义色 (规格 actionColor). 抽屉与行底色固定走 muted / card token. */
	actionTone?: DismissTone;
	height?: number;
	radius?: number;
	actionWidth?: number;
	direction?: RowDirection;
	snapBounce?: number;
	resistance?: number;
	collapseMs?: number;
	commitAt?: number;
	fullSwipe?: boolean;
	disabled?: boolean;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	onAction?: (action: DrawerRowAction) => void;
	onCommit?: (action: DrawerRowAction) => void;
	closeOnAction?: boolean;
	haptic?: boolean;
	label?: string;
	className?: string;
	style?: CSSProperties;
}

const DEFAULT_ACTIONS: readonly DrawerRowAction[] = [{ id: "delete", label: "Delete" }];

/**
 * 可左右划开的列表行. 拖动先判轴, 横向才接管; 松手按惯性投射决定开, 合或整行划走.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-dismiss.md
 */
export function DrawerRow({
	children,
	actions = DEFAULT_ACTIONS,
	actionTone = "destructive",
	height = ROW.height,
	radius = ROW.radius,
	actionWidth = ROW.actionWidth,
	direction = LEFT,
	snapBounce = ROW.snapBounce,
	resistance = ROW.resistance,
	collapseMs = ROW.collapseMs,
	commitAt = ROW.commitAt,
	fullSwipe = true,
	disabled = false,
	open,
	defaultOpen = false,
	onOpenChange,
	onAction,
	onCommit,
	closeOnAction = true,
	haptic = true,
	label = "List item",
	className,
	style,
}: DrawerRowProps): JSX.Element {
	const reduced = useReducedMotion();
	const [innerOpen, setInnerOpen] = useState(defaultOpen);
	const [folded, setFolded] = useState(false);
	const [revealed, setRevealed] = useState(defaultOpen);
	const isOpen = open ?? innerOpen;
	const drawer = actions.length * actionWidth;
	const sign = rowSign(direction);
	const rootRef = useRef<HTMLDivElement>(null);
	const rowRef = useRef<HTMLDivElement>(null);
	const drawerRef = useRef<HTMLDivElement>(null);
	const x = useRef(makeAxis(isOpen ? drawer : 0));
	const motion = useRef<DrawerMotion>(DRAWER_IDLE);
	const commitAction = actions[actions.length - 1] ?? DEFAULT_ACTIONS[0];

	const paint = (value: number): void => {
		if (rowRef.current) rowRef.current.style.transform = `translate3d(${sign * value}px, 0, 0)`;
		if (drawerRef.current) drawerRef.current.style.width = `${Math.max(drawer, value)}px`;
	};

	const loop = useFrameLoop((dt, now) => {
		const { next, running } = stepDrawerMotion(motion.current, x.current, dt, now, paint);
		motion.current = next;
		return running;
	});

	const setOpen = (next: boolean): void => {
		setRevealed(next);
		if (open === undefined) setInnerOpen(next);
		if (next !== isOpen) onOpenChange?.(next);
	};

	const settle = (next: boolean, velocity = 0): void => {
		setOpen(next);
		x.current.target = next ? drawer : 0;
		x.current.velocity = velocity;
		if (reduced) {
			snapAxis(x.current, x.current.target);
			paint(x.current.current);
			return;
		}
		motion.current = drawerSpring(next, snapBounce);
		loop.wake();
	};

	const fold = (action: DrawerRowAction): void => {
		setFolded(true);
		const finish = (): void => onCommit?.(action);
		if (reduced || collapseMs <= 0) finish();
		else window.setTimeout(finish, collapseMs);
	};

	const commit = (action: DrawerRowAction = commitAction): void => {
		if (haptic) navigator.vibrate?.(ROW.hapticMs);
		const width = rootRef.current?.offsetWidth ?? drawer;
		if (reduced) {
			fold(action);
			return;
		}
		motion.current = { kind: "tween", from: x.current.current, to: width, start: performance.now(), done: () => fold(action) };
		loop.wake();
	};

	const halt = (): void => {
		motion.current = DRAWER_IDLE;
		loop.stop();
	};
	const reveal = (value: number): void => {
		if (!revealed && value > 0) setRevealed(true);
	};
	const { grip, onPointerDown, onPointerMove, onPointerEnd } = useDrawerDrag({ x, rootRef, sign, drawer, resistance, fullSwipe, commitAt, haptic, blocked: disabled || folded, paint, halt, reveal, settle, commit });

	useEffect(() => {
		if (grip.current) return;
		settle(isOpen);
		// 只跟外部 open 与抽屉宽度同步, settle 每次渲染都是新函数, 不进依赖
	}, [isOpen, drawer]);

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		if (disabled || folded || event.target !== event.currentTarget) return;
		const reveal = direction === LEFT ? "ArrowLeft" : "ArrowRight";
		const hide = direction === LEFT ? "ArrowRight" : "ArrowLeft";
		if (event.key === reveal) settle(true);
		else if (event.key === hide || event.key === "Escape") settle(false);
		else if (fullSwipe && (event.key === "Delete" || event.key === "Backspace")) commit();
		else return;
		event.preventDefault();
	};

	const runAction = (action: DrawerRowAction): void => {
		onAction?.(action);
		if (closeOnAction) settle(false);
	};

	return (
		<div
			ref={rootRef}
			data-slot="drawer-row"
			data-open={isOpen ? "" : undefined}
			className={cn("relative overflow-hidden bg-muted", className)}
			style={{
				height: folded ? 0 : height,
				borderRadius: radius,
				opacity: folded ? 0 : 1,
				transition: reduced ? undefined : `height ${collapseMs}ms ${DISMISS_EASE_OUT}, opacity ${collapseMs}ms ease`,
				...style,
			}}
		>
			<DrawerActions
				drawerRef={drawerRef}
				actions={actions}
				actionTone={actionTone}
				actionWidth={actionWidth}
				fromLeft={direction === LEFT}
				open={isOpen}
				revealed={revealed}
				disabled={disabled}
				onRun={runAction}
			/>
			<div
				ref={rowRef}
				role="group"
				tabIndex={disabled ? -1 : 0}
				aria-label={label}
				aria-disabled={disabled || undefined}
				aria-keyshortcuts={fullSwipe ? "ArrowLeft ArrowRight Escape Delete" : "ArrowLeft ArrowRight Escape"}
				data-slot="drawer-row-surface"
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerEnd}
				onPointerCancel={onPointerEnd}
				onKeyDown={onKeyDown}
				className="relative flex h-full touch-pan-y select-none items-center bg-card px-4 text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset"
				style={{ borderRadius: radius }}
			>
				{children}
			</div>
		</div>
	);
}
