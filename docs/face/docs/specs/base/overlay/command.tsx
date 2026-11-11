import { Fragment, useState } from "react";
import { Button, Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@hx/ui";
import commandRaw from "../../../../../../src/primitives/command.tsx?raw";
import { text, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 命令面板 (cmdk). 输入即过滤, 方向键移动高亮; 主演示内嵌在页面里, 示例是 ⌘K 式的 CommandDialog.
 */

const GROUPS = [
  {
    heading: "页面",
    items: [
      { label: "打开仪表盘", key: "G D" },
      { label: "打开账单", key: "G B" },
    ],
  },
  {
    heading: "操作",
    items: [
      { label: "邀请成员", key: "⌘I" },
      { label: "导出 CSV", key: "⌘E" },
      { label: "切换深色模式", key: "⇧⌘L" },
    ],
  },
];

function Groups({ values }: { readonly values: Record<string, unknown> }) {
  return (
    <>
      {GROUPS.map((group, index) => (
        <Fragment key={group.heading}>
          {index > 0 && values.groups ? <CommandSeparator /> : null}
          <CommandGroup heading={values.groups ? group.heading : undefined}>
            {group.items.map((item) => (
              <CommandItem key={item.label} disabled={Boolean(values.disabled) && item.label === "导出 CSV"}>
                {item.label}
                {values.shortcuts ? <CommandShortcut>{item.key}</CommandShortcut> : null}
              </CommandItem>
            ))}
          </CommandGroup>
        </Fragment>
      ))}
    </>
  );
}

function CommandDemo(props: Record<string, unknown>) {
  return (
    <Command label="命令面板" className="h-auto w-[24rem] max-w-full rounded-xl border border-border text-left">
      <CommandInput placeholder={String(props.placeholder)} />
      <CommandList>
        <CommandEmpty>没有匹配的命令.</CommandEmpty>
        <Groups values={props} />
      </CommandList>
    </Command>
  );
}

function usage(values: Values): string {
  const groups = GROUPS.map((group, index) => {
    const items = group.items.map((item) => {
      const disabled = values.disabled && item.label === "导出 CSV" ? " disabled" : "";
      return `      <CommandItem${disabled}>${item.label}${values.shortcuts ? `<CommandShortcut>${item.key}</CommandShortcut>` : ""}</CommandItem>`;
    });
    const sep = index > 0 && values.groups ? "    <CommandSeparator />\n" : "";
    return `${sep}    <CommandGroup${values.groups ? ` heading="${group.heading}"` : ""}>\n${items.join("\n")}\n    </CommandGroup>`;
  }).join("\n");
  const body = `<Command label="命令面板" className="rounded-xl border">\n  <CommandInput placeholder="${String(values.placeholder)}" />\n  <CommandList>\n    <CommandEmpty>没有匹配的命令.</CommandEmpty>\n${groups}\n  </CommandList>\n</Command>`;
  return demo(["Command", "CommandEmpty", "CommandGroup", "CommandInput", "CommandItem", "CommandList", ...(values.groups ? ["CommandSeparator"] : []), ...(values.shortcuts ? ["CommandShortcut"] : [])], body);
}

function PaletteDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        打开命令面板
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="输入命令或搜索…" />
        <CommandList>
          <CommandEmpty>没有匹配的命令.</CommandEmpty>
          <Groups values={{ groups: true, shortcuts: true, disabled: false }} />
        </CommandList>
      </CommandDialog>
    </>
  );
}

