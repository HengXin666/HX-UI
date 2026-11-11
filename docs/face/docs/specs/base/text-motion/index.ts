import type { PageSpec } from "../../types";
import { SPLIT_TEXT } from "./split-text";
import { ROTATING_TEXT } from "./rotating-text";
import { ANIMATED_NUMBER } from "./animated-number";
import { GRADIENT_TEXT } from "./gradient-text";

/** 基础组件 / 文字动效 组的组件页定义, 一页一个文件 (<id>.tsx). */
export const TEXT_MOTION_SPECS: readonly PageSpec[] = [SPLIT_TEXT, ROTATING_TEXT, ANIMATED_NUMBER, GRADIENT_TEXT];
