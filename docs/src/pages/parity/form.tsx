import { type JSX } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CopyIcon, SearchIcon } from "lucide-react";
import { ALIGN, Button, Checkbox, Combobox, DOC, DOC_SAMPLE, Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet, Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Input, InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea, InputOTP, Kbd, NativeSelect, ORIENTATION, SIZE, Spinner, Switch, VARIANT, toast } from "@hx/ui";
import { Callout, H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/** 表单类文档页: Field, Form, InputGroup (InputOTP / NativeSelect / Combobox 在 pickers.tsx). */
export function FieldPage(): JSX.Element {
  return (
    <>
      <P>组合式表单字段: 标签, 控件, 说明与错误摆成一组. orientation 决定标签在上, 在左, 或随容器宽度切换. FieldSet / FieldLegend 给一组字段加语义标题.</P>
      <Usage names={["Field", "FieldLabel", "FieldDescription", "FieldError", "FieldGroup", "FieldSet", "FieldLegend", "FieldSeparator"]} />
      <H2>示例</H2>
      <Preview code={`<FieldSet>
  <FieldLegend>账号</FieldLegend>
  <FieldGroup>
    <Field>
      <FieldLabel htmlFor="name">显示名</FieldLabel>
      <Input id="name" placeholder="辉萝莉" />
      <FieldDescription>会出现在评论与提交记录里。</FieldDescription>
    </Field>
    <Field data-invalid="true">
      <FieldLabel htmlFor="email">邮箱</FieldLabel>
      <Input id="email" aria-invalid />
      <FieldError>邮箱格式不正确</FieldError>
    </Field>
    <FieldSeparator>或</FieldSeparator>
    <Field orientation="horizontal">
      <Switch id="notify" />
      <FieldLabel htmlFor="notify">接收通知</FieldLabel>
    </Field>
  </FieldGroup>
</FieldSet>`}>
        <FieldSet className={DOC.widthMd}>
          <FieldLegend>账号</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="doc-field-name">显示名</FieldLabel>
              <Input id="doc-field-name" placeholder="辉萝莉" />
              <FieldDescription>会出现在评论与提交记录里.</FieldDescription>
            </Field>
            <Field data-invalid>
              <FieldLabel htmlFor="doc-field-email">邮箱</FieldLabel>
              <Input id="doc-field-email" defaultValue="hx@" aria-invalid />
              <FieldError>邮箱格式不正确</FieldError>
            </Field>
            <FieldSeparator>或</FieldSeparator>
            <Field orientation={ORIENTATION.horizontal}>
              <Switch id="doc-field-notify" />
              <FieldLabel htmlFor="doc-field-notify">接收通知</FieldLabel>
            </Field>
            <FieldLabel>
              <Field orientation={ORIENTATION.horizontal}>
                <Checkbox id="doc-field-card" defaultChecked />
                <div className={DOC.tight}>
                  <span>选项卡片</span>
                  <FieldDescription>整块可点, 选中后边框转主色.</FieldDescription>
                </div>
              </Field>
            </FieldLabel>
          </FieldGroup>
        </FieldSet>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
Field.orientation ~ "vertical" | "horizontal" | "responsive" ~ "vertical" ~ 标签位置; responsive 按 FieldGroup 容器宽度切换
Field[data-invalid] ~ "true" ~ - ~ 整组转危险色
FieldError.errors ~ Array<{ message?: string }> ~ - ~ 直接传校验库的错误数组, 自动去重
FieldLegend.variant ~ "legend" | "label" ~ "legend" ~ 标题字号
`} />
    </>
  );
}

const PROFILE_SCHEMA = z.object({
  username: z.string().min(DOC_SAMPLE.nameMin, "至少 2 个字符").max(DOC_SAMPLE.nameMax, "最多 16 个字符"),
  bio: z.string().max(DOC_SAMPLE.bioMax, "简介最多 80 字").optional(),
});

export function FormPage(): JSX.Element {
  const form = useForm<z.infer<typeof PROFILE_SCHEMA>>({ resolver: zodResolver(PROFILE_SCHEMA), defaultValues: { username: "", bio: "" } });
  const submit = form.handleSubmit((values) => toast.success(`已保存: ${values.username}`));
  return (
    <>
      <P>
        react-hook-form 绑定. FormField 是 Controller 加一层上下文, FormLabel / FormControl / FormDescription / FormMessage 自动拿到同一字段的 id 与错误,
        不需要手写 htmlFor / aria-describedby / aria-invalid. 校验库不绑定, 这里用 zod.
      </P>
      <Usage
        names={["Form", "FormField", "FormItem", "FormLabel", "FormControl", "FormDescription", "FormMessage"]}
        deps={["react-hook-form"]}
        usage={`import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({ username: z.string().min(2, "至少 2 个字符") });
const form = useForm({ resolver: zodResolver(schema), defaultValues: { username: "" } });`}
      />
      <H2>示例</H2>
      <Preview code={`<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
    <FormField
      control={form.control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel>用户名</FormLabel>
          <FormControl><Input placeholder="hx" {...field} /></FormControl>
          <FormDescription>公开显示的名字。</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit" variant="primary">保存</Button>
  </form>
</Form>`}>
        <Form {...form}>
          <form onSubmit={submit} className="grid w-full max-w-sm gap-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户名</FormLabel>
                  <FormControl>
                    <Input placeholder="hx" {...field} />
                  </FormControl>
                  <FormDescription>公开显示的名字, 2 到 16 个字符.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>简介</FormLabel>
                  <FormControl>
                    <Input placeholder="一句话介绍自己" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" variant={VARIANT.primary} className="justify-self-start">保存</Button>
          </form>
        </Form>
      </Preview>
      <Callout title="提交不了时">先看 FormMessage: zod 的错误文案原样显示在字段下方, 且标签同步转为危险色.</Callout>
    </>
  );
}

export function InputGroupPage(): JSX.Element {
  return (
    <>
      <P>一个输入框加前后缀 (图标, 文字, 按钮, 快捷键), 外观是一个整体. 聚焦反馈落到外层边框; 点击前后缀区域把焦点交给输入框.</P>
      <Usage names={["InputGroup", "InputGroupAddon", "InputGroupInput", "InputGroupText", "InputGroupButton", "InputGroupTextarea"]} />
      <H2>示例</H2>
      <Preview code={`<InputGroup>
  <InputGroupAddon><SearchIcon /></InputGroupAddon>
  <InputGroupInput placeholder="搜索文档" />
  <InputGroupAddon align={ALIGN.inlineEnd}><Kbd>⌘K</Kbd></InputGroupAddon>
</InputGroup>
<InputGroup>
  <InputGroupAddon><InputGroupText>https://</InputGroupText></InputGroupAddon>
  <InputGroupInput placeholder="example.com" />
  <InputGroupAddon align={ALIGN.inlineEnd}>
    <InputGroupButton size="icon-xs"><CopyIcon /></InputGroupButton>
  </InputGroupAddon>
</InputGroup>`}>
        <div className="grid w-full max-w-sm gap-3">
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput placeholder="搜索文档" />
            <InputGroupAddon align={ALIGN.inlineEnd}>
              <Kbd>Ctrl K</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>https://</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput placeholder="example.com" />
            <InputGroupAddon align={ALIGN.inlineEnd}>
              <InputGroupButton size={SIZE.iconXs} aria-label={DOC.copy} onClick={() => toast.info("链接已复制")}>
                <CopyIcon />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput placeholder="正在校验用户名" defaultValue="hengxin" />
            <InputGroupAddon align={ALIGN.inlineEnd}>
              <Spinner />
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupTextarea placeholder="给 Agent 的指令..." />
            <InputGroupAddon align="block-end" className="justify-between">
              <InputGroupText>0 / 2000</InputGroupText>
              <InputGroupButton variant={VARIANT.primary} size={VARIANT.sm}>发送</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
InputGroupAddon.align ~ "inline-start" | "inline-end" | "block-start" | "block-end" ~ "inline-start" ~ 前后缀位置; block-* 时整组变为纵向
InputGroupButton ~ ButtonProps ~ variant="ghost" size="xs" ~ 组内按钮, 贴合输入框高度
`} />
    </>
  );
}
