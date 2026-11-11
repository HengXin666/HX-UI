import type { ComponentProps } from "react";
import { GradientText } from "@hx/ui";
import gradientRaw from "../../../../../../src/typography/GradientText.tsx?raw";
import { SPEC_GROUP } from "../../groups";
import { NONE, color, range, type ComponentSpec } from "../../types";
import { HEADLINE, STOPS, STOP_TYPE } from "./shared";

export const GRADIENT_TEXT: ComponentSpec = {
  id: "gradient-text",
  label: "GradientText 渐变字",
  desc: "文字渐变, 色标只接受语义令牌名; 高对比模式下退回系统文字色. 嵌在 Display 或正文里使用.",
  group: SPEC_GROUP.text,
  importName: "GradientText",
  source: "src/typography/GradientText.tsx",
  raw: gradientRaw,
  deps: [],
  fixed: { className: HEADLINE },
  children: "渐变标题",
  controls: [
    color("from", "起点", STOPS, "primary", STOP_TYPE, "起点色标 (语义令牌名)."),
    color("via", "中间", STOPS, "accent", STOP_TYPE, "可选中间色标."),
    color("to", "终点", STOPS, "success", STOP_TYPE, "终点色标."),
    range("angle", "角度", [0, 360, 5], 135, "渐变角度 (deg)."),
  ],
  extraProps: [{ name: "classNames / styles", type: "SlotClassNames", initial: NONE, desc: "按状态给 root 槽位追加类名或样式." }],
  render: (props) => <GradientText {...(props as unknown as ComponentProps<typeof GradientText>)}>渐变标题</GradientText>,
};
