import { useState, type JSX } from "react";
import { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuRoot, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger, TONE_VARIANT, toast } from "@hx/ui";
import { Callout, H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/** 右键菜单文档页: 组合式 ContextMenuRoot 与声明式 ContextMenu (从 navigation.tsx 拆出, 守住单文件行数上限). */
/** 声明式右键菜单的动作: 点了只弹一条提示. */
const FILE_ACTIONS = [
  { id: "rename-file", label: "重命名文件", shortcut: "Ctrl Shift R" },
  { id: "remove-file", label: "删除文件", destructive: true },
].map((action) => ({ ...action, onSelect: () => toast.info(action.label) }));

export function ContextMenuPage(): JSX.Element {
  const [grid, setGrid] = useState(true);
  const [sort, setSort] = useState("by-name");
  return (
    <>
      <P>
        组合式右键菜单, 对标 shadcn ContextMenu. 库里原有的声明式 <code>ContextMenu</code> (传 MenuAction[]) 下游在用, 名字不让出,
        所以组合式的根叫 <code>ContextMenuRoot</code>, 其余部件沿用 shadcn 的名字.
      </P>
      <Usage names={["ContextMenuRoot", "ContextMenuTrigger", "ContextMenuContent", "ContextMenuItem", "ContextMenuCheckboxItem", "ContextMenuRadioGroup", "ContextMenuRadioItem", "ContextMenuLabel", "ContextMenuSeparator", "ContextMenuShortcut", "ContextMenuSub", "ContextMenuSubTrigger", "ContextMenuSubContent"]} />
      <H2>组合式</H2>
      <Preview code={`<ContextMenuRoot>
  <ContextMenuTrigger className="...">在这里右键</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>后退 <ContextMenuShortcut>Alt ←</ContextMenuShortcut></ContextMenuItem>
    <ContextMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>显示网格</ContextMenuCheckboxItem>
    <ContextMenuRadioGroup value={sort} onValueChange={setSort}>
      <ContextMenuRadioItem value="by-name">按名称</ContextMenuRadioItem>
    </ContextMenuRadioGroup>
  </ContextMenuContent>
</ContextMenuRoot>`}>
        <ContextMenuRoot>
          <ContextMenuTrigger className="flex h-36 w-full max-w-sm items-center justify-center rounded-xl border border-dashed border-border text-[13px] text-muted-foreground">
            在这里右键
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>后退 <ContextMenuShortcut>Alt Left</ContextMenuShortcut></ContextMenuItem>
            <ContextMenuItem disabled>前进</ContextMenuItem>
            <ContextMenuItem>刷新 <ContextMenuShortcut>Ctrl R</ContextMenuShortcut></ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>更多工具</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>另存为</ContextMenuItem>
                <ContextMenuItem>开发者工具</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>显示网格</ContextMenuCheckboxItem>
            <ContextMenuSeparator />
            <ContextMenuLabel inset>排序</ContextMenuLabel>
            <ContextMenuRadioGroup value={sort} onValueChange={setSort}>
              <ContextMenuRadioItem value="by-name">按名称</ContextMenuRadioItem>
              <ContextMenuRadioItem value="by-time">按时间</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
            <ContextMenuSeparator />
            <ContextMenuItem variant={TONE_VARIANT.destructive}>删除</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuRoot>
      </Preview>
      <H2>声明式 (原有)</H2>
      <Preview code={`<ContextMenu heading="docs/README.md" actions={[
  { id: "rename", label: "重命名", shortcut: "F2", onSelect: rename },
  { id: "delete", label: "删除", destructive: true, onSelect: remove },
]}>
  <div>在这里右键</div>
</ContextMenu>`}>
        <ContextMenu
          heading="docs/README.md"
          actions={FILE_ACTIONS}
        >
          <div className="flex h-24 w-full max-w-sm items-center justify-center rounded-xl border border-dashed border-border text-[13px] text-muted-foreground">
            声明式: 在这里右键
          </div>
        </ContextMenu>
      </Preview>
      <Callout title="怎么选">只要一列动作用声明式 ContextMenu; 需要勾选项, 单选组, 子菜单或自定义内容时用组合式 ContextMenuRoot.</Callout>
      <H2>属性</H2>
      <Props spec={`
ContextMenuItem.variant ~ "default" | "destructive" ~ "default" ~ destructive 时文字转危险色
ContextMenuItem.inset ~ boolean ~ false ~ 左侧与勾选项对齐
ContextMenuItem.ripple ~ boolean ~ true ~ 点按水波纹
`} />
    </>
  );
}
