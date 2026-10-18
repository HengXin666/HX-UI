import { useState, type JSX } from "react";
import { ALIGN, Card, Carousel, CarouselContent, CarouselDots, CarouselItem, CarouselNext, CarouselPrevious, DOC, DOC_SAMPLE, DirectionProvider, ORIENTATION, ResizableHandle, ResizablePanel, ResizablePanelGroup, SegmentedControl, Sidebar, Slider, Tabs, TabsList, TabsTrigger } from "@hx/ui";
import { H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/** 布局与容器类文档页: Resizable, Carousel, Direction (Sidebar 在 sidebar.tsx). */
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
      <P>轮播 (embla-carousel). 拖拽与触控滑动带惯性, 左右方向键切换; 在输入框等可编辑元素里打字时方向键不翻页, 内部控件先 preventDefault 时也不翻页; 系统要求减弱动效时直接跳转. CarouselDots 的当前圆点拉长成胶囊.</P>
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
