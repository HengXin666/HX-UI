import type { JSX } from "react";
import { Input } from "@hx/ui";
import { H2, P, Preview, PropsTable } from "../components/DocKit";

export function InputPage(): JSX.Element {
  return (
    <>
      <P>输入框的交互反馈**全部落在边框颜色上**: 默认 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">border-border/60</code> → hover 变 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">border-border</code> → 聚焦变 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">border-ring/60</code>。类串里显式写了 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">shadow-none</code>。</P>

      <H2>基础</H2>
      <Preview align="start" code={`<Input placeholder="请输入" className="max-w-xs" />`}>
        <Input placeholder="请输入" className="max-w-xs" />
      </Preview>

      <H2>状态</H2>
      <Preview align="start" code={`<Input defaultValue="已填内容" className="max-w-xs" />
<Input placeholder="不可用" disabled className="max-w-xs" />
<Input defaultValue="校验失败" aria-invalid className="max-w-xs" />`}>
        <Input defaultValue="已填内容" className="max-w-xs" />
        <Input placeholder="不可用" disabled className="max-w-xs" />
        <Input defaultValue="校验失败" aria-invalid className="max-w-xs" />
      </Preview>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "type", type: "string", default: '"text"', desc: "原生 input type。" },
          { name: "aria-invalid", type: "boolean", desc: "为真时边框转 destructive, 用于校验失败。" },
          { name: "className", type: "string", desc: "宽度等布局微调传这里, 不要重写整套视觉。" },
        ]}
      />
    </>
  );
}
