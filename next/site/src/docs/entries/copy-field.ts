import type { DocEntry, Values } from "../types";

const IMPORT = `import { CopyField } from "@/components/ui/copy-field";\n`;

/** 公共属性: 与组件默认相同的不写 */
const common = (v: Values) =>
  [
    v.size !== "default" ? `size="${v.size}"` : "",
    v.variant !== "default" ? `variant="${v.variant}"` : "",
    v.feedback !== "pop" ? `feedback="${v.feedback}"` : "",
    Number(v.copiedDuration) !== 1600 ? `copiedDuration={${Number(v.copiedDuration)}}` : "",
    v.showLabel ? "showLabel" : "",
    v.mono === false ? "mono={false}" : "",
    v.clickToCopy ? "clickToCopy" : "",
  ].filter(Boolean);
const mask = (v: Values, peek = true) => (v.masked ? ["masked", peek && Number(v.maskPeek) ? `maskPeek={${Number(v.maskPeek)}}` : ""].filter(Boolean) : []);
const multi = (v: Values) => ["multiline", Number(v.maxHeight) !== 160 ? `maxHeight={${Number(v.maxHeight)}}` : "", v.wrap === "anywhere" ? `wrap="anywhere"` : ""].filter(Boolean);
/** 拼一个 <CopyField />: 属性多就换行 */
const tag = (attrs: string[], indent: string) => {
  const one = `<CopyField ${attrs.join(" ")} />`;
  if (one.length + indent.length <= 100) return indent + one;
  return `${indent}<CopyField\n${attrs.map((a) => `${indent}  ${a}`).join("\n")}\n${indent}/>`;
};

const USAGE: Record<string, (v: Values) => string> = {
  webhook: (v) => `${IMPORT}import { KeyRoundIcon } from "lucide-react";

export function GithubSource({ source }: { source: Source }) {
  return (
    <div className="grid gap-4">
${tag([`label="Payload URL"`, "value={source.webhookUrl}", ...common(v)], "      ")}
${tag([`label="Secret"`, `aside="只显示一次"`, `description="GitHub 用它给每次推送签名"`, "value={source.webhookSecret}", ...mask(v), ...common(v)], "      ")}
${tag([`label="API Key"`, "value={source.key}", "leading={<KeyRoundIcon />}", ...mask(v), ...common(v), `onCopy={() => toast.success("已复制")}`], "      ")}
    </div>
  );
}
`,
  prompt: (v) => `${IMPORT}
// 长文本: 高度随内容增长到 maxHeight, 再多就框内滚动; 复制的是完整文本
export function AgentPrompt({ agent }: { agent: Agent }) {
  return (
${tag([`label="接入语"`, "value={agent.prompt}", ...multi(v), ...mask(v, false), ...common(v)], "    ")}
  );
}
`,
  code: (v) => `${IMPORT}import { TicketIcon } from "lucide-react";

export function VerifyCode({ code, invite }: { code: string; invite: string }) {
  return (
    <>
${tag([`aria-label="验证码"`, "value={code}", `className="h-14"`, `valueClassName="text-center text-2xl font-semibold tracking-[0.4em]"`, ...mask(v, false), ...common(v)], "      ")}
${tag([`label="团队邀请码"`, "value={invite}", "leading={<TicketIcon />}", ...mask(v), ...common(v)], "      ")}
    </>
  );
}
`,
  field: (v) => `${IMPORT}import { Field } from "@/components/ui/field";

// 放进现有的 Field: CopyField 读它给的 id / aria-describedby / disabled, <label> 点了聚焦并全选值
export function ForwardAddress({ address, stale }: { address: string; stale: boolean }) {
  return (
    <Field label="转发到这个地址" description="在原邮箱里设置自动转发。" error={stale ? "该地址 30 天未收到邮件" : undefined}>
${tag(["value={address}", ...mask(v), ...common(v)], "      ")}
    </Field>
  );
}
`,
  list: (v) => `${IMPORT}import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";

export function InviteRow({ invite }: { invite: Invite }) {
  return (
    <Item>
      <ItemContent>
        <ItemTitle>{invite.who}</ItemTitle>
        <ItemDescription>{invite.role}</ItemDescription>
      </ItemContent>
${tag(["aria-label={`${invite.who} 的邀请链接`}", "value={invite.link}", `className="w-56"`, ...mask(v), ...common(v)], "      ")}
    </Item>
  );
}
`,
};

