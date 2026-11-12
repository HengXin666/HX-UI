import { useState } from "react";
import { DriftSelect, type DriftOption } from "../../../../../../src/controls";
import driftRaw from "../../../../../../src/controls/choice/pick/DriftSelect.tsx?raw";
import { color, initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlDemo } from "../shared";
import { tag } from "../../usage-code";
import { CHOICE_ACCENTS, CHOICE_SURFACES } from "./tones";

/**
 * controls 批 2: 滑行下拉. 演示是部署面板里选目标环境: 触发器是 select-only combobox, 菜单弹出时高亮块按弹簧在选项间滑行,
 * 选中值换字时轻推一下; 关闭途中再打开, 弹出动画原地倒放. 右侧小字标签 (tag) 写各环境的版本.
 */

const OPTIONS: readonly DriftOption[] = [
  { value: "preview", label: "预览环境", tag: "pr-482" },
  { value: "staging", label: "预发布", tag: "v0.18.0-rc.2" },
  { value: "canary", label: "灰度 5%", tag: "v0.17.3" },
  { value: "prod", label: "正式环境", tag: "v0.17.2" },
  { value: "legacy", label: "旧版集群", tag: "停用", disabled: true },
];

const CONTROLS: readonly ControlDef[] = [
  select("defaultValue", "初始值", ["", "preview", "staging", "canary", "prod"], "", "string", "非受控的初始值; 空串时显示占位文字."),
  text("placeholder", "占位文字", "选择部署目标", "没有值时触发器上的文字."),
  select("size", "尺寸", ["sm", "md", "lg"], "md", '"sm" | "md" | "lg"', "触发器高, 字号与选项高三档."),
  range("radius", "圆角", [0, 18, 1], 10, "触发器与菜单的圆角 px."),
  range("menuWidth", "菜单宽", [140, 260, 2], 220, "菜单最小宽 px."),
  select("align", "对齐", ["left", "right"], "left", '"left" | "right"', "菜单与触发器哪一边对齐."),
  toggle("showTags", "右侧标签", true, "选项右边的小字 (tag)."),
  color("highlightTone", "高亮块色", CHOICE_SURFACES, "accent", "ChoiceTone", "滑行高亮块的颜色."),
  color("accentTone", "选中色", CHOICE_ACCENTS, "foreground", "ChoiceTone", "选中项的对勾与文字色."),
  range("popDuration", "弹出时长", [40, 600, 10], 180, "菜单弹出 / 收起的 ms."),
  range("glideDuration", "滑行时长", [60, 800, 10], 220, "高亮块在选项间滑行的弹簧时长 ms."),
  toggle("rememberPosition", "记住位置", true, "打开时高亮从上次停留处起滑, 关掉则从顶部出现."),
  toggle("disabled", "禁用", false, "变淡, 不能打开."),
];
const BASE = initialValues(CONTROLS);

function DriftDemo(props: Record<string, unknown>) {
  const [value, setValue] = useState(String(props.defaultValue));
  return (
    <div className="flex h-[17rem] w-[min(22rem,calc(100vw-6rem))] flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left">
      <p className="text-[13px] font-medium text-foreground">部署 hx-ui-docs · 提交 3f1d1bb</p>
      <p className="text-[12px] text-muted-foreground">目标环境</p>
      <DriftSelect {...props} options={OPTIONS} ariaLabel="部署目标" onChange={setValue} />
      <p className="mt-auto font-mono text-[12px] text-muted-foreground">onChange: {value === "none" || !value ? "(未选)" : value}</p>
    </div>
  );
}

const usage = (values: Values): string => {
  const body = tag("DriftSelect", { ...values, ariaLabel: "部署目标" }, { ...BASE, defaultValue: "", placeholder: "Select…", menuWidth: 176, ariaLabel: "" }).replace("<DriftSelect", "<DriftSelect options={OPTIONS}");
  const head = `\n\nconst OPTIONS = [\n  { value: "preview", label: "预览环境", tag: "pr-482" },\n  { value: "staging", label: "预发布", tag: "v0.18.0-rc.2" },\n  { value: "canary", label: "灰度 5%", tag: "v0.17.3" },\n  { value: "prod", label: "正式环境", tag: "v0.17.2" },\n  { value: "legacy", label: "旧版集群", tag: "停用", disabled: true },\n];`;
  return controlDemo(["DriftSelect"], body, head);
};

export const DRIFT_SELECT: PageSpec = {
  id: "drift-select",
  kind: "control",
  importName: "DriftSelect",
  source: "src/controls/choice/pick/DriftSelect.tsx",
  raw: driftRaw,
  deps: [],
  controls: CONTROLS,
  height: 360,
  render: (props) => <DriftDemo {...props} />,
  usage,
  propDesc: {
    options: "选项 ({ value, label, tag?, disabled? }); disabled 的选项跳过, 不能选.",
    value: "受控值.",
    onChange: "选中时调用, 参数是 value.",
    surfaceTone: "菜单底色.",
    textTone: "菜单文字色.",
    placement: "菜单在触发器下方还是上方.",
    ariaLabel: "读屏名称, 默认 Select.",
    className: "根元素类名.",
  },
  propsNote: "触发器是 role=\"combobox\" (aria-haspopup=listbox, aria-activedescendant 指向高亮项), 菜单 role=\"listbox\"; 菜单在触发器的定位层里, 不进 portal.",
  examples: [
    {
      id: "top",
      title: "向上弹出, 右对齐",
      desc: "贴着页面底部时 placement=\"top\"; 右对齐让菜单不出界. 不要标签时 showTags={false}.",
      code: `<DriftSelect options={OPTIONS} placement="top" align="right" size="sm" showTags={false} defaultValue="prod" />`,
      render: () => (
        <div className="pt-[170px]">
          <DriftSelect options={OPTIONS} placement="top" align="right" size="sm" showTags={false} defaultValue="prod" ariaLabel="部署目标 (上弹)" />
        </div>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦触发器." },
    { keys: ["↓", "↑"], action: "关闭时打开菜单; 打开时移动高亮 (跳过禁用项), 高亮块滑过去." },
    { keys: ["Home"], action: "高亮第一项; End 高亮最后一项." },
    { keys: ["Enter"], action: "选中高亮项并收起; Space 同." },
    { keys: ["Esc"], action: "收起菜单, 不改值; Tab 收起并离开." },
  ],
  reduced: {
    desc: "减少动效下打开, 移动与选中照常, 菜单直接出现, 高亮块直接跳到目标项, 换字不推.",
    notes: ["菜单不缩放不淡入, 直接出现与消失.", "高亮块不滑行, 直接落到目标项.", "选中后触发器上的字直接换, 没有纵向轻推."],
    height: 320,
  },
};
