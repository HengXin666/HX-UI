import * as React from "react";
import { ArrowDownIcon, CornerDownLeftIcon, CrosshairIcon, ImageIcon, LoaderCircleIcon, PaperclipIcon, SendHorizontalIcon, StarIcon } from "lucide-react";
import { VirtualList, type VirtualListHandle, type VirtualRange } from "@/components/ui/virtual-list";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { DemoProps } from "../types";

/**
 * 三个真实场景: 1 万封的收件箱 (不定高, 定位并高亮), 反向的群聊 (新消息跟随 / "N 条新消息" / 向上加载更早 / 定位),
 * 放进 ScrollArea 的信息流 (列表上方有别的内容, 滚到底加载下一页).
 * 外框统一: 实心面板 + 1px 边, 顶栏 / 列表 / 底栏三段; 右上角实时显示 DOM 里的行数, 说明只渲染了视口附近.
 */
const CARD = "relative flex h-[32rem] w-full max-w-3xl flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-float";
const BAR = "flex shrink-0 items-center gap-2 border-b px-3 py-2";
const HIGHLIGHT_MS = 1600;
const TONES = [
  "bg-chart-1/20 text-chart-1",
  "bg-chart-2/20 text-chart-2",
  "bg-chart-3/20 text-chart-3",
  "bg-chart-4/20 text-chart-4",
  "bg-chart-5/20 text-chart-5",
];

type Opts = {
  overscan: number;
  estimate: number;
  reverse: boolean;
  follow: number;
  smooth: boolean;
  count: number;
  /** 聊天每页条数 (首页也是一页): 调小可以看到首页不满一屏时自动接着加载 */
  page: number;
};

/** 可复现的伪随机 (同一个 id 每次生成同样的内容) */
function rand(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, list: readonly T[]) => list[Math.floor(r() * list.length)];

/** 定位后短暂高亮 */
function useFlash() {
  const [key, setKey] = React.useState<string | number | null>(null);
  const timer = React.useRef(0);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const flash = React.useCallback((k: string | number) => {
    window.clearTimeout(timer.current);
    setKey(k);
    timer.current = window.setTimeout(() => setKey(null), HIGHLIGHT_MS);
  }, []);
  return [key, flash] as const;
}

/** 右上角的 "DOM 行数 / 总数": 自己持有状态, 区间变化不让整个演示重渲染 */
function useRangeStat() {
  const setter = React.useRef<(r: VirtualRange) => void>(() => {});
  const onRange = React.useCallback((r: VirtualRange) => setter.current(r), []);
  return { setter, onRange };
}
function Stat({ bind, total, unit }: { bind: React.RefObject<(r: VirtualRange) => void>; total: number; unit: string }) {
  const [r, setR] = React.useState<VirtualRange | null>(null);
  React.useLayoutEffect(() => {
    bind.current = setR;
  }, [bind]);
  const rows = r ? r.end - r.start : 0;
  return (
    <span className="ml-auto shrink-0 rounded-md border bg-background/60 px-2 py-0.5 text-[11px] text-muted-foreground tabular" title="当前挂在 DOM 里的行数 (含 overscan)">
      DOM {rows} 行 · 共 {total.toLocaleString()} {unit}
    </span>
  );
}

/** 高亮层: 定位到的那一行闪一下 (只动 opacity) */
function Flash({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      data-on={on ? "" : undefined}
      className="pointer-events-none absolute inset-0 rounded-[inherit] bg-brand-soft opacity-0 ring-1 ring-brand/60 ring-inset transition-opacity duration-200 data-on:opacity-100 motion-reduce:transition-none"
    />
  );
}

function JumpField({ label, defaultValue, onJump }: { label: string; defaultValue: string; onJump: (v: string) => void }) {
  const [v, setV] = React.useState(defaultValue);
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        onJump(v);
      }}
    >
      <Input aria-label={label} value={v} onChange={(e) => setV(e.target.value)} inputMode="numeric" className="h-7 w-20 px-2 text-xs tabular" />
      <Button type="submit" size="xs" variant="outline">
        <CrosshairIcon />
        定位
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------- 收件箱