export const copyField: DocEntry = {
  slug: "copy-field",
  name: "CopyField",
  title: "可复制字段",
  section: "ui",
  group: "表单",
  description:
    "Webhook 地址、API key、webhookSecret、Agent 接入语、验证码、邀请码这类“只显示一次，要复制”的值：等宽显示，可遮罩 / 显示切换，一键复制（剪贴板不可用时自动回退，彻底失败就选中让你手动复制），复制后图标短暂变成对勾、描边转成功色。遮罩时也能选中，Ctrl+C 复制出去的是真值而不是圆点。多行版本随内容长高到最大高度后框内滚动（CSS field-sizing 自动高度，不支持时 JS 兜底）。自带 label / 说明，也能直接放进 Field。",
  file: "src/components/ui/copy-field.tsx",
  importFrom: "@/components/ui/copy-field",
  demo: () => import("./copy-field.demo"),
  source: () => import("@/components/ui/copy-field.tsx?raw").then((m) => m.default),
  defaults: { example: "webhook", size: "default", variant: "default", masked: true, maskPeek: 4, feedback: "pop", copiedDuration: 1600, showLabel: false, mono: true, maxHeight: 160, wrap: "word", clickToCopy: false },
  componentDefaults: {},
  stageHeight: 600,
  presets: [
    { label: "数据源接入", values: { example: "webhook", size: "default", variant: "default", masked: true, maskPeek: 4, showLabel: false, clickToCopy: false } },
    { label: "接入语 (多行)", values: { example: "prompt", size: "default", variant: "muted", masked: false, maxHeight: 160, wrap: "word", showLabel: true } },
    { label: "验证码", values: { example: "code", size: "lg", variant: "default", masked: false, clickToCopy: true, feedback: "pop" } },
    { label: "放进 Field", values: { example: "field", size: "default", variant: "default", masked: true, maskPeek: 0 } },
    { label: "列表内紧凑", values: { example: "list", size: "sm", variant: "muted", masked: false, showLabel: false } },
    { label: "安静反馈", values: { example: "webhook", variant: "ghost", feedback: "fade", copiedDuration: 900, masked: true, maskPeek: 0 } },
  ],
  controls: [
    {
      type: "select",
      key: "example",
      label: "示例",
      options: [
        { value: "webhook", label: "数据源接入" },
        { value: "prompt", label: "接入语 (多行)" },
        { value: "code", label: "验证码 / 邀请码" },
        { value: "field", label: "放进 Field" },
        { value: "list", label: "列表内" },
      ],
    },
    { type: "select", key: "size", label: "尺寸", options: [{ value: "sm", label: "紧凑 (32)" }, { value: "default", label: "默认 (36)" }, { value: "lg", label: "大 (44)" }] },
    { type: "select", key: "variant", label: "外观", options: [{ value: "default", label: "描边" }, { value: "muted", label: "浅底" }, { value: "ghost", label: "无框" }] },
    { type: "toggle", key: "masked", label: "遮罩" },
    { type: "number", key: "maskPeek", label: "末尾明文", min: 0, max: 8, step: 1, unit: "位" },
    { type: "select", key: "feedback", label: "复制反馈", options: [{ value: "pop", label: "弹出对勾" }, { value: "fade", label: "淡入对勾" }, { value: "none", label: "直接切换" }] },
    { type: "number", key: "copiedDuration", label: "对勾停留", min: 400, max: 4000, step: 100, unit: "ms" },
    { type: "toggle", key: "showLabel", label: "按钮带文字" },
    { type: "toggle", key: "mono", label: "等宽字体" },
    { type: "toggle", key: "clickToCopy", label: "点值即复制" },
    { type: "number", key: "maxHeight", label: "多行最大高", min: 80, max: 360, step: 10, unit: "px" },
    { type: "select", key: "wrap", label: "多行换行", options: [{ value: "word", label: "按词" }, { value: "anywhere", label: "任意字符" }] },
  ],
  usage: (v) => (USAGE[String(v.example)] ?? USAGE.webhook)(v),
  props: [
    { name: "value", type: "string", description: "要显示与复制的值。" },
    { name: "copyValue", type: "string", description: "复制的内容与显示的不同时传（如显示短地址，复制完整命令）。" },
    { name: "label / description / aside", type: "ReactNode", description: "传了 label 或 description 就自动包一层 Field（标签、说明、标签右侧附加内容）。已经放在外部 Field 里时不用传，CopyField 会读 Field 给的 id / aria-describedby / aria-invalid / disabled（Field 有 error 时描边标红）。" },
    { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "高 32 / 36 / 44px，与 Input 对齐；按钮 24 / 28 / 32px。" },
    { name: "variant", type: '"default" | "muted" | "ghost"', default: '"default"', description: "default 与 Input 同款 1px 描边；muted 浅底无描边；ghost 无底无描边（放在行内 / 表格里）。" },
    { name: "masked", type: "boolean", default: "false", description: "敏感值：默认遮罩并带眼睛按钮切换。遮罩时 DOM 里只有遮罩字符，复制按钮仍复制真值；值仍可聚焦、选中，原生复制（Ctrl+C / 右键）也换成真值并给出“已复制”反馈。显示 / 隐藏切换在原元素上淡入去模糊，不重挂载（焦点、多行滚动位置保留）。" },
    { name: "revealed / defaultRevealed / onRevealedChange", type: "boolean", description: "受控 / 非受控的“已显示”状态。" },
    { name: "maskPeek / maskChar", type: 'number / string', default: '0 / "•"', description: "遮罩时末尾保留几位明文（不超过值长度的一半）；遮罩字符。点数最多 16 个，长密钥不会显示一长串；单行且容器窄时点数自动收少（至少 4 个），末尾明文始终可见、不被省略号截掉。" },
    { name: "multiline", type: "boolean", default: "false", description: "多行（接入语、证书、长命令）：只读 textarea，高度随内容增长到 maxHeight 为止，再多就框内滚动（自定义细滚动条）；按钮固定在右上角。自动高度优先用 CSS field-sizing: content（值、宽度、字体加载后都由浏览器自己跟上）；不支持的浏览器用 JS 量，值 / 宽度 / 字号相关参数 / 网页字体加载完成时重量。" },
    { name: "maxHeight", type: "number | string", default: "160", description: "多行最大高度，数字为 px。" },
    { name: "wrap", type: '"word" | "anywhere"', default: '"word"', description: "多行换行：word 在词间（自然语言）；anywhere 任意字符处（长 token / base64）。" },
    { name: "mono", type: "boolean", default: "true", description: "等宽字体。" },
    { name: "copiedDuration", type: "number", default: "1600", description: "“已复制”状态（对勾 + 成功色描边）保持多久，ms。" },
    { name: "feedback", type: '"pop" | "fade" | "none"', default: '"pop"', description: "复制图标切换动画：pop 对勾从 50% 带回弹转入；fade 只淡入淡出；none 直接换。200ms，只动 transform / opacity，减弱动效时直接切换。" },
    { name: "showLabel / copyLabel / copiedLabel / errorLabel", type: "boolean / string", default: 'false / "复制" / "已复制" / "复制失败, 请手动复制"', description: "复制按钮旁显示文字；各状态的文案（也用于 aria-label 与读屏播报）。" },
    { name: "clickToCopy", type: "boolean", default: "false", description: "点值本身就复制（验证码、邀请码）；键盘聚焦到值上按 Enter 也复制。" },
    { name: "leading", type: "ReactNode", description: "值左侧的图标或前缀（如 KeyRoundIcon、“POST”）。" },
    { name: "actions", type: "ReactNode", description: "复制按钮前的额外操作（如“重新生成”）。" },
    { name: "valueClassName", type: "string", description: "给值本身的类（如验证码的大字号、居中、字距）。" },
    { name: "disabled", type: "boolean", description: "禁用（也会读外部 Field 的 disabled）。" },
    { name: "onCopy", type: "(text: string) => void", description: "复制成功后调用（按钮、点值、Enter、原生 Ctrl+C 都算），参数是复制出去的文本（可在这里弹 toast）。" },
    { name: "onCopyError", type: "(error: unknown) => void", description: "剪贴板与回退都失败时调用；此时值已显示并被选中，用户可以 Ctrl+C。" },
    { name: "copyToClipboard / maskValue", type: "函数", description: "一并导出：写剪贴板（clipboard API → execCommand 回退，失败 reject）；生成遮罩文本。" },
  ],
};
