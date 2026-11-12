import { Liftoff } from "../../../../../../src/controls";
import liftRaw from "../../../../../../src/controls/press/launch/Liftoff.tsx?raw";
import { initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage, omit } from "../shared";

/**
 * controls 批 1: 起飞按钮. 舞台加高, 按钮放在底部留出升空空间; 悬停时长 hoverTime 与悬浮晃动 wobble 只在空中才看得到, 留在 Props 表.
 */

const CONTROLS: readonly ControlDef[] = [
  text("label", "按钮文字", "发布 v2.4.0", "不是属性: 演示里传给 children 的文字."),
  select("size", "尺寸", ["small", "medium", "large"], "large", '"small" | "medium" | "large"', "高度 32 / 40 / 48 px."),
  range("radius", "圆角", [0, 24, 1], 8, "圆角 px; 不传时是 rounded-lg."),
  range("altitude", "升空高度", [40, 200, 10], 150, "升空高度 px, 以弹簧升到这里."),
  range("jets", "推进器", [0, 4, 1], 2, "按钮底下均布的推进器个数, 0 到 4."),
  toggle("thrusters", "显示推进器", true, "关掉后只升空, 底下没有推进器与火焰."),
  select("trigger", "触发", ["hover", "press"], "hover", '"hover" | "press"', "hover: 悬停或聚焦即升空; press: 点了才升空."),
];
const BASE = initialValues(CONTROLS);

function LiftStage({ label, ...props }: Record<string, unknown>) {
  return (
    <div className="flex h-[19rem] w-[min(24rem,calc(100vw-6rem))] flex-col justify-end">
      <div className="rounded-2xl border border-border bg-card px-4 pt-4 pb-10 text-left">
        <p className="text-[13px] font-medium text-foreground">发布到正式环境</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">v2.4.0 · 37 个提交 · 412 项检查全部通过. 悬停按钮看它升空.</p>
        <div className="mt-5 flex justify-center">
          <Liftoff {...props}>{String(label)}</Liftoff>
        </div>
      </div>
    </div>
  );
}

export const LIFTOFF: PageSpec = {
  id: "liftoff",
  kind: "control",
  importName: "Liftoff",
  source: "src/controls/press/launch/Liftoff.tsx",
  raw: liftRaw,
  deps: [],
  controls: CONTROLS,
  height: 360,
  render: (props) => <LiftStage {...props} />,
  usage: (values: Values) => controlUsage("Liftoff", omit(values, ["label"]), { ...omit(BASE, ["label"]), size: "medium", radius: -1 }, String(values.label)),
  propDesc: {
    children: "按钮文字, 默认 Take off.",
    onClick: "点击回调; 每次点击按钮绕横轴翻一圈.",
    hoverTime: "升空后悬停多久自动降落, 秒.",
    wobble: "空中上下晃动的幅度倍数, 0 不晃.",
  },
  propsNote: "外层是 <span data-slot=\"liftoff\">, className 与 style 落在它上面; 里面是真正的 <button type=\"button\">, 推进器 aria-hidden.",
  examples: [
    {
      id: "press",
      title: "点了才起飞",
      desc: "trigger=\"press\": 悬停不动, 点击后升空并翻一圈, 悬停 hoverTime 秒后降落; 适合 \"发射\" 一类有仪式感的确认.",
      code: `<Liftoff trigger="press" jets={3} altitude={80} size="small">\n  发射\n</Liftoff>`,
      render: () => (
        <Liftoff trigger="press" jets={3} altitude={80} size="small">
          发射
        </Liftoff>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦即升空 (trigger 为 hover 时), 失焦降落." },
    { keys: ["Enter"], action: "触发点击, 按钮翻一圈; trigger 为 press 时同时升空." },
    { keys: ["Space"], action: "同 Enter." },
  ],
  reduced: {
    desc: "减少动效下不升空, 不倾斜, 不翻转, 火焰不喷, 只保留点击.",
    notes: ["悬停, 聚焦与点击都不会升空, 按钮留在原位.", "指针左右移动不再让按钮倾斜, 点击不翻转.", "推进器只剩底座, 火焰高度恒为 0."],
    height: 260,
  },
};
