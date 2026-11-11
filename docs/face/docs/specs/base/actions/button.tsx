import { Button } from "@hx/ui";
import buttonRaw from "../../../../../../src/primitives/button.tsx?raw";
import { select, text, toggle, type PageSpec, type Values } from "../../types";
import { demo, tag } from "../../usage-code";

/**
 * 样板批的两个可调单件页: Button 与 Switch.
 * .agents/notes/implemented/feature/2026-11-08-docs-component-pages.md
 */

const VARIANTS = ["default", "primary", "outline", "secondary", "ghost", "destructive", "link", "gradient"];
const SIZES = ["default", "xs", "sm", "lg"];

// ── Button ──────────────────────────────────────────────────────────
const BUTTON_BASE: Values = { variant: "default", size: "default", press: false, ripple: true, loading: false, disabled: false };
const SEARCH_ICON = "icon-[solar--magnifer-line-duotone] size-4";

export const BUTTON: PageSpec = {
  id: "button",
  kind: "single",
  importName: "Button",
  source: "src/primitives/button.tsx",
  raw: buttonRaw,
  deps: ["class-variance-authority", "radix-ui"],
  controls: [
    text("label", "文字", "立即开始", "按钮文字 (children)."),
    select("variant", "变体", VARIANTS, "primary", "", "语义色. 主操作用 primary, 危险操作用 destructive; gradient 是品牌渐变, 一屏最多一个."),
    select("size", "尺寸", SIZES, "default", "", "尺寸档. 图标按钮用 icon / icon-xs / icon-sm / icon-lg."),
    toggle("press", "按压缩放", false, "按下缩到 97%, 减弱动效时不缩放. 可与任何变体叠加."),
    toggle("ripple", "水波纹", true, "点按水波纹, link 变体始终不出."),
    toggle("loading", "加载中", false, "文字让位给旋转指示, 宽度仍由文字占住, 不跳."),
    toggle("disabled", "禁用", false, "原生 disabled, 不可聚焦也不响应点击."),
  ],
  propDesc: { asChild: "把样式交给唯一的子元素渲染 (Radix Slot), 用来把链接做成按钮外观." },
  propsNote: "其余属性透传给原生 <button>. type 不补默认值: 表单里不写 type 仍是 submit, 表单外的按钮请传 type=\"button\".",
  toProps: ({ label, ...rest }) => ({ ...rest, children: label }),
  render: (props) => <Button {...props} />,
  usage: ({ label, ...rest }) => demo(["Button"], tag("Button", rest, BUTTON_BASE, String(label))),
  examples: [
    {
      id: "variants",
      title: "语义变体",
      desc: "主操作 primary, 次要按场景选 outline / secondary / ghost, 危险操作 destructive.",
      code: `<Button variant="primary">主操作</Button>\n<Button>默认</Button>\n<Button variant="outline">次要</Button>\n<Button variant="secondary">浅面</Button>\n<Button variant="ghost">幽灵</Button>\n<Button variant="destructive">删除</Button>\n<Button variant="link">链接</Button>`,
      render: () => (
        <>
          <Button variant="primary">主操作</Button>
          <Button>默认</Button>
          <Button variant="outline">次要</Button>
          <Button variant="secondary">浅面</Button>
          <Button variant="ghost">幽灵</Button>
          <Button variant="destructive">删除</Button>
          <Button variant="link">链接</Button>
        </>
      ),
    },
    {
      id: "sizes",
      title: "尺寸与图标按钮",
      desc: "带图标时内边距由子元素决定; 只有图标的按钮必须给 aria-label.",
      code: `<Button size="lg" variant="primary">大</Button>\n<Button variant="outline">中</Button>\n<Button size="sm" variant="outline">小</Button>\n<Button size="xs" variant="outline">极小</Button>\n<Button size="icon" variant="outline" aria-label="搜索">\n  <span className="${SEARCH_ICON}" />\n</Button>`,
      render: () => (
        <>
          <Button size="lg" variant="primary">大</Button>
          <Button variant="outline">中</Button>
          <Button size="sm" variant="outline">小</Button>
          <Button size="xs" variant="outline">极小</Button>
          <Button size="icon" variant="outline" aria-label="搜索">
            <span aria-hidden className={SEARCH_ICON} />
          </Button>
        </>
      ),
    },
    {
      id: "states",
      title: "加载与禁用",
      desc: "loading 时宽度不变, 提交按钮不会在点下后缩一截.",
      code: `<Button variant="primary" loading>保存</Button>\n<Button variant="primary" disabled>不可用</Button>\n<Button variant="outline" disabled>不可用</Button>`,
      render: () => (
        <>
          <Button variant="primary" loading>保存</Button>
          <Button variant="primary" disabled>不可用</Button>
          <Button variant="outline" disabled>不可用</Button>
        </>
      ),
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦到按钮; 禁用的按钮跳过." },
    { keys: ["Enter"], action: "触发点击." },
    { keys: ["Space"], action: "触发点击; 打开 press 时按住期间保持按下的缩放." },
  ],
};
