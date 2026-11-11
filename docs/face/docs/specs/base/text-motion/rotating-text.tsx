import type { ComponentProps } from "react";
import { RotatingText } from "@hx/ui";
import rotateRaw from "../../../../../../src/motion/RotatingText.tsx?raw";
import { MOTION_DEPS, SPEC_GROUP } from "../../groups";
import { NONE, range, select, text, type ComponentSpec } from "../../types";
import { HEADLINE, PRESETS, CLASS_ROW, SEPARATOR, ROTATE } from "./shared";

export const ROTATING_TEXT: ComponentSpec = {
  id: "rotating-text",
  label: "RotatingText 轮换词",
  desc: "首屏 \"为 ___ 而生\" 那一格: 定时或按滚动进度换词, 旧词离场新词就位, 读屏器只读一份完整列表.",
  group: SPEC_GROUP.text,
  importName: "RotatingText",
  required: ["words"],
  source: "src/motion/RotatingText.tsx",
  raw: rotateRaw,
  deps: MOTION_DEPS,
  fixed: { className: HEADLINE },
  controls: [
    text("words", "词表", "设计师,工程师,产品经理", "轮换的词, 至少一个; 只有一个时等同静态文本."),
    select("preset", "进出场", PRESETS, "fadeUp", "MotionPresetName", "换词的进出场预设. 默认 fadeUp: 旧词上浮离场, 新词自下浮入."),
    select("trigger", "触发", Object.values(ROTATE), ROTATE.interval, '"interval" | "scroll"', "interval 定时轮换; scroll 按目标元素的滚动进度均分换词."),
    range(ROTATE.interval, "停留", [800, 4000, 100], 2400, "定时轮换的停留时长 (ms)."),
  ],
  extraProps: [
    { name: "container", type: "RefObject<HTMLElement>", initial: NONE, desc: "scroll 触发时的滚动容器, 省略时跟随整页." },
    { name: "onWordChange", type: "(index, word) => void", initial: NONE, desc: "当前词变化时回调." },
    CLASS_ROW,
  ],
  toProps: (values) => ({ ...values, words: String(values.words).split(SEPARATOR).map((word) => word.trim()).filter(Boolean) }),
  render: (props) => (
    <RotatingText {...(props as unknown as Partial<ComponentProps<typeof RotatingText>>)} words={Array.isArray(props.words) ? props.words.map(String) : []} />
  ),
};
