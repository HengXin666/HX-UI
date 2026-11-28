import * as React from "react";
import {
  CloudOffIcon,
  InboxIcon,
  LoaderCircleIcon,
  MessageSquarePlusIcon,
  MessagesSquareIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SearchXIcon,
  StarIcon,
} from "lucide-react";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle, type EmptyAnimation } from "@/components/ui/empty";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemMeta, ItemTitle } from "@/components/ui/item";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { DemoProps } from "../types";

const CARD = "w-full max-w-md overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-float";
const HEAD = "flex items-center gap-2 border-b px-3.5 py-2.5";
const BODY_H = "h-[20rem]";
/** 模拟请求耗时 */
const FETCH_MS = 1100;

type Tone = "muted" | "brand" | "destructive" | "warning" | "success";
type Common = {
  size: "page" | "compact";
  variant: "default" | "outline" | "muted";
  media: "default" | "icon";
  tone: Tone;
  animate: EmptyAnimation;
  duration: number;
  stagger: number;
  action: boolean;
  onEvent?: (msg: string) => void;
};

/** Empty 的公共参数; key 变了就重播入场 */
const emptyProps = (p: Common) => ({ size: p.size, variant: p.variant, animate: p.animate, duration: p.duration, stagger: p.stagger });
const replayKey = (p: Common) => `${p.animate}:${p.duration}:${p.stagger}:${p.size}`;

/* ---------- 列表为空 (卡片内) ---------- */

function ListEmpty(p: Common) {
  return (
    <div className={CARD}>
      <div className={HEAD}>
        <MessagesSquareIcon aria-hidden className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">消息</span>
        <Button type="button" size="icon-xs" variant="ghost" aria-label="新建会话" className="ml-auto"><PlusIcon /></Button>
      </div>
      <div className={cn("grid p-3", BODY_H)}>
        <Empty key={replayKey(p)} {...emptyProps(p)}>
          <EmptyMedia variant={p.media} tone={p.tone}><InboxIcon /></EmptyMedia>
          <EmptyTitle>还没有消息</EmptyTitle>
          <EmptyDescription>和同事或 Agent 发起一个会话，消息会按时间出现在这里。</EmptyDescription>
          {p.action && (
            <EmptyContent>
              <Button type="button" size="sm" onClick={() => p.onEvent?.("发起会话")}><MessageSquarePlusIcon />发起会话</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => p.onEvent?.("导入")}>从邮件导入</Button>
            </EmptyContent>
          )}
          {/* 第 5 个插槽: 交错个数不限, 它最后入场 */}
          <p className="text-xs text-muted-foreground">
            随时按 <Kbd>N</Kbd> 新建会话
          </p>
        </Empty>
      </div>
    </div>
  );
}

/* ---------- 详情区未选中 (整页) ---------- */

const PEERS = [
  { id: "p1", name: "林晓", last: "评审会改到周四下午三点", time: "21:04" },
  { id: "p2", name: "产品周会", last: "截断规则统一一下？", time: "20:31" },
  { id: "p3", name: "部署机器人", last: "已部署到 production", time: "19:58" },
];

function DetailEmpty(p: Common) {
  return (
    <div className="grid h-[24rem] w-full max-w-2xl grid-cols-[13rem_minmax(0,1fr)] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-float max-sm:grid-cols-1">
      <div className="border-r p-1.5 max-sm:hidden">
        <ItemGroup aria-label="会话" size="sm">
          {PEERS.map((c) => (
            <Item key={c.id} asChild>
              <button type="button" onClick={() => p.onEvent?.(`打开 ${c.name}`)}>
                <ItemMedia><Avatar size="sm"><AvatarFallback className="text-[11px]">{c.name[0]}</AvatarFallback></Avatar></ItemMedia>
                <ItemContent><ItemTitle>{c.name}</ItemTitle></ItemContent>
                <ItemMeta>{c.time}</ItemMeta>
              </button>
            </Item>
          ))}
        </ItemGroup>
      </div>
      <div className="flex min-h-0 flex-col bg-background/40">
        <Empty key={replayKey(p)} {...emptyProps(p)}>
          <EmptyMedia variant={p.media} tone={p.tone}><MessagesSquareIcon /></EmptyMedia>
          {/* 整页空状态: 详情区的主标题, 用 h2 */}
          <EmptyTitle as="h2">选择一个会话</EmptyTitle>
          <EmptyDescription>从左侧列表打开会话，或按 <Kbd>⌘</Kbd> <Kbd>K</Kbd> 搜索联系人。</EmptyDescription>
          {p.action && (
            <EmptyContent>
              <Button type="button" size="sm" variant="outline" onClick={() => p.onEvent?.("新建会话")}><PlusIcon />新建会话</Button>
            </EmptyContent>
          )}
        </Empty>
      </div>
    </div>
  );
}