export const COMMAND: PageSpec = {
  id: "command",
  kind: "composite",
  importName: "Command",
  parts: ["CommandDialog", "CommandItem", "CommandGroup"],
  source: "src/primitives/command.tsx",
  raw: commandRaw,
  deps: ["cmdk", "radix-ui", "lucide-react"],
  controls: [
    text("placeholder", "占位文字", "输入命令或搜索…", "不是 Command 的属性: CommandInput 的 placeholder."),
    toggle("groups", "分组标题", true, "CommandGroup 的 heading, 组与组之间放 CommandSeparator."),
    toggle("shortcuts", "快捷键提示", true, "不是属性: 每项右侧放 CommandShortcut, 纯展示, 不绑键."),
    toggle("disabled", "禁用一项", false, "CommandItem 的 disabled: 变淡, 方向键跳过."),
  ],
  propDesc: {
    children: "CommandInput, CommandList 及其中的组与项.",
    defaultValue: "初始高亮项的 value.",
    asChild: "把根元素交给唯一的子元素渲染.",
    label: "命令面板的可访问名称, 不显示.",
    shouldFilter: "false 时关掉内置的过滤与排序, 由调用方按输入自己渲染匹配项.",
    filter: "自定义匹配函数, 返回 0 到 1 的分数, 0 表示隐藏.",
    value: "受控的高亮项 value.",
    onValueChange: "高亮项变化时回调.",
    loop: "方向键到头后回到另一端.",
    disablePointerSelection: "true 时指针悬停不改变高亮.",
    vimBindings: "Ctrl+N / J / P / K 移动高亮, 默认开; false 关掉.",
    "CommandDialog.title": "对话框标题, 只给读屏器.",
    "CommandDialog.description": "对话框说明, 只给读屏器.",
    "CommandDialog.showCloseButton": "是否带右上角关闭键, 默认不带.",
    "CommandDialog.className": "DialogContent 的类名.",
    "CommandDialog.children": "CommandInput 与 CommandList.",
    "CommandDialog.open": "受控的打开状态.",
    "CommandDialog.defaultOpen": "非受控的初始打开状态.",
    "CommandDialog.onOpenChange": "打开状态变化时回调.",
    "CommandDialog.modal": "模态时锁住页面滚动与外部交互. 默认 true.",
    "CommandItem.children": "这一项的内容.",
    "CommandItem.disabled": "禁用这一项.",
    "CommandItem.onSelect": "选中这一项时回调 (点击或 Enter), 参数是 value.",
    "CommandItem.value": "这一项的值, 用于过滤与 onSelect; 不给时取文本内容.",
    "CommandItem.keywords": "额外的匹配关键词 (别名, 拼音等).",
    "CommandItem.forceMount": "过滤时始终显示.",
    "CommandItem.asChild": "把这一项交给唯一的子元素渲染.",
    "CommandGroup.heading": "组标题.",
    "CommandGroup.value": "组的值.",
    "CommandGroup.forceMount": "过滤时始终显示这一组.",
    "CommandGroup.children": "组里的 CommandItem.",
    "CommandGroup.asChild": "把组交给唯一的子元素渲染.",
  },
  propsNote: "CommandInput 有 value / onValueChange (受控的搜索词); CommandList, CommandEmpty, CommandSeparator, CommandShortcut 只有外观.",
  height: 380,
  render: (props) => <CommandDemo {...props} />,
  usage,
  examples: [
    {
      id: "dialog",
      title: "CommandDialog: ⌘K 式的全局面板",
      desc: "打开即聚焦搜索框; 绑定 ⌘K 由调用方自己做.",
      code: `const [open, setOpen] = useState(false);\n\n<CommandDialog open={open} onOpenChange={setOpen}>\n  <CommandInput placeholder="输入命令或搜索…" />\n  <CommandList>\n    <CommandEmpty>没有匹配的命令.</CommandEmpty>\n    <CommandGroup heading="页面">…</CommandGroup>\n  </CommandList>\n</CommandDialog>`,
      render: () => <PaletteDemo />,
    },
  ],
  keyboard: [
    { keys: ["输入"], action: "按输入过滤与排序命令." },
    { keys: ["↑", "↓"], action: "移动高亮, 跳过禁用项; Ctrl+N / Ctrl+P 同样." },
    { keys: ["Enter"], action: "执行高亮的命令." },
    { keys: ["Esc"], action: "在 CommandDialog 里关闭面板." },
  ],
};
