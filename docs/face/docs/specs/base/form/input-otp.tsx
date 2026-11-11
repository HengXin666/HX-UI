import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@hx/ui";
import otpRaw from "../../../../../../src/primitives/input-otp.tsx?raw";
import { select, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 一次性验证码输入. 主演示是登录短信验证码, 位数与分组可调; 格子是透明真实 input 的投影.
 */

const SAMPLE = "482913";

/** 按位数与是否分组切成几段格子下标: 6 位分组是 3 + 3, 4 位分组是 2 + 2. */
function groupsOf(length: number, split: boolean): number[][] {
  const all = Array.from({ length }, (_, index) => index);
  if (!split) return [all];
  const half = length / 2;
  return [all.slice(0, half), all.slice(half)];
}

function OtpDemo(props: Record<string, unknown>) {
  const { length, split, prefilled, invalid, disabled } = props as { length: string; split: boolean; prefilled: boolean; invalid: boolean; disabled: boolean };
  const size = Number(length);
  const groups = groupsOf(size, split);
  return (
    <InputOTP maxLength={size} defaultValue={prefilled ? SAMPLE.slice(0, size - 2) : undefined} disabled={disabled} aria-label="短信验证码">
      {groups.map((group, index) => (
        <span key={group[0]} className="contents">
          {index > 0 ? <InputOTPSeparator /> : null}
          <InputOTPGroup>
            {group.map((slot) => (
              <InputOTPSlot key={slot} index={slot} aria-invalid={invalid || undefined} />
            ))}
          </InputOTPGroup>
        </span>
      ))}
    </InputOTP>
  );
}

function usage(values: Values): string {
  const size = Number(values.length);
  const slot = (index: number) => `    <InputOTPSlot index={${index}}${values.invalid ? " aria-invalid" : ""} />`;
  const body = groupsOf(size, Boolean(values.split))
    .map((group) => `  <InputOTPGroup>\n${group.map(slot).join("\n")}\n  </InputOTPGroup>`)
    .join("\n  <InputOTPSeparator />\n");
  const attrs = [`maxLength={${size}}`, values.prefilled ? `defaultValue="${SAMPLE.slice(0, size - 2)}"` : "", values.disabled ? "disabled" : "", `aria-label="短信验证码"`].filter(Boolean).join(" ");
  const names = ["InputOTP", "InputOTPGroup", ...(values.split ? ["InputOTPSeparator"] : []), "InputOTPSlot"];
  return demo(names, `<InputOTP ${attrs}>\n${body}\n</InputOTP>`);
}

export const INPUT_OTP: PageSpec = {
  id: "input-otp",
  kind: "composite",
  importName: "InputOTP",
  parts: ["InputOTPSlot"],
  source: "src/primitives/input-otp.tsx",
  raw: otpRaw,
  deps: ["input-otp", "lucide-react"],
  controls: [
    select("length", "位数", ["4", "6"], "6", "", "maxLength, 也是格子的数量. 格子要与它对上, index 从 0 开始."),
    toggle("split", "分组", true, "不是属性: 把格子分成两组, 中间放 InputOTPSeparator, 便于对着短信核对."),
    toggle("prefilled", "预填", false, "defaultValue: 非受控的初始值; 演示填入位数减 2 个字符, 当前格有闪烁光标."),
    toggle("invalid", "校验失败", false, "不是 InputOTP 的属性: 每个 InputOTPSlot 给 aria-invalid, 边框转危险色."),
    toggle("disabled", "禁用", false, "原生 disabled 落在真实 input 上, 整组降到 50% 透明度."),
  ],
  propDesc: {
    children: "格子的排布: InputOTPGroup / InputOTPSlot / InputOTPSeparator.",
    value: "受控的值, 与 onChange 成对使用.",
    onChange: "值变化时回调, 参数是整串.",
    maxLength: "位数. 必填.",
    textAlign: "真实 input 里文字的对齐, 影响光标与选区的位置.",
    onComplete: "填满 maxLength 位时回调, 常用来自动提交.",
    pushPasswordManagerStrategy: "密码管理器的图标会盖住最后一格时, 是否把输入框加宽避开.",
    pasteTransformer: "粘贴前先处理文本 (例如去掉空格与短横).",
    containerClassName: "格子外层容器的类名; className 落在透明的真实 input 上.",
    noScriptCSSFallback: "禁用脚本时的兜底样式.",
    nonce: "注入样式时用的 CSP nonce.",
    render: "不用 children 时, 以渲染函数拿到每格状态自己画.",
    "InputOTPSlot.index": "这一格对应第几个字符, 从 0 开始. 必填.",
  },
  propsNote: "其余属性 (pattern, inputMode, autoComplete, name 等) 透传给真实 input; 只收数字时传 pattern={REGEXP_ONLY_DIGITS} (从 input-otp 引入).",
  height: 300,
  render: (props) => <OtpDemo {...props} />,
  usage,
  examples: [
    {
      id: "four",
      title: "四位不分组",
      desc: "银行卡支付确认这类四位码, 一组就够.",
      code: `<InputOTP maxLength={4} aria-label="支付确认码">\n  <InputOTPGroup>\n    <InputOTPSlot index={0} />\n    <InputOTPSlot index={1} />\n    <InputOTPSlot index={2} />\n    <InputOTPSlot index={3} />\n  </InputOTPGroup>\n</InputOTP>`,
      render: () => <OtpDemo length="4" split={false} prefilled={false} invalid={false} disabled={false} />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦到验证码输入 (整组只有一个真实 input)." },
    { keys: ["0-9"], action: "逐格填入, 光标自动移到下一格." },
    { keys: ["Backspace"], action: "删掉前一格." },
    { keys: ["←", "→"], action: "在格子之间移动光标." },
    { keys: ["Ctrl", "V"], action: "粘贴整串, 一次填满; 系统短信的一键填充同样有效." },
  ],
};
