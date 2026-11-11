import { Checkbox, Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet, Input } from "@hx/ui";
import fieldRaw from "../../../../../../src/primitives/field.tsx?raw";
import { select, text, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 表单字段 (组合式). 主演示是团队设置里的 "工作邮箱" 一栏: 标签, 输入框, 说明, 错误按开关出现.
 */

type Orientation = "vertical" | "horizontal" | "responsive";
const ERROR = "这个邮箱已被另一个团队使用.";
const HINT = "登录验证码与账单通知都发到这里.";

function FieldDemo(props: Record<string, unknown>) {
  const { orientation, label, description, invalid, disabled } = props as { orientation: Orientation; label: string; description: boolean; invalid: boolean; disabled: boolean };
  return (
    <FieldGroup className="w-[30rem] max-w-full text-left">
      <Field orientation={orientation} data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
        <FieldLabel htmlFor="field-demo-email">{label}</FieldLabel>
        <FieldContent>
          <Input id="field-demo-email" type="email" defaultValue="lin.yue@hx-studio.cn" aria-invalid={invalid || undefined} disabled={disabled} />
          {description ? <FieldDescription>{HINT}</FieldDescription> : null}
          {invalid ? <FieldError>{ERROR}</FieldError> : null}
        </FieldContent>
      </Field>
    </FieldGroup>
  );
}

function usage(values: Values): string {
  const field = [values.orientation === "vertical" ? "" : ` orientation="${values.orientation}"`, values.invalid ? " data-invalid" : "", values.disabled ? " data-disabled" : ""].join("");
  const input = [values.invalid ? " aria-invalid" : "", values.disabled ? " disabled" : ""].join("");
  const lines = [
    "<FieldGroup>",
    `  <Field${field}>`,
    `    <FieldLabel htmlFor="email">${String(values.label)}</FieldLabel>`,
    "    <FieldContent>",
    `      <Input id="email" type="email" defaultValue="lin.yue@hx-studio.cn"${input} />`,
    ...(values.description ? [`      <FieldDescription>${HINT}</FieldDescription>`] : []),
    ...(values.invalid ? [`      <FieldError>${ERROR}</FieldError>`] : []),
    "    </FieldContent>",
    "  </Field>",
    "</FieldGroup>",
  ];
  const names = ["Field", "FieldContent", ...(values.description ? ["FieldDescription"] : []), ...(values.invalid ? ["FieldError"] : []), "FieldGroup", "FieldLabel", "Input"];
  return demo(names, lines.join("\n"));
}

export const FIELD: PageSpec = {
  id: "field",
  kind: "composite",
  importName: "Field",
  parts: ["FieldLabel", "FieldLegend", "FieldError"],
  source: "src/primitives/field.tsx",
  raw: fieldRaw,
  deps: ["class-variance-authority", "radix-ui"],
  controls: [
    select("orientation", "排布", ["vertical", "horizontal", "responsive"], "vertical", "", "标签在上 (vertical), 在左 (horizontal), 或随 FieldGroup 的宽度切换 (responsive, 容器查询)."),
    text("label", "标签", "工作邮箱", "不是属性: FieldLabel 的文字."),
    toggle("description", "说明", true, "不是属性: 在控件下放一段 FieldDescription."),
    toggle("invalid", "校验失败", false, "Field 上的 data-invalid 把标签染成危险色; 控件同时给 aria-invalid, 错误文字用 FieldError (role=\"alert\")."),
    toggle("disabled", "禁用", false, "Field 上的 data-disabled 让标签变淡; 控件本身也要 disabled."),
  ],
  propDesc: {
    orientation: "标签与控件的排布: vertical 上下, horizontal 左右, responsive 随 FieldGroup 宽度切换.",
    "FieldLabel.asChild": "把标签交给唯一的子元素渲染.",
    "FieldLegend.variant": "legend 是组标题字号, label 与字段标签同字号.",
    "FieldError.errors": "错误数组 (例如 react-hook-form 的 fieldState.error), 去重后一条直接显示, 多条成列表; 都没有 message 时不渲染.",
  },
  propsNote: "FieldSet / FieldGroup / FieldContent / FieldDescription / FieldSeparator 只有原生属性, 透传给各自的元素.",
  height: 320,
  render: (props) => <FieldDemo {...props} />,
  usage,
  examples: [
    {
      id: "fieldset",
      title: "一组勾选项",
      desc: "FieldSet 加 FieldLegend 给一组字段一个语义标题; 勾选项用 horizontal, 标签在右.",
      code: `<FieldSet>\n  <FieldLegend variant="label">通知方式</FieldLegend>\n  <FieldGroup className="gap-3">\n    <Field orientation="horizontal">\n      <Checkbox id="n-mail" defaultChecked />\n      <FieldLabel htmlFor="n-mail">邮件</FieldLabel>\n    </Field>\n    <Field orientation="horizontal">\n      <Checkbox id="n-sms" />\n      <FieldLabel htmlFor="n-sms">短信</FieldLabel>\n    </Field>\n  </FieldGroup>\n</FieldSet>`,
      render: () => (
        <FieldSet className="w-56 text-left">
          <FieldLegend variant="label">通知方式</FieldLegend>
          <FieldGroup className="gap-3">
            <Field orientation="horizontal">
              <Checkbox id="n-mail" defaultChecked />
              <FieldLabel htmlFor="n-mail">邮件</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Checkbox id="n-sms" />
              <FieldLabel htmlFor="n-sms">短信</FieldLabel>
            </Field>
          </FieldGroup>
        </FieldSet>
      ),
    },
    {
      id: "separator",
      title: "分隔线与多条错误",
      desc: "FieldSeparator 中间可以放字; FieldError 收到多条 errors 时列成列表.",
      code: `<Field data-invalid>\n  <FieldLabel htmlFor="pw">新密码</FieldLabel>\n  <Input id="pw" type="password" defaultValue="hx2026" aria-invalid />\n  <FieldError errors={[{ message: "至少 10 个字符." }, { message: "要同时包含字母与数字以外的符号." }]} />\n</Field>\n<FieldSeparator>或</FieldSeparator>`,
      render: () => (
        <FieldGroup className="w-[22rem] max-w-full text-left">
          <Field data-invalid>
            <FieldLabel htmlFor="pw">新密码</FieldLabel>
            <Input id="pw" type="password" defaultValue="hx2026" aria-invalid />
            <FieldError errors={[{ message: "至少 10 个字符." }, { message: "要同时包含字母与数字以外的符号." }]} />
          </Field>
          <FieldSeparator>或</FieldSeparator>
        </FieldGroup>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "Field 本身不可聚焦, 焦点直接进到其中的控件." },
    { keys: ["点击标签"], action: "FieldLabel 用 htmlFor 关联控件, 点文字聚焦输入框或切换勾选框." },
    { keys: ["读屏"], action: "Field 是 role=\"group\"; FieldError 是 role=\"alert\", 出现时立即读出." },
  ],
};