/* ---------- 搜索无结果 ---------- */

function SearchEmpty(p: Common) {
  const [q, setQ] = React.useState("季度报告 2027");
  return (
    <div className={CARD}>
      <div className="border-b p-2.5">
        <Input aria-label="搜索收藏" value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索收藏" size="sm" leading={<SearchIcon />} />
      </div>
      <div className={cn("grid p-3", BODY_H)}>
        {q ? (
          <Empty key={replayKey(p) + q.length} {...emptyProps(p)}>
            <EmptyMedia variant={p.media} tone={p.tone}><SearchXIcon /></EmptyMedia>
            <EmptyTitle>没有找到「{q}」</EmptyTitle>
            <EmptyDescription>换个关键词试试，或者 <a href="#clear" onClick={(e) => { e.preventDefault(); setQ(""); }}>查看全部收藏</a>。</EmptyDescription>
            {p.action && (
              <EmptyContent>
                <Button type="button" size="sm" variant="outline" onClick={() => setQ("")}>清除搜索</Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <Empty key="all" {...emptyProps(p)} variant="default">
            <EmptyMedia variant={p.media} tone="warning"><StarIcon /></EmptyMedia>
            <EmptyTitle>输入关键词搜索收藏</EmptyTitle>
            <EmptyDescription>支持按标题、发送人和标签搜索。</EmptyDescription>
          </Empty>
        )}
      </div>
    </div>
  );
}

/* ---------- 加载失败 ---------- */

function ErrorEmpty(p: Common) {
  const [busy, setBusy] = React.useState(false);
  const [tries, setTries] = React.useState(0);
  const retry = () => {
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setTries((n) => n + 1);
      p.onEvent?.("还是连不上服务器");
    }, FETCH_MS);
  };
  return (
    <div className={CARD}>
      <div className={HEAD}><span className="text-sm font-medium">待办</span></div>
      <div className={cn("grid p-3", BODY_H)}>
        <Empty key={replayKey(p) + tries} {...emptyProps(p)}>
          <EmptyMedia variant={p.media} tone="destructive"><CloudOffIcon /></EmptyMedia>
          <EmptyTitle>待办加载失败</EmptyTitle>
          <EmptyDescription>网络连接中断（ERR_NETWORK）。已保存的待办不会丢失。{tries > 0 && ` 已重试 ${tries} 次。`}</EmptyDescription>
          {p.action && (
            <EmptyContent>
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={retry}>
                {busy ? <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" /> : <RefreshCwIcon />}
                {busy ? "重试中…" : "重试"}
              </Button>
            </EmptyContent>
          )}
        </Empty>
      </div>
    </div>
  );
}

/* ---------- 与 Skeleton 配合: 加载中 -> 空 / 失败 / 有数据 ---------- */

type Phase = "loading" | "empty" | "error" | "data";
const ROWS = [
  { id: "r1", from: "GitHub", subject: "feat: 空状态组件 Empty (#59)", time: "21:10" },
  { id: "r2", from: "林晓", subject: "Re: 评审会时间调整", time: "15:03" },
  { id: "r3", from: "npm", subject: "Successfully published @hx/ui@2.6.1", time: "昨天" },
];
const SKELETON_W = [68, 52, 74, 60];

function Flow(p: Common) {
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [next, setNext] = React.useState<Exclude<Phase, "loading">>("empty");
  const timer = React.useRef<number | null>(null);
  const load = React.useCallback((result: Exclude<Phase, "loading">) => {
    setPhase("loading");
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPhase(result), FETCH_MS);
  }, []);
  React.useEffect(() => {
    load("empty");
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, [load]);

  return (
    <div className="grid w-full max-w-md gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">请求结果</span>
        <ToggleGroup type="single" size="sm" variant="outline" value={next} onValueChange={(v) => v && setNext(v as Exclude<Phase, "loading">)}>
          <ToggleGroupItem value="empty">空</ToggleGroupItem>
          <ToggleGroupItem value="error">失败</ToggleGroupItem>
          <ToggleGroupItem value="data">有数据</ToggleGroupItem>
        </ToggleGroup>
        <Button type="button" size="sm" variant="secondary" className="ml-auto" onClick={() => load(next)}><RefreshCwIcon />重新加载</Button>
      </div>
      <div className={CARD}>
        <div className={HEAD}>
          <InboxIcon aria-hidden className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">收件箱</span>
          <span className="ml-auto text-xs text-muted-foreground tabular">{phase === "loading" ? "同步中…" : phase === "data" ? `${ROWS.length} 封` : ""}</span>
        </div>
        <div className={cn("grid p-1.5", BODY_H)} aria-busy={phase === "loading"} aria-live="polite">
          {phase === "loading" && (
            // 骨架行的形状与真实的行一致 (头像 32 + 两行字), 加载完不跳
            <div className="grid content-start gap-0.5">
              <span className="sr-only">加载中</span>
              {SKELETON_W.map((w, i) => (
                <div key={i} className="flex items-center gap-3 px-2.5 py-2">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="grid flex-1 gap-1.5">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3 rounded" style={{ width: `${w}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {phase === "data" && (
            <ItemGroup aria-label="邮件" highlight="slide" className="content-start">
              {ROWS.map((r) => (
                <Item key={r.id} asChild>
                  <button type="button" onClick={() => p.onEvent?.(`打开「${r.subject}」`)}>
                    <ItemMedia><Avatar><AvatarFallback className="text-xs">{r.from[0]}</AvatarFallback></Avatar></ItemMedia>
                    <ItemContent><ItemTitle>{r.from}</ItemTitle><ItemDescription>{r.subject}</ItemDescription></ItemContent>
                    <ItemMeta>{r.time}</ItemMeta>
                  </button>
                </Item>
              ))}
            </ItemGroup>
          )}
          {phase === "empty" && (
            <Empty key={replayKey(p)} {...emptyProps(p)}>
              <EmptyMedia variant={p.media} tone={p.tone}><InboxIcon /></EmptyMedia>
              <EmptyTitle>收件箱是空的</EmptyTitle>
              <EmptyDescription>所有邮件都处理完了。新邮件到达时会出现在这里。</EmptyDescription>
              {p.action && <EmptyContent><Button type="button" size="sm" variant="outline" onClick={() => load("data")}>检查新邮件</Button></EmptyContent>}
            </Empty>
          )}
          {phase === "error" && (
            <Empty key={replayKey(p)} {...emptyProps(p)}>
              <EmptyMedia variant={p.media} tone="destructive"><CloudOffIcon /></EmptyMedia>
              <EmptyTitle>同步失败</EmptyTitle>
              <EmptyDescription>IMAP 服务器无响应，请稍后重试。</EmptyDescription>
              {p.action && <EmptyContent><Button type="button" size="sm" variant="outline" onClick={() => load("data")}><RefreshCwIcon />重试</Button></EmptyContent>}
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}

const EXAMPLES: Record<string, (p: Common) => React.ReactElement> = { list: ListEmpty, detail: DetailEmpty, search: SearchEmpty, error: ErrorEmpty, flow: Flow };
const TONES: Tone[] = ["muted", "brand", "destructive", "warning", "success"];
const ANIMS: EmptyAnimation[] = ["none", "fade", "rise", "pop"];

export default function EmptyDemo({ values, onEvent }: DemoProps) {
  const Example = EXAMPLES[String(values.example)] ?? ListEmpty;
  const variant = values.variant === "outline" || values.variant === "muted" ? values.variant : "default";
  return (
    <Example
      size={values.size === "page" ? "page" : "compact"}
      variant={variant}
      media={values.media === "default" ? "default" : "icon"}
      tone={TONES.includes(values.tone as Tone) ? (values.tone as Tone) : "muted"}
      animate={ANIMS.includes(values.animate as EmptyAnimation) ? (values.animate as EmptyAnimation) : "fade"}
      duration={Number(values.duration ?? 300)}
      stagger={Number(values.stagger ?? 50)}
      action={values.action !== false}
      onEvent={onEvent}
    />
  );
}
