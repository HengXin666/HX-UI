import type { PageSpec } from "../../types";
import { GLINT_BUTTON } from "./glint-button";
import { GRACE_COMMIT } from "./grace-commit";
import { HOLD_CONFIRM } from "./hold-confirm";
import { LIFTOFF } from "./liftoff";
import { LIKE_BURST } from "./like-burst";
import { PULL_SEND } from "./pull-send";
import { RUN_CHIP } from "./run-chip";
import { SWIPE_CONFIRM } from "./swipe-confirm";

/** Controls / 按压 组的组件页定义, 一页一个文件 (<id>.tsx). */
export const PRESS_SPECS: readonly PageSpec[] = [GLINT_BUTTON, GRACE_COMMIT, HOLD_CONFIRM, LIFTOFF, LIKE_BURST, PULL_SEND, RUN_CHIP, SWIPE_CONFIRM];
