import { CueTip } from "../../../../../../src/controls";
import cueRaw from "../../../../../../src/controls/compose/overlay/CueTip.tsx?raw";
import { color, initialValues, range, select, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlDemo } from "../shared";
import { tag } from "../../usage-code";

/**
 * controls 批 2: 暖提示. 演示是编辑器工具栏的三颗按钮: 冷启动悬停 (或 Tab 聚焦) delay 后弹出;
 * 收起后 warmWindow 内碰到隔壁按钮立即弹出, 并从上一个气泡的位置滑过来. 每个气泡带快捷键.
 */

/** 气泡底色与配套的字色, 一起换才看得清. */
const INK: Readonly<Record<string, string>> = {
  popover: "popover-foreground",
  card: "card-foreground",
  foreground: "background",
  primary: "primary-foreground",
};

const CONTROLS: readonly ControlDef[] = [
  select("side", "方向", ["top", "bottom", "left", "right"], "top", '"top" | "bottom" | "left" | "right"', "气泡在触发件的哪一侧."),
  select("size", "尺寸", ["sm", "md", "lg"], "md", '"sm" | "md" | "lg"', "字号与内边距三档."),
  range("radius", "圆角", [0, 16, 1], 8, "气泡圆角 px."),
  range("gap", "间距", [2, 24, 1], 8, "气泡与触发件之间的 px."),
  toggle("arrow", "箭头", false, "气泡朝触发件的一侧画一个小三角."),
  color("surfaceColor", "气泡色", Object.keys(INK), "popover", "HxColor", "气泡底色; 演示里字色 (inkColor) 跟着换成配套的前景色."),
  range("delay", "冷启动延迟", [0, 1500, 50], 400, "冷启动时悬停或聚焦多久才弹出 ms."),
  toggle("showFuse", "等待引线", false, "等待期间在触发件底部画一条 1px 引线, 走满即弹出."),
  range("popDuration", "弹出时长", [40, 600, 5], 125, "冷启动弹出的 ms (热切换固定 120)."),
  range("popScale", "弹出起始缩放", [0.6, 1, 0.01], 0.96, "弹出前的缩放, 弹出时长内长到 1."),
  range("popBlur", "弹出起始模糊", [0, 10, 1], 2, "弹出前的模糊 px."),
  range("warmWindow", "热窗口", [0, 1500, 50], 300, "上一个气泡收起后多久内算热 ms; 热时立即弹出并滑过来."),
  range("travel", "滑行时长", [0, 900, 20], 320, "热切换时从旧位置滑到新位置的 ms."),
  toggle("disabled", "禁用", false, "不再弹出; 已打开的立即收起."),
];
const BASE = initialValues(CONTROLS);

const TOOLS = [
  { label: "撤销", tip: "撤销上一步", key: "⌘Z" },
  { label: "加粗", tip: "加粗选中文字", key: "⌘B" },
  { label: "链接", tip: "插入链接", key: "⌘K" },
] as const;

const toProps = (values: Values): Record<string, unknown> => ({ ...values, inkColor: INK[String(values.surfaceColor)] });

function Toolbar(props: Record<string, unknown>) {
  return (
    <div className="w-[min(22rem,calc(100vw-6rem))] rounded-2xl border border-border bg-card p-3 text-left">
      <div role="toolbar" aria-label="正文格式" className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5">
        {TOOLS.map((tool) => (
          <CueTip key={tool.label} {...props} content={tool.tip} shortcut={tool.key}>
            <button type="button" className="rounded-lg px-3 py-1.5 text-[13px] text-foreground hover:bg-accent">
              {tool.label}
            </button>
          </CueTip>
        ))}
      </div>
      <p className="mt-3 px-1 text-[14px] font-medium text-foreground">发布说明 v0.18</p>
      <p className="mt-1.5 px-1 text-[12.5px] leading-relaxed text-muted-foreground">controls 层补齐输入与选择两组的文档页; 预览台改为随内容收缩, 演示主体不再缩在一角.</p>
    </div>
  );
}

const usage = (values: Values): string => {
  const props = toProps(values) as Values;
  const base = { ...toProps(BASE), inkColor: "popover-foreground" } as Values;
  const open = tag("CueTip", { ...props, content: "撤销上一步", shortcut: "⌘Z" }, { ...base, content: "", shortcut: "" }, "\n  <button type=\"button\">撤销</button>\n");
  return controlDemo(["CueTip"], open);
};

export const CUE_TIP: PageSpec = {
  id: "cue-tip",
  kind: "control",
  importName: "CueTip",
  source: "src/controls/compose/overlay/CueTip.tsx",
  raw: cueRaw,
  deps: [],
  controls: CONTROLS,
  toProps,
  height: 280,
  render: (props) => <Toolbar {...props} />,
  usage,
  propDesc: {
    content: "气泡里的文字.",
    shortcut: "快捷键, 以 kbd 排在文字右边.",
    children: "触发件; 悬停, 聚焦或触屏长按它弹出.",
    lean: "指针横扫时气泡按速度倾斜的上限 (度), 0 关闭.",
    inkColor: "气泡字色.",
    longPress: "触屏长按多久弹出 ms, 0 关闭.",
    onWarmChange: "每次弹出时调用, 参数是这次是否热切换.",
    onOpenChange: "开合时调用.",
    className: "包裹触发件的 span 类名.",
  },
  propsNote: "气泡是 role=\"tooltip\", 打开时触发件外层带 aria-describedby; 滚动, 缩放, 切后台, 点别处与 Esc 都会收起. 热状态在全部 CueTip 之间共享, resetCueWarmth() 可清掉.",
  examples: [
    {
      id: "fuse",
      title: "带引线与箭头的慢提示",
      desc: "delay 拉到 900ms, showFuse 让等待看得见: 引线走满那一刻气泡弹出.",
      code: `<CueTip content="下载 PNG, 2x" delay={900} showFuse arrow side="bottom">\n  <button type="button">导出</button>\n</CueTip>`,
      render: () => (
        <CueTip content="下载 PNG, 2x" delay={900} showFuse arrow side="bottom">
          <button type="button" className="rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] text-foreground">
            导出
          </button>
        </CueTip>
      ),
    },
    {
      id: "lean",
      title: "随指针倾斜",
      desc: "lean={6}: 指针横扫时气泡按速度最多倾 6 度, 停下后以弹簧回正.",
      code: `<CueTip content="拖动排序" lean={6} size="lg">\n  <button type="button">⋮⋮</button>\n</CueTip>`,
      render: () => (
        <CueTip content="拖动排序" lean={6} size="lg">
          <button type="button" aria-label="拖动排序" className="rounded-lg border border-border bg-card px-4 py-2 text-[13px] text-foreground">
            ⋮⋮
          </button>
        </CueTip>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦触发件, 冷启动 delay 后弹出; 失焦收起 (留 80ms 缝)." },
    { keys: ["Esc"], action: "收起当前气泡; 随后 warmWindow 内聚焦隔壁会热弹出." },
  ],
  reduced: {
    desc: "减少动效下弹出时机 (delay 与热窗口) 照常, 气泡直接出现, 不缩放不模糊, 不滑行不倾斜.",
    notes: ["气泡直接出现与消失, 没有缩放, 模糊与上浮.", "热切换时直接出现在新位置, 不从旧位置滑过来.", "不随指针倾斜, 等待引线不画."],
  },
};
