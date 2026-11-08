// 行为规格参照 docs/research/catalog/textanimations.md 的 BlurText, FoldText, MaskedHeading, StrokeText, TrueFocus, FallingText 条目, 实现为 HX 自有.
export * from "./tokens";
export { StaggerText, type StaggerTextProps, type StaggerVariant } from "./StaggerText";
export { TraceText, traceAt, type TraceTextProps } from "./TraceText";
export { FocusText, nextFocus, type FocusTextProps } from "./FocusText";
export { DropText, dropPose, type DropTextProps } from "./DropText";
