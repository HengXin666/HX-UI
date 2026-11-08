"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 DecryptedText, ScrambledText, Shuffle 条目, 实现为 HX 自有.

import { useRef, type ElementType, type JSX } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { lockTimes, poolGlyph, settleAt } from "../kernel/settle";
import { splitCells } from "../kernel/split";
import type { StaggerFrom } from "../kernel/stagger";
import { GLYPH_POOL } from "../kernel/tokens";
import { TextShell } from "../kernel/TextShell";
import { usePlayhead, type PlayTrigger } from "../kernel/use-playhead";
import { useScramblePointer } from "./parts/use-scramble-pointer";
import { SCRAMBLE_DEFAULTS, SCRAMBLE_POINTER } from "./tokens";

export interface ScrambleTextProps {
  readonly text: string;
  /** settle 乱码后按位停格 (解密, 洗牌); pointer 指针扫过处临时乱码. */
  readonly mode?: "settle" | "pointer";
  /** settle 的触发方式. 默认 hover. */
  readonly animateOn?: PlayTrigger;
  readonly play?: boolean;
  /** 乱码换字节拍 (毫秒). */
  readonly speed?: number;
  /** 非逐位时整体乱多少拍后一起停格. */
  readonly maxIterations?: number;
  /** 逐位停格. */
  readonly sequential?: boolean;
  /** 逐位停格的顺序, 含 evenodd (先奇位后偶位) 与 random. */
  readonly revealDirection?: StaggerFrom;
  /** 逐位停格的名次间隔 (毫秒), 默认等于 speed. */
  readonly stepMs?: number;
  /** 逐位停格前先整体乱多久 (毫秒), 洗牌用. */
  readonly leadMs?: number;
  /** 乱码字符表. 省略时 settle 用内核字符表, pointer 用两个点号. */
  readonly characters?: string;
  /** 只用原文里出现过的字乱码. */
  readonly useOriginalCharsOnly?: boolean;
  readonly loop?: boolean;
  /** 循环之间停在原文的时长 (毫秒). */
  readonly loopDelay?: number;
  /** pointer 模式的半径 (像素) 与中心处的乱码时长 (秒). */
  readonly radius?: number;
  readonly duration?: number;
  /** 还在乱码的格的类, 语义 token. */
  readonly encryptedClassName?: string;
  readonly onComplete?: () => void;
  readonly as?: ElementType;
  readonly className?: string;
}

/** 每格的停格时刻: 逐位时按名次错开, 否则整体在 maxIterations 拍后停. */
export function scrambleLocks(count: number, o: { readonly sequential: boolean; readonly from: StaggerFrom; readonly speed: number; readonly step: number; readonly lead: number; readonly maxIterations: number }): number[] {
  if (o.sequential) return lockTimes(count, o.from, o.step, o.lead);
  return new Array<number>(count).fill(o.lead + o.maxIterations * o.speed);
}

/**
 * 乱码文字. settle 模式乱码后按位停格到原文 (解密, 洗牌), 时间进字串出, 中途重播从头再来;
 * pointer 模式由指针邻近决定每格乱多久. 读屏只读原文. 减弱动效时直接显示原文.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-glyph.md
 */
export function ScrambleText({
  text,
  mode = "settle",
  animateOn = "hover",
  play,
  speed = SCRAMBLE_DEFAULTS.speed,
  maxIterations = SCRAMBLE_DEFAULTS.maxIterations,
  sequential = false,
  revealDirection = "start",
  stepMs,
  leadMs = 0,
  characters,
  useOriginalCharsOnly = false,
  loop = false,
  loopDelay = SCRAMBLE_DEFAULTS.loopDelay,
  radius = SCRAMBLE_POINTER.radius,
  duration = SCRAMBLE_POINTER.duration,
  encryptedClassName = "text-muted-foreground",
  onComplete,
  as = "span",
  className,
}: ScrambleTextProps): JSX.Element {
  const reduced = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const cellRefs = useRef<(HTMLElement | null)[]>([]);
  const cells = splitCells(text);
  const target = cells.map((c) => c.text);
  const pool = useOriginalCharsOnly ? "" : (characters ?? (mode === "pointer" ? SCRAMBLE_POINTER.chars : GLYPH_POOL));
  const locks = scrambleLocks(target.length, { sequential, from: revealDirection, speed, step: stepMs ?? speed, lead: leadMs, maxIterations });
  const total = locks.reduce((m, v) => Math.max(m, v), 0) + speed;
  const settle = mode === "settle" && !reduced;
  const head = usePlayhead(root, { durationMs: total, reduced: reduced || mode !== "settle", trigger: animateOn, play, loop, loopDelayMs: loopDelay, onComplete });
  const pointer = useScramblePointer(root, cellRefs, radius, duration, mode === "pointer" && !reduced);
  const showFrame = settle && (head.started || animateOn === "view" || animateOn === "mount");
  const frame = showFrame ? settleAt(target, head.elapsedMs, locks, pool, speed) : null;

  if (reduced) {
    const Tag = as;
    return <Tag data-slot="scramble-text" className={className}>{text}</Tag>;
  }

  return (
    <TextShell ref={root} as={as} text={text} slot="scramble-text" className={className} {...(settle ? head.bind : {})}>
      {cells.map((cell, i) => {
        const hot = mode === "pointer" && !cell.space && (pointer.until[i] ?? 0) > pointer.now;
        const shown = frame ? frame.cells[i] : hot ? poolGlyph(pool || text, i, Math.floor(pointer.now / speed)) : cell.text;
        const scrambled = frame ? !frame.locked[i] : hot;
        return (
          <span key={i} ref={(el) => { cellRefs.current[i] = el; }} className={cn(cell.space && "whitespace-pre", scrambled && encryptedClassName)}>
            {shown}
          </span>
        );
      })}
    </TextShell>
  );
}
