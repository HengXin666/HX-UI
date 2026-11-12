import type { PageSpec } from "../../types";
import { ARC_KNOB } from "./arc-knob";
import { GRID_PULSE } from "./grid-pulse";
import { NUDGE_FIELD } from "./nudge-field";
import { PIN_CELLS } from "./pin-cells";
import { STRETCH_SLIDER } from "./stretch-slider";
import { SWELL_SLIDER } from "./swell-slider";
import { TALLY_ROLL } from "./tally-roll";
import { TANK_GAUGE } from "./tank-gauge";
import { TASK_GLYPH } from "./task-glyph";

/** Controls / 取值 组的组件页定义, 一页一个文件 (<id>.tsx). */
export const RANGE_SPECS: readonly PageSpec[] = [
  ARC_KNOB,
  GRID_PULSE,
  NUDGE_FIELD,
  PIN_CELLS,
  STRETCH_SLIDER,
  SWELL_SLIDER,
  TALLY_ROLL,
  TANK_GAUGE,
  TASK_GLYPH,
];
