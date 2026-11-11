import type { ComponentProps } from "react";
import { SplitText } from "@hx/ui";
import splitRaw from "../../../../../../src/motion/SplitText.tsx?raw";
import { MOTION_DEPS, SPEC_GROUP } from "../../groups";
import { range, select, text, toggle, type ComponentSpec } from "../../types";
import { HEADLINE, DIRECTIONS, TIMINGS, CLASS_ROW } from "./shared";

export const SPLIT_TEXT: ComponentSpec = {
  id: "split-text",
  label: "SplitText 逐字入场",
  desc: "把一句话拆成字或词, 依次从一个方向浮入. 读屏器只读原文, 减弱动效时直接显示静态文字.",
  group: SPEC_GROUP.text,
  importName: "SplitText",
  required: ["text"],
  source: "src/motion/SplitText.tsx",
  raw: splitRaw,
  deps: MOTION_DEPS,
  fixed: { className: HEADLINE },
  controls: [
    text("text", "文字", "你好, HX UI!", "要拆分的纯文本."),
    select("by", "拆分", ["char", "word"], "char", '"char" | "word"', "逐字 (默认) 或逐词. 中文建议逐字, 长英文句子建议逐词."),
    select("direction", "方向", DIRECTIONS, "up", '"up" | "down" | "left" | "right"', "每个单元从哪个方向进入."),
    select("timing", "节奏", TIMINGS, "enter", '"enter" | "exit" | "emphasized"', "动效节奏令牌, 首屏大标题可用 emphasized."),
    select("trigger", "触发", ["inView", "mount"], "inView", '"inView" | "mount"', "inView 进视口才播; mount 挂载即播."),
    range("step", "步长", [0.01, 0.2, 0.01], 0.02, "相邻单元的起播间隔 (s). 省略时逐字 0.02, 逐词 0.06."),
    range("delay", "延迟", [0, 1, 0.05], 0, "第一个单元之前的延迟 (s)."),
    toggle("once", "只播一次", true, "inView 时是否只播一次."),
  ],
  extraProps: [CLASS_ROW],
  render: (props) => <SplitText {...(props as unknown as Partial<ComponentProps<typeof SplitText>>)} text={String(props.text ?? "")} />,
};
