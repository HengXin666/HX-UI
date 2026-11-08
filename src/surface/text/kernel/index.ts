// 行为规格参照 docs/research/catalog/textanimations.md 全部 33 个条目共用的机制, 实现为 HX 自有.
export * from "./tokens";
export { graphemes, splitCells, splitText, type SplitResult, type SplitUnit, type TextGroup, type TextUnit } from "./split";
export { clamp, clamp01, falloff, hash01, midpoint, mix, smoothstep, type Falloff } from "./curve";
export { cappedStep, maxRank, staggerRanks, totalSpan, unitProgress, unitSpan, type StaggerFrom } from "./stagger";
export { lockTimes, poolGlyph, rollGlyph, settleAt, type RollFrame, type SettleFrame } from "./settle";
export { usePlayhead, type Playhead, type PlayheadOptions, type PlayTrigger } from "./use-playhead";
export { useScrollFrame, viewProgress, type ScrollFrameOptions, type ScrollSample } from "./scroll";
export { centerDistance, usePointerField, type PointerEventKind, type PointerField, type PointerFieldOptions } from "./pointer";
export { useCanvasText, type CanvasText } from "./canvas";
export { TextShell, type TextShellProps } from "./TextShell";
