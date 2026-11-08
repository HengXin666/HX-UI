"use client";

// 行为规格参照 docs/research/catalog/micro.md 的 Shredder 条目, 仅作出处说明; 实现与命名为 HX 自有.
import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { clamp } from "../feel";
import { SHRED } from "../tokens";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { moveItem, stackDelay } from "./discard-math";
import { ShredStrips } from "./parts/shred/ShredStrips";
import { paintCard, paintFeed } from "./parts/shred/shred-paint";
import { feedThrough, newFeed, stepCard, stepFeed, type Feed } from "./parts/shred/shred-sim";
import { useShredDrag } from "./parts/shred/use-shred-drag";
import { useShredStack } from "./parts/shred/use-shred-stack";

/** 本文件内重复出现的字面量, 只写一次. */
const TWO = 2;
const NEG_ONE = -1;
const ARIA_TRUE = "true";

export interface ShredItem {
	readonly id: string;
}

export interface ShredBinProps<T extends ShredItem> {
	items?: readonly T[];
	renderItem: (item: T) => ReactNode;
	onShred?: (item: T) => void;
	onReorder?: (items: T[]) => void;
	width?: number;
	height?: number;
	inset?: number;
	gap?: number;
	slitHeight?: number;
	fallHeight?: number;
	feedSpeed?: number;
	bite?: number;
	/** 为假时只有按住送入中的纸才继续往里走. */
	autoFeed?: boolean;
	stripWidth?: number;
	curl?: number;
	/** 演示模式: 空闲时自动把最上面一张送进去. */
	autoAnimate?: boolean;
	/** 演示模式下送完后重新装满. */
	loop?: boolean;
	/** 用户删完最后一张后重新装满. */
	loopAfterDelete?: boolean;
	dragTilt?: number;
	lift?: number;
	disabled?: boolean;
	label?: string;
	className?: string;
}

const AUTO_IDLE_MS = 600;
const MS = 1000;

/**
 * 碎纸机: 卡片堆在刀口上方, 拖过刀口或按 Delete 送入, 下方吐出成条的碎纸; 拖动中也可上下重排.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-dismiss.md
 */
