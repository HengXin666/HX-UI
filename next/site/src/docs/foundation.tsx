import * as React from "react";
import { toast } from "sonner";
import { Bold, Italic, Underline } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SpotlightCard } from "@/effects/spotlight-card";
import { BorderBeam } from "@/effects/border-beam";
import { Marquee } from "@/effects/marquee";
import { Backdrop } from "@/effects/backdrop";
import { ShimmerButton } from "@/effects/shimmer-button";
import { Magnetic } from "@/effects/magnetic";
import { TiltCard } from "@/effects/tilt-card";
import { LiveDot } from "@/effects/live-dot";
import { AnimatedNumber } from "@/motion/animated-number";
import { TextReveal } from "@/motion/text-effect";
import { Reveal } from "@/motion/reveal";
import { Spin, SPIN_VARIANTS } from "@/components/ui/spin";

// 演示用图片 (Unsplash)
const WATCH = "https://images.unsplash.com/photo-1541195942158-ccbd892c4673?auto=format&fit=crop&w=800&q=70";

function Demo({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Reveal className="flex flex-col rounded-2xl border bg-card shadow-soft">
      <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">{title}</div>
      <div className={"relative flex min-h-40 flex-1 flex-wrap items-center justify-center gap-3 overflow-hidden p-6 " + (className ?? "")}>{children}</div>
    </Reveal>
  );
}

