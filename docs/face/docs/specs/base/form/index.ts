import type { PageSpec } from "../../types";
import { FIELD } from "./field";
import { INPUT_OTP } from "./input-otp";
import { SWITCH } from "./switch";

/** 基础组件 / 表单输入 组的组件页定义, 一页一个文件 (<id>.tsx). */
export const FORM_SPECS: readonly PageSpec[] = [INPUT_OTP, FIELD, SWITCH];