export function ShredBin<T extends ShredItem>({
	items = [],
	renderItem,
	onShred,
	onReorder,
	width = SHRED.width,
	height = SHRED.height,
	inset = SHRED.inset,
	gap = SHRED.gap,
	slitHeight = SHRED.slitHeight,
	fallHeight = SHRED.fallHeight,
	feedSpeed = SHRED.feedSpeed,
	bite = SHRED.bite,
	autoFeed = true,
	stripWidth = SHRED.stripWidth,
	curl = SHRED.curl,
	autoAnimate = false,
	loop = false,
	loopAfterDelete = false,
	dragTilt = SHRED.dragTilt,
	lift = SHRED.lift,
	disabled = false,
	label = "Shredder",
	className,
}: ShredBinProps<T>): JSX.Element {
	const reduced = useReducedMotion();
	const [list, setList] = useState<T[]>(() => items.slice());
	const [feed, setFeed] = useState<Feed<T> | null>(null);
	const [, redraw] = useState(0);
	const slitY = height - fallHeight - slitHeight;
	const feedRef = useRef<Feed<T> | null>(null);
	const feedEl = useRef<HTMLDivElement>(null);
	const stripEls = useRef<Array<HTMLDivElement | null>>([]);
	const pressing = useRef(false);
	const listRef = useRef(list);
	listRef.current = list;

	useEffect(() => setList(items.slice()), [items]);

	const { cards, sims, heights, slots, simFor } = useShredStack(list, inset, gap, reduced, () => frame.wake());

	const reorder = (moved: T[]): void => {
		setList(moved);
		onReorder?.(moved);
	};

	const blocked = (): boolean => disabled || feedRef.current !== null;
	const { grab, onPointerDown, onPointerMove, onPointerUp } = useShredDrag<T>({ sims, heights, listRef, slots, slitY, dragTilt, lift, blocked, reorder, shred: (item) => shred(item), wake: () => frame.wake() });

	const frame = useFrameLoop((dtMs, now) => {
		const dt = clamp(dtMs / MS, 0, SHRED.maxDtS);
		let busy = false;
		const order = listRef.current;
		const tops = slots(order);
		order.forEach((item, i) => {
			const sim = simFor(item.id, tops[i], i);
			if (stepCard(sim, tops[i], grab.current?.id === item.id, dt, dtMs)) busy = true;
			paintCard(cards.current.get(item.id), sim);
		});
		const f = feedRef.current;
		if (f) {
			busy = true;
			stepFeed(f, dt, { width, slitY, feeding: autoFeed || pressing.current, feedSpeed, bite });
			paintFeed(f, feedEl.current, stripEls.current, curl);
			if (feedThrough(f) && !f.fadeAt) {
				f.fadeAt = now;
				redraw((n) => n + 1);
			}
			if (f.fadeAt && now - f.fadeAt >= SHRED.fadeMs) finishFeed(f);
		}
		return busy;
	});

	const finishFeed = (f: Feed<T>): void => {
		feedRef.current = null;
		sims.current.delete(f.item.id);
		setFeed(null);
		onShred?.(f.item);
	};

	const shred = (item: T): void => {
		if (disabled || feedRef.current) return;
		const index = listRef.current.findIndex((entry) => entry.id === item.id);
		if (index < 0) return;
		const rest = listRef.current.filter((entry) => entry.id !== item.id);
		rest.forEach((entry, i) => {
			const sim = sims.current.get(entry.id);
			if (sim) sim.delay = stackDelay(i, index + 1);
		});
		setList(rest);
		if (loopAfterDelete && rest.length === 0 && !autoAnimate) window.setTimeout(() => setList(items.slice()), SHRED.fadeMs);
		if (reduced) {
			sims.current.delete(item.id);
			onShred?.(item);
			return;
		}
		const sim = sims.current.get(item.id);
		const el = cards.current.get(item.id);
		const w = el?.offsetWidth ?? width - inset * TWO;
		const h = heights.current.get(item.id) ?? 0;
		const f = newFeed(item, inset + (sim?.dx ?? 0), (sim?.y.current ?? 0) + (sim?.dy ?? 0), w, h, stripWidth);
		feedRef.current = f;
		stripEls.current = [];
		setFeed(f);
		frame.wake();
	};

	useEffect(() => {
		if (!autoAnimate || feed || disabled) return undefined;
		const timer = window.setTimeout(() => {
			if (listRef.current.length > 0) shred(listRef.current[0]);
			else if (loop) setList(items.slice());
		}, AUTO_IDLE_MS);
		return () => window.clearTimeout(timer);
	});

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, item: T, index: number): void => {
		if (disabled) return;
		if (event.key === "Delete" || event.key === "Backspace") shred(item);
		else if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
			const to = clamp(index + (event.key === "ArrowUp" ? NEG_ONE : 1), 0, list.length - 1);
			if (to === index) return;
			reorder(moveItem(list, index, to));
		} else return;
		event.preventDefault();
	};

	return (
		<div
			data-slot="shred-bin"
			role="group"
			aria-label={label}
			className={cn("relative select-none overflow-hidden rounded-xl border border-border bg-muted", className)}
			style={{ width, height }}
		>
			<div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: slitY }}>
				<div role="list" aria-label={label}>
					{list.map((item, index) => (
						<div
							key={item.id}
							role="listitem"
							tabIndex={disabled ? NEG_ONE : 0}
							aria-keyshortcuts="Delete Alt+ArrowUp Alt+ArrowDown"
							ref={(el) => {
								if (el) cards.current.set(item.id, el);
								else cards.current.delete(item.id);
							}}
							onPointerDown={(event) => onPointerDown(event, item, index)}
							onPointerMove={onPointerMove}
							onPointerUp={(event) => onPointerUp(event, item)}
							onPointerCancel={(event) => onPointerUp(event, item)}
							onKeyDown={(event) => onKeyDown(event, item, index)}
							className="absolute top-0 touch-none outline-none focus-visible:ring-1 focus-visible:ring-ring"
							style={{ left: inset, right: inset }}
						>
							{renderItem(item)}
						</div>
					))}
				</div>
				{feed ? (
					<div
						ref={feedEl}
						aria-hidden={ARIA_TRUE}
						onPointerDown={() => {
							pressing.current = true;
						}}
						onPointerUp={() => {
							pressing.current = false;
						}}
						className="absolute left-0 top-0"
						style={{ width: feed.w }}
					>
						{renderItem(feed.item)}
					</div>
				) : null}
			</div>
			<div
				aria-hidden={ARIA_TRUE}
				data-slot="shred-bin-slit"
				className="absolute inset-x-0 bg-foreground/40"
				style={{ top: slitY, height: slitHeight, filter: feed ? "brightness(1.4)" : undefined, transition: `filter ${SHRED.slitFilterMs}ms ease` }}
			/>
			<ShredStrips feed={feed} stripEls={stripEls} top={slitY + slitHeight} height={fallHeight} renderItem={renderItem} />
		</div>
	);
}
