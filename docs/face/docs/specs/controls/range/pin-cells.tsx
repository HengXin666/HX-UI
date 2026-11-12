import { useState } from "react";
import { PinCells, type PinStatus } from "../../../../../../src/controls";
import pinRaw from "../../../../../../src/controls/range/input/PinCells.tsx?raw";
import { color, initialValues, range, select, text, toggle, type ControlDef, type PageSpec, type Values } from "../../types";
import { controlUsage } from "../shared";
import { RANGE_TONES } from "./tones";

/**
 * controls 批 1: 一次性验证码格子. 演示里填满后 onComplete 校验: 482916 通过 (底色漫上来, 对勾升起), 其余报错 (红边).
 * 状态也能直接在 "状态" 下拉里切; 字符落下的弹簧参数在 Props 表.
 */

const CODE = "482916";

const CONTROLS: readonly ControlDef[] = [
  range("length", "位数", [4, 8, 1], 6, "格子数, 也是最大长度."),
  text("defaultValue", "已填", "4829", "非受控的初始内容; 只留数字以外也收, 超长截断."),
  select("status", "状态", ["idle", "success", "error"], "idle", '"idle" | "success" | "error"', "success: 底色漫上, 字符下沉变淡, 对勾升起; error: 格子描红, aria-invalid."),
  toggle("mask", "遮住字符", false, "字符画成圆点, 用于 PIN."),
  toggle("caret", "光标", true, "聚焦时在下一个空格画闪烁光标."),
  range("slotSize", "格子大小", [32, 60, 2], 44, "每格边长 px."),
  range("gap", "格距", [0, 16, 1], 8, "格与格之间 px."),
  range("radius", "圆角", [0, 24, 1], 12, "格子圆角 px."),
  color("accentTone", "通过底色", RANGE_TONES, "foreground", "RangeTone", "通过态漫上来的底色."),
  toggle("disabled", "禁用", false, "半透明, 不能输入."),
];
const BASE = initialValues(CONTROLS);

function PinDemo({ status, ...props }: Record<string, unknown>) {
  const [checked, setChecked] = useState<PinStatus | null>(null);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-4">
        <div className="self-start text-left">
          <p className="text-[13px] font-medium text-foreground">登录验证</p>
          <p className="mt-1 text-[12px] text-muted-foreground">验证码已发送到 138****2046, 5 分钟内有效</p>
        </div>
        <PinCells
          {...props}
          status={checked ?? (status as PinStatus)}
          ariaLabel="短信验证码"
          onChange={() => setChecked(null)}
          onComplete={(code) => setChecked(code === CODE ? "success" : "error")}
        />
      </div>
      <p className="font-mono text-[12px] text-muted-foreground">演示验证码 {CODE}: 填对通过, 填错描红</p>
    </div>
  );
}

export const PIN_CELLS: PageSpec = {
  id: "pin-cells",
  kind: "control",
  importName: "PinCells",
  source: "src/controls/range/input/PinCells.tsx",
  raw: pinRaw,
  deps: [],
  controls: CONTROLS,
  height: 260,
  render: (props) => <PinDemo {...props} />,
  usage: (values: Values) => controlUsage("PinCells", { ...values, ariaLabel: "短信验证码" }, { ...BASE, defaultValue: "", ariaLabel: "" }).replace("<PinCells", "<PinCells onComplete={verify}"),
  propDesc: {
    value: "受控内容.",
    onChange: "内容每变一次调用.",
    onComplete: "填满 length 位的那一刻调用一次.",
    autoFocus: "挂载即聚焦.",
    inkTone: "普通态字符色.",
    slotTone: "格子底色.",
    digitTone: "通过态漫底上的字符与对勾色.",
    dangerTone: "错误态描边色.",
    bounce: "字符落下与对勾升起的回弹.",
    ariaLabel: "读屏名称, 默认 One-time code.",
  },
  propsNote: "格子都 aria-hidden; 真正接收输入的是叠在上面的透明 <input inputMode=\"numeric\" autoComplete=\"one-time-code\">, 手机键盘与短信自动填充都走它.",
  examples: [
    {
      id: "pin",
      title: "四位 PIN",
      desc: "mask 把字符画成圆点; 格子更大, 圆角收小.",
      code: `<PinCells length={4} mask slotSize={52} radius={8} ariaLabel="支付密码" />`,
      render: () => <PinCells length={4} mask slotSize={52} radius={8} ariaLabel="支付密码" />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦隐藏的输入框, 光标出现在下一个空格." },
    { keys: ["0-9"], action: "逐格输入; 粘贴一整串时逐格错峰落下." },
    { keys: ["Backspace"], action: "删掉最后一位." },
  ],
  reduced: {
    desc: "减少动效下字符直接出现, 通过态的漫底, 下沉与对勾都直接到位.",
    notes: ["输入与粘贴时字符不从上方落下, 不错峰.", "通过时字符直接变淡, 对勾直接出现, 不升起.", "离开通过态时直接复原, 不倒放."],
  },
};
