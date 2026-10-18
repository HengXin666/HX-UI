import { useState, type JSX } from "react";
import { HomeIcon, InboxIcon, SearchIcon, SettingsIcon, SparklesIcon } from "lucide-react";
import { ALIGN, Card, Carousel, CarouselContent, CarouselDots, CarouselItem, CarouselNext, CarouselPrevious, DOC, DOC_SAMPLE, DirectionProvider, OPEN_STATE, ORIENTATION, ResizableHandle, ResizablePanel, ResizablePanelGroup, SegmentedControl, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarTrigger, Slider, Tabs, TabsList, TabsTrigger } from "@hx/ui";
import { Callout, H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/** 布局与容器类文档页: Resizable, Carousel, Direction, Sidebar. */
/** 分栏示例里每一栏的占位. */
const PANE = "grid h-full place-items-center text-[13px] text-muted-foreground";

export function ResizablePage(): JSX.Element {
  return (
    <>
      <P>可拖拽调整大小的分栏. 尺寸写成字符串是百分比 ("30"), 数字是像素. 拖拽条只有 1px 可见线, 可点区域向两侧各扩 4px; 悬停与拖拽中线变为 ring 色. 双击拖拽条恢复默认尺寸, 键盘方向键也能调整.</P>
      <Usage names={["ResizablePanelGroup", "ResizablePanel", "ResizableHandle"]} deps={["react-resizable-panels"]} />
      <H2>示例</H2>
      <Preview code={`<ResizablePanelGroup orientation="horizontal" className="rounded-xl border">
  <ResizablePanel defaultSize="30" minSize="15">侧栏</ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel>
    <ResizablePanelGroup orientation="vertical">
      <ResizablePanel defaultSize="60">编辑器</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>终端</ResizablePanel>
    </ResizablePanelGroup>
  </ResizablePanel>
</ResizablePanelGroup>`}>
        <div className="h-64 w-full">
          <ResizablePanelGroup orientation={ORIENTATION.horizontal} className="rounded-xl border border-border">
            <ResizablePanel defaultSize="30" minSize="15">
              <div className={PANE}>侧栏</div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel>
              <ResizablePanelGroup orientation={ORIENTATION.vertical}>
                <ResizablePanel defaultSize="60">
                  <div className={PANE}>编辑器</div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel>
                  <div className={PANE}>终端</div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
ResizablePanelGroup.orientation ~ "horizontal" | "vertical" ~ "horizontal" ~ 分栏方向
ResizablePanel.defaultSize / minSize / maxSize ~ number | string ~ - ~ 数字为像素, 字符串为百分比
ResizablePanel.collapsible ~ boolean ~ false ~ 小于 minSize 时折叠
ResizableHandle.withHandle ~ boolean ~ false ~ 显示握把
`} />
    </>
  );
}

const SLIDES = ["Dark Dimmed", "语义状态色", "动效令牌", "水波纹", "shadcn 对标"];

export function CarouselPage(): JSX.Element {
  return (
    <>
      <P>轮播 (embla-carousel). 拖拽与触控滑动带惯性, 左右方向键切换; 系统要求减弱动效时直接跳转. CarouselDots 的当前圆点拉长成胶囊.</P>
      <Usage names={["Carousel", "CarouselContent", "CarouselItem", "CarouselPrevious", "CarouselNext", "CarouselDots", "useCarousel"]} deps={["embla-carousel-react"]} />
      <H2>示例</H2>
      <Preview align={ALIGN.center} code={`<Carousel className="w-full max-w-xs" opts={{ loop: true }}>
  <CarouselContent>
    {slides.map((text) => (
      <CarouselItem key={text}><Card>...</Card></CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
  <CarouselDots />
</Carousel>`}>
        <Carousel className="w-full max-w-xs" opts={{ loop: true }}>
          <CarouselContent>
            {SLIDES.map((text, index) => (
              <CarouselItem key={text}>
                <Card className="grid aspect-square place-items-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[30px] font-semibold text-heading tabular-nums">{index + 1}</span>
                    <span className="text-[13px] text-muted-foreground">{text}</span>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
          <CarouselDots />
        </Carousel>
      </Preview>
      <H2>一次多张</H2>
      <Preview align={ALIGN.center} code={`<CarouselItem className="basis-1/3">...</CarouselItem>`}>
        <Carousel className={DOC.widthMd} opts={{ align: ALIGN.start }}>
          <CarouselContent>
            {SLIDES.map((text) => (
              <CarouselItem key={text} className="basis-1/3">
                <Card className="grid h-24 place-items-center px-2 text-center text-[12px] text-muted-foreground">{text}</Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
opts ~ EmblaOptions ~ - ~ embla 选项, 例如 loop, align
orientation ~ "horizontal" | "vertical" ~ "horizontal" ~ 滚动方向
setApi ~ (api: CarouselApi) => void ~ - ~ 拿到 embla 实例自行控制
plugins ~ EmblaPlugin[] ~ - ~ 例如自动播放插件
`} />
    </>
  );
}

export function DirectionPage(): JSX.Element {
  const [dir, setDir] = useState<"ltr" | "rtl">("rtl");
  return (
    <>
      <P>文字方向提供者. radix 的菜单, 滑块, 标签页等按它决定方向键语义与弹出侧. 整个应用挂一次, 同时给根元素写 dir, 让 ms-* / me-* 这类逻辑属性跟着翻转.</P>
      <Usage names={["DirectionProvider", "useDirection"]} />
      <H2>示例</H2>
      <Preview code={`<DirectionProvider dir="rtl">
  <div dir="rtl">
    <Tabs defaultValue="a">...</Tabs>
    <Slider defaultValue={[DOC_SAMPLE.slider]} />
  </div>
</DirectionProvider>`}>
        <div className="flex w-full max-w-md flex-col gap-4">
          <SegmentedControl
            value={dir}
            onChange={setDir}
            items={[{ key: "ltr", label: "从左到右" }, { key: "rtl", label: "从右到左" }]}
          />
          <DirectionProvider dir={dir}>
            <div dir={dir} className="flex flex-col gap-4">
              <Tabs defaultValue="dir-overview">
                <TabsList>
                  <TabsTrigger value="dir-overview">概览</TabsTrigger>
                  <TabsTrigger value="dir-logs">日志</TabsTrigger>
                  <TabsTrigger value="dir-config">配置</TabsTrigger>
                </TabsList>
              </Tabs>
              <Slider defaultValue={[DOC_SAMPLE.slider]} />
            </div>
          </DirectionProvider>
        </div>
      </Preview>
    </>
  );
}

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
        组合式应用侧栏, 对标 shadcn Sidebar. SidebarProvider 持有开合状态并注册 Ctrl/Cmd+B; collapsible=icon 时收成图标条,
        文字改由 tooltip 显示; 移动端宽度自动改为 Sheet 抽屉. 库里原有的 SidebarNavItemButton, CollapsibleRail, AppFrame 继续可用 (见 HX 扩展).
      </P>
      <Usage names={["SidebarProvider", "Sidebar", "SidebarHeader", "SidebarContent", "SidebarFooter", "SidebarGroup", "SidebarGroupLabel", "SidebarGroupContent", "SidebarMenu", "SidebarMenuItem", "SidebarMenuButton", "SidebarMenuBadge", "SidebarMenuSub", "SidebarTrigger", "SidebarRail", "SidebarInset", "useSidebar"]} />
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