const SENDERS = ["GitHub", "林晓", "阿里云", "周屿", "HX-AIOA", "陈默", "Cloudflare", "苏青", "招商银行", "Linear", "何川", "Vercel"];
const SUBJECTS = [
  "[HX-UI] PR #142 已合并: VirtualList 不定高测量",
  "本周项目例会纪要与待办",
  "您的服务器实例即将到期",
  "设计稿第三版, 请过目",
  "Agent 接入语已更新",
  "账单提醒: 11 月账单已出",
  "回复: 关于消息列表的性能问题",
  "部署成功: hx-aioa-web (production)",
  "邀请你加入 HX-Lab 工作区",
  "安全提醒: 新设备登录",
];
const PREVIEWS = [
  "好的, 收到。",
  "附件是本周的数据汇总, 群消息峰值时段的渲染耗时已经从 38ms 降到 4ms, 详细对比见第二页。",
  "下午三点在 3 号会议室, 议题: 三栏布局的拖宽与记忆, 移动端适配, 邮件列表虚拟化。如果时间冲突请提前说一声, 我们改到明天上午。",
  "构建 #2281 已完成, 用时 1 分 12 秒。",
  "你好, 我们注意到你的账号在一台新的 macOS 设备上登录。如果这是你本人的操作, 可以忽略这封邮件; 否则请尽快修改密码并开启两步验证。",
  "看了一下, 主要是全量渲染 DOM 导致的, 上千条时滚动掉帧明显。建议换成虚拟列表, 只渲染可见区间。",
];
const LABELS = [
  { t: "工作", c: "bg-chart-1/15 text-chart-1" },
  { t: "通知", c: "bg-chart-2/15 text-chart-2" },
  { t: "账单", c: "bg-chart-3/15 text-chart-3" },
  { t: "GitHub", c: "bg-chart-4/15 text-chart-4" },
];
const FILES = ["周报.pdf", "设计稿-v3.fig", "数据汇总.xlsx", "截图.png", "合同.docx"];

interface Mail {
  id: number;
  from: string;
  tone: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  starred: boolean;
  label?: (typeof LABELS)[number];
  files: string[];
}

function makeMail(id: number): Mail {
  const r = rand(id * 7 + 3);
  const from = pick(r, SENDERS);
  const day = Math.floor(id / 24);
  const time = day === 0 ? `${String(23 - (id % 24)).padStart(2, "0")}:${String(Math.floor(r() * 60)).padStart(2, "0")}` : day < 6 ? `${day} 天前` : `${(11 - Math.floor(day / 30) + 12) % 12 || 12}月${(day % 28) + 1}日`;
  return {
    id,
    from,
    tone: TONES[SENDERS.indexOf(from) % TONES.length],
    subject: pick(r, SUBJECTS),
    preview: pick(r, PREVIEWS),
    time,
    unread: r() < 0.22,
    starred: r() < 0.08,
    label: r() < 0.35 ? pick(r, LABELS) : undefined,
    files: r() < 0.16 ? FILES.slice(0, 1 + Math.floor(r() * 3)) : [],
  };
}

