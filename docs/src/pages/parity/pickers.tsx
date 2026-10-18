import { useState, type JSX } from "react";
import { ALIGN, Combobox, DOC_SAMPLE, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, NativeSelect, NativeSelectOptGroup, NativeSelectOption, UI_CLASSES, VARIANT } from "@hx/ui";
import { H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/** 选择与验证码类文档页: InputOTP, NativeSelect, Combobox (从 form.tsx 拆出, 守住单文件行数上限). */
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
      <Preview align={ALIGN.center} code={`<NativeSelect defaultValue="sin">
  <NativeSelectOptGroup label="亚洲">
    <NativeSelectOption value="sin">新加坡</NativeSelectOption>
    <NativeSelectOption value="tokyo">东京</NativeSelectOption>
  </NativeSelectOptGroup>
  <NativeSelectOptGroup label="欧洲">
    <NativeSelectOption value="fra">法兰克福</NativeSelectOption>
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
      <Preview code={`const FRAMEWORKS = [
  { value: "react", label: "React", keywords: ["前端"] },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "solidjs", label: "Solid" },
  { value: "angular", label: "Angular", disabled: true },
  { value: "qt", label: "Qt (C++)", keywords: ["桌面"] },
];

const [value, setValue] = useState(FRAMEWORKS[0].value);
const [many, setMany] = useState([FRAMEWORKS[0].value, "qt"]);

<Combobox options={FRAMEWORKS} value={value} onValueChange={setValue} placeholder="选择框架" />
<Combobox multiple options={FRAMEWORKS} value={many} onValueChange={setMany} placeholder="可多选" />`}>
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
