"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 SplitFlapText 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { rollGlyph } from "../kernel/settle";
import { graphemes } from "../kernel/split";
import { maxRank, staggerRanks, type StaggerFrom } from "../kernel/stagger";
import { HALF, MS_PER_S, SR_ONLY } from "../kernel/tokens";
import { usePlayhead, type PlayTrigger } from "../kernel/use-playhead";
import { FLAP_CHARSETS, FLAP_DEFAULTS, FLAP_MIN_FLIP_S } from "./tokens";

export interface FlapTextProps {
  /** 轮换的词. 给了 text 时只显示 text. */
  readonly words?: readonly string[];
  readonly text?: string;
  /** 每翻一次的时长 (秒), 下限 0.04. */
  readonly flipDuration?: number;
  /** 格间隔 (秒). */
  readonly stagger?: number;
  /** 一个词翻完后停留多久再翻下一个 (毫秒). */
  readonly cycleDelay?: number;
  /** 字符表名或自定字符表 (第一个字应为空格). */
  readonly charset?: keyof typeof FLAP_CHARSETS | string;
  /** 每格最多翻几次. */
  readonly flipsPerChar?: number;
  readonly loop?: boolean;
  /** 补到多少格. */
  readonly padTo?: number;
  readonly align?: "left" | "center" | "right";
  /** 首次从空白翻到第一个词. */
  readonly intro?: boolean;
  /** 翻牌顺序. left 从左, right 从右, 其余同内核错峰. */
  readonly order?: "left" | "right" | StaggerFrom;
  readonly trigger?: PlayTrigger;
  /** 格间距与圆角 (像素). */
  readonly gap?: number;
  readonly tileRadius?: number;
  /** 牌面的类, 语义 token. */
  readonly tileClassName?: string;
  readonly className?: string;
}

/** 把词补到 width 格并按 align 放, 转成大写. */
export function padBoard(word: string, width: number, align: "left" | "center" | "right"): string[] {
  const chars = graphemes(word.toUpperCase()).slice(0, Math.max(width, 0) || undefined);
  const room = Math.max(0, width - chars.length);
  const before = align === "right" ? room : align === "center" ? Math.floor(room * HALF) : 0;
  return [...new Array<string>(before).fill(" "), ...chars, ...new Array<string>(room - before).fill(" ")];
}

const HALF_CLIP = { top: "inset(0 0 50% 0)", bottom: "inset(50% 0 0 0)" } as const;

function Tile({ char, next, phase, className, radius }: { readonly char: string; readonly next: string; readonly phase: number; readonly className: string; readonly radius: number }): JSX.Element {
  const face = cn("absolute inset-0 flex items-center justify-center", className);
  const style = { borderRadius: radius, backfaceVisibility: "hidden" as const };
  const moving = phase > 0;
  return (
    <span className="relative inline-block h-[1.4em] w-[1em] [perspective:300px]" style={{ borderRadius: radius }}>
      <span className={face} style={{ ...style, clipPath: HALF_CLIP.top }}>{moving ? next : char}</span>
      <span className={face} style={{ ...style, clipPath: HALF_CLIP.bottom }}>{char}</span>
      {moving && phase < HALF ? <span className={face} style={{ ...style, clipPath: HALF_CLIP.top, transform: `rotateX(${-phase * 180}deg)` }}>{char}</span> : null}
      {moving && phase >= HALF ? <span className={face} style={{ ...style, clipPath: HALF_CLIP.bottom, transform: `rotateX(${(1 - phase) * 180}deg)` }}>{next}</span> : null}
    </span>
  );
}

/**
 * 翻牌板: 每格从当前字沿字符表一页页翻到目标字 (最多 flipsPerChar 页), 格按顺序错开起翻; 翻完停留后换下一个词.
 * 上下半页各用一层裁切, 翻页半程换面. 读屏读全部词. 减弱动效时只显示第一个词, 不翻.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-glyph.md
 */
export function FlapText({
  words = ["READY"],
  text,
  flipDuration = FLAP_DEFAULTS.flipDuration,
  stagger = FLAP_DEFAULTS.stagger,
  cycleDelay = FLAP_DEFAULTS.cycleDelay,
  charset = "alphanumeric",
  flipsPerChar = FLAP_DEFAULTS.flipsPerChar,
  loop = true,
  padTo = FLAP_DEFAULTS.padTo,
  align = "left",
  intro = true,
  order = "left",
  trigger = "view",
  gap = FLAP_DEFAULTS.gap,
  tileRadius = FLAP_DEFAULTS.tileRadius,
  tileClassName = "bg-muted text-foreground",
  className,
}: FlapTextProps): JSX.Element {
  const reduced = useReducedMotion();
  const root = useRef<HTMLSpanElement>(null);
  const list = text !== undefined ? [text] : words.length > 0 ? words : [""];
  const width = Math.max(padTo, ...list.map((w) => graphemes(w).length));
  const pool = Array.from(charset in FLAP_CHARSETS ? FLAP_CHARSETS[charset as keyof typeof FLAP_CHARSETS] : charset);
  const blank = padBoard("", width, align);
  const [pair, setPair] = useState(() => ({ from: intro ? blank : padBoard(list[0], width, align), index: 0 }));
  const to = padBoard(list[pair.index] ?? "", width, align);
  const ranks = staggerRanks(width, order === "left" ? "start" : order === "right" ? "end" : order);
  const flipMs = Math.max(FLAP_MIN_FLIP_S, flipDuration) * MS_PER_S;
  const total = maxRank(ranks) * stagger * MS_PER_S + flipsPerChar * flipMs;
  const [round, setRound] = useState(0);
  const head = usePlayhead(root, { durationMs: total, reduced, trigger, onComplete: () => setRound((r) => r + 1) });

  useEffect(() => {
    if (round === 0 || reduced || list.length < 2 || (!loop && pair.index >= list.length - 1)) return undefined;
    const id = globalThis.setTimeout(() => {
      setPair((p) => ({ from: padBoard(list[p.index] ?? "", width, align), index: (p.index + 1) % list.length }));
      head.replay();
    }, cycleDelay);
    return () => globalThis.clearTimeout(id);
    // 每翻完一轮排一次下一个词
  }, [round]);

  const frames = to.map((ch, i) => (reduced ? { char: ch, next: ch, phase: 0 } : rollGlyph(pool, pair.from[i] ?? " ", ch, flipsPerChar, head.elapsedMs - ranks[i] * stagger * MS_PER_S, flipMs)));
  return (
    <span ref={root} data-slot="flap-text" className={cn("inline-flex font-mono", className)} style={{ gap }} {...head.bind}>
      <span className={SR_ONLY}>{list.join(", ")}</span>
      {frames.map((f, i) => (
        <span key={i} aria-hidden="true">
          <Tile char={f.char} next={f.next} phase={f.phase} className={tileClassName} radius={tileRadius} />
        </span>
      ))}
    </span>
  );
}
