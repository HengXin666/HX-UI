import { useState } from "react";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@hx/ui";
import menubarRaw from "../../../../../../src/primitives/menubar.tsx?raw";
import { select, toggle, type PageSpec, type Values } from "../../types";
import { demo } from "../../usage-code";

/**
 * 文档站批 1: 菜单栏. 桌面应用式的 "文件 / 编辑 / 视图"; 打开一个菜单后左右方向键与鼠标横扫直接切到相邻菜单.
 */

const FILE = [
  { label: "新建文档", key: "⌘N" },
  { label: "打开…", key: "⌘O" },
  { label: "另存为…", key: "⇧⌘S" },
];
const EDIT = [
  { label: "撤销", key: "⌘Z" },
  { label: "重做", key: "⇧⌘Z" },
  { label: "查找", key: "⌘F" },
];

function Rows({ rows, shortcuts }: { readonly rows: typeof FILE; readonly shortcuts: boolean }) {
  return (
    <>
      {rows.map((row) => (
        <MenubarItem key={row.label}>
          {row.label}
          {shortcuts ? <MenubarShortcut>{row.key}</MenubarShortcut> : null}
        </MenubarItem>
      ))}
    </>
  );
}

function MenubarDemo(props: Record<string, unknown>) {
  const { open, shortcuts, checks, zoom } = props as { open: string; shortcuts: boolean; checks: boolean; zoom: boolean };
  const [scale, setScale] = useState("100");
  return (
    <Menubar defaultValue={open === "none" ? undefined : open} aria-label="编辑器菜单">
      <MenubarMenu value="file">
        <MenubarTrigger>文件</MenubarTrigger>
        <MenubarContent>
          <Rows rows={FILE} shortcuts={shortcuts} />
          <MenubarSeparator />
          <MenubarItem variant="destructive">关闭窗口</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="edit">
        <MenubarTrigger>编辑</MenubarTrigger>
        <MenubarContent>
          <Rows rows={EDIT} shortcuts={shortcuts} />
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="view">
        <MenubarTrigger>视图</MenubarTrigger>
        <MenubarContent>
          {checks ? (
            <>
              <MenubarCheckboxItem checked>显示标尺</MenubarCheckboxItem>
              <MenubarCheckboxItem>显示网格</MenubarCheckboxItem>
            </>
          ) : null}
          {checks && zoom ? <MenubarSeparator /> : null}
          {zoom ? (
            <MenubarRadioGroup value={scale} onValueChange={setScale}>
              <MenubarRadioItem value="75">缩放 75%</MenubarRadioItem>
              <MenubarRadioItem value="100">缩放 100%</MenubarRadioItem>
              <MenubarRadioItem value="150">缩放 150%</MenubarRadioItem>
            </MenubarRadioGroup>
          ) : null}
          {!checks && !zoom ? <MenubarItem>全屏</MenubarItem> : null}
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

function usage(values: Values): string {
  const item = (row: { label: string; key: string }) => `      <MenubarItem>${row.label}${values.shortcuts ? `<MenubarShortcut>${row.key}</MenubarShortcut>` : ""}</MenubarItem>`;
  const view = [
    ...(values.checks ? ["      <MenubarCheckboxItem checked>显示标尺</MenubarCheckboxItem>", "      <MenubarCheckboxItem>显示网格</MenubarCheckboxItem>"] : []),
    ...(values.checks && values.zoom ? ["      <MenubarSeparator />"] : []),
    ...(values.zoom ? ['      <MenubarRadioGroup value={scale} onValueChange={setScale}>', '        <MenubarRadioItem value="75">缩放 75%</MenubarRadioItem>', '        <MenubarRadioItem value="100">缩放 100%</MenubarRadioItem>', '        <MenubarRadioItem value="150">缩放 150%</MenubarRadioItem>', "      </MenubarRadioGroup>"] : []),
    ...(!values.checks && !values.zoom ? ["      <MenubarItem>全屏</MenubarItem>"] : []),
  ];
  const root = values.open === "none" ? "<Menubar>" : `<Menubar defaultValue="${values.open}">`;
  const body = `${root}\n  <MenubarMenu value="file">\n    <MenubarTrigger>文件</MenubarTrigger>\n    <MenubarContent>\n${FILE.map(item).join("\n")}\n      <MenubarSeparator />\n      <MenubarItem variant="destructive">关闭窗口</MenubarItem>\n    </MenubarContent>\n  </MenubarMenu>\n  <MenubarMenu value="edit">\n    <MenubarTrigger>编辑</MenubarTrigger>\n    <MenubarContent>\n${EDIT.map(item).join("\n")}\n    </MenubarContent>\n  </MenubarMenu>\n  <MenubarMenu value="view">\n    <MenubarTrigger>视图</MenubarTrigger>\n    <MenubarContent>\n${view.join("\n")}\n    </MenubarContent>\n  </MenubarMenu>\n</Menubar>`;
  const names = ["Menubar", ...(values.checks ? ["MenubarCheckboxItem"] : []), "MenubarContent", "MenubarItem", "MenubarMenu", ...(values.zoom ? ["MenubarRadioGroup", "MenubarRadioItem"] : []), "MenubarSeparator", ...(values.shortcuts ? ["MenubarShortcut"] : []), "MenubarTrigger"];
  const code = demo(names, body);
  return values.zoom ? code.replace('";\n\nexport function Demo() {\n', '";\nimport { useState } from "react";\n\nexport function Demo() {\n  const [scale, setScale] = useState("100");\n') : code;
}

export const MENUBAR: PageSpec = {
  id: "menubar",
  kind: "composite",
  importName: "Menubar",
  parts: ["MenubarContent", "MenubarItem", "MenubarCheckboxItem"],
  source: "src/primitives/menubar.tsx",
  raw: menubarRaw,
  deps: ["radix-ui", "lucide-react"],
  controls: [
    select("open", "初始展开", ["none", "file", "edit", "view"], "none", "", "Menubar 的 defaultValue: 挂载时展开哪个菜单 (MenubarMenu 的 value); none 表示都收起."),
    toggle("shortcuts", "快捷键提示", true, "不是属性: 菜单项右侧放 MenubarShortcut, 纯展示, 不绑键."),
    toggle("checks", "勾选项", true, "不是属性: \"视图\" 菜单里放两个 MenubarCheckboxItem."),
    toggle("zoom", "单选组", true, "不是属性: \"视图\" 菜单里放一组 MenubarRadioGroup."),
  ],
  propsNote: "MenubarMenu 的 value 用来对上 Menubar 的 value / defaultValue; MenubarRadioGroup 有 value / onValueChange; SubTrigger 不开放 asChild. 只有一个菜单时用 DropdownMenu.",
  height: 320,
  render: (props) => <MenubarDemo {...props} />,
  usage,
  examples: [
    {
      id: "plain",
      title: "只有动作, 不带快捷键",
      code: `<Menubar>\n  <MenubarMenu>\n    <MenubarTrigger>文件</MenubarTrigger>\n    <MenubarContent>\n      <MenubarItem>新建文档</MenubarItem>\n      …\n    </MenubarContent>\n  </MenubarMenu>\n  …\n</Menubar>`,
      render: () => <MenubarDemo open="none" shortcuts={false} checks={false} zoom={false} />,
    },
  ],
  keyboard: [
    { keys: ["Tab"], action: "聚焦到菜单栏 (整条只占一个 Tab 位)." },
    { keys: ["←", "→"], action: "在菜单之间移动; 某个菜单已展开时直接切到相邻菜单并展开." },
    { keys: ["Enter"], action: "展开当前菜单, 或选中当前菜单项; Space 与 ↓ 同样能展开." },
    { keys: ["↑", "↓"], action: "在展开的菜单里移动." },
    { keys: ["Esc"], action: "收起菜单, 焦点回到菜单名." },
  ],
};
