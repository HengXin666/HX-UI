import { FRAME_MS, ease, phase } from "../../../../../src/craft";

/**
 * 镜 8 收尾, 来自 paper-title-card 与 marker-underline-title (docs/research/shots/part-*.md), 帧号换成毫秒:
 * 第 i 词 delay 4+4i 帧 (133+133i ms), 9 帧 (300ms) stamp, scale 1.28 到 1 + blur 7px 到 0 + opacity;
 * 下划线 16f 到 34f (533 到 1133) scaleX, 曲线同卡里的 bezier(0.3,0,0.2,1) = dive;
 * 关键词马克线在标题落定后 6 帧 (卡: +4 到 8 帧) 起笔, 10 帧 (333ms) 画完, out 微收尾;
 * 副行 10f 到 22f 出现, 数字同窗落定, 早于本镜结束. 网页不做片尾淡出.
 */
const f = (frames: number): number => frames * FRAME_MS;
export const WORD_STEP_MS = f(4);
export const WORD_MS = f(9);
export const STAMP_FROM = 1.28;
export const BLUR_FROM_PX = 7;
export const RULE_AT = f(16);
export const RULE_END = f(34);
export const SUB_AT = f(10);
export const SUB_END = f(22);
const MARK_GAP_FRAMES = 6;
const MARK_FRAMES = 10;
export const MARK_MS = f(MARK_FRAMES);
export const CLOSE_END_MS = f(75);

export function wordAt(index: number): number {
  return WORD_STEP_MS + WORD_STEP_MS * index;
}

export function markAt(words: number): number {
  return wordAt(words - 1) + WORD_MS + f(MARK_GAP_FRAMES);
}

export interface WordPose {
  readonly scale: number;
  readonly blur: number;
  readonly opacity: number;
}

export function wordPose(index: number, ms: number): WordPose {
  const t = ease("stamp", phase(ms, wordAt(index), WORD_MS));
  return { scale: STAMP_FROM + (1 - STAMP_FROM) * t, blur: BLUR_FROM_PX * (1 - t), opacity: t };
}

export interface ClosePose {
  readonly rule: number;
  readonly mark: number;
  readonly sub: number;
}

export function closePose(ms: number, words: number): ClosePose {
  return {
    rule: ease("dive", phase(ms, RULE_AT, RULE_END - RULE_AT)),
    mark: ease("out", phase(ms, markAt(words), MARK_MS)),
    sub: ease("out", phase(ms, SUB_AT, SUB_END - SUB_AT)),
  };
}
