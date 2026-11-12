import { useState } from "react";
import { RunChip, type RunStatus } from "../../../../../../src/controls";
import runRaw from "../../../../../../src/controls/press/signal/RunChip.tsx?raw";
import { initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage, omit } from "../shared";

/**
 * controls 批 1: 工具调用芯片. 状态是受控的 (status), 第一枚由 "状态" 下拉切; 下面固定一枚完成, 一枚出错,
 * 外观类调参 (高度, 圆角, 刷底浓度, 预期耗时, 计时) 三枚一起走. 出错且开了重试时芯片可点, 点了回到运行中, 下面一行写出 onRetry.
 */

const CONTROLS: readonly ControlDef[] = [
  select("status", "状态", ["running", "done", "error"], "running", '"running" | "done" | "error"', "运行中走进度与计时; 完成刷 success 底, 出错刷 danger 底并抖一下."),
  select("icon", "图标", ["terminal", "file", "search", "edit"], "terminal", '"terminal" | "file" | "search" | "edit"', "工具类别的图标."),
  text("name", "工具名", "bash", "工具名, 粗体."),
  text("argument", "参数", "pnpm vitest run tests/controls", "参数, 等宽灰字, 过长截断."),
  range("expectedMs", "预期耗时", [500, 10000, 500], 2500, "预期耗时 ms: 进度在这段时间里走到 90% 停住, 只有真正完成才走满."),
  range("size", "高度", [24, 48, 2], 34, "芯片高度 px."),
  range("radius", "圆角", [0, 24, 1], 10, "圆角 px."),
  range("washOpacity", "刷底浓度", [0, 0.4, 0.02], 0.14, "完成 / 出错时刷开的底色不透明度."),
  toggle("showTimer", "显示计时", true, "运行中右侧显示已用秒数; 结束后淡出."),
  toggle("retry", "可重试", true, "不是开关属性: 打开时演示传 onRetry, 出错时芯片变成按钮."),
];
const BASE = initialValues(CONTROLS);
/** 演示里重试后多久算跑通. */
const RERUN_MS = 1800;
/** 外观类属性也给下面两枚固定芯片, 刷底浓度与重试在完成 / 出错态才看得到. */
const LOOK = ["size", "radius", "washOpacity", "expectedMs", "showTimer"];

function idleLog(retry: unknown): string {
  return retry ? "出错的芯片可以点: 点它重试" : "没传 onRetry: 出错的芯片不可点";
}

function RunDemo({ retry, status, ...props }: Record<string, unknown>) {
  const [log, setLog] = useState(idleLog(retry));
  const [override, setOverride] = useState<"running" | "done" | null>(null);
  const [failed, setFailed] = useState<RunStatus>("error");
  const look = Object.fromEntries(LOOK.map((key) => [key, props[key]]));
  const rerun = (done: (status: "running" | "done") => void): void => {
    done("running");
    setLog("onRetry: 已重新运行");
    setTimeout(() => {
      done("done");
      setLog("第二次运行通过");
    }, RERUN_MS);
  };
  return (
    <div className="flex w-[min(26rem,calc(100vw-6rem))] flex-col items-start gap-2">
      <RunChip {...props} status={(override ?? status) as RunStatus} onRetry={retry ? () => rerun(setOverride) : undefined} />
      <RunChip {...look} icon="file" name="read" argument="src/controls/index.ts" status="done" />
      <RunChip {...look} icon="edit" name="write" argument="docs/CHANGELOG.md" status={failed} onRetry={retry ? () => rerun(setFailed) : undefined} />
      <p className="mt-2 self-center font-mono text-[12px] text-muted-foreground">{log}</p>
    </div>
  );
}

export const RUN_CHIP: PageSpec = {
  id: "run-chip",
  kind: "control",
  importName: "RunChip",
  source: "src/controls/press/signal/RunChip.tsx",
  raw: runRaw,
  deps: ["lucide-react"],
  controls: CONTROLS,
  height: 260,
  render: (props) => <RunDemo {...props} />,
  usage: (values: Values) => {
    const code = controlUsage("RunChip", omit(values, ["retry"]), { ...omit(BASE, ["retry"]), name: "", argument: "" });
    return values.retry ? code.replace("<RunChip", "<RunChip onRetry={rerun}") : code;
  },
  propDesc: {
    progressOpacity: "运行中进度条 (bg-foreground) 的不透明度.",
    shake: "出错抖动的幅度 px.",
    onRetry: "给了它, 出错时整枚芯片变成 <button>, 点击即重试.",
  },
  propsNote: "平时根元素是 <span role=\"status\" aria-busy>, 出错且有 onRetry 时换成 <button>; 状态写在 data-status, 并经 aria-live 播报.",
  examples: [
    {
      id: "list",
      title: "一串工具调用",
      desc: "智能体回复里按顺序列出各次调用; 已结束的停在完成或出错.",
      code: `<RunChip icon="search" name="grep" argument="useReducedMotion src/" status="done" />\n<RunChip icon="file" name="read" argument="src/controls/index.ts" status="done" />\n<RunChip icon="edit" name="write" argument="docs/CHANGELOG.md" status="error" />\n<RunChip icon="terminal" name="bash" argument="npm run build" />`,
      align: "stretch",
      render: () => (
        <div className="flex flex-col items-start gap-2 p-6">
          <RunChip icon="search" name="grep" argument="useReducedMotion src/" status="done" />
          <RunChip icon="file" name="read" argument="src/controls/index.ts" status="done" />
          <RunChip icon="edit" name="write" argument="docs/CHANGELOG.md" status="error" />
          <RunChip icon="terminal" name="bash" argument="npm run build" />
        </div>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "只有出错且给了 onRetry 时芯片才可聚焦 (它是按钮), 其余状态不占 Tab 位." },
    { keys: ["Enter"], action: "出错可重试时触发 onRetry." },
    { keys: ["Space"], action: "同 Enter." },
  ],
  reduced: {
    desc: "进度与计时是状态信息, 减少动效下照常更新; 去掉出错抖动, 底色刷开与淡变.",
    notes: ["运行中的进度条与秒数照常走.", "完成 / 出错时底色直接铺满, 不从左往右刷.", "出错不抖动, 计时直接消失, 点击重试不缩放."],
  },
};
