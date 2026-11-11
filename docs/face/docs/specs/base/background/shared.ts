import { NONE, type Values } from "../../types";

/** 背景件可选的语义令牌. */
export const EFFECT_TOKENS = ["primary", "accent-2", "success", "warning", "danger", "link", "heading"];
/** 背景铺满预览台. */
export const FILL = "size-full";
/** Beam 要放进 isolate 宿主里才能垫在内容下面. */
export const HOST = "relative isolate size-full overflow-hidden";
export const KEY = { fade: "fade", animated: "animated", intensity: "intensity", size: "size" } as const;
/** 格距滑块的步长 (px). */
export const STEP2 = 2;
export const FADE_LABEL = "渐隐";
export const FADE_DESC = "从中心向四周渐隐, 避免底纹在边缘硬切.";
export const ANIMATED_DESC = "缓慢漂移. 减弱动效时总是静止.";
export const INTENSITY_DESC = "强度 0..1.";
export const CHILDREN_ROW = { name: "children", type: "ReactNode", initial: NONE, desc: "垫在底纹上面的内容." };
export const MESH_KEYS = ["color1", "color2", "color3"] as const;
export const COLORS = "colors";

export function meshProps(values: Values): Record<string, unknown> {
  return {
    [COLORS]: MESH_KEYS.map((key) => values[key]),
    intensity: values[KEY.intensity],
    animated: values[KEY.animated],
    fade: values[KEY.fade],
  };
}
