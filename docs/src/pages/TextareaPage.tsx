import type { JSX } from "react";
import { useState } from "react";
import { Textarea, Input, SettingRow, SettingSection } from "@hx/ui";
import { Callout, H2, P, Preview, PropsTable } from "../components/DocKit";

/** Textarea 页。 */
export function TextareaPage(): JSX.Element {
  const [text, setText] = useState("");

  return (
    <>
      <P>
        类串与 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">Input</code> 同源 ——
        边框、底色、焦点、禁用、aria-invalid 全部对齐, 所以两者并排放在一个设置区里不会显得是两个时代的控件。
      </P>

      <H2>基础</H2>
      <Preview
        align="start"
        code={`<Textarea placeholder="写点什么…" className="w-72" />`}
      >
        <Textarea placeholder="写点什么…" className="w-72" aria-label="备注" />
      </Preview>

      <H2>随内容长高</H2>
      <P>
        用 CSS 的 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">field-sizing: content</code> 实现自动增高,
        而不是手写 onInput 改 height。后者会和 React 抢同一个 DOM 属性, 在受控值场景下反复打架。
        不支持该属性的浏览器退化成 min-h-16 固定高度, 不会坏。
      </P>
      <Preview
        align="start"
        code={`const [text, setText] = useState("");

<Textarea
  value={text}
  onChange={(e) => setText(e.target.value)}
  placeholder="输入多少行长多少行"
  className="w-72"
/>`}
      >
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入多少行长多少行"
          className="w-72"
          aria-label="自动增高示例"
        />
      </Preview>

      <H2>放进设置行</H2>
      <P>
        设置页里它通常不是单独一行, 而是某个开关打开后才出现 —— SettingRow 的 children 位置可以直接放。
      </P>
      <Preview
        align="start"
        code={`<SettingSection section={{ id: "agent" }} title="Agent 配置">
  <SettingRow title="系统提示词" description="每次新会话都会带上这段说明">
    <Textarea placeholder="你是一个…" className="w-64" />
  </SettingRow>
  <SettingRow title="工作目录" description="相对路径基于这里解析">
    <Input defaultValue="/home/user/project" className="w-64" />
  </SettingRow>
</SettingSection>`}
      >
        <SettingSection section={{ id: "agent" }} title="Agent 配置">
          <SettingRow title="系统提示词" description="每次新会话都会带上这段说明">
            <Textarea placeholder="你是一个…" className="w-64" aria-label="系统提示词" />
          </SettingRow>
          <SettingRow title="工作目录" description="相对路径基于这里解析">
            <Input defaultValue="/home/user/project" className="w-64" aria-label="工作目录" />
          </SettingRow>
        </SettingSection>
      </Preview>

      <H2>禁用与校验失败</H2>
      <Preview
        align="start"
        code={`<Textarea disabled placeholder="不可编辑" className="w-64" />
<Textarea aria-invalid placeholder="校验失败时会变红" className="w-64" />`}
      >
        <Textarea disabled placeholder="不可编辑" className="w-64" aria-label="禁用" />
        <Textarea aria-invalid placeholder="校验失败时会变红" className="w-64" aria-label="校验失败" />
      </Preview>

      <Callout title="不给 rows 默认值">
        rows 与 field-sizing 同时存在时各浏览器表现不一致 (有的以 rows 为准)。
        用 min-height 表达高度下限只用一条规则, 跨浏览器一致。
      </Callout>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "value / defaultValue", type: "string", desc: "受控 / 非受控。透传给原生 textarea。" },
          { name: "onChange", type: "ChangeEventHandler", desc: "原生事件, 取 e.target.value。" },
          { name: "placeholder", type: "string", desc: "占位文本, 用 muted-foreground 上色。" },
          { name: "disabled", type: "boolean", desc: "禁用。" },
          { name: "aria-invalid", type: "boolean", desc: "置为真时边框走 destructive。" },
          { name: "className", type: "string", desc: "宽度等布局微调 (组件默认 w-full)。" },
        ]}
      />
    </>
  );
}