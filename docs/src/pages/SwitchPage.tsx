import type { JSX } from "react";
import { Switch } from "@hx/ui";
import { H2, P, Preview, PropsTable } from "../components/DocKit";

export function SwitchPage(): JSX.Element {
  return (
    <>
      <P>开关。选中态是主色实底, 未选中是 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">bg-input</code>。缩略块在两档尺寸下有各自的位移量。</P>

      <H2>尺寸与状态</H2>
      <Preview align="center" code={`<Switch defaultChecked />
<Switch />
<Switch size="sm" defaultChecked />
<Switch size="sm" />
<Switch disabled defaultChecked />`}>
        <Switch defaultChecked />
        <Switch />
        <Switch size="sm" defaultChecked />
        <Switch size="sm" />
        <Switch disabled defaultChecked />
      </Preview>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "size", type: '"default" | "sm"', default: '"default"', desc: "两档尺寸。" },
          { name: "checked / defaultChecked", type: "boolean", desc: "受控 / 非受控选中态。" },
          { name: "disabled", type: "boolean", desc: "禁用, 透明度降到 50%。" },
        ]}
      />
    </>
  );
}
