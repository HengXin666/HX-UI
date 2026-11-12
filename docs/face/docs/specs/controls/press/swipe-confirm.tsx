import { useState } from "react";
import { SwipeConfirm } from "../../../../../../src/controls";
import swipeRaw from "../../../../../../src/controls/press/hold/SwipeConfirm.tsx?raw";
import { initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage, omit } from "../shared";

/**
 * controls 批 1: 滑动确认. 演示是付款: onConfirm 返回一个 900ms 后兑现 (或拒绝) 的 Promise,
 * "模拟结果" 选失败时走错误态; 下面一行写出 onDone / onError 的回调.
 */

const PAY_MS = 900;

const CONTROLS: readonly ControlDef[] = [
  text("label", "提示文字", "滑动支付 ¥ 268.00", "空闲态的文字 (label), 拖动时随进度淡出."),
  text("doneLabel", "成功文字", "支付成功", "onConfirm 兑现后的文字 (doneLabel)."),
  select("outcome", "模拟结果", ["成功", "失败"], "成功", "-", "不是属性: 演示里 onConfirm 返回的 Promise 兑现还是拒绝."),
  range("width", "宽度", [200, 340, 10], 280, "轨道宽 px."),
  range("height", "高度", [40, 72, 2], 56, "轨道高 px; 拇指是 高度 - 8 的正方形."),
  range("radius", "圆角", [0, 36, 1], 28, "轨道圆角 px; 拇指圆角比它小 4."),
  range("holdMs", "结果停留", [600, 4000, 100], 1500, "成功或失败文字停留多久 ms 再回到空闲."),
  toggle("disabled", "禁用", false, "半透明, 拇指不能拖也不能按."),
];
const BASE = initialValues(CONTROLS);

function SwipeDemo({ outcome, ...props }: Record<string, unknown>) {
  const [log, setLog] = useState("把右箭头拖到最右端");
  const confirm = (): Promise<void> =>
    new Promise((resolve, reject) => {
      setLog("onConfirm: 正在扣款");
      setTimeout(() => (outcome === "失败" ? reject(new Error("余额不足")) : resolve()), PAY_MS);
    });
  return (
    <div className="flex flex-col items-center gap-4">
      <SwipeConfirm {...props} errorLabel="余额不足" onConfirm={confirm} onDone={() => setLog("onDone: 订单 #20261112-0418 已支付")} onError={(error) => setLog(`onError: ${String((error as Error).message)}`)} />
      <p className="font-mono text-[12px] text-muted-foreground">{log}</p>
    </div>
  );
}

export const SWIPE_CONFIRM: PageSpec = {
  id: "swipe-confirm",
  kind: "control",
  importName: "SwipeConfirm",
  source: "src/controls/press/hold/SwipeConfirm.tsx",
  raw: swipeRaw,
  deps: ["lucide-react"],
  controls: CONTROLS,
  height: 300,
  render: (props) => <SwipeDemo {...props} />,
  usage: (values: Values) =>
    controlUsage("SwipeConfirm", { ...omit(values, ["outcome"]), errorLabel: "余额不足" }, { ...omit(BASE, ["outcome"]), label: "", doneLabel: "", errorLabel: "" }).replace(
      "<SwipeConfirm",
      "<SwipeConfirm onConfirm={() => pay(order)}",
    ),
  propDesc: {
    errorLabel: "onConfirm 拒绝后的文字, 默认 Payment failed.",
    onConfirm: "拇指到端 (或键盘确认) 时调用; 返回 Promise 时进入等待态, 兑现走成功, 拒绝走错误.",
    onDone: "成功文字停留 holdMs 之后调用.",
    onError: "错误文字停留 holdMs 之后调用, 参数是拒绝的原因.",
    speed: "拇指跟手的弹簧硬度 (x8 换成 stiffness).",
    returnBounce: "中途松手回弹的弹性, 上限 0.5.",
    landingDip: "到端时轨道下压的比例.",
    icon: "拇指上的图标, 默认右箭头.",
  },
  propsNote: "轨道是 <div>, 拇指是 <button> 并由轨道文字 aria-labelledby 命名; 文字区 aria-live=\"polite\", 成功与失败都会播报.",
  examples: [
    {
      id: "compact",
      title: "窄轨道的解锁",
      desc: "更窄更矮的轨道放进卡片底部; 成功后 onDone 里再做跳转.",
      code: `<SwipeConfirm label="滑动解锁" doneLabel="已解锁" width={220} height={44} radius={12} onConfirm={unlock} />`,
      render: () => <SwipeConfirm label="滑动解锁" doneLabel="已解锁" width={220} height={44} radius={12} />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦拇指 (轨道文字是它的名字)." },
    { keys: ["Enter"], action: "直接提交, 不要求拖动; 等待与结果态照常走." },
    { keys: ["Space"], action: "同 Enter." },
  ],
  reduced: {
    desc: "减少动效下仍要拖到端才提交, 但没有压扁, 下压与抖动, 松手 200ms 直线归位.",
    notes: ["拖动时拇指不随速度压扁, 到端不放大.", "到端不下压, 失败不抖动, 等待图标不呼吸.", "中途松手用 200ms 缓出直线归位, 不弹."],
  },
};
