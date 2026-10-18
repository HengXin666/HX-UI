import { useState, type JSX } from "react";
import { BookOpenIcon, BoxIcon, LayersIcon } from "lucide-react";
import { ALIGN, Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuRoot, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger, NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, TONE_VARIANT, UI_CLASSES, navigationMenuTriggerStyle, toast } from "@hx/ui";
import { Callout, H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/** 导航与菜单类文档页: Breadcrumb, Menubar, NavigationMenu, ContextMenu. */
export function BreadcrumbDocPage(): JSX.Element {
  return (
    <>
      <P>当前页在层级里的位置. 当前页用 BreadcrumbPage (aria-current=page, 不可点), 中间层级太多时折叠成 BreadcrumbEllipsis 并配 DropdownMenu 展开.</P>
      <Usage names={["Breadcrumb", "BreadcrumbList", "BreadcrumbItem", "BreadcrumbLink", "BreadcrumbPage", "BreadcrumbSeparator", "BreadcrumbEllipsis"]} />
      <H2>示例</H2>
      <Preview align={ALIGN.center} code={`<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="#/">首页</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <DropdownMenu>
        <DropdownMenuTrigger><BreadcrumbEllipsis /></DropdownMenuTrigger>
        <DropdownMenuContent>...</DropdownMenuContent>
      </DropdownMenu>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>Breadcrumb</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#/install">首页</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-md outline-none hover:text-foreground" aria-label="展开中间层级">
                  <BreadcrumbEllipsis />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>组件</DropdownMenuItem>
                  <DropdownMenuItem>导航</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#/navigation-menu">菜单</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Preview>
    </>
  );
}

export function MenubarPage(): JSX.Element {
  const [wrap, setWrap] = useState(true);
  const [panel, setPanel] = useState("panel-files");
  return (
    <>
      <P>桌面应用式的菜单栏. 打开一个菜单后, 左右方向键与鼠标横扫会直接切到相邻菜单, 这是它与一排 DropdownMenu 的区别. 菜单项默认带水波纹.</P>
      <Usage names={["Menubar", "MenubarMenu", "MenubarTrigger", "MenubarContent", "MenubarItem", "MenubarSeparator", "MenubarShortcut", "MenubarCheckboxItem", "MenubarRadioGroup", "MenubarRadioItem", "MenubarSub", "MenubarSubTrigger", "MenubarSubContent"]} />
      <H2>示例</H2>
      <Preview code={`<Menubar>
  <MenubarMenu>
    <MenubarTrigger>文件</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>新建标签页 <MenubarShortcut>Ctrl T</MenubarShortcut></MenubarItem>
      <MenubarSub>
        <MenubarSubTrigger>分享</MenubarSubTrigger>
        <MenubarSubContent>...</MenubarSubContent>
      </MenubarSub>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`}>
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>文件</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={() => toast.info("新建标签页")}>新建标签页 <MenubarShortcut>Ctrl T</MenubarShortcut></MenubarItem>
              <MenubarItem>新建窗口 <MenubarShortcut>Ctrl N</MenubarShortcut></MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>分享</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>复制链接</MenubarItem>
                  <MenubarItem>发送邮件</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarItem variant={TONE_VARIANT.destructive}>关闭窗口</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>视图</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked={wrap} onCheckedChange={setWrap}>自动换行</MenubarCheckboxItem>
              <MenubarSeparator />
              <MenubarRadioGroup value={panel} onValueChange={setPanel}>
                <MenubarRadioItem value="panel-files">文件面板</MenubarRadioItem>
                <MenubarRadioItem value="panel-search">搜索面板</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>帮助</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>文档</MenubarItem>
              <MenubarItem disabled>检查更新</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </Preview>
    </>
  );
}

const NAV_LINKS = [
  { title: "基础件", desc: "按钮, 输入, 弹层, 菜单", icon: <BoxIcon /> },
  { title: "版式件", desc: "应用外壳, 设置页, 数据表", icon: <LayersIcon /> },
  { title: "文档", desc: "每个组件的预览与代码", icon: <BookOpenIcon /> },
];

export function NavigationMenuPage(): JSX.Element {
  return (
    <>
      <P>站点顶部的导航菜单. 在入口之间切换时, 共用的视口宽高平滑插值, 内容按移动方向左右滑入. viewport=false 时每个面板就地弹出.</P>
      <Usage names={["NavigationMenu", "NavigationMenuList", "NavigationMenuItem", "NavigationMenuTrigger", "NavigationMenuContent", "NavigationMenuLink", "navigationMenuTriggerStyle"]} />
      <H2>示例</H2>
      <Preview align={ALIGN.center} className="min-h-[300px]" code={`<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>开始</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[420px] gap-1 md:grid-cols-2">...</ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
        <a href="#/install">文档</a>
      </NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`}>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>开始</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[420px] gap-1 md:grid-cols-2">
                  {NAV_LINKS.map((link) => (
                    <li key={link.title}>
                      <NavigationMenuLink href="#/navigation-menu">
                        <div className="flex items-center gap-2 font-medium text-foreground">{link.icon}{link.title}</div>
                        <div className={UI_CLASSES.mutedSm}>{link.desc}</div>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>组件</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-1">
                  {["Sheet", "Command", "Sidebar", "Carousel"].map((name) => (
                    <li key={name}>
                      <NavigationMenuLink href={`#/${name.toLowerCase()}`}>{name}</NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <a href="#/install">文档</a>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </Preview>
    </>
  );
}

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
