/** 版式件桶文件: 营销尺度 (Display, Eyebrow, Kicker, Lead, GradientText) 与正文容器 Prose. 公共导出由集成分片接到 src/index.ts. */
export { Display, type DisplayProps } from "./Display";
export { Eyebrow, type EyebrowProps } from "./Eyebrow";
export { Kicker, type KickerProps } from "./Eyebrow";
export { Lead, type LeadProps } from "./Lead";
export { GradientText, type GradientTextProps, type GradientTextState } from "./GradientText";
export { Prose, type ProseProps, type ProseState } from "./Prose";
export {
	DISPLAY_SIZE,
	DISPLAY_WEIGHT,
	TEXT_SIZE,
	TEXT_TONE,
	LEAD_MEASURE,
	KICKER_MARKER,
	CJK_MODE,
	detectCjk,
	type DisplaySize,
	type DisplayWeight,
	type TextSize,
	type TextTone,
	type LeadMeasure,
	type KickerMarker,
	type CjkMode,
	type GradientStop,
	type DisplayTag,
	type LineTag,
	type ProseTag,
} from "../constants/typography";
