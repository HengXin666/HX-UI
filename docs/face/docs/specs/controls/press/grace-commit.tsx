import { useState } from "react";
import { GraceCommit, type GracePhase } from "../../../../../../src/controls";
import graceRaw from "../../../../../../src/controls/press/hold/GraceCommit.tsx?raw";
import { initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";

/**
 * controls 批 1: 带撤销窗口的提交. 演示是 "归档邮件": 下面一行如实写出 onCommit / onUndo / onPhaseChange 的回调,
 * commitOn 与 settle 的差别就看这一行什么时候出 "已提交".
 */

const PHASE_TEXT: Record<GracePhase, string> = { idle: "待操作", armed: "引线燃烧中, 再按一次撤销", done: "已落定" };

const CONTROLS: readonly ControlDef[] = [
  text("label", "按钮文字", "归档 12 封邮件", "空闲态的文字 (label)."),
  text("undoLabel", "撤销文字", "撤销", "引线燃烧期间显示的文字 (undoLabel), 读屏器同时播报."),
  select("size", "尺寸", ["sm", "md", "lg"], "lg", '"sm" | "md" | "lg"', "高度 32 / 40 / 48 px."),
  range("radius", "圆角", [0, 24, 1], 22, "圆角 px; 描边引线沿同一个圆角走."),
  select("fuse", "引线", ["outline", "bar"], "outline", '"outline" | "bar"', "outline 沿整圈描边烧, bar 是底边一条 1px 进度线."),
  range("undoWindow", "撤销窗口", [1000, 8000, 500], 4000, "撤销窗口 ms, 引线烧完即落定."),
  select("commitOn", "提交时机", ["press", "end"], "press", '"press" | "end"', "press: 按下即提交, 撤销时回滚; end: 引线烧完才提交."),
  select("settle", "烧完后", ["reset", "done"], "reset", '"reset" | "done"', "烧完回到空闲 (reset), 还是停在已完成并禁用 (done)."),
  toggle("pauseOnHover", "悬停暂停", true, "指针停在按钮上时引线暂停; 页面隐藏时总是暂停."),
  toggle("disabled", "禁用", false, "半透明, 不响应."),
];
const BASE = initialValues(CONTROLS);
/** 演示卡里的三封推广邮件 (只是陪衬, 让按钮落在真实场景里). */
const MAILS = ["京东 · 双 11 返场, 满 300 减 50", "Figma · Config 2026 全部回放已上线", "12306 · 您的候补订单已兑现"];

function GraceDemo(props: Record<string, unknown>) {
  const [phase, setPhase] = useState<GracePhase>("idle");
  const [log, setLog] = useState("还没有提交");
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-[min(22rem,calc(100vw-6rem))] rounded-2xl border border-border bg-card p-4 text-left">
        <p className="text-[13px] font-medium text-foreground">收件箱 · 推广 (12)</p>
        <ul className="mt-2 flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
          {MAILS.map((mail) => (
            <li key={mail} className="truncate">
              {mail}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-center">
          <GraceCommit
            {...props}
            doneLabel="已归档"
            onPhaseChange={setPhase}
            onCommit={() => setLog("onCommit: 已提交归档")}
            onUndo={() => setLog("onUndo: 已撤销, 邮件回到收件箱")}
          />
        </div>
      </div>
      <p className="font-mono text-[12px] text-muted-foreground">
        {PHASE_TEXT[phase]} · {log}
      </p>
    </div>
  );
}

export const GRACE_COMMIT: PageSpec = {
  id: "grace-commit",
  kind: "control",
  importName: "GraceCommit",
  source: "src/controls/press/hold/GraceCommit.tsx",
  raw: graceRaw,
  deps: [],
  controls: CONTROLS,
  height: 300,
  render: (props) => <GraceDemo {...props} />,
  usage: (values: Values) => controlUsage("GraceCommit", { ...values, doneLabel: "已归档" }, { ...BASE, size: "md", label: "", undoLabel: "", doneLabel: "" }),
  propDesc: {
    label: "空闲态文字, 默认 Archive.",
    doneLabel: "落定后的文字 (settle 为 done 时一直显示), 默认 Archived.",
    icon: "空闲态文字前的图标.",
    crossfadeMs: "三种文字之间的淡变时长 ms.",
    onCommit: "提交回调: commitOn 为 press 时按下即调, 为 end 时引线烧完才调.",
    onUndo: "窗口内再按一次时调用; commitOn 为 press 时在这里回滚.",
    onFuseEnd: "引线烧完时调用 (早于 onCommit).",
    onPhaseChange: "idle / armed / done 三态切换时调用.",
    type: "按钮的 type; 放进表单当提交键时传 submit.",
  },
  propsNote: "根元素是 <button>, 当前阶段写在 data-phase 上; 引线与进度线 aria-hidden, 阶段文字经 aria-live=\"polite\" 播报.",
  examples: [
    {
      id: "bar",
      title: "底边进度线, 烧完才提交",
      desc: "fuse=\"bar\" 只在底边留一条 1px 线; commitOn=\"end\" 适合发消息这类撤销后不必回滚的动作.",
      code: `<GraceCommit label="发送给 8 位成员" undoLabel="撤销发送" doneLabel="已发送" fuse="bar" commitOn="end" undoWindow={5000} />`,
      render: () => <GraceCommit label="发送给 8 位成员" undoLabel="撤销发送" doneLabel="已发送" fuse="bar" commitOn="end" undoWindow={5000} />,
    },
    {
      id: "done",
      title: "落定后停在完成态",
      desc: "settle=\"done\": 引线烧完按钮停在 \"已删除\" 并禁用, 不再回到空闲.",
      code: `<GraceCommit label="删除草稿" undoLabel="撤销删除" doneLabel="已删除" settle="done" size="sm" />`,
      render: () => <GraceCommit label="删除草稿" undoLabel="撤销删除" doneLabel="已删除" settle="done" size="sm" />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦按钮, 出 1px 焦点环." },
    { keys: ["Enter"], action: "空闲时点燃引线 (按 commitOn 提交); 燃烧期间再按一次撤销." },
    { keys: ["Space"], action: "同 Enter." },
  ],
  reduced: {
    desc: "引线时长是功能信息, 减少动效下照常计时; 只去掉按下缩放与文字淡变.",
    notes: [
      "撤销窗口照常倒计时, 引线照常烧 (它告诉用户还剩多久, 不算装饰动效).",
      "按下不再缩放, 背景色切换没有过渡.",
      "三种文字直接切换, 没有交叉淡变.",
    ],
  },
};
