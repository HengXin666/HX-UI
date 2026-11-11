import type { ComponentProps } from "react";
import { Marquee } from "@hx/ui";
import marqueeRaw from "../../../../../../src/effects/Marquee.tsx?raw";
import { SPEC_GROUP } from "../../groups";
import { range, text, toggle, type ComponentSpec } from "../../types";
import { REVERSE, THUMB_SCALE, MARQUEE_ITEMS, CHIP } from "./shared";

export const MARQUEE: ComponentSpec = {
  id: "marquee",
  label: "Marquee 跑马灯",
  desc: "内容渲染多份同步平移, 视觉无缝; 复制件不进可访问性树, 减弱动效时停下改为可手动横滚.",
  group: SPEC_GROUP.effect,
  importName: "Marquee",
  source: "src/effects/Marquee.tsx",
  raw: marqueeRaw,
  deps: [],
  thumbScale: THUMB_SCALE,
  children: "{items.map((item) => <span key={item}>{item}</span>)}",
  fixed: { className: "w-full" },
  controls: [
    range("duration", "一份时长", [4, 60, 1], 20, "滚完一份的时长 (秒). 不传用 effects.css 的默认值."),
    text("gap", "间距", "1rem", "项与项, 份与份之间的间距, 任意 CSS 长度."),
    range("repeat", "份数", [2, 6, 1], 2, "内容复制份数, 至少 2. 内容很短时调大, 避免出现空档."),
    toggle("pauseOnHover", "悬停暂停", true, "指针悬停时暂停. 键盘焦点落在里面时总是暂停."),
    toggle(REVERSE, "反向", false, "反向滚动 (横向从左往右, 纵向从上往下)."),
    toggle("fade", "两端渐隐", true, "两端渐隐."),
  ],
  render: (props) => (
    <Marquee {...(props as unknown as ComponentProps<typeof Marquee>)}>
      {MARQUEE_ITEMS.map((item) => (
        <span key={item} className={CHIP}>
          {item}
        </span>
      ))}
    </Marquee>
  ),
};
