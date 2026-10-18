import { useState, type JSX } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CopyIcon, SearchIcon } from "lucide-react";
import { ALIGN, Button, Checkbox, Combobox, DOC, DOC_SAMPLE, Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet, Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Input, InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, Kbd, NativeSelect, NativeSelectOptGroup, NativeSelectOption, ORIENTATION, SIZE, Spinner, Switch, UI_CLASSES, VARIANT, toast } from "@hx/ui";
import { Callout, H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/** 表单类文档页: Field, Form, InputGroup, InputOTP, NativeSelect, Combobox. */
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

/** 验证码前后两组各自的格子下标. */
const OTP_SLOTS = Array.from({ length: DOC_SAMPLE.otpHalf }, (_, index) => index);

export function InputOTPPage(): JSX.Element {
  const [value, setValue] = useState("");
  return (
    <>
      <P>一次性验证码. 底层是一个透明的真实 input: 粘贴整串, 系统短信自动填充, 退格都是原生行为. 当前格有闪烁光标, 字符填入时轻微放大淡入.</P>
      <Usage names={["InputOTP", "InputOTPGroup", "InputOTPSlot", "InputOTPSeparator"]} deps={["input-otp"]} />
      <H2>示例</H2>
      <Preview align={ALIGN.center} code={`<InputOTP maxLength={6} value={value} onChange={setValue}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>`}>
        <div className="flex flex-col items-center gap-3">
          <InputOTP maxLength={DOC_SAMPLE.otpLength} value={value} onChange={setValue}>
            <InputOTPGroup>
              {OTP_SLOTS.map((index) => <InputOTPSlot key={index} index={index} />)}
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              {OTP_SLOTS.map((index) => <InputOTPSlot key={index} index={index + DOC_SAMPLE.otpHalf} />)}
            </InputOTPGroup>
          </InputOTP>
          <span className={UI_CLASSES.mutedSm}>{value ? `已输入: ${value}` : "输入 6 位验证码"}</span>
        </div>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
maxLength ~ number ~ - ~ 位数
value / onChange ~ string / (value) => void ~ - ~ 受控值
pattern ~ string ~ - ~ 允许的字符正则, 例如 input-otp 导出的 REGEXP_ONLY_DIGITS
onComplete ~ (value) => void ~ - ~ 填满时回调
`} />
    </>
  );
}

export function NativeSelectPage(): JSX.Element {
  return (
    <>
      <P>浏览器原生 select: 移动端弹系统滚轮, 表单原生提交, 选项上千也不卡. 外观与 SelectTrigger 对齐. 需要搜索或自定义选项渲染时用 Select 或 Combobox.</P>
      <Usage names={["NativeSelect", "NativeSelectOption", "NativeSelectOptGroup"]} />
      <H2>示例</H2>
      <Preview align={ALIGN.center} code={`<NativeSelect defaultValue="sg">
  <NativeSelectOptGroup label="亚洲">
    <NativeSelectOption value="sg">新加坡</NativeSelectOption>
    <NativeSelectOption value="tokyo">东京</NativeSelectOption>
  </NativeSelectOptGroup>
</NativeSelect>`}>
        <NativeSelect defaultValue="sin">
          <NativeSelectOptGroup label="亚洲">
            <NativeSelectOption value="sin">新加坡</NativeSelectOption>
            <NativeSelectOption value="tokyo">东京</NativeSelectOption>
          </NativeSelectOptGroup>
          <NativeSelectOptGroup label="欧洲">
            <NativeSelectOption value="fra">法兰克福</NativeSelectOption>
          </NativeSelectOptGroup>
        </NativeSelect>
        <NativeSelect size={VARIANT.sm} disabled>
          <NativeSelectOption>不可用</NativeSelectOption>
        </NativeSelect>
      </Preview>
    </>
  );
}

const FRAMEWORKS = [
  { value: "react", label: "React", keywords: ["前端"] },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "solidjs", label: "Solid" },
  { value: "angular", label: "Angular", disabled: true },
  { value: "qt", label: "Qt (C++)", keywords: ["桌面"] },
];

export function ComboboxPage(): JSX.Element {
  const [value, setValue] = useState(FRAMEWORKS[0].value);
  const [many, setMany] = useState<string[]>([FRAMEWORKS[0].value, "qt"]);
  return (
    <>
      <P>可搜索下拉: Popover + Command. 输入即过滤 (keywords 参与搜索但不显示), 单选时再点已选项会取消; multiple 时选中项以标签显示在触发器里.</P>
      <Usage names={["Combobox"]} deps={["cmdk"]} />
      <H2>示例</H2>
      <Preview code={`<Combobox options={frameworks} value={value} onValueChange={setValue} />
<Combobox multiple options={frameworks} value={many} onValueChange={setMany} />`}>
        <Combobox options={FRAMEWORKS} value={value} onValueChange={setValue} placeholder="选择框架" />
        <Combobox multiple options={FRAMEWORKS} value={many} onValueChange={setMany} placeholder="可多选" className="w-80" />
      </Preview>
      <H2>属性</H2>
      <Props spec={`
options ~ ComboboxOption[] ~ - ~ value, label, keywords, disabled
multiple ~ boolean ~ false ~ 多选, value 变为 string[]
value / defaultValue ~ string | string[] ~ - ~ 受控 / 非受控
onValueChange ~ (value) => void ~ - ~ 选择变化
placeholder / searchPlaceholder / emptyText ~ string ~ - ~ 文案
`} />
    </>
  );
}
