import * as React from "react";
import {
  AlarmClockIcon,
  BotIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  CodeIcon,
  FlameIcon,
  GlobeIcon,
  InboxIcon,
  LayoutGridIcon,
  MailIcon,
  NewspaperIcon,
  PaletteIcon,
  RocketIcon,
  ShieldIcon,
  SparklesIcon,
  UserRoundIcon,
} from "lucide-react";
import { Chip, ChipGroup, type ChipGroupAnimation, type ChipGroupSize, type ChipGroupVariant, type ChipZeroCount } from "@/components/ui/chip-group";
import { cn } from "@/lib/utils";
import type { DemoProps } from "../types";

/** 演示卡片: 宽度可调 (调窄就能看到横向滚动和两端渐隐) */
const CARD = "rounded-2xl border bg-background/85 shadow-float backdrop-blur";

type Opts = {
  multiple: boolean;
  size: ChipGroupSize;
  variant: ChipGroupVariant;
  animation: ChipGroupAnimation;
  duration: number;
  fade: boolean;
  scrollButtons: boolean;
  counts: boolean;
  icons: boolean;
  zeroCount: ChipZeroCount;
  all: boolean;
};

/** 单选 / 多选共用的状态: 单选存一个值, 多选存数组; 切换模式时互相换算 */
function useSelection(initial: string[], multiple: boolean) {
  const [list, setList] = React.useState<string[]>(initial);
  const bind = multiple
    ? ({ type: "multiple" as const, value: list, onValueChange: setList })
    : ({ type: "single" as const, value: list[0] ?? null, onValueChange: (v: string, { all }: { all: boolean }) => setList(all ? [] : [v]) });
  return { list: multiple ? list : list.slice(0, 1), bind };
}

const groupProps = (o: Opts) => ({
  size: o.size,
  variant: o.variant,
  animation: o.animation,
  duration: o.duration,
  fade: o.fade,
  scrollButtons: o.scrollButtons,
  zeroCount: o.zeroCount,
});

// ---------------- 邮件厂商筛选 (HX-AIOA MailView) ----------------

const MAILS = [
  { id: 1, box: "gmail", from: "GitHub", subject: "[HX-UI] PR #66 筛选标签 ChipGroup 已合并", time: "10:24", unread: true },
  { id: 2, box: "gmail", from: "Vercel", subject: "部署成功：hx-ui-docs (production)", time: "09:58", unread: true },
  { id: 3, box: "outlook", from: "教务处", subject: "关于 2026 年寒假放假安排的通知", time: "09:12", unread: false },
  { id: 4, box: "gmail", from: "Linear", subject: "你被分配了 3 个新的 issue", time: "昨天", unread: false },
  { id: 5, box: "icloud", from: "Apple", subject: "你的 iCloud 储存空间即将用完", time: "昨天", unread: false },
  { id: 6, box: "outlook", from: "导师", subject: "Re: 周报 第 12 周", time: "周三", unread: true },
];

const BOXES = [
  { value: "gmail", label: "Gmail", count: 12, icon: <MailIcon /> },
  { value: "outlook", label: "Outlook", count: 3, icon: <InboxIcon /> },
  { value: "icloud", label: "iCloud", count: 2, icon: <CircleDotIcon /> },
  { value: "qq", label: "QQ 邮箱", count: 0, icon: <MailIcon /> },
  { value: "163", label: "网易 163", count: 0, icon: <MailIcon /> },
  { value: "company", label: "企业邮箱", count: 7, icon: <ShieldIcon /> },
];

function Mail(o: Opts) {
  const { list, bind } = useSelection([], o.multiple);
  const shown = MAILS.filter((m) => !list.length || list.includes(m.box));
  return (
    <div className={cn(CARD, "w-full overflow-hidden")}>
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <p className="font-medium">收件箱</p>
        <span className="text-xs text-muted-foreground tabular">{shown.length} 封</span>
      </div>
      <ChipGroup aria-label="按邮箱筛选" className="px-2.5" {...groupProps(o)} {...bind} all={o.all} allCount={o.counts ? 24 : undefined}>
        {BOXES.map((b) => (
          <Chip key={b.value} value={b.value} count={o.counts ? b.count : undefined} icon={o.icons ? b.icon : undefined}>
            {b.label}
          </Chip>
        ))}
      </ChipGroup>
      <ul className="mt-1.5 min-h-[228px] divide-y border-t">
        {shown.length ? (
          shown.slice(0, 4).map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className={cn("size-1.5 shrink-0 rounded-full", m.unread ? "bg-brand" : "bg-transparent")} />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-[13px]", m.unread ? "font-medium" : "text-muted-foreground")}>{m.from}</p>
                <p className="truncate text-xs text-muted-foreground">{m.subject}</p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground tabular">{m.time}</span>
            </li>
          ))
        ) : (
          <li className="px-4 py-8 text-center text-[13px] text-muted-foreground">这个邮箱里没有邮件</li>
        )}
      </ul>
    </div>
  );
}

// ---------------- 信息流类别 (HX-AIOA FeedView) ----------------

const TOPICS = [
  { value: "hot", label: "热门", count: 128, icon: <FlameIcon /> },
  { value: "ai", label: "AI", count: 64, icon: <SparklesIcon /> },
  { value: "frontend", label: "前端", count: 41, icon: <CodeIcon /> },
  { value: "design", label: "设计", count: 18, icon: <PaletteIcon /> },
  { value: "agent", label: "Agent", count: 23, icon: <BotIcon /> },
  { value: "oss", label: "开源", count: 37, icon: <GlobeIcon /> },
  { value: "security", label: "安全", count: 0, icon: <ShieldIcon /> },
  { value: "launch", label: "新产品", count: 9, icon: <RocketIcon /> },
  { value: "news", label: "资讯", count: 1204, icon: <NewspaperIcon /> },
];

