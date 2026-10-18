import { useState, type JSX } from "react";
import { ALIGN, Button, Checkbox, Kbd, KbdGroup, Label, ORIENTATION, RadioGroup, RadioGroupItem, Separator, Spin, Spinner, UI_CLASSES, VARIANT } from "@hx/ui";
import { Callout, H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/**
 * 对标 shadcn 的基础输入与小件文档页: Checkbox, RadioGroup, Label, Separator, Kbd, Spinner.
 *
 * .agents/notes/implemented/feature/2026-10-18-docs-shadcn-site-pages.md
 */
export function CheckboxPage(): JSX.Element {
  const [checked, setChecked] = useState<boolean | "indeterminate">("indeterminate");
  return (
    <>
      <P>复选框建在 radix Checkbox 上, 键盘 Space 切换, 支持 **半选** (indeterminate). 勾选框面积小, 状态变化本身就是反馈, 所以不带水波纹.</P>
      <Usage names={["Checkbox"]} />
      <H2>示例</H2>
      <Preview
        align={ALIGN.center}
        code={`<div className={UI_CLASSES.row}>
  <Checkbox id="terms" />
  <Label htmlFor="terms">接受服务条款</Label>
</div>
<Checkbox checked="indeterminate" />
<Checkbox disabled />`}
      >
        <div className={UI_CLASSES.row}>
          <Checkbox id="doc-terms" />
          <Label htmlFor="doc-terms">接受服务条款</Label>
        </div>
        <div className={UI_CLASSES.row}>
          <Checkbox id="doc-partial" checked={checked} onCheckedChange={setChecked} />
          <Label htmlFor="doc-partial">半选 (点一下切换)</Label>
        </div>
        <div className={UI_CLASSES.row}>
          <Checkbox id="doc-off" disabled />
          <Label htmlFor="doc-off">不可用</Label>
        </div>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
checked ~ boolean | "indeterminate" ~ - ~ 受控选中态
defaultChecked ~ boolean ~ - ~ 非受控初值
onCheckedChange ~ (checked) => void ~ - ~ 状态变化回调
disabled ~ boolean ~ false ~ 禁用
`} />
    </>
  );
}

/** 单选示例的选项: 值与文案. */
const DENSITY = [["compact", "紧凑"], ["cozy", "舒适"], ["spacious", "宽松"]] as const;

export function RadioGroupPage(): JSX.Element {
  return (
    <>
      <P>单选组: 方向键在选项间漫游, 选中项是 primary 实心圆点. 文字标签用 Label 的 htmlFor 关联.</P>
      <Usage names={["RadioGroup", "RadioGroupItem"]} />
      <H2>示例</H2>
      <Preview
        code={`<RadioGroup defaultValue="cozy">
  <div className={UI_CLASSES.row}>
    <RadioGroupItem value="cozy" id="r1" />
    <Label htmlFor="r1">舒适</Label>
  </div>
  ...
</RadioGroup>`}
      >
        <RadioGroup defaultValue={DENSITY[1][0]}>
          {DENSITY.map(([value, label]) => (
            <div key={value} className={UI_CLASSES.row}>
              <RadioGroupItem value={value} id={`doc-radio-${value}`} />
              <Label htmlFor={`doc-radio-${value}`}>{label}</Label>
            </div>
          ))}
        </RadioGroup>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
value / defaultValue ~ string ~ - ~ 受控 / 非受控选中值
onValueChange ~ (value: string) => void ~ - ~ 选中变化
orientation ~ "horizontal" | "vertical" ~ - ~ 方向键语义
disabled ~ boolean ~ false ~ 整组禁用
`} />
    </>
  );
}

export function LabelPage(): JSX.Element {
  return (
    <>
      <P>表单标签. 点击标签会聚焦或切换关联控件; 控件禁用时 (peer-disabled 或外层 data-disabled) 标签自动变淡.</P>
      <Usage names={["Label"]} />
      <H2>示例</H2>
      <Preview align={ALIGN.center} code={`<Checkbox id="remember" />
<Label htmlFor="remember">记住我</Label>`}>
        <Checkbox id="doc-label-remember" />
        <Label htmlFor="doc-label-remember">记住我</Label>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
htmlFor ~ string ~ - ~ 关联控件的 id
className ~ string ~ - ~ 只做布局微调
`} />
    </>
  );
}

export function SeparatorPage(): JSX.Element {
  return (
    <>
      <P>分隔线全局 1px. decorative 默认 true, 纯排版用途不进无障碍树; 真正切分两个语义区时传 false.</P>
      <Usage names={["Separator"]} />
      <H2>示例</H2>
      <Preview
        code={`<div>
  <h4>HX UI</h4>
  <p>对标 shadcn 的组件库</p>
</div>
<Separator className="my-3" />
<div className="flex h-5 items-center gap-3">
  <span>文档</span>
  <Separator orientation="vertical" />
  <span>组件</span>
</div>`}
      >
        <div className="w-full max-w-sm">
          <div className="text-[14px] font-semibold text-heading">HX UI</div>
          <div className={UI_CLASSES.mutedSm}>对标 shadcn 的组件库</div>
          <Separator className="my-3" />
          <div className="flex h-5 items-center gap-3 text-[13px]">
            <span>文档</span>
            <Separator orientation={ORIENTATION.vertical} />
            <span>组件</span>
            <Separator orientation={ORIENTATION.vertical} />
            <span>源码</span>
          </div>
        </div>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
orientation ~ "horizontal" | "vertical" ~ "horizontal" ~ 方向
decorative ~ boolean ~ true ~ 为 false 时以 role=separator 进无障碍树
`} />
    </>
  );
}

export function KbdPage(): JSX.Element {
  return (
    <>
      <P>键盘按键标记. 底边 1px 内阴影做出按键厚度, 组合键用 KbdGroup 并排.</P>
      <Usage names={["Kbd", "KbdGroup"]} />
      <H2>示例</H2>
      <Preview align={ALIGN.center} code={`<KbdGroup>
  <Kbd>Ctrl</Kbd>
  <Kbd>K</Kbd>
</KbdGroup>`}>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        <KbdGroup>
          <Kbd>Shift</Kbd>
          <Kbd>Enter</Kbd>
        </KbdGroup>
        <span className={UI_CLASSES.mutedHalf}>按 <Kbd>Esc</Kbd> 关闭</span>
      </Preview>
    </>
  );
}

export function SpinnerPage(): JSX.Element {
  return (
    <>
      <P>
        <code>Spinner</code> 是一个 lucide 图标加旋转, 默认 16px (size-4), 可用 className 覆盖尺寸, 适合放进按钮与输入组; 系统要求减弱动效时改为缓慢呼吸.
        需要多种形态与尺寸档的加载指示用 Spin (见 Spin 页).
      </P>
      <Usage names={["Spinner"]} />
      <H2>示例</H2>
      <Preview align={ALIGN.center} code={`<Spinner />
<Button disabled><Spinner /> 提交中</Button>
<Spin size={28} />`}>
        <Spinner />
        <Spinner className="size-6 text-link" />
        <Button variant={VARIANT.primary} disabled>
          <Spinner /> 提交中
        </Button>
        <Spin />
      </Preview>
      <Callout title="两种加载指示怎么选">行内与按钮里用 Spinner; 整块区域加载, 或想要更有辨识度的形态时用 Spin.</Callout>
    </>
  );
}
