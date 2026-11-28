import * as React from "react";
import {
  BellOffIcon,
  FileCodeIcon,
  FolderIcon,
  LockIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  PinIcon,
  RotateCcwIcon,
  SearchIcon,
  SendHorizontalIcon,
  TerminalIcon,
  UsersIcon,
} from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  type PanelSize,
  type ResizableDirection,
  type ResizablePanelGroupHandle,
  type ResizablePanelHandle,
} from "@/components/ui/resizable";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DemoProps } from "../types";

/**
 * 三个场景: HX-AIOA 电脑端三栏 (会话列表 / 会话 / 群资料检查栏), 两栏 (方向可切, 竖直时上下分), 嵌套的 IDE 布局.
 * 外框统一: 实心面板 + 1px 边, 固定高度; 底栏实时显示布局百分比和操作提示.
 */
const CARD = "flex h-[32rem] w-full max-w-4xl flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-float";
const FOOT = "flex shrink-0 items-center gap-2 border-t px-3 py-1.5 text-[11px] text-muted-foreground";
const PANE_HEAD = "flex h-11 shrink-0 items-center gap-2 border-b px-3";
const TONES = ["bg-chart-1/20 text-chart-1", "bg-chart-2/20 text-chart-2", "bg-chart-3/20 text-chart-3", "bg-chart-4/20 text-chart-4", "bg-chart-5/20 text-chart-5"];
const HINT = "拖动分隔线改宽, 推到最小会接着推下一栏 · 双击复位 · 聚焦后方向键微调, Enter 折叠";
const WORKSPACES = [
  { id: "a", label: "工作区 A" },
  { id: "b", label: "工作区 B" },
];

type Opts = {
  direction: ResizableDirection;
  min: number;
  collapsible: boolean;
  withHandle: boolean;
  persist: boolean;
  /** 折叠 / 展开 / 复位的过渡时长 ms, 0 = 关闭 */
  animation: number;
  /** 两栏示例: 受控且父组件拒绝修改 (演示回弹) */
  locked: boolean;
};

const anim = (o: Opts) => (o.animation > 0 ? o.animation : false);

const px = (n: number): PanelSize => `${n}px`;
const fmt = (sizes: number[]) => sizes.map((s) => `${Math.round(s)}%`).join(" · ");

function Layout({ sizes }: { sizes: number[] }) {
  return <span className="shrink-0 rounded-md border bg-background/60 px-1.5 py-0.5 whitespace-nowrap tabular">{sizes.length ? fmt(sizes) : "…"}</span>;
}

/** 底栏的布局读数: onLayout 只在提交时调用, 挂载 (或重挂) 后先读一次初始布局 */
function useLayoutReadout(dep: string) {
  const ref = React.useRef<ResizablePanelGroupHandle>(null);
  const [sizes, setSizes] = React.useState<number[]>([]);
  React.useLayoutEffect(() => {
    setSizes(ref.current?.getLayout() ?? []);
  }, [dep]);
  return [ref, sizes, setSizes] as const;
}

// ---------------------------------------------------------------- HX-AIOA 三栏

const CHATS = [
  { n: "HX-AIOA 内测群", m: "周屿: 三栏可以拖宽了, 试试", t: "21:04", u: 3, pin: true },
  { n: "林晓", m: "设计稿第三版发你了", t: "20:51", u: 1 },
  { n: "AIOA 助手", m: "已为你整理今日待办 (5)", t: "20:30", u: 0 },
  { n: "前端小组", m: "陈默: 今晚八点发版", t: "19:12", u: 0, mute: true },
  { n: "苏青", m: "[图片]", t: "18:40", u: 0 },
  { n: "邮件通知", m: "GitHub: PR #142 已合并", t: "昨天", u: 0 },
  { n: "何川", m: "好的, 明天聊", t: "周三", u: 0 },
];
const MEMBERS = ["林晓", "周屿", "陈默", "苏青", "何川", "AIOA 助手"];
const MSGS = [
  { f: "周屿", t: "三栏现在可以拖动改宽了, 刷新以后会记住宽度。" },
  { f: "我", t: "检查栏能折叠吗? 小屏的时候想把它收起来。" },
  { f: "林晓", t: "可以, 拖到最小宽度以下一半就会吸附折叠, 双击分隔线复位。键盘聚焦分隔线按 Enter 也能折叠。" },
  { f: "我", t: "👍 体验很顺, 拖动时一点都不卡。" },
];

