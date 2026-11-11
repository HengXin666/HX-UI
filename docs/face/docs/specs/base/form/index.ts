import type { PageSpec } from "../../types";
import { CHECKBOX } from "./checkbox";
import { FIELD } from "./field";
import { INPUT_OTP } from "./input-otp";
import { LABEL } from "./label";
import { RADIO_GROUP } from "./radio-group";
import { SLIDER } from "./slider";
import { SWITCH } from "./switch";

/** 基础组件 / 表单输入 组的组件页定义, 一页一个文件 (<id>.tsx). */
export const FORM_SPECS: readonly PageSpec[] = [INPUT_OTP, FIELD, LABEL, CHECKBOX, RADIO_GROUP, SWITCH, SLIDER];
