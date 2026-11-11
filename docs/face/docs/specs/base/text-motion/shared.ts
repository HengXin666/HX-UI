import { NONE, T } from "../../types";

/** 文字类预览的标题字号, 用法代码里也原样写出. */
export const HEADLINE = "text-6xl font-bold tracking-tight text-foreground";
export const DIRECTIONS = ["up", "down", "left", "right"];
export const TIMINGS = ["enter", "exit", "emphasized"];
export const PRESETS = ["fade", "fadeUp", "fadeDown", "scaleIn", "blurIn", "slideLeft", "slideRight"];
export const SPRINGS = ["soft", "snappy", "bouncy"];
export const STOPS = ["primary", "link", "accent", "heading", "success", "warning", "danger"];
export const CLASS_ROW = { name: "className", type: T.str, initial: NONE, desc: "根元素类名, 字号与颜色由调用方给." };
export const STOP_TYPE = "GradientStop";
export const SEPARATOR = ",";
export const ROTATE = { interval: "interval", scroll: "scroll" } as const;
export const FORMATS: Record<string, Intl.NumberFormatOptions | undefined> = {
  decimal: undefined,
  compact: { notation: "compact" },
  currency: { style: "currency", currency: "CNY" },
};
