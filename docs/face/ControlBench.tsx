import { useState, type JSX, type ReactNode } from "react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
  Avatar, AvatarFallback,
  Badge,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
  Button, BUTTON_TYPE, VARIANT,
  Card, CardContent, CardHeader, CardTitle,
  Checkbox,
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  Input,
  Pagination,
  Popover, PopoverContent, PopoverTrigger,
  Progress,
  RadioGroup, RadioGroupItem,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Skeleton,
  Slider,
  Switch,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Textarea,
  Toggle,
  TooltipHint,
} from "@hx/ui";
import { NumberRoll, SegmentedThumb } from "../../src/craft";
import { Stepper } from "../../src/layout/Stepper";
import { showToast } from "../../src/layout/Toast";

function Row({ title, children }: { readonly title: string; readonly children: ReactNode }): JSX.Element {
  return (
    <section className="rounded-xl border border-border p-4">
      <h2 className="text-sm text-muted-foreground">{title}</h2>
      <div className="mt-3 flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

/** 全部基础控件的同一套分态: 禁用, 加载, 错误可以同时打在舞台上. */
export function ControlBench(): JSX.Element {
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [on, setOn] = useState(false);
  const [checked, setChecked] = useState(false);
  const [radio, setRadio] = useState("a");
  const [page, setPage] = useState("one");
  const [amount, setAmount] = useState(42);
  const [step, setStep] = useState(1);
  const [tab, setTab] = useState("overview");
  const invalidProps = invalid ? { "aria-invalid": true as const } : {};

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-8">
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.target.checked)} />禁用</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={loading} onChange={(event) => setLoading(event.target.checked)} />加载</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={invalid} onChange={(event) => setInvalid(event.target.checked)} />错误</label>
      </div>

      <Row title="按钮 / 图标按钮 / 切换">
        <Button type={BUTTON_TYPE} variant={VARIANT.primary} disabled={disabled} loading={loading}>保存</Button>
        <Button type={BUTTON_TYPE} variant="outline" disabled={disabled} size="icon" aria-label="图标按钮">+</Button>
        <Toggle disabled={disabled} pressed={on} onPressedChange={setOn}>加粗</Toggle>
        <TooltipHint label="保存当前草稿"><Button type={BUTTON_TYPE} disabled={disabled}>提示</Button></TooltipHint>
      </Row>

      <Row title="开关 / 复选 / 单选 / 分段">
        <Switch checked={on} onCheckedChange={setOn} disabled={disabled} aria-label="开关" />
        <Checkbox checked={checked} onCheckedChange={(value) => setChecked(value === true)} disabled={disabled} aria-label="复选" />
        <RadioGroup value={radio} onValueChange={setRadio} disabled={disabled} className="flex gap-3">
          <RadioGroupItem value="a" aria-label="甲" />
          <RadioGroupItem value="b" aria-label="乙" />
        </RadioGroup>
        <SegmentedThumb
          ariaLabel="分段"
          value={page}
          onChange={setPage}
          options={[{ value: "one", label: "甲", disabled }, { value: "two", label: "乙" }]}
        />
      </Row>

      <Row title="标签">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList animated>
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="log">日志</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">概览</TabsContent>
          <TabsContent value="log">日志</TabsContent>
        </Tabs>
      </Row>

      <Row title="输入 / 多行 / 选择 / 滑杆 / 数字">
        <Input disabled={disabled} placeholder="输入" aria-label="输入" {...invalidProps} />
        <Textarea disabled={disabled} placeholder="多行" aria-label="多行" {...invalidProps} />
        <Select disabled={disabled}>
          <SelectTrigger aria-label="选择"><SelectValue placeholder="选择" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="a">甲</SelectItem>
            <SelectItem value="b">乙</SelectItem>
          </SelectContent>
        </Select>
        <Slider value={[amount]} disabled={disabled} onValueChange={(next) => setAmount(next[0] ?? 0)} aria-label="滑杆" className="w-40" />
        <input className="h-8 w-24 rounded-lg border border-border bg-transparent px-2 text-sm" type="number" disabled={disabled} value={amount} aria-label="数字输入" onChange={(event) => setAmount(Number(event.target.value))} />
        <span className="text-2xl"><NumberRoll value={amount} /></span>
      </Row>

      <Row title="浮层">
        <Dialog>
          <DialogTrigger asChild><Button type={BUTTON_TYPE} disabled={disabled}>对话框</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>对话框</DialogTitle>
              <DialogDescription>遮罩 180ms, 面板从 0.98 收到 1.</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <Popover>
          <PopoverTrigger asChild><Button type={BUTTON_TYPE} disabled={disabled}>弹出层</Button></PopoverTrigger>
          <PopoverContent>附在触发器上的一层.</PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button type={BUTTON_TYPE} disabled={disabled}>菜单</Button></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>第一项</DropdownMenuItem>
            <DropdownMenuItem>第二项</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button type={BUTTON_TYPE} disabled={disabled} onClick={() => showToast({ message: "已保存", variant: "success" })}>提示条</Button>
      </Row>

      <Row title="折叠 / 进度 / 骨架 / 徽章 / 头像">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="a">
            <AccordionTrigger>折叠</AccordionTrigger>
            <AccordionContent>面板内容.</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Progress value={amount % 100} className="w-40" />
        <Skeleton className="h-8 w-24" />
        <Badge>徽章</Badge>
        <Avatar><AvatarFallback>HX</AvatarFallback></Avatar>
      </Row>

      <Row title="卡片 / 表格 / 分页 / 面包屑 / 步骤">
        <Card className="w-48"><CardHeader><CardTitle>卡片</CardTitle></CardHeader><CardContent>1px 边.</CardContent></Card>
        <Table>
          <TableHeader><TableRow><TableHead>名</TableHead><TableHead>值</TableHead></TableRow></TableHeader>
          <TableBody><TableRow><TableCell>甲</TableCell><TableCell>{amount}</TableCell></TableRow></TableBody>
        </Table>
        <Pagination page={1} pageCount={5} onPageChange={() => undefined} />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="#/home">首页</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>控件</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Stepper steps={[{ id: "a", title: "准备" }, { id: "b", title: "制作" }, { id: "c", title: "落定" }]} current={step} onStepClick={setStep} />
      </Row>
    </div>
  );
}
