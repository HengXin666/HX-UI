import { useState } from "react";
import { DevelopFrame, type DevelopStatus } from "../../../../../../src/controls";
import developRaw from "../../../../../../src/controls/compose/status/DevelopFrame.tsx?raw";
import { color, initialValues, range, select, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { COMPOSE_SURFACES } from "./tones";

/**
 * controls 批 2: 显影框. 演示是一张正在生成的周活跃图: 内容从分条遮罩与模糊里逐档清晰, 生成中与精修中有一条软边扫光;
 * 状态在半路改了下一帧就转向. 失败时中间给 "重新生成", 点了回到生成中.
 */

const STATUSES = ["queued", "generating", "refining", "complete", "error"];

const CONTROLS: readonly ControlDef[] = [
  select("status", "状态", STATUSES, "generating", "DevelopStatus", "queued 0, generating 0.5, refining 0.875, complete 1 的进度档; error 回到 0 并给重试."),
  range("width", "宽度", [200, 360, 10], 300, "框宽 px (也收字符串)."),
  select("aspectRatio", "宽高比", ["4 / 3", "1 / 1", "16 / 9", "3 / 4"], "4 / 3", "string", "CSS aspect-ratio."),
  range("radius", "圆角", [0, 32, 1], 16, "框圆角 px."),
  range("stageDuration", "每档时长", [100, 2400, 50], 400, "进度追随到下一档的 ms (约 95%)."),
  toggle("sweep", "扫光", true, "生成中与精修中画一条软边扫光."),
  toggle("showStatus", "状态签", true, "左下角的状态签 (role=status)."),
  color("background", "底色", COMPOSE_SURFACES, "secondary", "HxColor", "框底色, 遮罩也用这个颜色; 演示取 secondary, 与台面拉开一档好看清圆角."),
];
const BASE = initialValues(CONTROLS);
const LABELS = { queued: "排队中", generating: "生成中", refining: "精修中", complete: "完成", error: "失败" };
const WEEK = [
  ["一", 62],
  ["二", 74],
  ["三", 58],
  ["四", 86],
  ["五", 95],
  ["六", 41],
  ["日", 37],
] as const;

function WeekChart() {
  return (
    <div className="flex size-full flex-col gap-2 p-4 text-left">
      <p className="text-[12px] text-muted-foreground">11 月第 2 周 · 日活跃</p>
      <p className="text-[20px] font-semibold tabular-nums">12,480</p>
      <div className="flex flex-1 items-end gap-1.5">
        {WEEK.map(([day, value]) => (
          <div key={day} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-sm bg-primary" style={{ height: `${value}%` }} />
            <span className="text-[10px] text-muted-foreground">{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DevelopDemo({ status, ...props }: Record<string, unknown>) {
  const [now, setNow] = useState(status as DevelopStatus);
  return (
    <DevelopFrame retryLabel="重新生成" {...props} status={now} labels={LABELS} onRetry={() => setNow("generating")}>
      <WeekChart />
    </DevelopFrame>
  );
}

export const DEVELOP_FRAME: PageSpec = {
  id: "develop-frame",
  kind: "control",
  importName: "DevelopFrame",
  source: "src/controls/compose/status/DevelopFrame.tsx",
  raw: developRaw,
  deps: [],
  controls: CONTROLS,
  height: 340,
  render: (props) => <DevelopDemo {...props} />,
  usage: (values: Values) => controlUsage("DevelopFrame", values, { ...BASE, width: 320, background: "muted" }, "\n  <WeekChart />\n"),
  propDesc: {
    children: "被显影的内容 (图, 卡片, 任意节点), 铺满框.",
    color: "框内前景色 (扫光与条带的墨色).",
    retryLabel: "失败时中间那颗按钮的文字, 默认 Retry.",
    hideAfter: "完成后状态签停留的 ms, 之后淡出.",
    labels: "各状态的签文字, 默认英文 Queued / Generating / Refining / Done / Failed.",
    onRetry: "失败时点重试按钮调用.",
    className: "根元素类名.",
  },
  propsNote: "根元素 data-status 与 aria-busy 跟着状态走; 遮罩与扫光是 aria-hidden 的 canvas, 内容的模糊按进度分 12 / 6 / 3 / 0px 四档.",
  examples: [
    {
      id: "square",
      title: "方形头像的排队态",
      desc: "queued 时遮罩以 2.4s 慢呼吸; 不要状态签时 showStatus={false}.",
      code: `<DevelopFrame status="queued" width={160} aspectRatio="1 / 1" radius={80} showStatus={false}>\n  <div className="grid size-full place-items-center bg-secondary text-secondary-foreground">林</div>\n</DevelopFrame>`,
      render: () => (
        <DevelopFrame status="queued" width={160} aspectRatio="1 / 1" radius={80} showStatus={false}>
          <div className="grid size-full place-items-center bg-secondary text-[40px] font-semibold text-secondary-foreground">林</div>
        </DevelopFrame>
      ),
    },
    {
      id: "error",
      title: "失败与重试",
      desc: "error 时进度退回 0, 中间给重试按钮; onRetry 里把状态改回 generating 就重新显影.",
      code: `<DevelopFrame status="error" width={240} labels={{ error: "失败" }} retryLabel="再试一次" onRetry={retry}>\n  <WeekChart />\n</DevelopFrame>`,
      render: () => <DevelopDemo status="error" width={240} retryLabel="再试一次" />,
    },
  ],
  keyboard: [{ keys: ["Tab"], action: "失败时聚焦重试按钮, Enter / Space 触发 onRetry; 其余状态框内没有可聚焦元素." }],
  reduced: {
    desc: "减少动效下进度直接到该档, 内容模糊直接换档; 不扫光, 排队不呼吸, 状态签不淡入.",
    notes: ["每次改状态遮罩与模糊直接跳到该档, 不追随.", "生成中与精修中不画扫光; 排队时遮罩不呼吸.", "状态签换字不淡入, 完成后仍按 hideAfter 收起."],
    height: 300,
  },
};
