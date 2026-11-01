import type { JSX } from "react";
import { Button } from "@hx/ui";
import { H2, H3, P, Preview, PropsTable } from "../components/DocKit";
import { API_DEFAULT_FALSE, API_DEFAULT_QUOTED_DEFAULT, API_DEFAULT_TRUE, API_PROP, API_TYPE_BOOLEAN, DEMO_ALIGN, DEMO_ARIA, DEMO_CLASS, DEMO_SIZES, DEMO_VARIANT } from "../../../src/constants/docs-legacy";

export function ButtonPage(): JSX.Element {
  return (
    <>
      <P>按钮只有这一个来源。禁止手写 <code className={DEMO_CLASS.inlineCode}>&lt;button&gt;</code> 自拼样式, 也禁止给按钮加发光或自定义阴影。</P>

      <H2>语义 variant</H2>
      <P>主操作用 primary, 次要按场景选 outline / secondary / ghost, 危险操作用 destructive。</P>
      <Preview
        align={DEMO_ALIGN.center}
        code={`<Button variant="primary">主操作</Button>
<Button variant="default">默认</Button>
<Button variant="outline">次要</Button>
<Button variant="secondary">浅面</Button>
<Button variant="ghost">幽灵</Button>
<Button variant="destructive">删除</Button>
<Button variant="link">链接</Button>`}
      >
        <Button variant={DEMO_VARIANT.primary}>主操作</Button>
        <Button variant={DEMO_VARIANT.default}>默认</Button>
        <Button variant={DEMO_VARIANT.outline}>次要</Button>
        <Button variant={DEMO_VARIANT.secondary}>浅面</Button>
        <Button variant={DEMO_VARIANT.ghost}>幽灵</Button>
        <Button variant={DEMO_VARIANT.destructive}>删除</Button>
        <Button variant="link">链接</Button>
      </Preview>

      <H2>可选: 渐变与按压缩放</H2>
      <P>
        gradient 是品牌渐变的主操作, 一屏最多一个, 用在落地页或空状态的首要动作上; press 打开按下时缩到 97% 的反馈,
        默认关, 可与任何 variant 叠加。两者都不传时按钮外观与原来一致。
      </P>
      <Preview
        align={DEMO_ALIGN.center}
        code={`<Button variant="gradient">立即开始</Button>
<Button variant="gradient" press size="lg">按下试试</Button>
<Button variant="outline" press>次要 + 按压</Button>`}
      >
        <Button variant="gradient">立即开始</Button>
        <Button variant="gradient" press size={DEMO_SIZES.lg}>按下试试</Button>
        <Button variant={DEMO_VARIANT.outline} press>次要 + 按压</Button>
      </Preview>

      <H2>尺寸</H2>
      <P>八档尺寸。传入图标时内边距由子元素决定, 不需要手调。</P>
      <Preview
        align={DEMO_ALIGN.center}
        code={`<Button size="lg" variant="primary">大</Button>
<Button variant="outline">中</Button>
<Button size="sm" variant="outline">小</Button>
<Button size="xs" variant="outline">极小</Button>
<Button size="icon" variant="outline" aria-label="搜索"><Search /></Button>`}
      >
        <Button size={DEMO_SIZES.lg} variant={DEMO_VARIANT.primary}>大</Button>
        <Button variant={DEMO_VARIANT.outline}>中</Button>
        <Button size={DEMO_SIZES.sm} variant={DEMO_VARIANT.outline}>小</Button>
        <Button size={DEMO_SIZES.xs} variant={DEMO_VARIANT.outline}>极小</Button>
        <Button size={DEMO_SIZES.icon} variant={DEMO_VARIANT.outline} aria-label="搜索">
          <span className="icon-[solar--magnifer-line-duotone] size-4" />
        </Button>
        <Button size={DEMO_SIZES.iconSm} variant={DEMO_VARIANT.ghost} aria-label={DEMO_ARIA.settings}>
          <span className="icon-[solar--settings-linear] size-3.5" />
        </Button>
      </Preview>

      <H2>禁用态</H2>
      <Preview align={DEMO_ALIGN.center} code={`<Button variant="primary" disabled>不可用</Button>
<Button variant="outline" disabled>不可用</Button>`}>
        <Button variant={DEMO_VARIANT.primary} disabled>不可用</Button>
        <Button variant={DEMO_VARIANT.outline} disabled>不可用</Button>
      </Preview>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: API_PROP.variant, type: '"default" | "primary" | "outline" | "secondary" | "ghost" | "destructive" | "link" | "gradient"', default: API_DEFAULT_QUOTED_DEFAULT, desc: "语义色。主操作用 primary, 危险用 destructive; gradient 是可选的品牌渐变。" },
          { name: API_PROP.size, type: '"default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"', default: API_DEFAULT_QUOTED_DEFAULT, desc: "八档尺寸。图标按钮用 icon 系列。" },
          { name: "press", type: API_TYPE_BOOLEAN, default: API_DEFAULT_FALSE, desc: "按下时缩放到 97%; 减弱动效时不缩放。" },
          { name: "ripple", type: API_TYPE_BOOLEAN, default: API_DEFAULT_TRUE, desc: "点按水波纹, link 变体始终不出。" },
          { name: "asChild", type: API_TYPE_BOOLEAN, default: API_DEFAULT_FALSE, desc: "把样式交给子元素渲染 (配合 Radix Slot), 用于把按钮伪装成链接。" },
        ]}
      />
    </>
  );
}
