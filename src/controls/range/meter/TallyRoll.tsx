// 行为规格参照 docs/research/catalog/components-1.md 的 Counter 条目, 实现为 HX 自有.
// 按位滚动的数字: 每位一条 0 到 9 的条带, 高位先动, 停在整数格; 分组符与小数点是静止槽.
"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { DIGIT_MS, DIGIT_STAGGER_MS } from "../../../craft/tokens";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { toneVar, type RangeTone } from "../tokens";
import { TALLY_INTRO_THRESHOLD, TALLY_STRIP, tallyAt, tallyBlur, tallyCell, tallyFormatter, tallyGap, tallyGlyphs } from "./tally-digits";
import { tallyHeading, tallyOvershoot, tallyTarget, type TallyDirection, type TallyRun } from "./tally-digits";

/** 合同: 每位宽 0.62em, 高 1.2em. */
const CELL_EM = 1.2;
const SLOT_WIDTH = "0.62em";
const SLOT_HEIGHT = `${CELL_EM}em`;
const PERCENT = 100;
const HALF = 0.5;
const BLUR_VISIBLE_PX = 0.05;
const FALLBACK_FONT_PX = 16;

export interface TallyRollProps {
	readonly value?: number;
	readonly locale?: string;
	/** 追加给 Intl.NumberFormat 的选项 (货币, 百分比, 紧凑写法). */
	readonly format?: Intl.NumberFormatOptions;
	/** 固定小数位. 不给时按 locale 默认. */
	readonly decimals?: number;
	/** 整数部分最少位数, 不足补 0. */
	readonly minDigits?: number;
	readonly prefix?: ReactNode;
	readonly suffix?: ReactNode;
	/** auto 跟值的增减走; up / down 固定滚向. */
	readonly direction?: TallyDirection;
	/** 每位滚动时长 (ms). */
	readonly duration?: number;
	/** 0 到 1. 0.2 及以上即合同的过冲上限 0.06 位. */
	readonly bounce?: number;
	/** 位间错峰上限 (ms), 另受时长 40% 的总量上限. */
	readonly stagger?: number;
	readonly motionBlur?: boolean;
	/** 首次进入视口一半时从 0 滚到值. */
	readonly intro?: boolean;
	/** 窗口上下边的渐隐占比 (0 到 1). */
	readonly fade?: number;
	readonly fontSize?: number | string;
	readonly fontWeight?: CSSProperties["fontWeight"];
	/** 不给时跟随文字色. */
	readonly tone?: RangeTone;
	/** 位间距 (px). */
	readonly gap?: number;
	/** 外层内边距 (px). */
	readonly padding?: number;
	readonly tabular?: boolean;
	/** 为 true 时显示终值宽度的骨架, 版面不被挤开. */
	readonly loading?: boolean;
	readonly digitClassName?: string;
	readonly className?: string;
	readonly style?: CSSProperties;
}

interface Track extends TallyRun {
	position: number;
}

function stripTransform(position: number): string {
	return `translateY(${-tallyCell(position) * CELL_EM}em)`;
}

function fadeMask(fade: number): string | undefined {
	const edge = Math.min(HALF, Math.max(0, fade) * HALF) * PERCENT;
	if (edge <= 0) return undefined;
	return `linear-gradient(to bottom, transparent, currentColor ${edge}%, currentColor ${PERCENT - edge}%, transparent)`;
}

