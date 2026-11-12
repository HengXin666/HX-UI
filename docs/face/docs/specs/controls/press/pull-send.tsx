import { useState } from "react";
import { PullSend } from "../../../../../../src/controls";
import pullRaw from "../../../../../../src/controls/press/launch/PullSend.tsx?raw";
import { initialValues, range, select, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";

/**
 * controls 批 1: 弹弓发送. 演示是聊天输入框右侧的发送键: 下面一行写出 onSend 收到的力度.
 * 飞行距离 flight, 粒子数 particles 与扇角 spread 只在发射那一瞬出现, 留在 Props 表.
 */

const CONTROLS: readonly ControlDef[] = [
  range("size", "尺寸", [40, 80, 2], 56, "井的直径 px; 垫子比井小一圈 (各边 4px)."),
  range("armAt", "上膛距离", [16, 200, 4], 48, "拉开超过这么多 px 才上膛, 松手才会发射; 拉回到一半以内退膛."),
  range("maxPull", "最大拉距", [60, 240, 10], 160, "垫子最多被拉开多少 px."),
  select("axis", "拉动方向", ["any", "x", "y"], "any", '"any" | "x" | "y"', "any 任意方向, x 只能横拉, y 只能竖拉."),
  toggle("tapSends", "轻点发送", true, "不拉直接点也发送 (力度 1); 关掉后只能拉弓发射."),
  toggle("disabled", "禁用", false, "半透明, 不响应."),
];
const BASE = initialValues(CONTROLS);

function PullDemo(props: Record<string, unknown>) {
  const [log, setLog] = useState("拖住圆键向后拉, 松手发射");
  return (
    <div className="flex w-[min(24rem,calc(100vw-6rem))] flex-col items-center gap-4">
      <div className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-3 text-left">
        <p className="px-1 text-[12px] text-muted-foreground">设计评审群 · 6 人</p>
        <p className="max-w-[80%] self-start rounded-xl bg-muted px-3 py-2 text-[12.5px] text-foreground">周四的评审能挪一下吗? 我 9 点还在路上.</p>
        <p className="max-w-[80%] self-start rounded-xl bg-muted px-3 py-2 text-[12.5px] text-foreground">可以, 改到 10 点, 会议室不变.</p>
        <div className="mt-14 flex w-full items-center gap-3 rounded-2xl border border-border bg-background py-2 pr-2 pl-4">
        <span className="min-w-0 flex-1 truncate text-left text-[13px] text-muted-foreground">明早 9 点的评审改到 10 点</span>
        <PullSend {...props} ariaLabel="发送消息" onSend={(power) => setLog(`onSend: 力度 ${power.toFixed(2)}, 消息已发出`)} />
        </div>
      </div>
      <p className="font-mono text-[12px] text-muted-foreground">{log}</p>
    </div>
  );
}

export const PULL_SEND: PageSpec = {
  id: "pull-send",
  kind: "control",
  importName: "PullSend",
  source: "src/controls/press/launch/PullSend.tsx",
  raw: pullRaw,
  deps: ["lucide-react"],
  controls: CONTROLS,
  height: 420,
  render: (props) => <PullDemo {...props} />,
  usage: (values: Values) => controlUsage("PullSend", { ...values, ariaLabel: "发送消息" }, { ...BASE, ariaLabel: "" }),
  propDesc: {
    children: "垫子上的图标, 默认是发送箭头.",
    launchSpeed: "松手速度达到它时速度项记满 1; 力度 = 拉开比例 + 速度比例, 封顶 1.5.",
    recoil: "垫子回弹的弹性 (0 不过冲).",
    flight: "图标沿发射方向飞出的距离 px, 按力度缩放.",
    particles: "发射时拖出的粒子数.",
    spread: "粒子扇出的角度 (度).",
    ariaLabel: "读屏标签, 默认 Send.",
  },
  propsNote: "外层是 <span data-slot=\"pull-send\"> (宽高等于 size), className 落在它上面; 垫子是 <button>, 上膛时带 data-armed. 橡皮筋与粒子都 aria-hidden.",
  examples: [
    {
      id: "axis",
      title: "只能横拉的发射键",
      desc: "axis=\"x\" 配更短的 armAt, 放进窄条工具栏里也不会竖向乱飞; tapSends 关掉后必须拉弓.",
      code: `<PullSend axis="x" armAt={32} maxPull={100} tapSends={false} size={44} ariaLabel="发布动态" />`,
      render: () => <PullSend axis="x" armAt={32} maxPull={100} tapSends={false} size={44} ariaLabel="发布动态" />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦垫子, 出 1px 焦点环." },
    { keys: ["Enter"], action: "直接发送, 力度 1 (键盘不需要拉弓)." },
    { keys: ["Space"], action: "同 Enter." },
  ],
  reduced: {
    desc: "减少动效下照样能拉弓与发送, 但没有粒子与图标飞行, 松手垫子直接归位.",
    notes: ["拖动时橡皮筋与垫子仍跟手 (那是操作反馈).", "松手发射不出粒子, 图标不飞出.", "垫子不回弹, 直接回到井中央; 上膛变色没有过渡."],
  },
};
