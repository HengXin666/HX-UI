import type { ComponentProps } from "react";
import { AnimatedNumber } from "@hx/ui";
import numberRaw from "../../../../../../src/motion/AnimatedNumber.tsx?raw";
import { MOTION_DEPS, SPEC_GROUP } from "../../groups";
import { NONE, T, range, select, type ComponentSpec } from "../../types";
import { HEADLINE, SPRINGS, CLASS_ROW, FORMATS } from "./shared";

export const ANIMATED_NUMBER: ComponentSpec = {
  id: "animated-number",
  label: "AnimatedNumber 弹簧数字",
  desc: "数值由弹簧驱动, 每帧直接写文字不走 React 渲染; 等宽数字滚动时不左右抖, 减弱动效时直接跳到终值.",
  group: SPEC_GROUP.text,
  importName: "AnimatedNumber",
  required: ["value"],
  source: "src/motion/AnimatedNumber.tsx",
  raw: numberRaw,
  deps: MOTION_DEPS,
  keepMounted: true,
  fixed: { className: HEADLINE },
  controls: [
    range("value", "数值", [0, 100000, 500], 12800, "目标数值, 变化时从当前值滚过去."),
    range("from", "起点", [0, 100000, 500], 0, "首次进入视口时从这个值开始."),
    select("spring", "弹簧", SPRINGS, "soft", '"soft" | "snappy" | "bouncy"', "弹簧档位."),
    select("format", "格式", Object.keys(FORMATS), "decimal", "Intl.NumberFormatOptions", "数字格式 (货币, 紧凑写法等), 省略小数位时按 value 自身的小数位."),
  ],
  extraProps: [{ name: "locale", type: T.str, initial: NONE, desc: "区域设置, 省略时跟随运行环境." }, CLASS_ROW],
  toProps: (values) => ({ value: values.value, from: values.from, spring: values.spring, format: FORMATS[String(values.format)] }),
  render: (props) => <AnimatedNumber {...(props as unknown as Partial<ComponentProps<typeof AnimatedNumber>>)} value={Number(props.value ?? 0)} />,
};
