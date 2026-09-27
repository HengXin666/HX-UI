import type { JSX } from "react";
import { Button } from "@hx/ui";
import { H2, H3, P, Preview, PropsTable } from "../components/DocKit";

export function ButtonPage(): JSX.Element {
  return (
    <>
      <P>按钮只有这一个来源。禁止手写 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">&lt;button&gt;</code> 自拼样式, 也禁止给按钮加发光或自定义阴影。</P>

      <H2>语义 variant</H2>
      <P>主操作用 primary, 次要按场景选 outline / secondary / ghost, 危险操作用 destructive。</P>
      <Preview
        align="center"
        code={`<Button variant="primary">主操作</Button>
<Button variant="default">默认</Button>
<Button variant="outline">次要</Button>
<Button variant="secondary">浅面</Button>
<Button variant="ghost">幽灵</Button>
<Button variant="destructive">删除</Button>
<Button variant="link">链接</Button>`}
      >
        <Button variant="primary">主操作</Button>
        <Button variant="default">默认</Button>
        <Button variant="outline">次要</Button>
        <Button variant="secondary">浅面</Button>
        <Button variant="ghost">幽灵</Button>
        <Button variant="destructive">删除</Button>
        <Button variant="link">链接</Button>
      </Preview>

      <H2>尺寸</H2>
      <P>八档尺寸。传入图标时内边距由子元素决定, 不需要手调。</P>
      <Preview
        align="center"
        code={`<Button size="lg" variant="primary">大</Button>
<Button variant="outline">中</Button>
<Button size="sm" variant="outline">小</Button>
<Button size="xs" variant="outline">极小</Button>
<Button size="icon" variant="outline" aria-label="搜索"><Search /></Button>`}
      >
        <Button size="lg" variant="primary">大</Button>
        <Button variant="outline">中</Button>
        <Button size="sm" variant="outline">小</Button>
        <Button size="xs" variant="outline">极小</Button>
        <Button size="icon" variant="outline" aria-label="搜索">
          <span className="icon-[solar--magnifer-line-duotone] size-4" />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="设置">
          <span className="icon-[solar--settings-linear] size-3.5" />
        </Button>
      </Preview>

      <H2>禁用态</H2>
      <Preview align="center" code={`<Button variant="primary" disabled>不可用</Button>
<Button variant="outline" disabled>不可用</Button>`}>
        <Button variant="primary" disabled>不可用</Button>
        <Button variant="outline" disabled>不可用</Button>
      </Preview>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "variant", type: '"default" | "primary" | "outline" | "secondary" | "ghost" | "destructive" | "link"', default: '"default"', desc: "语义色。主操作用 primary, 危险用 destructive。" },
          { name: "size", type: '"default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"', default: '"default"', desc: "八档尺寸。图标按钮用 icon 系列。" },
          { name: "asChild", type: "boolean", default: "false", desc: "把样式交给子元素渲染 (配合 Radix Slot), 用于把按钮伪装成链接。" },
        ]}
      />
    </>
  );
}
