import type { PageSpec } from "../../types";
import { BORDER_BEAM } from "./border-beam";
import { SPOTLIGHT_CARD } from "./spotlight-card";
import { GRADIENT_BORDER } from "./gradient-border";
import { MARQUEE } from "./marquee";

/** 基础组件 / 效果 组的组件页定义, 一页一个文件 (<id>.tsx). */
export const EFFECT_SPECS: readonly PageSpec[] = [BORDER_BEAM, SPOTLIGHT_CARD, GRADIENT_BORDER, MARQUEE];
