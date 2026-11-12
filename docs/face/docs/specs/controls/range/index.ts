import type { PageSpec } from "../../types";
import { ARC_KNOB } from "./arc-knob";
import { GRID_PULSE } from "./grid-pulse";

/** Controls / 取值 组的组件页定义, 一页一个文件 (<id>.tsx). */
export const RANGE_SPECS: readonly PageSpec[] = [ARC_KNOB, GRID_PULSE];