const POSTS = [
  { topic: "ai", title: "长上下文 Agent 的记忆压缩实践", meta: "AI · 12 分钟前 · 2.3k 阅读" },
  { topic: "frontend", title: "React 19 的 Actions 在表单里怎么用", meta: "前端 · 35 分钟前" },
  { topic: "hot", title: "Tailwind v4.3 发布：@utility 更好用了", meta: "热门 · 1 小时前 · 8.1k 阅读" },
  { topic: "agent", title: "用 MCP 把邮件、待办接进群聊 Agent", meta: "Agent · 2 小时前" },
  { topic: "design", title: "深色界面里的层级：只用 1px 线和明度", meta: "设计 · 3 小时前" },
  { topic: "oss", title: "HX-UI 2.7 路线图：Item / Empty / ChipGroup", meta: "开源 · 今天" },
  { topic: "ai", title: "小模型做意图路由，延迟降到 80ms", meta: "AI · 今天" },
  { topic: "launch", title: "一个把网盘变成知识库的新产品", meta: "新产品 · 昨天" },
  { topic: "news", title: "本周开发者资讯合集", meta: "资讯 · 昨天" },
];

function Feed(o: Opts) {
  const { list, bind } = useSelection(o.multiple ? ["ai", "frontend"] : ["ai"], o.multiple);
  const names = TOPICS.filter((t) => list.includes(t.value)).map((t) => t.label);
  const posts = POSTS.filter((p) => !list.length || list.includes(p.topic));
  return (
    <div className={cn(CARD, "w-full p-3")}>
      <div className="flex items-center gap-2 px-1 pb-2.5">
        <LayoutGridIcon aria-hidden className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">信息流</p>
        <span className="ml-auto truncate text-xs text-muted-foreground">{names.length ? names.join(" · ") : "全部类别"}</span>
      </div>
      <ChipGroup aria-label="信息流类别" {...groupProps(o)} {...bind} all={o.all}>
        {TOPICS.map((t) => (
          <Chip key={t.value} value={t.value} count={o.counts ? t.count : undefined} icon={o.icons ? t.icon : undefined}>
            {t.label}
          </Chip>
        ))}
      </ChipGroup>
      <ul className="mt-2.5 grid min-h-[9.5rem] content-start gap-1.5">
        {posts.slice(0, 3).map((p) => (
          <li key={p.title} className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand-soft text-brand [&_svg]:size-3.5">{TOPICS.find((t) => t.value === p.topic)?.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{p.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">{p.meta}</p>
            </div>
          </li>
        ))}
        {!posts.length && <li className="py-8 text-center text-[13px] text-muted-foreground">这个类别今天还没有新内容</li>}
      </ul>
    </div>
  );
}

// ---------------- 待办筛选 (HX-AIOA TodoBoard) ----------------

const TODO_FILTERS = [
  { value: "today", label: "今天", count: 5, icon: <CalendarDaysIcon /> },
  { value: "overdue", label: "已逾期", count: 2, icon: <AlarmClockIcon /> },
  { value: "mine", label: "指派给我", count: 8, icon: <UserRoundIcon /> },
  { value: "agent", label: "Agent 处理中", count: 3, icon: <BotIcon /> },
  { value: "done", label: "已完成", count: 0, icon: <CheckCircle2Icon /> },
];

function Todo(o: Opts) {
  const { list, bind } = useSelection(["today"], o.multiple);
  return (
    <div className={cn(CARD, "w-full p-3")}>
      <div className="flex items-baseline justify-between px-1 pb-2.5">
        <p className="text-sm font-medium">待办</p>
        <span className="text-xs text-muted-foreground">{list.length ? `${list.length} 个筛选` : "全部"}</span>
      </div>
      <ChipGroup aria-label="待办筛选" {...groupProps(o)} {...bind} all={o.all} allCount={o.counts ? 18 : undefined}>
        {TODO_FILTERS.map((t) => (
          <Chip key={t.value} value={t.value} count={o.counts ? t.count : undefined} icon={o.icons ? t.icon : undefined} className={t.value === "overdue" ? "[&_[data-slot=chip-icon]]:text-destructive" : undefined}>
            {t.label}
          </Chip>
        ))}
      </ChipGroup>
      <ul className="mt-2.5 grid gap-1.5">
        {["整理 #66 的验收截图", "回复导师的周报意见", "给 Composer 接上 MentionInput"].map((t, i) => (
          <li key={t} className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px]">
            <span className={cn("size-3.5 shrink-0 rounded-full border", i === 0 && "border-destructive")} />
            <span className="truncate">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const EXAMPLES: Record<string, (o: Opts) => React.ReactElement> = { mail: Mail, feed: Feed, todo: Todo };

export default function ChipGroupDemo({ values }: DemoProps) {
  const o: Opts = {
    multiple: values.type === "multiple",
    size: values.size as ChipGroupSize,
    variant: values.variant as ChipGroupVariant,
    animation: values.animation as ChipGroupAnimation,
    duration: Number(values.duration),
    fade: Boolean(values.fade),
    scrollButtons: Boolean(values.scrollButtons),
    counts: Boolean(values.counts),
    icons: Boolean(values.icons),
    zeroCount: values.zeroCount as ChipZeroCount,
    all: Boolean(values.all),
  };
  const Example = EXAMPLES[String(values.example)] ?? Mail;
  // 切换单选 / 多选时重挂, 各自从示例的初始选中开始
  return (
    <div className="w-full" style={{ maxWidth: Number(values.width) }}>
      <Example key={`${values.example}:${values.type}`} {...o} />
    </div>
  );
}
