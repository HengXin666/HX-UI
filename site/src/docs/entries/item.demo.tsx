import * as React from "react";
import {
  BellIcon,
  BotIcon,
  MessageSquarePlusIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileArchiveIcon,
  FileTextIcon,
  FolderIcon,
  ImageIcon,
  InfoIcon,
  MoreHorizontalIcon,
  PaletteIcon,
  PinIcon,
  Share2Icon,
  ShieldCheckIcon,
  StarIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemMeta,
  ItemSeparator,
  ItemTitle,
  ItemTrigger,
  type ItemHighlight,
  type ItemHighlightEasing,
  type ItemSize,
  type ItemVariant,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";
import type { DemoProps } from "../types";

/** 演示外框: 与 Tree 文档的面板一致 (实心面板, 1px 边, 浮起阴影), 列表区固定高度框内滚动 */
const CARD = "w-full max-w-md rounded-xl border bg-popover text-popover-foreground shadow-float";
const HEAD = "flex items-center gap-2 border-b px-3.5 py-2.5";
const LIST = "max-h-[22rem] overflow-y-auto overscroll-contain p-1.5";
const NOTE = "border-t px-3.5 py-2 text-xs text-muted-foreground";
/** 头像底色轮换: 只用图表色 token */
const TINTS = ["bg-chart-1/20 text-chart-1", "bg-chart-2/20 text-chart-2", "bg-chart-3/20 text-chart-3", "bg-chart-4/20 text-chart-4", "bg-chart-5/20 text-chart-5"];
/** Avatar 尺寸与行尺寸同档 */
const AVATAR: Record<ItemSize, "sm" | "default" | "lg"> = { sm: "sm", default: "default", lg: "lg" };

type Common = {
  size: ItemSize;
  variant: ItemVariant;
  highlight: ItemHighlight;
  easing: ItemHighlightEasing;
  duration: number;
  reveal: "always" | "hover" | "swap";
  roving: boolean;
  lines: 1 | 2;
  separators: boolean;
  onEvent?: (msg: string) => void;
};

function Panel({ title, count, action, note, children }: { title: string; count?: React.ReactNode; action?: React.ReactNode; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={CARD}>
      <div className={HEAD}>
        <span className="text-sm font-medium">{title}</span>
        {count != null && <span className="ml-auto text-xs text-muted-foreground tabular">{count}</span>}
        {action}
      </div>
      <div className={LIST}>{children}</div>
      {note != null && <p className={NOTE}>{note}</p>}
    </div>
  );
}

/** 组的公共参数 */
const groupProps = (p: Common) => ({ size: p.size, variant: p.variant, highlight: p.highlight, highlightEasing: p.easing, highlightDuration: p.duration, roving: p.roving });

/** 尾部图标按钮 (浮在 ItemTrigger 铺满整行的点击区之上) */
function Act({ label, onEvent, children }: { label: string; onEvent?: (msg: string) => void; children: React.ReactNode }) {
  return (
    <Button
      type="button"
      size="icon-xs"
      variant="ghost"
      aria-label={label}
      title={label}
      className="text-muted-foreground hover:text-foreground"
      onClick={() => onEvent?.(label)}
    >
      {children}
    </Button>
  );
}

/* ---------- 会话列表 (HX-AIOA ChatList) ---------- */

type Chat = { id: string; name: string; last: string; time: string; unread?: number; online?: boolean; bot?: boolean };
const CHATS: Chat[] = [
  { id: "c1", name: "林晓", last: "好的，评审会改到周四下午三点，我把会议链接发群里了", time: "21:04", unread: 2, online: true },
  { id: "c2", name: "产品周会 · 9 人", last: "周屿：新版会话列表的截断规则统一一下？", time: "20:31", unread: 12 },
  { id: "c3", name: "部署机器人", last: "✅ hx-aioa@main 已部署到 production (2m 14s)", time: "19:58", bot: true },
  { id: "c4", name: "陈默", last: "图标我重新导了一版 1.5px 描边的", time: "昨天", online: true },
  { id: "c5", name: "HX-UI 维护组", last: "Item / Empty / CopyField 三个组件的文档已上线，欢迎试用并反馈问题", time: "周三" },
  { id: "c6", name: "周屿", last: "收到", time: "周二" },
  { id: "c7", name: "邮件助手", last: "你有 3 封来自 GitHub 的通知待处理", time: "11/20", bot: true },
];

/** 模拟来消息: 依次有这些会话收到新消息, 顶到最前 (测试行重排时高亮与 Tab 位) */
const INCOMING = [
  { id: "c8", name: "运维值班", last: "⚠️ hx-mail 队列积压 1.2k，已自动扩容到 4 个 worker", bot: true },
  { id: "c6", name: "周屿", last: "顺便看下 Empty 的浅色主题？" },
  { id: "c9", name: "Gmail 同步", last: "新增 5 封邮件，已按规则分拣", bot: true },
];

function Chats(p: Common) {
  const [current, setCurrent] = React.useState("c1");
  const [chats, setChats] = React.useState<Chat[]>(CHATS);
  const [step, setStep] = React.useState(0);
  const incoming = () => {
    const msg = INCOMING[step % INCOMING.length];
    setStep((n) => n + 1);
    setChats((list) => {
      const prev = list.find((c) => c.id === msg.id);
      const rest = list.filter((c) => c.id !== msg.id);
      return [{ ...prev, ...msg, time: "刚刚", unread: (prev?.unread ?? 0) + 1 }, ...rest];
    });
    p.onEvent?.(`${msg.name}：${msg.last}`);
  };
  const remove = (id: string) => {
    setChats((list) => list.filter((c) => c.id !== id));
    p.onEvent?.("已删除会话");
  };
  return (
    <Panel
      title="消息"
      count={`${chats.length} 个会话`}
      action={
        <Button type="button" size="xs" variant="ghost" className="text-muted-foreground" onClick={incoming}>
          <MessageSquarePlusIcon />来消息
        </Button>
      }
      note={p.highlight === "slide" ? "选中底色滑到新行；点“来消息”把会话顶到最前，滚动中或重排后底色仍贴着选中行。" : "悬停行查看操作；触屏设备上操作常显。"}
    >
      <ItemGroup aria-label="会话" {...groupProps(p)}>
        {chats.map((c, i) => (
          <React.Fragment key={c.id}>
            {p.separators && i > 0 && <ItemSeparator inset />}
            <Item active={current === c.id}>
              <ItemMedia>
                <Avatar size={AVATAR[p.size]}>
                  <AvatarFallback className={cn("font-medium", TINTS[c.name.charCodeAt(0) % TINTS.length])}>{c.bot ? <BotIcon className="size-4" /> : c.name.slice(0, 1)}</AvatarFallback>
                  {c.online && <AvatarBadge aria-label="在线" className="bg-success" />}
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle><ItemTrigger onClick={() => setCurrent(c.id)}>{c.name}</ItemTrigger></ItemTitle>
                {p.size !== "sm" && <ItemDescription lines={p.lines}>{c.last}</ItemDescription>}
              </ItemContent>
              <ItemMeta>
                <span>{c.time}</span>
                {c.unread ? <span className="min-w-4 rounded-full bg-brand px-1 text-center text-[10px] leading-4 font-medium text-brand-foreground">{c.unread > 9 ? "9+" : c.unread}</span> : null}
              </ItemMeta>
              <ItemActions reveal={p.reveal}>
                <Act label="置顶" onEvent={p.onEvent}><PinIcon /></Act>
                <Act label="删除会话" onEvent={() => remove(c.id)}><Trash2Icon /></Act>
              </ItemActions>
            </Item>
          </React.Fragment>
        ))}
      </ItemGroup>
    </Panel>
  );
}

/* ---------- 邮件列表 (MailView) ---------- */

const MAILS = [
  { id: "m1", from: "GitHub", subject: "[HengXin666/HX-UI] feat: 列表行组件 Item (#58)", snippet: "HengXin666 opened this issue: HX-AIOA Web 端对齐安卓时，会话列表、邮件列表、收藏都是同一种列表行……", time: "21:10", unread: true, star: true },
  { id: "m2", from: "Cloudflare", subject: "Your invoice for November is available", snippet: "Hi, your monthly invoice is ready. Total due: $5.00. View it in the dashboard.", time: "18:42", unread: true },
  { id: "m3", from: "林晓", subject: "Re: 评审会时间调整", snippet: "可以，周四下午三点我这边没问题。会议室我订好了，链接稍后发。", time: "15:03" },
  { id: "m4", from: "npm", subject: "Successfully published @hx/ui@2.6.1", snippet: "The package @hx/ui@2.6.1 has been published to the registry.", time: "昨天", star: true },
  { id: "m5", from: "Vercel", subject: "Deployment ready: hx-docs", snippet: "Your deployment for hx-docs is ready. Visit the preview URL to see your changes.", time: "周一" },
];

function Mails(p: Common) {
  const [current, setCurrent] = React.useState("m1");
  const [stars, setStars] = React.useState(() => new Set(MAILS.filter((m) => m.star).map((m) => m.id)));
  return (
    <Panel title="收件箱" count={`${MAILS.filter((m) => m.unread).length} 封未读`} note="副标题最多两行；未读加粗，星标常显在时间下方。">
      <ItemGroup aria-label="邮件" {...groupProps(p)}>
        {MAILS.map((m, i) => (
          <React.Fragment key={m.id}>
            {p.separators && i > 0 && <ItemSeparator />}
            <Item active={current === m.id} className="items-start">
                <ItemMedia className="pt-0.5">
                  <Avatar size={AVATAR[p.size]}>
                    <AvatarFallback className={cn("text-xs font-medium", TINTS[(i + 2) % TINTS.length])}>{m.from.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className={cn(!m.unread && "font-normal text-muted-foreground")}>
                    <ItemTrigger onClick={() => setCurrent(m.id)}>
                      {m.unread && <span aria-label="未读" className="mr-1.5 inline-block size-1.5 -translate-y-0.5 rounded-full bg-brand" />}
                      {m.from}
                    </ItemTrigger>
                  </ItemTitle>
                  <ItemDescription lines={1} className={cn("text-foreground", !m.unread && "text-muted-foreground")}>{m.subject}</ItemDescription>
                  {p.size !== "sm" && <ItemDescription lines={p.lines}>{m.snippet}</ItemDescription>}
                </ItemContent>
                <ItemMeta className="justify-start pt-0.5">
                  <span>{m.time}</span>
                  {stars.has(m.id) && <StarIcon aria-label="已加星标" className="size-3.5 fill-warning text-warning" />}
                </ItemMeta>
                <ItemActions reveal={p.reveal} className="self-center">
                  <Act
                    label={stars.has(m.id) ? "取消星标" : "加星标"}
                    onEvent={() =>
                      setStars((s) => {
                        const next = new Set(s);
                        if (!next.delete(m.id)) next.add(m.id);
                        return next;
                      })
                    }
                  >
                    <StarIcon />
                  </Act>
                  <Act label="删除" onEvent={p.onEvent}><Trash2Icon /></Act>
                </ItemActions>
            </Item>
          </React.Fragment>
        ))}
      </ItemGroup>
    </Panel>
  );
}

/* ---------- "我的" 页导航 (ui/me) ---------- */

const NAV = [
  { id: "profile", icon: <UserIcon />, title: "个人资料", desc: "头像、昵称与签名" },
  { id: "notify", icon: <BellIcon />, title: "通知", desc: "邮件、消息与待办提醒", badge: "3" },
  { id: "security", icon: <ShieldCheckIcon />, title: "账号与安全", desc: "密码、两步验证、登录设备" },
  { id: "theme", icon: <PaletteIcon />, title: "外观", desc: "深色 / 浅色 / 跟随系统" },
  { id: "about", icon: <InfoIcon />, title: "关于", desc: "版本 2.6.1" },
];

function Nav(p: Common) {
  const [current, setCurrent] = React.useState("security");
  return (
    <Panel title="我的" note="行是 <a> 链接 (asChild)；roving 打开后整组只占一个 Tab 位，↑ ↓ Home End 移动焦点。">
      <ItemGroup aria-label="设置" {...groupProps(p)}>
        {NAV.map((n, i) => (
          <React.Fragment key={n.id}>
            {p.separators && i > 0 && <ItemSeparator inset />}
            <Item asChild active={current === n.id}>
              <a
                href={`#me/${n.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrent(n.id);
                }}
              >
                <ItemMedia variant="icon">{n.icon}</ItemMedia>
                <ItemContent>
                  <ItemTitle>{n.title}</ItemTitle>
                  {p.size !== "sm" && <ItemDescription>{n.desc}</ItemDescription>}
                </ItemContent>
                <ItemMeta className="flex-row items-center gap-1.5">
                  {n.badge && <Badge variant="secondary" className="h-4 px-1.5 text-[10px] tabular">{n.badge}</Badge>}
                  <ChevronRightIcon aria-hidden className="size-4 text-muted-foreground/70" />
                </ItemMeta>
              </a>
            </Item>
          </React.Fragment>
        ))}
      </ItemGroup>
    </Panel>
  );
}

/* ---------- 网盘 / 收藏 ---------- */

const FILES = [
  { id: "f1", icon: <FolderIcon className="text-warning" />, name: "设计稿", meta: "12 项", time: "今天" },
  { id: "f2", icon: <ImageIcon className="text-chart-2" />, name: "会话列表-深色-最终版-v3-确认稿.png", meta: "2.4 MB", time: "今天" },
  { id: "f3", icon: <FileTextIcon className="text-info" />, name: "HX-AIOA Web 端对齐安卓需求.md", meta: "18 KB", time: "昨天" },
  { id: "f4", icon: <FileArchiveIcon className="text-chart-4" />, name: "hx-ui-2.6.1.tgz", meta: "1.1 MB", time: "11/20" },
  { id: "f5", icon: <ImageIcon className="text-chart-2" />, name: "avatar@2x.png", meta: "86 KB", time: "11/18" },
];

function Files(p: Common) {
  const [current, setCurrent] = React.useState("f2");
  return (
    <Panel title="我的网盘" count={`${FILES.length} 项`} note="长文件名在中间列截断；尾部操作悬停或键盘聚焦到行内时出现。">
      <ItemGroup aria-label="文件" {...groupProps(p)}>
        {FILES.map((f, i) => (
          <React.Fragment key={f.id}>
            {p.separators && i > 0 && <ItemSeparator inset />}
            <Item active={current === f.id}>
                <ItemMedia variant="icon" className="bg-background">{f.icon}</ItemMedia>
                <ItemContent>
                  <ItemTitle className="font-normal">
                    <ItemTrigger onClick={() => setCurrent(f.id)} onDoubleClick={() => p.onEvent?.(`打开 ${f.name}`)}>{f.name}</ItemTrigger>
                  </ItemTitle>
                  {p.size !== "sm" && <ItemDescription>{f.meta} · {f.time}</ItemDescription>}
                </ItemContent>
                <ItemActions reveal={p.reveal}>
                  <Act label="下载" onEvent={p.onEvent}><DownloadIcon /></Act>
                  <Act label="分享" onEvent={p.onEvent}><Share2Icon /></Act>
                  <Act label="更多" onEvent={p.onEvent}><MoreHorizontalIcon /></Act>
                </ItemActions>
            </Item>
          </React.Fragment>
        ))}
      </ItemGroup>
    </Panel>
  );
}

/* ---------- Agent 列表 (纯展示 + 选中) ---------- */

const AGENTS = [
  { id: "a1", name: "代码评审", desc: "读 PR diff，按仓库规则给出行内建议", state: "running" as const, runs: 128 },
  { id: "a2", name: "邮件分拣", desc: "把通知类邮件归档，重要邮件置顶并摘要", state: "idle" as const, runs: 54 },
  { id: "a3", name: "日报助手", desc: "每天 18:00 汇总提交、Issue 与会议纪要", state: "running" as const, runs: 31 },
  { id: "a4", name: "部署守卫", desc: "部署失败时自动回滚并在群里报告原因", state: "error" as const, runs: 7 },
];
const STATE = {
  running: { dot: "success" as const, label: "运行中" },
  idle: { dot: "muted" as const, label: "空闲" },
  error: { dot: "destructive" as const, label: "异常" },
};

function Agents(p: Common) {
  const [current, setCurrent] = React.useState("a1");
  return (
    <Panel title="Agent" count={`${AGENTS.filter((a) => a.state === "running").length} 个运行中`} note="点行选中；时间 / 状态在 ItemMeta 里常显。">
      <ItemGroup aria-label="Agent" {...groupProps(p)}>
        {AGENTS.map((a, i) => (
          <React.Fragment key={a.id}>
            {p.separators && i > 0 && <ItemSeparator inset />}
            <Item active={current === a.id}>
                <ItemMedia>
                  <Avatar size={AVATAR[p.size]} className="rounded-md">
                    <AvatarFallback className={cn("rounded-md", TINTS[(i + 1) % TINTS.length])}><BotIcon className="size-4" /></AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle><ItemTrigger onClick={() => setCurrent(a.id)}>{a.name}</ItemTrigger></ItemTitle>
                  {p.size !== "sm" && <ItemDescription lines={p.lines}>{a.desc}</ItemDescription>}
                </ItemContent>
                <ItemMeta>
                  <Badge variant="outline" dot={STATE[a.state].dot} live={a.state === "running"} className="h-5 text-[11px]">{STATE[a.state].label}</Badge>
                  {p.size !== "sm" && <span>{a.runs} 次</span>}
                </ItemMeta>
                <ItemActions reveal={p.reveal}>
                  <Act label="设置" onEvent={p.onEvent}><MoreHorizontalIcon /></Act>
                </ItemActions>
            </Item>
          </React.Fragment>
        ))}
      </ItemGroup>
    </Panel>
  );
}

const EASING: Record<string, ItemHighlightEasing> = { ease: "ease", spring: "spring", inout: "cubic-bezier(0.65, 0, 0.35, 1)" };
const EXAMPLES: Record<string, (p: Common) => React.ReactElement> = { chat: Chats, mail: Mails, nav: Nav, files: Files, agents: Agents };

export default function ItemDemo({ values, onEvent }: DemoProps) {
  const Example = EXAMPLES[String(values.example)] ?? Chats;
  const size = (["sm", "default", "lg"].includes(String(values.size)) ? values.size : "default") as ItemSize;
  const variant = (["default", "outline", "muted"].includes(String(values.variant)) ? values.variant : "default") as ItemVariant;
  return (
    <Example
      size={size}
      variant={variant}
      highlight={values.highlight === "slide" ? "slide" : "static"}
      easing={EASING[String(values.easing)] ?? "ease"}
      duration={Number(values.duration ?? 220)}
      reveal={values.reveal === "always" || values.reveal === "swap" ? values.reveal : "hover"}
      roving={Boolean(values.roving)}
      lines={Number(values.lines) === 2 ? 2 : 1}
      separators={Boolean(values.separators)}
      onEvent={onEvent}
    />
  );
}
