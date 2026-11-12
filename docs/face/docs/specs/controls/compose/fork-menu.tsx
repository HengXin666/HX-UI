import { useState } from "react";
import { ForkMenu, type ForkBranch } from "../../../../../../src/controls";
import forkRaw from "../../../../../../src/controls/compose/overlay/ForkMenu.tsx?raw";
import { color, initialValues, range, select, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlDemo } from "../shared";
import { tag } from "../../usage-code";
import { COMPOSE_ACCENTS } from "./tones";

/**
 * controls 批 2: 分枝菜单. 演示是工作区设置的侧栏: 组标题点开时, 子项从主干分出 1px 分支线逐条画出, 文字随后淡入;
 * 选中项下面垫一块高亮, 换选时高亮滑过去; 组收起时分支线倒退擦掉. 下面一行写出 onSelect 收到的 id.
 */

const ITEMS: readonly ForkBranch[] = [
  {
    id: "account",
    label: "账户",
    children: [
      { id: "profile", label: "个人资料" },
      { id: "security", label: "登录与安全" },
      { id: "notify", label: "通知" },
    ],
  },
  {
    id: "workspace",
    label: "工作区",
    children: [
      { id: "members", label: "成员与权限" },
      { id: "billing", label: "账单" },
      { id: "integrations", label: "集成" },
    ],
  },
  { id: "help", label: "帮助中心" },
];
const IDS = ["profile", "security", "notify", "members", "billing", "integrations", "help"];

const CONTROLS: readonly ControlDef[] = [
  range("defaultOpen", "初始展开组", [-1, 1, 1], 0, "初始展开的组下标, -1 全部收起; 同一时间只展开一组."),
  select("defaultActive", "初始选中", IDS, "security", "string", "初始选中项的 id, 下面垫高亮块."),
  range("width", "宽度", [180, 320, 10], 240, "菜单宽 px."),
  range("rowHeight", "行高", [28, 48, 1], 36, "每行高 px."),
  range("indent", "子项缩进", [24, 64, 2], 40, "子项文字的左缩进 px, 分支线画到这里."),
  range("trunk", "主干位置", [6, 22, 1], 14, "主干竖线的 x px."),
  range("radius", "圆角", [0, 18, 1], 10, "分支拐角与高亮块的圆角 px."),
  range("fontSize", "字号", [12, 17, 1], 14, "文字字号 px."),
  range("drawDuration", "画线时长", [100, 1500, 50], 400, "展开时每条分支线画出的 ms (逐条错开 50ms)."),
  range("foldDuration", "收起时长", [100, 1500, 50], 300, "展开 / 收起的高度过渡与分支线擦掉的 ms."),
  color("lineColor", "分支线色", ["muted-foreground", "border", "primary", "foreground"], "muted-foreground", "HxColor", "主干与分支线颜色."),
  color("accentColor", "选中字色", ["accent-foreground", ...COMPOSE_ACCENTS], "accent-foreground", "HxColor", "选中项文字颜色."),
];
const BASE = initialValues(CONTROLS);

function ForkDemo(props: Record<string, unknown>) {
  const [log, setLog] = useState("点组标题展开, 点子项选中");
  return (
    <div className="flex flex-col items-center gap-4 text-left">
      <ForkMenu {...props} items={ITEMS} onSelect={(id) => setLog(`onSelect: ${id}`)} onToggle={(index) => setLog(`onToggle: ${index}`)} />
      <p className="font-mono text-[12px] text-muted-foreground">{log}</p>
    </div>
  );
}

const usage = (values: Values): string => {
  const body = tag("ForkMenu", values, { ...BASE, defaultActive: "" }).replace("<ForkMenu", "<ForkMenu items={ITEMS}");
  const head = `\n\nconst ITEMS = [\n  { id: "account", label: "账户", children: [\n    { id: "profile", label: "个人资料" },\n    { id: "security", label: "登录与安全" },\n    { id: "notify", label: "通知" },\n  ] },\n  { id: "workspace", label: "工作区", children: [\n    { id: "members", label: "成员与权限" },\n    { id: "billing", label: "账单" },\n    { id: "integrations", label: "集成" },\n  ] },\n  { id: "help", label: "帮助中心" },\n];`;
  return controlDemo(["ForkMenu"], body, head);
};

export const FORK_MENU: PageSpec = {
  id: "fork-menu",
  kind: "control",
  importName: "ForkMenu",
  source: "src/controls/compose/overlay/ForkMenu.tsx",
  raw: forkRaw,
  deps: [],
  controls: CONTROLS,
  height: 380,
  render: (props) => <ForkDemo {...props} />,
  usage,
  propDesc: {
    items: "组列表 ({ id, label, icon?, children? }); 没有 children 的组就是一行可选项.",
    onSelect: "选中某项时调用, 参数是 id.",
    onToggle: "展开或收起组时调用, 参数是展开的组下标, 收起为 -1.",
    color: "未选中文字与箭头的颜色.",
    className: "根 nav 类名.",
  },
  propsNote: "根元素是 <nav>; 组标题是带 aria-expanded 的按钮, 子项列表 role=\"group\", 选中项 aria-current; 收起的子项 tabIndex=-1, 不占 Tab 位.",
  examples: [
    {
      id: "closed",
      title: "全部收起, 窄一号",
      desc: "defaultOpen={-1} 时只剩组标题; 行高 30, 缩进 32, 适合侧栏较窄的工具面板.",
      code: `<ForkMenu items={ITEMS} defaultOpen={-1} width={200} rowHeight={30} indent={32} fontSize={13} />`,
      render: () => <ForkMenu items={ITEMS} defaultOpen={-1} width={200} rowHeight={30} indent={32} fontSize={13} />,
    },
    {
      id: "slow",
      title: "慢画的分支线",
      desc: "drawDuration={1200} 配 primary 色的线, 点开第二组能看清逐条错开的起笔.",
      code: `<ForkMenu items={ITEMS} defaultOpen={1} defaultActive="billing" drawDuration={1200} lineColor="primary" />`,
      render: () => <ForkMenu items={ITEMS} defaultOpen={1} defaultActive="billing" drawDuration={1200} lineColor="primary" />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "依次聚焦组标题与展开组里的子项; 收起组的子项跳过." },
    { keys: ["Enter"], action: "组标题上展开 / 收起该组; 子项上选中; Space 同." },
  ],
  reduced: {
    desc: "减少动效下展开, 收起与选中照常, 分支线直接出现或消失, 高亮块直接跳到选中项.",
    notes: ["分支线不逐条画出, 展开时直接显示, 收起时直接消失.", "子项高度与文字直接到位, 不淡入.", "高亮块不滑动, 箭头直接转到位."],
    height: 300,
  },
};
