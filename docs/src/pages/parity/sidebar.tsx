import { useState, type JSX } from "react";
import { HomeIcon, InboxIcon, SearchIcon, SettingsIcon, SparklesIcon } from "lucide-react";
import { DOC, OPEN_STATE, SegmentedControl, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@hx/ui";
import { Callout, H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/** 组合式 Sidebar 文档页 (从 display.tsx 拆出, 守住单文件行数上限). */
const NAV = [
  { label: "首页", icon: <HomeIcon />, active: true },
  { label: "收件箱", icon: <InboxIcon />, badge: "24" },
  { label: "搜索", icon: <SearchIcon /> },
  { label: DOC.settings, icon: <SettingsIcon /> },
];

export function SidebarPage(): JSX.Element {
  const [collapsible, setCollapsible] = useState<"icon" | "offcanvas">(OPEN_STATE.icon);
  return (
    <>
      <P>
        组合式应用侧栏, 对标 shadcn Sidebar. SidebarProvider 持有开合状态并注册 Ctrl/Cmd+B (带 Shift / Alt 的组合不接管, 焦点在可编辑元素里时让位给打字); collapsible=icon 时收成图标条,
        文字改由 tooltip 显示; 移动端宽度自动改为 Sheet 抽屉. 库里原有的 SidebarNavItemButton, CollapsibleRail, AppFrame 继续可用 (见 HX 扩展).
      </P>
      <Usage names={["SidebarProvider", "Sidebar", "SidebarHeader", "SidebarContent", "SidebarFooter", "SidebarGroup", "SidebarGroupLabel", "SidebarGroupContent", "SidebarMenu", "SidebarMenuItem", "SidebarMenuButton", "SidebarMenuBadge", "SidebarMenuSub", "SidebarMenuSubItem", "SidebarMenuSubButton", "SidebarTrigger", "SidebarRail", "SidebarInset", "useSidebar"]} />
      <H2>示例</H2>
      <P>为了嵌在文档里, 示例把 Sidebar 的 fixed 定位改成 absolute (传 className); 真实应用里直接铺满视口.</P>
      <Preview code={`<SidebarProvider>
  <Sidebar collapsible="icon">
    <SidebarHeader>...</SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>应用</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive tooltip="首页"><HomeIcon /><span>首页</span></SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarRail />
  </Sidebar>
  <SidebarInset>
    <header><SidebarTrigger /></header>
  </SidebarInset>
</SidebarProvider>`}>
        <div className={DOC.stack}>
          <SegmentedControl
            value={collapsible}
            onChange={setCollapsible}
            items={[{ key: OPEN_STATE.icon, label: "收成图标条" }, { key: OPEN_STATE.offcanvas, label: "整体移出" }]}
          />
          <SidebarProvider className="relative h-[380px] min-h-0 overflow-hidden rounded-xl border border-border">
            <Sidebar collapsible={collapsible} className="absolute h-full">
              <SidebarHeader>
                <div className="flex items-center gap-2 px-1 py-1">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/15 text-link [&>svg]:size-3.5"><SparklesIcon /></span>
                  <span className="truncate text-[13px] font-semibold group-data-[collapsible=icon]:hidden">HX Console</span>
                </div>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>应用</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {NAV.map((item) => (
                        <SidebarMenuItem key={item.label}>
                          <SidebarMenuButton isActive={item.active} tooltip={item.label}>
                            {item.icon}
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                          {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                        </SidebarMenuItem>
                      ))}
                      <SidebarMenuItem>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem><SidebarMenuSubButton href="#/sidebar" isActive>概览</SidebarMenuSubButton></SidebarMenuSubItem>
                          <SidebarMenuSubItem><SidebarMenuSubButton href="#/sidebar">日志</SidebarMenuSubButton></SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
              <SidebarFooter>
                <div className="truncate px-2 text-[11px] text-muted-foreground group-data-[collapsible=icon]:hidden">v0.1.0</div>
              </SidebarFooter>
              <SidebarRail />
            </Sidebar>
            <SidebarInset className="min-h-0">
              <header className="flex h-11 items-center gap-2 border-b border-border px-3">
                <SidebarTrigger />
                <span className="text-[13px] font-semibold text-heading">控制台</span>
              </header>
              <div className="p-4 text-[13px] text-muted-foreground">点左上角按钮或按 Ctrl+B 切换侧栏.</div>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </Preview>
      <Callout title="与原有侧栏件的分工">固定版式的文档站侧栏 (本站左侧) 用 SidebarNavItemButton; 需要可收起, 分组, 子菜单与移动端抽屉的应用外壳用这一组.</Callout>
      <H2>属性</H2>
      <Props spec={`
SidebarProvider.defaultOpen / open / onOpenChange ~ boolean ~ true ~ 开合状态, 受控或非受控
Sidebar.side ~ "left" | "right" ~ "left" ~ 所在侧
Sidebar.variant ~ "sidebar" | "floating" | "inset" ~ "sidebar" ~ 外观
Sidebar.collapsible ~ "offcanvas" | "icon" | "none" ~ "offcanvas" ~ 收起方式
SidebarMenuButton.isActive / tooltip ~ boolean / string ~ - ~ 当前页标记与图标条模式的提示
`} />
    </>
  );
}
