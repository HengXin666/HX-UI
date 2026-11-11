import { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuRoot, ContextMenuSeparator, ContextMenuShortcut, ContextMenuTrigger, type MenuAction } from "@hx/ui";
import contextRaw from "../../../../../../src/layout/ContextMenu.tsx?raw";
import { text, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 右键菜单. 主演示是声明式 ContextMenu (传 actions 数组); 要勾选项, 子菜单等时用组合式 ContextMenuRoot 一组.
 */

const AREA = "grid h-36 w-[22rem] max-w-full place-items-center rounded-xl border border-dashed border-border text-[13px] text-muted-foreground";
const NOOP = (): void => undefined;

function actionsOf(values: Record<string, unknown>): MenuAction[] {
  return [
    { id: "open", label: "打开", shortcut: values.shortcuts ? "⏎" : undefined, onSelect: NOOP },
    { id: "rename", label: "重命名", shortcut: values.shortcuts ? "F2" : undefined, onSelect: NOOP },
    { id: "share", label: "共享给团队", disabled: Boolean(values.disabled), onSelect: NOOP },
    ...(values.destructive ? [{ id: "delete", label: "删除", destructive: true, shortcut: values.shortcuts ? "⌫" : undefined, onSelect: NOOP }] : []),
  ];
}

function ContextDemo(props: Record<string, unknown>) {
  const heading = String(props.heading);
  return (
    <ContextMenu actions={actionsOf(props)} heading={heading === "" ? undefined : heading}>
      <div className={AREA}>在这块区域里点右键 (触屏长按)</div>
    </ContextMenu>
  );
}

function usage(values: Values): string {
  const rows = actionsOf(values).map((action) => {
    const extra = [action.shortcut ? `shortcut: "${action.shortcut}"` : "", action.disabled ? "disabled: true" : "", action.destructive ? "destructive: true" : ""].filter(Boolean);
    return `  { id: "${action.id}", label: "${action.label}", ${extra.length > 0 ? extra.join(", ") + ", " : ""}onSelect: () => ${action.id}() },`;
  });
  const heading = values.heading === "" ? "" : ` heading="${String(values.heading)}"`;
  return demo(["ContextMenu"], `<ContextMenu actions={ACTIONS}${heading}>\n  <div>在这块区域里点右键</div>\n</ContextMenu>`, `\n\nconst ACTIONS = [\n${rows.join("\n")}\n];`);
}

export const CONTEXT_MENU: PageSpec = {
  id: "context-menu",
  kind: "composite",
  importName: "ContextMenu",
  parts: ["ContextMenuRoot", "ContextMenuItem", "ContextMenuCheckboxItem"],
  source: "src/layout/ContextMenu.tsx",
  raw: contextRaw,
  deps: ["radix-ui"],
  controls: [
    text("heading", "标题", "设计稿-v3.fig", "heading: 菜单顶部的一行, 通常写 \"你正在操作谁\"; 留空不显示."),
    toggle("shortcuts", "快捷键提示", true, "actions 每项的 shortcut: 右侧的快捷键文字, 纯展示, 组件不绑键."),
    toggle("disabled", "禁用一项", false, "actions 里 \"共享给团队\" 的 disabled: 此刻不适用, 变淡且跳过."),
    toggle("destructive", "危险动作", true, "actions 里加一项 destructive 的 \"删除\", 文字转危险色."),
  ],
  propDesc: {
    children: "触发区域, 整个子树都可以右键; 必须能接 ref (例如 div). 必填.",
    actions: "菜单项数组 (MenuAction): id, label, icon, disabled, destructive, shortcut, onSelect. 必填.",
    heading: "菜单顶部的标题.",
    "ContextMenuRoot.children": "ContextMenuTrigger 与 ContextMenuContent.",
    "ContextMenuRoot.open": "打开状态.",
    "ContextMenuRoot.onOpenChange": "打开状态变化时回调.",
    "ContextMenuRoot.dir": "阅读方向, 影响子菜单方向.",
    "ContextMenuRoot.modal": "true (默认) 时打开期间页面其余部分不可交互.",
    "ContextMenuItem.inset": "左侧留出与勾选项对齐的缩进.",
    "ContextMenuItem.variant": "destructive 时文字转危险色.",
    "ContextMenuItem.ripple": "点按水波纹, 默认开.",
    "ContextMenuItem.disabled": "禁用这一项.",
    "ContextMenuItem.onSelect": "选中这一项时回调; preventDefault 可让菜单不关.",
    "ContextMenuItem.textValue": "键入字母跳转时匹配的文字.",
    "ContextMenuItem.asChild": "把菜单项交给唯一的子元素渲染.",
    "ContextMenuCheckboxItem.checked": "受控的勾选状态.",
    "ContextMenuCheckboxItem.onCheckedChange": "勾选变化时回调.",
    "ContextMenuCheckboxItem.disabled": "禁用这一项.",
    "ContextMenuCheckboxItem.onSelect": "选中这一项时回调.",
    "ContextMenuCheckboxItem.textValue": "键入字母跳转时匹配的文字.",
    "ContextMenuCheckboxItem.asChild": "把菜单项交给唯一的子元素渲染.",
  },
  propsNote: "声明式 ContextMenu 只收一列动作; 勾选项, 单选组, 子菜单用组合式 ContextMenuRoot / Trigger / Content / Item 等 (源码 src/primitives/context-menu.tsx), 外观与 DropdownMenu 同一套.",
  height: 320,
  render: (props) => <ContextDemo {...props} />,
  usage,
  examples: [
    {
      id: "composite",
      title: "组合式: 带勾选项",
      desc: "ContextMenuRoot 一组, 菜单项外观与下拉菜单一致.",
      code: `<ContextMenuRoot>\n  <ContextMenuTrigger asChild>\n    <div>右键这里</div>\n  </ContextMenuTrigger>\n  <ContextMenuContent className="w-52">\n    <ContextMenuItem>后退<ContextMenuShortcut>⌘[</ContextMenuShortcut></ContextMenuItem>\n    <ContextMenuItem>刷新<ContextMenuShortcut>⌘R</ContextMenuShortcut></ContextMenuItem>\n    <ContextMenuSeparator />\n    <ContextMenuCheckboxItem checked>显示书签栏</ContextMenuCheckboxItem>\n  </ContextMenuContent>\n</ContextMenuRoot>`,
      render: () => (
        <ContextMenuRoot>
          <ContextMenuTrigger asChild>
            <div className={AREA}>右键这里: 组合式菜单</div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-52">
            <ContextMenuItem>
              后退<ContextMenuShortcut>⌘[</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              刷新<ContextMenuShortcut>⌘R</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuCheckboxItem checked>显示书签栏</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenuRoot>
      ),
    },
  ],
  keyboard: [
    { keys: ["右键"], action: "在触发区域上打开菜单 (触屏长按). 触发区域本身不占 Tab 位, 常用动作请另留按钮给键盘用户." },
    { keys: ["↑", "↓"], action: "在菜单项之间移动, 跳过禁用项." },
    { keys: ["Enter"], action: "选中当前项并关闭菜单." },
    { keys: ["Esc"], action: "关闭菜单." },
  ],
};
