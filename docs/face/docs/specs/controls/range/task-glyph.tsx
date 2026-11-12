import { TaskGlyph, type TaskStatus } from "../../../../../../src/controls";
import glyphRaw from "../../../../../../src/controls/range/status/TaskGlyph.tsx?raw";
import { color, initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { RANGE_TONES } from "./tones";

/**
 * controls 批 1: 任务行前的状态图标. 待办是呼吸的虚线圈, 进行中是转动的弧 (给 progress 时是定量弧), 完成画对勾并给文字划线, 失败画叉.
 * 演示是一份发布清单: 第二行的状态, 文字与进度跟着调参走, 其余三行固定在各自状态; 外观类调参 (尺寸, 线宽, 虚线段数, 字号, 划线, 进行色)
 * 四行一起走, 所以虚线段数看待办行, 完成划线看完成行.
 */

const CONTROLS: readonly ControlDef[] = [
  select("status", "状态", ["pending", "working", "done", "error"], "working", '"pending" | "working" | "done" | "error"', "四种状态; 切换时图标以弹簧缩放进来."),
  text("label", "文字", "构建并上传 dist", "图标右边的任务文字; 完成时被划线."),
  toggle("quantified", "定量进度", true, "不是属性: 打开时演示传 progress, 进行中改画定量弧, 不转."),
  range("progress", "进度", [0, 1, 0.05], 0.4, "0 到 1; 只在给了且处于 working 时起作用."),
  range("size", "图标尺寸", [14, 32, 1], 20, "图标边长 px."),
  range("strokeWidth", "线宽", [1, 3, 0.5], 2, "圈, 弧, 对勾与叉的线宽 (24 视口单位)."),
  range("dashes", "虚线段数", [4, 16, 1], 8, "待办虚线圈分成几段."),
  range("fontSize", "字号", [12, 18, 1], 14, "文字字号 px."),
  toggle("strike", "完成划线", true, "完成时给文字划一道线."),
  color("tone", "进行色", RANGE_TONES, "primary", "RangeTone", "待办与进行中的颜色; 不给时跟随文字色."),
];
const BASE = initialValues(CONTROLS);

const ROWS: ReadonlyArray<{ readonly status: TaskStatus; readonly label: string }> = [
  { status: "done", label: "跑完单元测试 (2,184 例)" },
  { status: "error", label: "上传 source map" },
  { status: "pending", label: "通知 #release 频道" },
];

/** 外观类属性, 固定的三行也跟着走. */
const LOOK = ["size", "strokeWidth", "dashes", "fontSize", "strike", "tone"];

const toProps = ({ quantified, progress, ...rest }: Values): Record<string, unknown> => (quantified ? { ...rest, progress } : rest);

function pick(props: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(LOOK.map((key) => [key, props[key]]));
}

export const TASK_GLYPH: PageSpec = {
  id: "task-glyph",
  kind: "control",
  importName: "TaskGlyph",
  source: "src/controls/range/status/TaskGlyph.tsx",
  raw: glyphRaw,
  deps: [],
  controls: CONTROLS,
  toProps,
  height: 280,
  render: (props) => (
    <ul className="flex flex-col items-start gap-3 text-left">
      <li>
        <TaskGlyph {...pick(props)} {...ROWS[0]} />
      </li>
      <li>
        <TaskGlyph {...props} />
      </li>
      {ROWS.slice(1).map((row) => (
        <li key={row.label}>
          <TaskGlyph {...pick(props)} {...row} />
        </li>
      ))}
    </ul>
  ),
  usage: (values: Values) => controlUsage("TaskGlyph", toProps(values) as Values, { ...toProps(BASE), status: "pending", label: "", tone: "", progress: -1 } as Values),
  propDesc: {
    doneTone: "对勾的颜色.",
    errorTone: "叉的颜色.",
    spinDuration: "进行中弧转一圈的 ms.",
    arcLength: "转动弧占周长的比例.",
    drawDuration: "对勾 / 叉的描画时长 ms.",
    fillOpacity: "图标底圆的填充浓度.",
    strikeDelay: "划线在对勾画完之后再等的 ms.",
    statusText: "覆盖读屏念的状态词 (默认英文 Pending / In progress / Done / Failed).",
  },
  propsNote: "根元素是 role=\"status\"; 图标 aria-hidden, 读屏器念 \"状态词: 文字\".",
  examples: [
    {
      id: "progress",
      title: "定量进度",
      desc: "给 progress 时进行中改画定量弧, 弧长变化有 300ms 过渡.",
      code: `<TaskGlyph status="working" progress={0.25} label="下载依赖 25%" />\n<TaskGlyph status="working" progress={0.75} label="编译 75%" />`,
      align: "stretch",
      render: () => (
        <div className="flex flex-col items-start gap-3 p-6">
          <TaskGlyph status="working" progress={0.25} label="下载依赖 25%" />
          <TaskGlyph status="working" progress={0.75} label="编译 75%" />
        </div>
      ),
    },
  ],
  keyboard: [{ keys: ["Tab"], action: "不可聚焦: 状态图标是 role=\"status\" 的展示区, 不占 Tab 位; 状态变化由读屏器播报." }],
  reduced: {
    desc: "减少动效下图标直接切到新状态: 待办不呼吸, 进行中的弧不转, 对勾与叉与划线直接画好.",
    notes: ["待办虚线圈静止, 不呼吸.", "进行中是一段静止的弧 (定量进度照常按值画).", "状态切换不缩放, 对勾 / 叉与划线不做描画动画."],
  },
};
