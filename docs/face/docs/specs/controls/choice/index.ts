import type { PageSpec } from "../../types";
import { CHIME_TOGGLE } from "./chime-toggle";
import { DRIFT_SELECT } from "./drift-select";
import { ELASTIC_SEGMENT } from "./elastic-segment";
import { GEL_RADIO } from "./gel-radio";
import { LIFT_RATING } from "./lift-rating";
import { PLUSH_SWITCH } from "./plush-switch";
import { REEL_PICKER } from "./reel-picker";
import { STEP_TRAIL } from "./step-trail";
import { TALLY_CHECK } from "./tally-check";

/** Controls / 选择 组的组件页定义, 一页一个文件 (<id>.tsx). */
export const CHOICE_SPECS: readonly PageSpec[] = [CHIME_TOGGLE, DRIFT_SELECT, ELASTIC_SEGMENT, GEL_RADIO, LIFT_RATING, PLUSH_SWITCH, REEL_PICKER, STEP_TRAIL, TALLY_CHECK];
