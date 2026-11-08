// 行为规格参照 docs/research/catalog/textanimations.md 的 DecryptedText, ScrambledText, Shuffle, SplitFlapText, TextType, GradientText, ShinyText, GlitchText 条目, 实现为 HX 自有.
export * from "./tokens";
export { ScrambleText, scrambleLocks, type ScrambleTextProps } from "./ScrambleText";
export { scrambleUntil, useScramblePointer, type ScramblePointer } from "./parts/use-scramble-pointer";
export { FlapText, padBoard, type FlapTextProps } from "./FlapText";
export { TypeText, typeCycle, typeFrame, type TypeFrame, type TypePhase, type TypeTextProps, type TypeTiming } from "./TypeText";
export { SheenText, sheenPhase, shinePhase, type SheenTextProps, type SheenTone } from "./SheenText";
export { ShiftText, shiftSlice, type ShiftSlice, type ShiftTextProps } from "./ShiftText";
