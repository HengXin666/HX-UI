import * as React from "react";
import { toast } from "sonner";
import { Bold, Italic, Underline } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Reveal } from "@/motion/reveal";
import { Spin, SPIN_VARIANTS } from "@/components/ui/spin";

// 演示用图片 (Unsplash)

function Demo({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Reveal className="flex flex-col rounded-2xl border bg-card shadow-soft">
      <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">{title}</div>
      <div className={"relative flex min-h-40 flex-1 flex-wrap items-center justify-center gap-3 overflow-hidden p-6 " + (className ?? "")}>{children}</div>
    </Reveal>
  );
}

export default function Components() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="mx-auto max-w-5xl px-5 pt-10 pb-24 md:px-10">
        <p className="mb-4 flex items-center gap-2 font-mono text-xs text-muted-foreground"><span aria-hidden className="size-2 rounded-full bg-[oklch(0.62_0.2_262)]" /><a href="#/ui" className="hover:underline">UI 组件</a><span aria-hidden>/</span><span>待拆分</span></p>
        <h1 id="base" className="text-5xl font-medium tracking-[-0.04em] md:text-6xl">更多基础件</h1>
        <p className="mt-4 mb-10 max-w-2xl text-muted-foreground">shadcn/ui 源码，全部跟随主题令牌。还没拆成独立页面的部分，正在逐个整理。</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          <Demo title="Progress · Toggle · Skeleton" className="flex-col">
            <Progress value={64} aria-label="上传进度" className="w-full" />
            <ToggleGroup type="multiple" variant="outline"><ToggleGroupItem value="b" aria-label="粗体"><Bold /></ToggleGroupItem><ToggleGroupItem value="i" aria-label="斜体"><Italic /></ToggleGroupItem><ToggleGroupItem value="u" aria-label="下划线"><Underline /></ToggleGroupItem></ToggleGroup>
            <div className="w-full space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
          </Demo>
        </div>

      </div>
    </TooltipProvider>
  );
}
