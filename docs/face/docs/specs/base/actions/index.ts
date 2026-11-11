import type { PageSpec } from "../../types";
import { BUTTON } from "./button";
import { BUTTON_GROUP } from "./button-group";
import { SEGMENTED_CONTROL } from "./segmented-control";
import { TOGGLE_GROUP } from "./toggle-group";

/** 基础组件 / 按钮与操作 组的组件页定义, 一页一个文件 (<id>.tsx). */
export const ACTIONS_SPECS: readonly PageSpec[] = [BUTTON, BUTTON_GROUP, TOGGLE_GROUP, SEGMENTED_CONTROL];
