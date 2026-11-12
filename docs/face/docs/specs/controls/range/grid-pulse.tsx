import { GridPulse } from "../../../../../../src/controls";
import pulseRaw from "../../../../../../src/controls/range/status/GridPulse.tsx?raw";
import { color, initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { RANGE_TONES } from "./tones";

/**
 * controls 批 1: 点阵加文字的长任务状态. 状态是受控的 (status), 演示里由下拉切; 进行中自己计时,
 * 完成与失败把文字换成 "用时" 文案并在点阵上画对勾或叉.
 */

const CONTROLS: readonly ControlDef[] = [
  select("status", "状态", ["working", "done", "error"], "working", '"working" | "done" | "error"', "进行中点阵逐帧点亮并计时; 完成画对勾, 失败画叉."),
  text("label", "进行中文字", "正在检索 2,431 篇文档", "进行中显示的文字 (label)."),
  select("grid", "点阵边长", ["3", "4"], "3", "3 | 4", "3x3 或 4x4 的点阵."),
  select("pattern", "走法", ["orbit", "sweep"], "orbit", '"orbit" | "sweep"', "orbit 沿外圈转, sweep 斜向扫; 不给时 3 用 orbit, 4 用 sweep."),
  select("shape", "格子形状", ["round", "square"], "round", '"square" | "round"', "圆点或方格."),
  color("tone", "点阵色", RANGE_TONES, "primary", "RangeTone", "进行中点亮的颜色; 不给时跟随文字色."),
  range("cellSize", "格子大小", [3, 12, 1], 8, "每格边长 px."),
  range("gap", "格距", [1, 6, 1], 2, "格与格之间 px."),
  range("idleOpacity", "暗格浓度", [0, 0.5, 0.05], 0.15, "未点亮的格子的不透明度."),
  toggle("glow", "辉光", false, "点阵外加一圈同色 drop-shadow."),
  toggle("showTimer", "显示计时", true, "文字后面显示已用秒数."),
];
const BASE = initialValues(CONTROLS);

const toProps = (values: Values): Record<string, unknown> => ({ ...values, grid: Number(values.grid), doneLabel: "检索完成, 用时", errorLabel: "检索失败, 用时" });

export const GRID_PULSE: PageSpec = {
  id: "grid-pulse",
  kind: "control",
  importName: "GridPulse",
  source: "src/controls/range/status/GridPulse.tsx",
  raw: pulseRaw,
  deps: [],
  controls: CONTROLS,
  toProps,
  height: 240,
  render: (props) => (
    <div className="w-[min(22rem,calc(100vw-6rem))] rounded-2xl border border-border bg-card p-4 text-left">
      <p className="text-[13px] font-medium text-foreground">文档检索</p>
      <p className="mt-1 text-[12px] text-muted-foreground">问题: 「ReelPicker 怎么接受控值」 · 范围: 全部组件页</p>
      <div className="mt-4 rounded-xl border border-border bg-background px-3 py-3">
        <GridPulse {...props} />
      </div>
    </div>
  ),
  usage: (values: Values) =>
    controlUsage("GridPulse", toProps(values) as Values, { ...toProps(BASE), cellSize: 6, label: "", tone: "", doneLabel: "", errorLabel: "" } as Values),
  propDesc: {
    doneLabel: "完成后的文字前半句, 后面接用时, 默认 Done in.",
    errorLabel: "失败后的文字前半句, 默认 Failed after.",
    doneTone: "完成对勾的颜色.",
    errorTone: "失败叉的颜色.",
    fontSize: "文字字号 px.",
    glowTone: "辉光颜色, 不给时与点阵同色.",
  },
  propsNote: "根元素是 <span role=\"status\" aria-live=\"polite\">, 点阵 aria-hidden, 只播报文字与用时.",
  examples: [
    {
      id: "states",
      title: "完成与失败",
      desc: "elapsed 由外部给定时不自己计时, 适合回放已结束的任务.",
      code: `<GridPulse status="done" elapsed={3.2} doneLabel="生成完成, 用时" />\n<GridPulse status="error" elapsed={12.8} errorLabel="连接超时, 用时" grid={4} shape="square" />`,
      align: "stretch",
      render: () => (
        <div className="flex flex-col items-start gap-3 p-6">
          <GridPulse status="done" elapsed={3.2} doneLabel="生成完成, 用时" />
          <GridPulse status="error" elapsed={12.8} errorLabel="连接超时, 用时" grid={4} shape="square" />
        </div>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "不可聚焦: 这是状态区 (role=\"status\"), 不占 Tab 位; 状态变化由读屏器自动播报." },
  ],
  reduced: {
    desc: "减少动效下点阵不再逐格跑, 全部点亮后整体缓慢呼吸; 计时照常.",
    notes: ["进行中所有格子同亮, 整体以 1.4s 周期明暗呼吸, 不出走法.", "完成 / 失败时格子直接切到对勾或叉, 没有缩放过渡.", "秒数照常更新 (计时是状态信息)."],
  },
};
