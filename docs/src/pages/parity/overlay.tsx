import { useEffect, useState, type JSX } from "react";
import { CalendarIcon, CreditCardIcon, SettingsIcon, SmileIcon, Trash2Icon, UserIcon } from "lucide-react";
import { ALIGN, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger, Avatar, AvatarFallback, Button, Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut, DOC, EVENT, HoverCard, HoverCardContent, HoverCardTrigger, Input, Kbd, Label, SIDE, Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, TONE_VARIANT, UI_CLASSES, VARIANT, toast, type SheetSide } from "@hx/ui";
import { Callout, H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

const SHEET_SIDES: readonly SheetSide[] = [SIDE.top, SIDE.right, SIDE.bottom, SIDE.left];

/** 弹层类文档页: Sheet, AlertDialog, HoverCard, Command. */
export function SheetPage(): JSX.Element {
  return (
    <>
      <P>
        从屏幕四边滑入的面板, 建在 radix Dialog 上 (焦点陷阱, Esc 关闭). 进入 ease-out, 退出 ease-in 且更快.
        与 Drawer 的区别: Drawer 是可拖拽的底部抽屉 (移动端手势), Sheet 用于桌面端的设置 / 详情 / 筛选面板.
      </P>
      <Usage names={["Sheet", "SheetTrigger", "SheetContent", "SheetHeader", "SheetTitle", "SheetDescription", "SheetFooter", "SheetClose"]} />
      <H2>示例</H2>
      <Preview align={ALIGN.center} code={`<Sheet>
  <SheetTrigger asChild><Button>编辑资料</Button></SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>编辑资料</SheetTitle>
      <SheetDescription>修改后点击保存。</SheetDescription>
    </SheetHeader>
    <div className="grid gap-3 px-4">...</div>
    <SheetFooter>
      <SheetClose asChild><Button variant="primary">保存</Button></SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`}>
        {SHEET_SIDES.map((side) => (
          <Sheet key={side}>
            <SheetTrigger asChild>
              <Button>{side}</Button>
            </SheetTrigger>
            <SheetContent side={side}>
              <SheetHeader>
                <SheetTitle>编辑资料</SheetTitle>
                <SheetDescription>修改后点击保存, 面板从 {side} 侧滑入.</SheetDescription>
              </SheetHeader>
              <div className="grid gap-3 px-4">
                <Label htmlFor={`doc-sheet-${side}`}>显示名</Label>
                <Input id={`doc-sheet-${side}`} defaultValue="辉萝莉" />
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant={VARIANT.primary}>保存</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ))}
      </Preview>
      <H2>属性</H2>
      <Props spec={`
SheetContent.side ~ "top" | "right" | "bottom" | "left" ~ "right" ~ 从哪一侧滑入
SheetContent.showCloseButton ~ boolean ~ true ~ 右上角关闭按钮
open / onOpenChange ~ boolean / (open) => void ~ - ~ 受控开合 (在 Sheet 上)
`} />
    </>
  );
}

export function AlertDialogPage(): JSX.Element {
  return (
    <>
      <P>
        警示对话框: 点遮罩不关闭, 必须在 "取消 / 确认" 里二选一, 用于不可撤销的操作. 只需要一句话拿到 true / false 时,
        用 ConfirmDialog 或命令式 <code>await confirmDialog()</code> 更省事 (见 HX 扩展里的 ConfirmDialog 页).
      </P>
      <Usage names={["AlertDialog", "AlertDialogTrigger", "AlertDialogContent", "AlertDialogHeader", "AlertDialogTitle", "AlertDialogDescription", "AlertDialogFooter", "AlertDialogCancel", "AlertDialogAction"]} />
      <H2>示例</H2>
      <Preview align={ALIGN.center} code={`<AlertDialog>
  <AlertDialogTrigger asChild><Button variant="destructive">删除仓库</Button></AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogMedia className={DOC.dangerText}><Trash2Icon /></AlertDialogMedia>
      <AlertDialogTitle>确定删除?</AlertDialogTitle>
      <AlertDialogDescription>此操作不可撤销, 仓库与全部分支会被永久删除。</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>取消</AlertDialogCancel>
      <AlertDialogAction variant="destructive">删除</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant={TONE_VARIANT.destructive}>删除仓库</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia className={DOC.dangerText}>
                <Trash2Icon />
              </AlertDialogMedia>
              <AlertDialogTitle>确定删除?</AlertDialogTitle>
              <AlertDialogDescription>此操作不可撤销, 仓库与全部分支会被永久删除.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction variant={TONE_VARIANT.destructive} onClick={() => toast.success("已删除 (演示)")}>删除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>小尺寸</Button>
          </AlertDialogTrigger>
          <AlertDialogContent size={VARIANT.sm}>
            <AlertDialogHeader>
              <AlertDialogTitle>放弃修改?</AlertDialogTitle>
              <AlertDialogDescription>未保存的内容会丢失.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>继续编辑</AlertDialogCancel>
              <AlertDialogAction>放弃</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
AlertDialogContent.size ~ "default" | "sm" ~ "default" ~ sm 时底部两个按钮等宽并排
AlertDialogAction.variant ~ ButtonVariant ~ "primary" ~ 危险操作传 destructive
AlertDialogCancel.variant ~ ButtonVariant ~ "outline" ~ 取消按钮外观
`} />
    </>
  );
}

export function HoverCardPage(): JSX.Element {
  return (
    <>
      <P>鼠标停在链接或头像上时预览详情. 默认停留 400ms 才弹出, 扫过不会误弹; 离开 150ms 后收起, 鼠标能从触发器移进卡片. 内容只放 "看一眼" 的信息, 不放必须操作的控件.</P>
      <Usage names={["HoverCard", "HoverCardTrigger", "HoverCardContent"]} />
      <H2>示例</H2>
      <Preview align={ALIGN.center} code={`<HoverCard>
  <HoverCardTrigger asChild><a href="#">@HengXin666</a></HoverCardTrigger>
  <HoverCardContent>...</HoverCardContent>
</HoverCard>`}>
        <HoverCard>
          <HoverCardTrigger asChild>
            <a href="#/hover-card" className="text-[13px] text-link underline-offset-4 hover:underline">@HengXin666</a>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="flex gap-3">
              <Avatar>
                <AvatarFallback>HX</AvatarFallback>
              </Avatar>
              <div className={DOC.tight}>
                <div className="text-[13px] font-medium text-heading">HengXin666</div>
                <p className={UI_CLASSES.mutedHalf}>HX-UI 作者. 写 C++ 与 React.</p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarIcon className="size-3" /> 2024 年加入
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
openDelay ~ number ~ 400 ~ 停留多久才弹出 (ms)
closeDelay ~ number ~ 150 ~ 离开多久才收起 (ms)
HoverCardContent.side / align ~ radix 定位 ~ "bottom" / "center" ~ 弹出位置
`} />
    </>
  );
}

export function CommandPage(): JSX.Element {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "j" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener(EVENT.keydown, onKey);
    return () => window.removeEventListener(EVENT.keydown, onKey);
  }, []);
  const items = (
    <>
      <CommandInput placeholder="输入命令或搜索..." />
      <CommandList>
        <CommandEmpty>没有匹配的命令</CommandEmpty>
        <CommandGroup heading="建议">
          <CommandItem><CalendarIcon />日历</CommandItem>
          <CommandItem><SmileIcon />表情</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={DOC.settings}>
          <CommandItem><UserIcon />个人资料<CommandShortcut>Ctrl P</CommandShortcut></CommandItem>
          <CommandItem><CreditCardIcon />账单<CommandShortcut>Ctrl B</CommandShortcut></CommandItem>
          <CommandItem><SettingsIcon />偏好设置<CommandShortcut>Ctrl S</CommandShortcut></CommandItem>
        </CommandGroup>
      </CommandList>
    </>
  );
  return (
    <>
      <P>命令面板 (cmdk): 输入即过滤, 方向键移动高亮, Enter 选中; 列表高度随结果数量平滑过渡. 内嵌用 Command, 全局面板用 CommandDialog.</P>
      <Usage names={["Command", "CommandDialog", "CommandInput", "CommandList", "CommandEmpty", "CommandGroup", "CommandItem", "CommandSeparator", "CommandShortcut"]} deps={["cmdk"]} />
      <H2>内嵌</H2>
      <Preview code={`<Command className="border">
  <CommandInput placeholder="输入命令或搜索..." />
  <CommandList>
    <CommandEmpty>没有匹配的命令</CommandEmpty>
    <CommandGroup heading="建议">
      <CommandItem><CalendarIcon />日历</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`}>
        <Command className="max-w-md border border-border">{items}</Command>
      </Preview>
      <H2>对话框</H2>
      <Preview align={ALIGN.center} code={`<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="输入命令或搜索..." />
  <CommandList>...</CommandList>
</CommandDialog>`}>
        <Button onClick={() => setOpen(true)}>打开命令面板</Button>
        <span className={UI_CLASSES.mutedHalf}>或按 <Kbd>Ctrl</Kbd> <Kbd>J</Kbd></span>
        <CommandDialog open={open} onOpenChange={setOpen}>{items}</CommandDialog>
      </Preview>
      <Callout title="文档站自己的搜索">左上角的搜索框 (Ctrl K) 是文档站自带的实现; 业务里需要命令面板时用这里的 CommandDialog.</Callout>
    </>
  );
}
