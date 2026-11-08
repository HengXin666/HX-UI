// 行为规格参照 docs/research/catalog/textanimations.md 的 SplitText, BlurText, FoldText, ScrollFloat, ScrollReveal 条目, 实现为 HX 自有.

/**
 * 按字或按词拆文本. 空白原样保留且不编号; 按字时以字素为单位 (Intl.Segmenter, 没有时退到码点),
 * 表情与组合字符不会被拆坏. 编号 index 只给参与动画的单元, 从 0 连续递增.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-kernel.md
 */

export type SplitUnit = "char" | "word";

export interface TextUnit {
  readonly text: string;
  /** 动画编号, 从 0 连续. */
  readonly index: number;
}

export interface TextGroup {
  /** 空白段: 原样输出, 不参与动画. */
  readonly space: boolean;
  readonly text: string;
  /** 本段的单元. 按词时一段一个单元; 空白段为空数组. */
  readonly units: readonly TextUnit[];
}

export interface SplitResult {
  readonly groups: readonly TextGroup[];
  /** 参与动画的单元总数. */
  readonly count: number;
}

const SPACE = /(\s+)/;
const ONLY_SPACE = /^\s+$/;

interface SegmenterLike {
  segment: (input: string) => Iterable<{ segment: string }>;
}

function segmenter(): SegmenterLike | null {
  const ctor = (Intl as unknown as { Segmenter?: new (locale?: string, options?: { granularity: string }) => SegmenterLike }).Segmenter;
  return ctor ? new ctor(undefined, { granularity: "grapheme" }) : null;
}

/** 字素序列. */
export function graphemes(text: string): string[] {
  const seg = segmenter();
  if (!seg) return Array.from(text);
  return Array.from(seg.segment(text), (part) => part.segment);
}

/**
 * @param text 原文.
 * @param by char 按字, word 按词.
 */
export function splitText(text: string, by: SplitUnit = "char"): SplitResult {
  let index = 0;
  const groups: TextGroup[] = [];
  for (const part of text.split(SPACE)) {
    if (part === "") continue;
    if (ONLY_SPACE.test(part)) {
      groups.push({ space: true, text: part, units: [] });
      continue;
    }
    const pieces = by === "word" ? [part] : graphemes(part);
    const units = pieces.map((piece) => ({ text: piece, index: index++ }));
    groups.push({ space: false, text: part, units });
  }
  return { groups, count: index };
}

/** 拆成平铺的单元列表, 空白也作为一格 (index 为 -1). 逐格停格类 (乱码, 翻牌, 打字) 用. */
export function splitCells(text: string): { readonly text: string; readonly space: boolean }[] {
  return graphemes(text).map((g) => ({ text: g, space: ONLY_SPACE.test(g) }));
}
