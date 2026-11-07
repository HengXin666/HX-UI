import { useState, type JSX } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../src/primitives/accordion";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../../src/primitives/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "../../src/primitives/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../src/primitives/select";
import { Slider } from "../../src/primitives/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../src/primitives/tooltip";
import { showToast } from "../../src/layout/Toast";

/**
 * 道具台下半. 用的就是库里的 Select / Dialog / Drawer / Accordion / Slider / Tooltip.
 * 不再另挂一套同名控件.
 */
export function LiveBench(): JSX.Element {
  const [choice, setChoice] = useState("field");
  const [amount, setAmount] = useState(36);

  return (
    <TooltipProvider>
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8">
      <section className="rounded-xl border border-border p-4">
        <h2 className="text-sm text-muted-foreground">选择. 面板弹簧进出</h2>
        <div className="mt-3">
          <Select value={choice} onValueChange={setChoice}>
            <SelectTrigger aria-label="页面" className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="field">田野</SelectItem>
              <SelectItem value="kiln">窑四号</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <pre className="mt-3 text-xs text-muted-foreground">{`<Select value="${choice}">`}</pre>
      </section>
      <section className="rounded-xl border border-border p-4">
        <h2 className="text-sm text-muted-foreground">滑杆</h2>
        <Slider className="mt-4 w-48" value={[amount]} onValueChange={(next) => setAmount(next[0] ?? 0)} aria-label="幅度" />
        <pre className="mt-3 text-xs text-muted-foreground">{`<Slider value={[${amount}]} />`}</pre>
      </section>
      <section className="flex flex-wrap gap-2 rounded-xl border border-border p-4">
        <Dialog>
          <DialogTrigger className="h-8 rounded-lg border border-border px-3 text-sm">对话框</DialogTrigger>
          <DialogContent><DialogTitle>对话框</DialogTitle>从当前进度反向关闭.</DialogContent>
        </Dialog>
        <Drawer>
          <DrawerTrigger className="h-8 rounded-lg border border-border px-3 text-sm">抽屉</DrawerTrigger>
          <DrawerContent><DrawerTitle>抽屉</DrawerTitle>向右拖可以关上.</DrawerContent>
        </Drawer>
        <Tooltip>
          <TooltipTrigger className="h-8 rounded-lg border border-border px-3 text-sm">提示</TooltipTrigger>
          <TooltipContent>延迟后出现</TooltipContent>
        </Tooltip>
        <button type="button" className="h-8 rounded-lg border border-border px-3 text-sm" onClick={() => showToast({ message: "已记录" })}>提示条</button>
      </section>
      <Accordion type="single" collapsible className="rounded-xl border border-border px-4">
        <AccordionItem value="one">
          <AccordionTrigger>折叠</AccordionTrigger>
          <AccordionContent>高度从当前值继续, 不再用关键帧跳切.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
    </TooltipProvider>
  );
}
