import { useState, type JSX } from "react";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator,
  SelectTrigger, SelectValue,
} from "@hx/ui";
import { Callout, H2, H3, P, Preview, PropsTable } from "../components/DocKit";

/**
 * Select 页。
 *
 * 库里有两条下拉路线: 这里的 Radix Select (基础件) 与 layout/MotionSelect
 * (设置页那张皮)。两者视觉几乎一致, 但 Radix 这条**由 Item 反写触发器的显示文案**,
 * 所以选项必须真实挂载过 —— 这也是为什么 DatePicker 的月份/年份下拉用 Select,
 * 而设置页用 MotionSelect 的显式 label。
 */
export function SelectPage(): JSX.Element {
  const [model, setModel] = useState("hx-2");

  return (
    <>
      <P>
        展开态整块换底 (<code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">bg-accent</code>),
        面板是 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">bg-popover</code> 加一圈 1px 边,
        选中项的对勾固定在右侧 8px 处, 所以选项右侧留了 8 的 padding, 不随文案长度移动。
      </P>

      <H2>基础用法</H2>
      <P>不传 value 时自己管状态, 用 defaultValue 给初值。触发器默认 h-8, 宽度靠 className 给。</P>
      <Preview
        align="start"
        code={`<Select defaultValue="hx-2">
  <SelectTrigger className="w-52">
    <SelectValue placeholder="选择模型" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="hx-2">HX-2</SelectItem>
    <SelectItem value="hx-2-mini">HX-2 Mini</SelectItem>
    <SelectItem value="hx-1">HX-1</SelectItem>
  </SelectContent>
</Select>`}
      >
        <Select defaultValue="hx-2">
          <SelectTrigger className="w-52">
            <SelectValue placeholder="选择模型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hx-2">HX-2</SelectItem>
            <SelectItem value="hx-2-mini">HX-2 Mini</SelectItem>
            <SelectItem value="hx-1">HX-1</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="未选中 (占位色更浅)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hx-2">HX-2</SelectItem>
            <SelectItem value="hx-2-mini">HX-2 Mini</SelectItem>
          </SelectContent>
        </Select>
      </Preview>

      <H2>分组</H2>
      <P>
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">SelectGroup</code> 自带 p-1,
        组与组之间用 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">SelectSeparator</code> 断一条。
        组名是 11px 的静默色, 不参与键盘选择。
      </P>
      <Preview
        align="start"
        code={`<Select defaultValue="local-7b">
  <SelectTrigger className="w-52">
    <SelectValue placeholder="选择模型" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>本机</SelectLabel>
      <SelectItem value="local-7b">本地 7B</SelectItem>
      <SelectItem value="local-32b">本地 32B</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>云端</SelectLabel>
      <SelectItem value="hx-2">HX-2</SelectItem>
      <SelectItem value="hx-2-mini">HX-2 Mini</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`}
      >
        <Select defaultValue="local-7b">
          <SelectTrigger className="w-52">
            <SelectValue placeholder="选择模型" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>本机</SelectLabel>
              <SelectItem value="local-7b">本地 7B</SelectItem>
              <SelectItem value="local-32b">本地 32B</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>云端</SelectLabel>
              <SelectItem value="hx-2">HX-2</SelectItem>
              <SelectItem value="hx-2-mini">HX-2 Mini</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Preview>

      <H2>禁用</H2>
      <P>
        单个选项禁用只降到 50% 透明度并挡住指针; 整个触发器禁用则连展开都拦掉。
        单选下拉不要用它表达"不可用"以外的语义 —— 禁用项仍然在列表里占位, 用户会去点。
      </P>
      <Preview
        align="start"
        code={`{/* 单选项禁用: 通常给"需要升级才解锁"的能力 */}
<Select defaultValue="flash">
  <SelectTrigger className="w-52">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="flash">Flash</SelectItem>
    <SelectItem value="pro" disabled>Pro (未开通)</SelectItem>
  </SelectContent>
</Select>

{/* 触发器禁用 */}
<Select disabled>
  <SelectTrigger className="w-52">
    <SelectValue placeholder="不可用" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="x">不会展开</SelectItem>
  </SelectContent>
</Select>`}
      >
        <Select defaultValue="flash">
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flash">Flash</SelectItem>
            <SelectItem value="pro" disabled>Pro (未开通)</SelectItem>
          </SelectContent>
        </Select>
        <Select disabled>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="不可用" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="x">不会展开</SelectItem>
          </SelectContent>
        </Select>
      </Preview>

      <H2>受控</H2>
      <P>
        传了 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">value</code> 就必须接
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> onValueChange</code>, 否则选完不会变。
        需要"选完立刻做别的事"(写配置、发请求) 时用这条路线。
      </P>
      <Preview
        align="start"
        code={`const [model, setModel] = useState("hx-2");

<Select value={model} onValueChange={setModel}>
  <SelectTrigger className="w-52">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="hx-2">HX-2</SelectItem>
    <SelectItem value="hx-2-mini">HX-2 Mini</SelectItem>
    <SelectItem value="hx-1">HX-1</SelectItem>
  </SelectContent>
</Select>

<span>当前值: {model}</span>`}
      >
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hx-2">HX-2</SelectItem>
            <SelectItem value="hx-2-mini">HX-2 Mini</SelectItem>
            <SelectItem value="hx-1">HX-1</SelectItem>
          </SelectContent>
        </Select>
        <span className="self-center text-[12px] text-muted-foreground">当前值: {model}</span>
      </Preview>

      <Callout title="尺寸只有两档">
        触发器 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">size</code> 只认 sm (h-7) 与 default (h-8)。
        更小的场景不要压高度, 换成 Button + DropdownMenu。
      </Callout>
      <Callout kind="warning" title="Item 的 value 不能是空字符串">
        Radix 把 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">value=""</code> 当作"未选中"的哨兵值, 传空串会直接抛错。
        需要"不限 / 全部"这类选项时用 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">value="all"</code>, 并在读取处做映射。
      </Callout>

      <H2>属性</H2>
      <H3>Select (根)</H3>
      <PropsTable
        rows={[
          { name: "value / defaultValue", type: "string", desc: "受控选中值 / 非受控初值。" },
          { name: "onValueChange", type: "(value: string) => void", desc: "受控时的变更回调。" },
          { name: "disabled", type: "boolean", default: "false", desc: "禁用整个下拉。" },
          { name: "open / onOpenChange", type: "boolean / (open: boolean) => void", desc: "受控展开态。" },
        ]}
      />
      <H3>SelectTrigger</H3>
      <PropsTable
        rows={[
          { name: "size", type: '"sm" | "default"', default: '"default"', desc: "两档高度: sm 28px, default 32px。" },
          { name: "className", type: "string", desc: "宽度给这里 (例如 w-52)。视觉类串不要重写。" },
          { name: "aria-invalid", type: "boolean", desc: "为真时边框转 destructive。" },
        ]}
      />
      <H3>SelectContent</H3>
      <PropsTable
        rows={[
          { name: "position", type: '"popper" | "item-aligned"', default: '"popper"', desc: "popper 时面板宽度至少等于触发器宽度。" },
          { name: "align", type: '"start" | "center" | "end"', default: '"start"', desc: "面板相对触发器的对齐。" },
          { name: "sideOffset", type: "number", default: "6", desc: "与触发器的间距 (px)。" },
        ]}
      />
      <H3>SelectItem</H3>
      <PropsTable
        rows={[
          { name: "value", type: "string", desc: "必填。空字符串会被 Radix 拒绝。" },
          { name: "disabled", type: "boolean", default: "false", desc: "禁用该选项, 透明度 50%。" },
        ]}
      />
    </>
  );
}