function ChatList() {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className={PANE_HEAD}>
        <span className="text-sm font-medium">消息</span>
        <div className="relative ml-auto min-w-0 flex-1">
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="搜索会话" placeholder="搜索" className="h-7 pl-7 text-xs" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-1.5">
        {CHATS.map((c, i) => (
          <button
            key={c.n}
            type="button"
            data-selected={i === 0 ? "" : undefined}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors duration-150 not-data-selected:hover:bg-accent/60 data-selected:bg-accent data-selected:ring-1 data-selected:ring-border"
          >
            <Avatar>
              <AvatarFallback className={cn("text-xs font-medium", TONES[i % TONES.length])}>{c.n.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)]">
              <span className="flex items-center gap-1">
                <span className="truncate text-sm font-medium">{c.n}</span>
                {c.pin && <PinIcon aria-label="置顶" className="size-3 shrink-0 text-muted-foreground" />}
                {c.mute && <BellOffIcon aria-label="免打扰" className="size-3 shrink-0 text-muted-foreground" />}
                <span className="ml-auto shrink-0 text-[11px] text-muted-foreground tabular">{c.t}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="truncate text-xs text-muted-foreground">{c.m}</span>
                {c.u > 0 && <span className="ml-auto shrink-0 rounded-full bg-brand px-1.5 text-[10px] leading-4 text-brand-foreground tabular">{c.u}</span>}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Conversation({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className={PANE_HEAD}>
        {left}
        <span className="truncate text-sm font-medium">HX-AIOA 内测群</span>
        <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">128 人</span>
        <span className="ml-auto" />
        {right}
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-4">
        {MSGS.map((m, i) => {
          const mine = m.f === "我";
          return (
            <div key={i} className={cn("flex gap-2", mine && "flex-row-reverse")}>
              {!mine && (
                <Avatar size="sm" className="mt-4">
                  <AvatarFallback className={cn("text-[10px] font-medium", TONES[MEMBERS.indexOf(m.f) % TONES.length])}>{m.f.slice(0, 1)}</AvatarFallback>
                </Avatar>
              )}
              <div className={cn("grid max-w-[80%] gap-1", mine && "justify-items-end")}>
                {!mine && <span className="px-1 text-[11px] text-muted-foreground">{m.f}</span>}
                <p className={cn("rounded-2xl px-3 py-2 text-sm leading-6", mine ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md border bg-background/70")}>{m.t}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t p-3">
        <Input aria-label="消息" placeholder="说点什么" className="h-9" />
        <Button type="button" size="icon" aria-label="发送">
          <SendHorizontalIcon />
        </Button>
      </div>
    </div>
  );
}

function Inspector() {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className={PANE_HEAD}>
        <span className="text-sm font-medium">群资料</span>
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
        <div className="flex flex-col items-center gap-2 pb-4 text-center">
          <Avatar size="lg">
            <AvatarFallback className="bg-brand-soft text-sm font-medium text-brand">HX</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">HX-AIOA 内测群</p>
            <p className="text-xs text-muted-foreground">Web 端对齐安卓 · #155</p>
          </div>
        </div>
        <p className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <UsersIcon className="size-3.5" />
          成员 128
        </p>
        <ul className="grid gap-0.5">
          {MEMBERS.map((m, i) => (
            <li key={m} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors duration-150 hover:bg-accent/60">
              <Avatar size="sm">
                <AvatarFallback className={cn("text-[10px] font-medium", TONES[i % TONES.length])}>{m.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span className="truncate">{m}</span>
              {i === 0 && <span className="ml-auto rounded bg-accent px-1.5 text-[10px] leading-4 text-muted-foreground">群主</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Aioa({ o }: { o: Opts }) {
  const left = React.useRef<ResizablePanelHandle>(null);
  const right = React.useRef<ResizablePanelHandle>(null);
  const groupKey = `${o.min}:${o.collapsible}:${o.persist}`;
  const [group, sizes, setSizes] = useLayoutReadout(groupKey);
  const [leftOpen, setLeftOpen] = React.useState(true);
  const [rightOpen, setRightOpen] = React.useState(true);
  // 不同工作区各记各的宽度: autoSaveId 换了组件会重新读取, 不用重挂
  const [space, setSpace] = React.useState(WORKSPACES[0].id);
  const toggle = (r: React.RefObject<ResizablePanelHandle | null>) => r.current?.toggle();
  React.useLayoutEffect(() => {
    setSizes(group.current?.getLayout() ?? []);
  }, [space, group, setSizes]);
  return (
    <div className={CARD}>
      <ResizablePanelGroup
        key={groupKey}
        groupRef={group}
        direction="horizontal"
        autoSaveId={o.persist ? `docs-aioa-three-pane-${space}` : undefined}
        animation={anim(o)}
        onLayout={setSizes}
        className="min-h-0 flex-1"
      >
        <ResizablePanel
          panelRef={left}
          defaultSize={26}
          minSize={px(o.min)}
          maxSize="40%"
          collapsible={o.collapsible}
          onCollapse={() => setLeftOpen(false)}
          onExpand={() => setLeftOpen(true)}
          className="bg-background/40"
        >
          <ChatList />
        </ResizablePanel>
        <ResizableHandle withHandle={o.withHandle} />
        <ResizablePanel minSize="320px">
          <Conversation
            left={
              <Button type="button" size="icon-xs" variant="ghost" aria-label={leftOpen ? "收起会话列表" : "展开会话列表"} disabled={!o.collapsible} onClick={() => toggle(left)}>
                {leftOpen ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
              </Button>
            }
            right={
              <Button type="button" size="icon-xs" variant="ghost" aria-label={rightOpen ? "收起群资料" : "展开群资料"} disabled={!o.collapsible} onClick={() => toggle(right)}>
                {rightOpen ? <PanelRightCloseIcon /> : <PanelRightOpenIcon />}
              </Button>
            }
          />
        </ResizablePanel>
        <ResizableHandle withHandle={o.withHandle} />
        <ResizablePanel
          panelRef={right}
          defaultSize={24}
          minSize={px(o.min)}
          maxSize="38%"
          collapsible={o.collapsible}
          onCollapse={() => setRightOpen(false)}
          onExpand={() => setRightOpen(true)}
          className="bg-background/40"
        >
          <Inspector />
        </ResizablePanel>
      </ResizablePanelGroup>
      <div className={FOOT}>
        <Layout sizes={sizes} />
        <span className="min-w-0 truncate">{HINT}</span>
        {o.persist && (
          <span role="group" aria-label="工作区" className="ml-auto flex shrink-0 items-center gap-0.5 rounded-md border p-0.5">
            {WORKSPACES.map((w) => (
              <button
                key={w.id}
                type="button"
                aria-pressed={space === w.id}
                onClick={() => setSpace(w.id)}
                className="rounded-sm px-1.5 py-0.5 transition-colors duration-150 hover:text-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground"
              >
                {w.label}
              </button>
            ))}
          </span>
        )}
        <Button type="button" size="xs" variant="ghost" className={cn("shrink-0", !o.persist && "ml-auto")} onClick={() => group.current?.reset()}>
          <RotateCcwIcon />
          复位
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 两栏 (方向可切)

function Pane({ title, children, className }: { title: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-full min-w-0 flex-col", className)}>
      <div className="flex h-9 shrink-0 items-center border-b px-3 text-xs font-medium text-muted-foreground">{title}</div>
      <div className="min-h-0 flex-1 overflow-auto p-3 text-sm leading-6">{children}</div>
    </div>
  );
}

const MARKDOWN = `# 发版说明 2.7.0\n\n- 新增 VirtualList: 不定高, 反向聊天, 定位\n- 新增 Resizable: 三栏拖宽并记住\n- Tree 展开动画可调`;

const LOCKED_LAYOUT = [50, 50];

function Basic({ o }: { o: Opts }) {
  const groupKey = `${o.direction}:${o.min}:${o.collapsible}:${o.persist}:${o.locked}`;
  const [group, sizes, setSizes] = useLayoutReadout(groupKey);
  const [rejected, setRejected] = React.useState(0);
  const vertical = o.direction === "vertical";
  return (
    <div className={CARD}>
      <ResizablePanelGroup
        key={groupKey}
        groupRef={group}
        direction={o.direction}
        // 锁定: 受控 layout 固定不变, onLayout 里不写回 = 拒绝, 组件回弹到 layout
        layout={o.locked ? LOCKED_LAYOUT : undefined}
        autoSaveId={o.persist && !o.locked ? `docs-basic-${o.direction}` : undefined}
        animation={anim(o)}
        onLayout={o.locked ? () => setRejected((n) => n + 1) : setSizes}
        className="min-h-0 flex-1"
      >
        <ResizablePanel defaultSize={50} minSize={px(o.min)} collapsible={o.collapsible}>
          <Pane title={vertical ? "上: 编辑" : "左: 编辑"}>
            <pre className="font-mono text-[13px] whitespace-pre-wrap text-foreground/90">{MARKDOWN}</pre>
          </Pane>
        </ResizablePanel>
        <ResizableHandle withHandle={o.withHandle} />
        <ResizablePanel defaultSize={50} minSize={px(o.min)} collapsible={o.collapsible} className="bg-background/40">
          <Pane title={vertical ? "下: 预览" : "右: 预览"}>
            <h3 className="mb-2 text-base font-semibold">发版说明 2.7.0</h3>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>新增 VirtualList: 不定高, 反向聊天, 定位</li>
              <li>新增 Resizable: 三栏拖宽并记住</li>
              <li>Tree 展开动画可调</li>
            </ul>
          </Pane>
        </ResizablePanel>
      </ResizablePanelGroup>
      <div className={FOOT}>
        <Layout sizes={sizes} />
        {o.locked ? (
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <LockIcon className="size-3 shrink-0" />
            受控且父组件拒绝修改: 松手后回弹{rejected > 0 && ` (已拒绝 ${rejected} 次)`}
          </span>
        ) : (
          <span className="truncate">{HINT}</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 四栏邮件 (级联推挤)

const FOLDERS = ["收件箱", "星标", "已发送", "草稿", "归档"];
const INBOX = [
  { f: "GitHub", s: "PR #142 已合并" },
  { f: "林晓", s: "设计稿第三版" },
  { f: "Vercel", s: "部署成功: hx-aioa-web" },
  { f: "周屿", s: "本周例会纪要" },
];

function Cascade({ o }: { o: Opts }) {
  const groupKey = `${o.min}:${o.collapsible}:${o.persist}`;
  const [group, sizes, setSizes] = useLayoutReadout(groupKey);
  return (
    <div className={CARD}>
      <ResizablePanelGroup key={groupKey} groupRef={group} autoSaveId={o.persist ? "docs-cascade-mail" : undefined} animation={anim(o)} onLayout={setSizes} className="min-h-0 flex-1">
        <ResizablePanel defaultSize={18} minSize="120px" collapsible={o.collapsible} className="bg-background/40">
          <Pane title="文件夹">
            <ul className="grid gap-0.5">
              {FOLDERS.map((f, i) => (
                <li key={f} className={cn("truncate rounded-md px-1.5 py-0.5", i === 0 ? "bg-accent text-accent-foreground ring-1 ring-border" : "text-foreground/80")}>
                  {f}
                </li>
              ))}
            </ul>
          </Pane>
        </ResizablePanel>
        <ResizableHandle withHandle={o.withHandle} />
        <ResizablePanel defaultSize={28} minSize={px(o.min)}>
          <Pane title="邮件">
            <ul className="grid gap-2">
              {INBOX.map((m) => (
                <li key={m.s} className="grid min-w-0">
                  <span className="truncate font-medium">{m.f}</span>
                  <span className="truncate text-xs text-muted-foreground">{m.s}</span>
                </li>
              ))}
            </ul>
          </Pane>
        </ResizablePanel>
        <ResizableHandle withHandle={o.withHandle} />
        <ResizablePanel defaultSize={34} minSize="200px">
          <Pane title="正文">
            <p className="text-muted-foreground">把右边的分隔线一路往左拖: 正文到最小宽度后接着推邮件列表, 列表也到最小后, 可折叠的文件夹栏被推过一半就吸附折叠。拖回去原样恢复。</p>
          </Pane>
        </ResizablePanel>
        <ResizableHandle withHandle={o.withHandle} />
        <ResizablePanel defaultSize={20} minSize="140px" collapsible={o.collapsible} className="bg-background/40">
          <Pane title="联系人">
            <p className="text-muted-foreground">林晓 · 周屿 · 陈默</p>
          </Pane>
        </ResizablePanel>
      </ResizablePanelGroup>
      <div className={FOOT}>
        <Layout sizes={sizes} />
        <span className="truncate">推到最小值会接着推下一栏 (像 VS Code), 可折叠的栏最后吸附折叠</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 嵌套 IDE

const FILES = ["src/components/ui/resizable.tsx", "src/components/ui/resizable-model.ts", "src/components/ui/virtual-list.tsx", "site/src/docs/entries/resizable.ts"];
const LOG = ["$ npx tsc -b", "✓ 0 errors", "$ npm run check", "✓ budgets  ✓ use client  ✓ components", "$ npx vite --port 5202", "  ➜  Local:   http://127.0.0.1:5202/"];

function Ide({ o }: { o: Opts }) {
  const groupKey = `${o.min}:${o.collapsible}:${o.persist}`;
  const [outerRef, outer, setOuter] = useLayoutReadout(groupKey);
  const [innerRef, inner, setInner] = useLayoutReadout(groupKey);
  return (
    <div className={CARD}>
      <ResizablePanelGroup key={groupKey} groupRef={outerRef} direction="horizontal" autoSaveId={o.persist ? "docs-ide-outer" : undefined} animation={anim(o)} onLayout={setOuter} className="min-h-0 flex-1">
        <ResizablePanel defaultSize={24} minSize={px(Math.min(o.min, 200))} maxSize="45%" collapsible={o.collapsible} className="bg-background/40">
          <Pane title="资源管理器">
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <FolderIcon className="size-4 text-warning" />
              next
            </p>
            <ul className="mt-1 grid gap-0.5">
              {FILES.map((f, i) => (
                <li key={f} className={cn("flex items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-[13px]", i === 0 ? "bg-accent text-accent-foreground ring-1 ring-border" : "text-foreground/80")}>
                  <FileCodeIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{f.slice(f.lastIndexOf("/") + 1)}</span>
                </li>
              ))}
            </ul>
          </Pane>
        </ResizablePanel>
        <ResizableHandle withHandle={o.withHandle} />
        <ResizablePanel minSize="280px">
          <ResizablePanelGroup groupRef={innerRef} direction="vertical" autoSaveId={o.persist ? "docs-ide-inner" : undefined} animation={anim(o)} onLayout={setInner}>
            <ResizablePanel defaultSize={68} minSize="120px">
              <Pane title="resizable.tsx">
                <pre className="font-mono text-[12px] leading-5 whitespace-pre text-foreground/85">{`<ResizablePanelGroup direction="horizontal" autoSaveId="aioa">\n  <ResizablePanel defaultSize={24} minSize="220px" collapsible>\n    <ChatList />\n  </ResizablePanel>\n  <ResizableHandle withHandle />\n  <ResizablePanel minSize="360px">\n    <Conversation />\n  </ResizablePanel>\n</ResizablePanelGroup>`}</pre>
              </Pane>
            </ResizablePanel>
            <ResizableHandle withHandle={o.withHandle} />
            <ResizablePanel defaultSize={32} minSize="72px" collapsible={o.collapsible} className="bg-background/40">
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex h-9 shrink-0 items-center gap-1.5 border-b px-3 text-xs font-medium text-muted-foreground">
                  <TerminalIcon className="size-3.5" />
                  终端
                </div>
                <pre className="min-h-0 flex-1 overflow-auto p-3 font-mono text-[12px] leading-5 text-muted-foreground">{LOG.join("\n")}</pre>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
      <div className={FOOT}>
        <Layout sizes={outer} />
        <span>竖直</span>
        <Layout sizes={inner} />
        <span className="truncate">外层左右, 编辑区内上下, 各自记住</span>
      </div>
    </div>
  );
}

export default function ResizableDemo({ values }: DemoProps) {
  const o: Opts = {
    direction: values.direction === "vertical" ? "vertical" : "horizontal",
    min: Number(values.minSize),
    collapsible: Boolean(values.collapsible),
    withHandle: Boolean(values.withHandle),
    persist: Boolean(values.persist),
    animation: Number(values.animation ?? 200),
    locked: Boolean(values.locked),
  };
  if (values.example === "basic") return <Basic o={o} />;
  if (values.example === "ide") return <Ide o={o} />;
  if (values.example === "cascade") return <Cascade o={o} />;
  return <Aioa o={o} />;
}
