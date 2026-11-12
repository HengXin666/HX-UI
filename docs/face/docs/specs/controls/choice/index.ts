import type { PageSpec } from "../../types";
import { CHIME_TOGGLE } from "./chime-toggle";
import { DRIFT_SELECT } from "./drift-select";

/** Controls / 选择 组的组件页定义, 一页一个文件 (<id>.tsx). */
export const CHOICE_SPECS: readonly PageSpec[] = [CHIME_TOGGLE, DRIFT_SELECT];