function MailRow({ mail, selected, flash, onSelect }: { mail: Mail; selected: boolean; flash: boolean; onSelect: (id: number) => void }) {
  return (
    <div className="px-1.5 pb-0.5">
      <button
        type="button"
        data-selected={selected ? "" : undefined}
        onClick={() => onSelect(mail.id)}
        className={cn(
          "relative flex w-full gap-3 rounded-lg px-3 py-2.5 text-left outline-none select-none",
          "transition-colors duration-150 not-data-selected:hover:bg-accent/60 focus-visible:ring-1 focus-visible:ring-ring",
          "data-selected:bg-accent data-selected:text-accent-foreground data-selected:ring-1 data-selected:ring-border",
        )}
      >
        <Flash on={flash} />
        <Avatar className="mt-0.5">
          <AvatarFallback className={cn("text-xs font-medium", mail.tone)}>{mail.from.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="flex min-w-0 items-center gap-2">
            {mail.unread && <span aria-label="未读" className="size-1.5 shrink-0 rounded-full bg-brand" />}
            <span className={cn("truncate text-sm", mail.unread ? "font-semibold text-foreground" : "text-foreground/80")}>{mail.from}</span>
            {mail.label && <span className={cn("shrink-0 rounded px-1.5 text-[10px] leading-4", mail.label.c)}>{mail.label.t}</span>}
            <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground tabular">
              {mail.starred && <StarIcon aria-label="星标" className="size-3 fill-warning text-warning" />}
              {mail.time}
            </span>
          </span>
          <span className={cn("truncate text-[13px]", mail.unread ? "font-medium text-foreground" : "text-foreground/80")}>
            <span className="text-muted-foreground tabular">#{mail.id + 1} </span>
            {mail.subject}
          </span>
          <span className="line-clamp-2 text-[13px] leading-5 text-muted-foreground">{mail.preview}</span>
          {mail.files.length > 0 && (
            <span className="mt-1 flex flex-wrap gap-1.5">
              {mail.files.map((f) => (
                <span key={f} className="inline-flex items-center gap-1 rounded-md border bg-background/60 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  <PaperclipIcon className="size-3" />
                  {f}
                </span>
              ))}
            </span>
          )}
        </span>
      </button>
    </div>
  );
}

function MailExample({ o, onEvent }: { o: Opts; onEvent?: (msg: string) => void }) {
  const mails = React.useMemo(() => Array.from({ length: o.count }, (_, i) => makeMail(i)), [o.count]);
  const [selected, setSelected] = React.useState(2);
  const [flashKey, flash] = useFlash();
  const list = React.useRef<VirtualListHandle>(null);
  const stat = useRangeStat();
  const behavior = o.smooth ? "smooth" : "auto";
  const renderItem = React.useCallback(
    (m: Mail) => <MailRow mail={m} selected={m.id === selected} flash={m.id === flashKey} onSelect={setSelected} />,
    [selected, flashKey],
  );
  const jump = (v: string) => {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n) || n < 1 || n > mails.length) return onEvent?.(`没有第 ${v} 封`);
    setSelected(n - 1);
    void list.current?.scrollToIndex(n - 1, { align: "center", behavior }).then((ok) => ok && flash(n - 1));
  };
  return (
    <div className={CARD}>
      <div className={BAR}>
        <span className="text-sm font-medium">收件箱</span>
        <span className="rounded-full bg-brand-soft px-1.5 text-[11px] leading-4 text-brand tabular">{mails.filter((m) => m.unread).length.toLocaleString()} 未读</span>
        <Stat bind={stat.setter} total={mails.length} unit="封" />
      </div>
      <VirtualList
        ref={list}
        aria-label="邮件"
        items={mails}
        getKey={(m) => m.id}
        renderItem={renderItem}
        estimateSize={o.estimate}
        overscan={o.overscan}
        reverse={o.reverse}
        followThreshold={o.follow}
        scrollBehavior={behavior}
        onRangeChange={stat.onRange}
        className="min-h-0 flex-1 pt-1.5"
        empty="收件箱是空的"
      />
      <div className={cn(BAR, "border-t border-b-0")}>
        <JumpField label="邮件序号" defaultValue={String(Math.min(o.count, 6180))} onJump={jump} />
        <Button type="button" size="xs" variant="ghost" onClick={() => void list.current?.scrollToTop({ behavior })}>顶部</Button>
        <Button type="button" size="xs" variant="ghost" onClick={() => void list.current?.scrollToBottom({ behavior })}>底部</Button>
        <span className="ml-auto truncate text-xs text-muted-foreground">行高不一: 附件行更高, 量过后按 key 缓存</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 群聊 (反向)

const MEMBERS = ["林晓", "周屿", "陈默", "苏青", "AIOA 助手"];
const LINES = [
  "收到 👌",
  "我看一下",
  "群消息上千条的时候滚动还卡吗?",
  "换成虚拟列表以后, DOM 里只剩二十几行, 滚动一直是 60 帧。",
  "向上翻到顶会自动加载更早的消息, 加载完位置不跳, 可以试试。",
  "设计稿说三栏都要能拖宽, 还要记住宽度, 刷新以后保持。",
  "今晚八点发版, 发版前大家把自己的分支合一下。",
  "我把 Conversation.tsx 里的全量渲染换掉了, 顺便把定位到某条消息也做了: 点引用会滚过去并高亮一下, 不在已加载范围里的会先补齐再定位。",
  "好",
  "👍",
];
const ME = "我";
const LOAD_MS = 650;
const AUTO_MS = 1400;

interface Msg {
  id: number;
  from: string;
  text: string;
  image: boolean;
  time: string;
}

function makeMsg(id: number, from?: string, text?: string): Msg {
  const r = rand(id * 13 + 1);
  const who = from ?? (r() < 0.25 ? ME : pick(r, MEMBERS));
  const minutes = 9 * 60 + id;
  return {
    id,
    from: who,
    text: text ?? pick(r, LINES),
    image: !text && r() < 0.07,
    time: `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
  };
}

function Bubble({ m, flash }: { m: Msg; flash: boolean }) {
  const mine = m.from === ME;
  return (
    <div className={cn("flex gap-2.5 px-4 py-1.5", mine && "flex-row-reverse")}>
      {!mine && (
        <Avatar size="sm" className="mt-5">
          <AvatarFallback className={cn("text-[10px] font-medium", TONES[MEMBERS.indexOf(m.from) % TONES.length])}>{m.from.slice(0, 1)}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn("flex max-w-[78%] min-w-0 flex-col gap-1", mine && "items-end")}>
        <span className="px-1 text-[11px] text-muted-foreground tabular">
          {mine ? "" : `${m.from} · `}
          {m.time} · #{m.id}
        </span>
        <div
          className={cn(
            "relative rounded-2xl px-3 py-2 text-sm leading-6 break-words",
            mine ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md border bg-background/70",
          )}
        >
          <Flash on={flash} />
          {m.image ? (
            <span className="grid h-36 w-56 max-w-full place-items-center rounded-lg bg-muted text-muted-foreground">
              <ImageIcon className="size-6" />
            </span>
          ) : (
            m.text
          )}
        </div>
      </div>
    </div>
  );
}

function ChatExample({ o, onEvent, inScrollArea = false }: { o: Opts; onEvent?: (msg: string) => void; inScrollArea?: boolean }) {
  const total = Math.max(o.page, o.count);
  /** 历史是 [first, total) 已加载, 之后到达的新消息 id 从 total 往上 */
  const [first, setFirst] = React.useState(total - o.page);
  const [live, setLive] = React.useState<Msg[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [unseen, setUnseen] = React.useState(0);
  const [atBottom, setAtBottom] = React.useState(true);
  const [auto, setAuto] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [flashKey, flash] = useFlash();
  const list = React.useRef<VirtualListHandle>(null);
  const stat = useRangeStat();
  const afterRender = React.useRef<(() => void) | null>(null);
  const behavior = o.smooth ? "smooth" : "auto";

  const items = React.useMemo(() => {
    const out: Msg[] = [];
    for (let id = first; id < total; id++) out.push(makeMsg(id));
    return out.concat(live);
  }, [first, total, live]);

  React.useEffect(() => {
    const run = afterRender.current;
    afterRender.current = null;
    run?.();
  }, [items]);

  const nextId = React.useRef(total);
  const receive = React.useCallback(() => {
    const id = nextId.current++;
    setLive((l) => [...l, makeMsg(id, MEMBERS[id % MEMBERS.length])]);
  }, []);

  React.useEffect(() => {
    if (!auto) return;
    const t = window.setInterval(receive, AUTO_MS);
    return () => window.clearInterval(t);
  }, [auto, receive]);

  // 返回 Promise: 列表在它结束前不会重复触发; 加载完仍在阈值内 (首页不满一屏) 会自动接着加载
  const loadOlder = React.useCallback(() => {
    if (first <= 0) return;
    setLoading(true);
    return new Promise<void>((done) =>
      window.setTimeout(() => {
        setFirst((f) => Math.max(0, f - o.page));
        setLoading(false);
        done();
      }, LOAD_MS),
    );
  }, [first, o.page]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const id = nextId.current++;
    setDraft("");
    // 自己发的消息: 不管在哪都滚到底
    afterRender.current = () => void list.current?.scrollToBottom({ behavior });
    setLive((l) => [...l, makeMsg(id, ME, text)]);
  };

  const jump = (v: string) => {
    const id = Math.round(Number(v.replace("#", "")));
    if (!Number.isFinite(id) || id < 0 || id >= nextId.current) return onEvent?.(`没有消息 #${v}`);
    const go = () => void list.current?.scrollToKey(id, { align: "center", behavior }).then((ok) => ok && flash(id));
    if (id >= first) return go();
    // 不在已加载范围: 先把它之前的几条也补上, 渲染后再定位
    afterRender.current = go;
    setFirst(Math.max(0, id - 10));
  };

  const renderItem = React.useCallback((m: Msg) => <Bubble m={m} flash={m.id === flashKey} />, [flashKey]);
  const showPill = !atBottom || unseen > 0;

  return (
    <div className={CARD}>
      <div className={BAR}>
        <span className="min-w-0 truncate text-sm font-medium">HX-AIOA 内测群</span>
        <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">128 人</span>
        <Stat bind={stat.setter} total={items.length} unit="条已加载" />
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <Scroller on={inScrollArea}>
        <VirtualList
          ref={list}
          scrollParent={inScrollArea ? "scroll-area" : "self"}
          role="log"
          aria-label="群消息"
          items={items}
          getKey={(m) => m.id}
          renderItem={renderItem}
          estimateSize={o.estimate}
          overscan={o.overscan}
          reverse={o.reverse}
          followThreshold={o.follow}
          scrollBehavior={behavior}
          onStartReached={loadOlder}
          onUnseenChange={setUnseen}
          onAtBottomChange={setAtBottom}
          onRangeChange={stat.onRange}
          className={inScrollArea ? undefined : "min-h-0 flex-1"}
          header={
            <div className="flex h-10 items-center justify-center gap-2 text-xs text-muted-foreground">
              {first <= 0 ? (
                <>已经到顶了 · 共 {total.toLocaleString()} 条历史</>
              ) : loading ? (
                <>
                  <LoaderCircleIcon className="size-3.5 animate-spin motion-reduce:animate-none" />
                  加载更早的消息…
                </>
              ) : (
                <>向上滚动加载更早的消息</>
              )}
            </div>
          }
          footer={<div className="h-2" />}
        />
        </Scroller>
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <Button
            type="button"
            size="xs"
            variant={unseen ? "default" : "outline"}
            tabIndex={showPill ? 0 : -1}
            aria-hidden={!showPill}
            onClick={() => void list.current?.scrollToBottom({ behavior })}
            className={cn(
              "rounded-full shadow-soft transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none",
              showPill ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            <ArrowDownIcon />
            {unseen ? `${unseen} 条新消息` : "回到底部"}
          </Button>
        </div>
      </div>
      <div className="grid shrink-0 gap-2 border-t p-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <Input aria-label="消息" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="说点什么, 回车发送" className="h-9" />
          <Button type="submit" size="icon" aria-label="发送" disabled={!draft.trim()}>
            <SendHorizontalIcon />
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="xs" variant="outline" onClick={receive}>
            <CornerDownLeftIcon />
            收到一条新消息
          </Button>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Switch checked={auto} onCheckedChange={setAuto} aria-label="自动到达" />
            自动到达
          </label>
          <span className="ml-auto" />
          <JumpField label="消息编号" defaultValue={String(Math.max(0, total - 200))} onJump={jump} />
        </div>
      </div>
    </div>
  );
}

/** 聊天放进 ScrollArea: 反向列表在外部滚动容器里同样贴底 */
function Scroller({ on, children }: { on: boolean; children: React.ReactNode }) {
  if (!on) return <>{children}</>;
  return <ScrollArea className="min-h-0 flex-1">{children}</ScrollArea>;
}

// ---------------------------------------------------------------- 信息流 (ScrollArea 里)

const FEED_PAGE = 50;
const FEED_TOPICS = ["前端", "AI", "设计", "开源", "产品"];
const FEED_TEXT = [
  "React 19 的 ref 可以直接作为 prop 传给函数组件了。",
  "长列表优化的三个要点: 只渲染可见区间, 用 transform 摆位, 测量放进 ResizeObserver 批处理, 避免读写交错导致的布局抖动。",
  "今天把文档站换成了深色主题, 所有颜色都走语义令牌, 亮暗切换零成本。",
  "分享一个小技巧: 聊天列表向上加载更早消息时, 用 key 锚点修正 scrollTop, 比计算新增高度更稳, 因为新插入的行还没测量时高度只是估算值, 测量完成后锚点会再修正一次。",
];

function FeedCard({ id }: { id: number }) {
  const r = rand(id * 31 + 7);
  const topic = pick(r, FEED_TOPICS);
  const text = pick(r, FEED_TEXT);
  const who = pick(r, MEMBERS);
  return (
    <article className="mx-3 mb-2 rounded-xl border bg-background/60 p-3">
      <header className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <Avatar size="sm">
          <AvatarFallback className={cn("text-[10px] font-medium", TONES[id % TONES.length])}>{who.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <span className="text-foreground/90">{who}</span>
        <span className="rounded bg-accent px-1.5 leading-4">{topic}</span>
        <span className="ml-auto tabular">#{id + 1}</span>
      </header>
      <p className="text-sm leading-6">{text}</p>
    </article>
  );
}

function FeedExample({ o }: { o: Opts }) {
  const [n, setN] = React.useState(FEED_PAGE);
  const [loading, setLoading] = React.useState(false);
  const stat = useRangeStat();
  const items = React.useMemo(() => Array.from({ length: Math.min(n, o.count) }, (_, i) => i), [n, o.count]);
  const done = items.length >= o.count;
  const more = React.useCallback(() => {
    if (loading || done) return;
    setLoading(true);
    window.setTimeout(() => {
      setN((x) => x + FEED_PAGE);
      setLoading(false);
    }, LOAD_MS);
  }, [loading, done]);
  const renderItem = React.useCallback((id: number) => <FeedCard id={id} />, []);
  return (
    <div className={CARD}>
      <div className={BAR}>
        <span className="text-sm font-medium">信息流</span>
        <span className="text-xs text-muted-foreground">放在 ScrollArea 里</span>
        <Stat bind={stat.setter} total={items.length} unit="条已加载" />
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-3 pt-3 pb-2">
          <div className="rounded-xl border bg-brand-soft/40 p-3 text-sm">
            <p className="font-medium">列表上方的内容</p>
            <p className="text-xs text-muted-foreground">scrollParent="scroll-area": 用外层 ScrollArea 的 viewport 滚动, 这块卡片的高度会自动计入偏移。</p>
          </div>
        </div>
        <VirtualList
          scrollParent="scroll-area"
          aria-label="信息流"
          items={items}
          getKey={(id) => id}
          renderItem={renderItem}
          estimateSize={o.estimate}
          overscan={o.overscan}
          onEndReached={more}
          onRangeChange={stat.onRange}
          footer={
            <div className="flex h-12 items-center justify-center gap-2 text-xs text-muted-foreground">
              {done ? (
                "没有更多了"
              ) : (
                <>
                  <LoaderCircleIcon className={cn("size-3.5", loading && "animate-spin motion-reduce:animate-none")} />
                  {loading ? "加载中…" : "滚到底加载更多"}
                </>
              )}
            </div>
          }
        />
      </ScrollArea>
    </div>
  );
}

export default function VirtualListDemo({ values, onEvent }: DemoProps) {
  const o: Opts = {
    overscan: Number(values.overscan),
    estimate: Number(values.estimateSize),
    reverse: Boolean(values.reverse),
    follow: Number(values.followThreshold),
    smooth: Boolean(values.smooth),
    count: Number(values.count),
    page: Math.max(1, Number(values.pageSize) || 40),
  };
  // 条数 / 反向 / 每页条数变了就重挂列表 (演示数据随之重建)
  const key = `${values.example}:${o.count}:${o.reverse}:${o.page}`;
  if (values.example === "chat") return <ChatExample key={key} o={o} onEvent={onEvent} />;
  if (values.example === "chat-scroll-area") return <ChatExample key={key} o={o} onEvent={onEvent} inScrollArea />;
  if (values.example === "feed") return <FeedExample key={key} o={o} />;
  return <MailExample key={key} o={o} onEvent={onEvent} />;
}