export default function Components() {
  const [n, setN] = React.useState(12_486);
  return (
    <TooltipProvider delayDuration={200}>
      <div className="mx-auto max-w-5xl px-5 pt-10 pb-24 md:px-10">
        <p className="mb-4 flex items-center gap-2 font-mono text-xs text-muted-foreground"><span aria-hidden className="size-2 rounded-full bg-[oklch(0.7_0.15_155)]" /><span className="text-[oklch(0.7_0.15_155)]">05 基础</span><span aria-hidden>/</span><span>合集</span></p>
        <h1 id="base" className="text-5xl font-medium tracking-[-0.04em] md:text-6xl">基础件合集</h1>
        <p className="mt-4 mb-10 max-w-2xl text-muted-foreground">shadcn/ui 源码，全部跟随主题令牌。下一步会把它们逐个拆成独立页面，带调参和属性表。</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Demo title="Button">
            <Button>主要</Button><Button variant="secondary">次要</Button><Button variant="outline">描边</Button><Button variant="ghost">幽灵</Button><Button variant="destructive">删除</Button>
          </Demo>
          <Demo title="Form" className="flex-col items-stretch">
            <div className="space-y-1.5"><Label htmlFor="em">邮箱</Label><Input id="em" placeholder="you@company.com" /></div>
            <div className="flex items-center justify-between"><Label htmlFor="sw">接收周报</Label><Switch id="sw" defaultChecked /></div>
            <div className="flex items-center gap-2"><Checkbox id="cb" defaultChecked /><Label htmlFor="cb">同意服务条款</Label></div>
          </Demo>
          <Demo title="Select · Slider" className="flex-col items-stretch">
            <Select defaultValue="sh"><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sh">华东 · 上海</SelectItem><SelectItem value="bj">华北 · 北京</SelectItem><SelectItem value="sz">华南 · 深圳</SelectItem></SelectContent></Select>
            <Slider defaultValue={[64]} max={100} />
            <Progress value={64} />
          </Demo>
          <Demo title="Tabs">
            <Tabs defaultValue="a" className="w-full">
              <TabsList className="w-full"><TabsTrigger value="a">概览</TabsTrigger><TabsTrigger value="b">明细</TabsTrigger><TabsTrigger value="c">设置</TabsTrigger></TabsList>
              <TabsContent value="a" className="pt-3 text-sm text-muted-foreground">本月共处理 12,486 笔。</TabsContent>
              <TabsContent value="b" className="pt-3 text-sm text-muted-foreground">明细按日期倒序。</TabsContent>
              <TabsContent value="c" className="pt-3 text-sm text-muted-foreground">通知与权限。</TabsContent>
            </Tabs>
          </Demo>
          <Demo title="Overlay">
            <Dialog>
              <DialogTrigger asChild><Button variant="outline">对话框</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>删除这个项目?</DialogTitle><DialogDescription>项目下的 38 个看板会一起删除，无法恢复。</DialogDescription></DialogHeader>
                <DialogFooter><Button variant="outline">取消</Button><Button variant="destructive" onClick={() => toast.success("已删除")}>删除</Button></DialogFooter>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild><Button variant="outline">抽屉</Button></SheetTrigger>
              <SheetContent><SheetHeader><SheetTitle>订单 TL-20518</SheetTitle><SheetDescription>列表进详情用抽屉，不丢滚动位置。</SheetDescription></SheetHeader></SheetContent>
            </Sheet>
            <Popover><PopoverTrigger asChild><Button variant="outline">气泡</Button></PopoverTrigger><PopoverContent className="text-sm">轻量浮层，点外部关闭。</PopoverContent></Popover>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost">提示</Button></TooltipTrigger><TooltipContent>悬停 200ms 出现</TooltipContent></Tooltip>
          </Demo>
          <Demo title="Spin · 固定 / 轮播 (LDRS 41 形态)" className="flex-col">
            <div className="flex items-center gap-6 text-brand">
              <Spin size="lg" label="加载中" />
              <Spin size="lg" mode="rotate" />
              <Button type="button" disabled><Spin size="sm" variant="ring2" /> 提交中</Button>
            </div>
            <div className="grid grid-cols-8 gap-3 text-muted-foreground">
              {SPIN_VARIANTS.slice(0, 16).map((v) => <Spin key={v} variant={v} size={20} title={v} />)}
            </div>
          </Demo>
          <Demo title="Badge · Toggle · Skeleton" className="flex-col">
            <div className="flex gap-2"><Badge>默认</Badge><Badge variant="secondary">次要</Badge><Badge variant="outline">描边</Badge><Badge variant="destructive">告警</Badge></div>
            <ToggleGroup type="multiple" variant="outline"><ToggleGroupItem value="b" aria-label="粗体"><Bold /></ToggleGroupItem><ToggleGroupItem value="i" aria-label="斜体"><Italic /></ToggleGroupItem><ToggleGroupItem value="u" aria-label="下划线"><Underline /></ToggleGroupItem></ToggleGroup>
            <div className="w-full space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
          </Demo>
        </div>

        <h2 id="fx" className="mb-2 mt-16 text-2xl font-medium tracking-tight">动效与特效</h2>
        <p className="mb-8 text-muted-foreground">少而精。全部只动 transform / opacity，系统开启 "减弱动效" 时自动降级。</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Demo title="SpotlightCard · 指针光斑"><SpotlightCard className="w-full p-6"><div className="font-medium">把鼠标移进来</div><p className="mt-1 text-sm text-muted-foreground">光斑跟随指针，不触发重渲染。</p></SpotlightCard></Demo>
          <Demo title="BorderBeam · 流光边框"><div className="relative w-full rounded-xl border bg-background p-6"><BorderBeam /><div className="font-medium">推荐套餐</div><p className="mt-1 text-sm text-muted-foreground">光沿 1px 边框流动。</p></div></Demo>
          <Demo title="ShimmerButton · Magnetic"><Magnetic><ShimmerButton>立即开始</ShimmerButton></Magnetic></Demo>
          <Demo title="AnimatedNumber · 弹簧数字" className="flex-col">
            <AnimatedNumber value={n} className="text-4xl font-semibold" />
            <Button size="sm" variant="outline" onClick={() => setN((v) => v + Math.round(Math.random() * 4000 - 1000))}>随机变化</Button>
          </Demo>
          <Demo title="TextReveal · 标题入场"><TextReveal as="h3" by="char" text="一屏一个主角" className="text-3xl font-semibold" /></Demo>
          <Demo title="TiltCard · 3D 倾斜"><TiltCard className="w-40 overflow-hidden rounded-xl shadow-float"><img src={WATCH} alt="腕表" className="aspect-square object-cover" /></TiltCard></Demo>
          <Demo title="Marquee · 跑马灯" className="px-0"><Marquee className="w-full">{["蓝鲸物流", "青禾生鲜", "极光电器", "北辰医疗", "云栖科技"].map((t) => <span key={t} className="text-lg font-semibold text-muted-foreground">{t}</span>)}</Marquee></Demo>
          <Demo title="Backdrop · aurora"><Backdrop variant="aurora" /><span className="relative font-medium">极光底纹</span></Demo>
          <Demo title="Backdrop · grid / dots"><Backdrop variant="dots" /><div className="relative flex items-center gap-2 text-sm"><LiveDot /> 运行中 <LiveDot tone="warning" /> 降级 <LiveDot tone="destructive" /> 故障</div></Demo>
        </div>
      </div>
    </TooltipProvider>
  );
}