export function TallyRoll({
	value = 0,
	locale = "en-US",
	format,
	decimals,
	minDigits = 1,
	prefix,
	suffix,
	direction = "auto",
	duration = DIGIT_MS,
	bounce = 0.2,
	stagger = DIGIT_STAGGER_MS,
	motionBlur = true,
	intro = true,
	fade = 0.3,
	fontSize,
	fontWeight,
	tone,
	gap = 0,
	padding = 0,
	tabular = true,
	loading = false,
	digitClassName,
	className,
	style,
}: TallyRollProps): JSX.Element {
	const reduced = useReducedMotion();
	const formatKey = JSON.stringify([locale, decimals, minDigits, format]);
	// formatKey 已经覆盖 format 的内容, 调用方每次传新对象也不重建
	const formatter = useMemo(() => tallyFormatter({ locale, decimals, minDigits, format }), [formatKey]);
	const text = formatter.format(value);
	const glyphs = useMemo(() => tallyGlyphs(value, formatter), [value, formatter]);
	const rootRef = useRef<HTMLSpanElement>(null);
	const strips = useRef(new Map<string, HTMLSpanElement>());
	const blurs = useRef(new Map<string, SVGFEGaussianBlurElement>());
	const tracks = useRef(new Map<string, Track>());
	const previous = useRef(value);
	const mounted = useRef(false);
	const [armed, setArmed] = useState(!intro);
	const loop = useFrameLoop();
	const uid = useId().replace(/[^\w-]/g, "");
	const live = !reduced && !loading;

	useEffect(() => {
		const node = rootRef.current;
		if (armed || !live || !node) return undefined;
		if (typeof IntersectionObserver === "undefined") {
			setArmed(true);
			return undefined;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.intersectionRatio >= TALLY_INTRO_THRESHOLD)) setArmed(true);
			},
			{ threshold: TALLY_INTRO_THRESHOLD },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [armed, live]);

	useEffect(() => {
		const digits = glyphs.filter((g) => g.kind === "digit");
		const keys = new Set(digits.map((g) => g.key));
		for (const key of [...tracks.current.keys()]) if (!keys.has(key)) tracks.current.delete(key);
		if (!live || !armed) {
			loop.stop();
			for (const g of digits) tracks.current.set(g.key, { position: armed ? g.digit : 0, from: 0, to: 0, start: 0, delay: 0 });
			mounted.current = true;
			return;
		}
		const now = performance.now();
		const heading = tallyHeading(direction, previous.current, value);
		previous.current = value;
		const spacing = tallyGap(digits.length, duration, stagger);
		for (const g of digits) {
			// 挂上时已在终值; 之后新长出来的高位从 0 滚入
			const position = tracks.current.get(g.key)?.position ?? (mounted.current ? 0 : g.digit);
			tracks.current.set(g.key, { position, from: position, to: tallyTarget(position, g.digit, heading), start: now, delay: spacing * g.order });
		}
		mounted.current = true;
		const overshoot = tallyOvershoot(bounce);
		const fontPx = rootRef.current ? Number.parseFloat(getComputedStyle(rootRef.current).fontSize) || FALLBACK_FONT_PX : FALLBACK_FONT_PX;
		loop.start((dt, time) => {
			let moving = false;
			tracks.current.forEach((track, key) => {
				const step = tallyAt(track, time, duration, overshoot);
				const speed = dt > 0 ? (step.position - track.position) / (dt / 1000) : 0;
				track.position = step.done ? track.to : step.position;
				moving ||= !step.done;
				const strip = strips.current.get(key);
				if (!strip) return;
				strip.style.transform = stripTransform(track.position);
				const blur = motionBlur && !step.done ? tallyBlur(speed, fontPx * CELL_EM) : 0;
				blurs.current.get(key)?.setAttribute("stdDeviation", `0 ${blur}`);
				strip.style.filter = blur > BLUR_VISIBLE_PX ? `url(#${uid}${key})` : "none";
			});
			return moving;
		});
	}, [glyphs, live, armed]);

	const rootStyle: CSSProperties = {
		fontSize,
		fontWeight,
		color: tone ? toneVar(tone) : undefined,
		padding,
		fontVariantNumeric: tabular ? "tabular-nums" : undefined,
		...style,
	};
	const mask = fadeMask(fade);
	const spoken = `${typeof prefix === "string" ? prefix : ""}${text}${typeof suffix === "string" ? suffix : ""}`;

	return (
		<span ref={rootRef} data-slot="tally-roll" data-loading={loading || undefined} className={cn("relative inline-flex items-start whitespace-nowrap", className)} style={rootStyle}>
			<span aria-hidden className={cn("inline-flex items-start", loading && "animate-pulse rounded-sm bg-muted")} style={{ gap, height: SLOT_HEIGHT, lineHeight: SLOT_HEIGHT }}>
				{prefix}
				{glyphs.map((g) => {
					if (g.kind === "static" || !live) {
						const char = g.kind === "static" ? g.char : String(g.digit);
						return (
							<span key={g.key} className={cn("inline-block", loading && "invisible", g.kind === "digit" && digitClassName)}>
								{char}
							</span>
						);
					}
					const position = tracks.current.get(g.key)?.position ?? (armed ? g.digit : 0);
					return (
						<span key={g.key} className={cn("relative inline-block overflow-hidden", digitClassName)} style={{ width: tabular ? SLOT_WIDTH : undefined, height: SLOT_HEIGHT, maskImage: mask, WebkitMaskImage: mask }}>
							{motionBlur ? (
								<svg aria-hidden width="0" height="0" className="absolute">
									<filter id={`${uid}${g.key}`}>
										<feGaussianBlur
											ref={(node) => {
												if (node) blurs.current.set(g.key, node);
												else blurs.current.delete(g.key);
											}}
											stdDeviation="0 0"
										/>
									</filter>
								</svg>
							) : null}
							<span
								ref={(node) => {
									if (node) strips.current.set(g.key, node);
									else strips.current.delete(g.key);
								}}
								className="block will-change-transform"
								style={{ transform: stripTransform(position) }}
							>
								{TALLY_STRIP.map((n, i) => (
									<span key={i} className="block text-center" style={{ height: SLOT_HEIGHT }}>
										{n}
									</span>
								))}
							</span>
						</span>
					);
				})}
				{suffix}
			</span>
			<span className="sr-only">{loading ? null : spoken}</span>
		</span>
	);
}
