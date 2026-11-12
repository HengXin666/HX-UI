import type { PageSpec } from "../../types";
import { ARC_FIELD } from "./arc-field";
import { COMPOSER_FIELD } from "./composer-field";
import { CUE_TIP } from "./cue-tip";
import { DEVELOP_FRAME } from "./develop-frame";
import { DICTATE_BUTTON } from "./dictate-button";
import { FORK_MENU } from "./fork-menu";
import { REASONING_TRACE } from "./reasoning-trace";
import { TURN_CARD } from "./turn-card";

/** Controls / 输入 组的组件页定义, 一页一个文件 (<id>.tsx). */
export const COMPOSE_SPECS: readonly PageSpec[] = [
  ARC_FIELD,
  COMPOSER_FIELD,
  CUE_TIP,
  DEVELOP_FRAME,
  DICTATE_BUTTON,
  FORK_MENU,
  REASONING_TRACE,
  TURN_CARD,
];
