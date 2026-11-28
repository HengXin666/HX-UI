import * as React from "react";
import {
  AtSignIcon,
  BellOffIcon,
  BotIcon,
  HashIcon,
  LanguagesIcon,
  ListTodoIcon,
  MailIcon,
  PaperclipIcon,
  RocketIcon,
  SendHorizontalIcon,
  SmileIcon,
  SparklesIcon,
  UsersIcon,
  VoteIcon,
} from "lucide-react";
import {
  MentionInput,
  mentionRanges,
  type MentionItem,
  type MentionPlacement,
  type MentionRecord,
  type MentionTrigger,
} from "@/components/ui/mention-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DemoProps } from "../types";

/** 成员头像: 首字 + 主题色淡底 (都是令牌) */
const TINTS = ["bg-chart-2/20 text-chart-2", "bg-chart-3/20 text-chart-3", "bg-chart-4/20 text-chart-4", "bg-chart-5/20 text-chart-5", "bg-brand-soft text-brand"];
const face = (name: string, i: number) => <span className={cn("grid size-full place-items-center text-[11px] font-semibold", TINTS[i % TINTS.length])}>{name[0]}</span>;
const glyph = (icon: React.ReactNode, tint = "bg-brand-soft text-brand") => <span className={cn("grid size-full place-items-center [&_svg]:size-3.5", tint)}>{icon}</span>;

const EVERYONE: MentionItem[] = [{ id: "all", label: "所有人", group: "全体", description: "通知群里 12 位成员", icon: glyph(<UsersIcon />, "bg-warning/15 text-warning"), tag: "全体", keywords: ["all", "everyone", "suoyouren"] }];

const AGENTS: MentionItem[] = [
  { id: "agent-review", label: "代码评审", group: "群 Agent", description: "HX-AI-Review", icon: glyph(<BotIcon />), tag: "Agent", keywords: ["review", "daimapingshen"] },
  { id: "agent-mail", label: "邮件助理", group: "群 Agent", description: "HX-Email", icon: glyph(<MailIcon />), tag: "Agent", keywords: ["mail", "youjian"] },
  { id: "agent-deploy", label: "部署小助手", group: "群 Agent", description: "HX-Pxy", icon: glyph(<RocketIcon />), tag: "Agent", keywords: ["deploy", "bushu"] },
];

const PEOPLE = [
  ["林晓", "产品经理", "linxiao"],
  ["周屿", "前端", "zhouyu"],
  ["陈默", "设计", "chenmo"],
  ["苏青", "后端", "suqing"],
  ["王一帆", "测试", "wangyifan"],
  ["韩梅梅", "运营", "hanmeimei"],
  ["李雷", "实习生", "lilei"],
  ["Heng Xin", "维护者", "hengxin"],
] as const;
const MEMBERS: MentionItem[] = PEOPLE.map(([name, role, py], i) => ({ id: `u-${py}`, label: name, value: name.replace(" ", ""), group: "成员", description: role, icon: face(name, i), keywords: [py] }));

const AT_ITEMS = [...EVERYONE, ...AGENTS, ...MEMBERS];

const TOPICS: MentionItem[] = ["发版计划", "HX-UI-2.7", "周报", "设计评审", "#155-Web端", "值班表"].map((t, i) => ({
  id: `topic-${i}`,
  label: t,
  description: ["本周五 20:00", "里程碑", "每周一", "每周三下午", "issue", "本月"][i],
  icon: glyph(<HashIcon />, "bg-info/15 text-info"),
}));

const COMMANDS: MentionItem[] = [
  { id: "cmd-summary", label: "总结", description: "总结最近 50 条消息", icon: glyph(<SparklesIcon />) },
  { id: "cmd-translate", label: "翻译", description: "把下一条消息翻成英文", icon: glyph(<LanguagesIcon />) },
  { id: "cmd-todo", label: "待办", description: "把这条消息转成待办", icon: glyph(<ListTodoIcon />) },
  { id: "cmd-vote", label: "投票", description: "发起一个群投票", icon: glyph(<VoteIcon />) },
  { id: "cmd-mute", label: "静音", description: "这个群 2 小时内不提醒", icon: glyph(<BellOffIcon />), disabled: true },
];

const ASYNC_MS = 450;
/** 模拟服务端搜成员: 按名字 / 拼音过滤, 延迟返回 */
const searchMembers = (q: string) =>
  new Promise<MentionItem[]>((resolve) =>
    setTimeout(() => {
      const s = q.toLowerCase();
      resolve(AT_ITEMS.filter((m) => !s || m.label.toLowerCase().includes(s) || m.keywords?.some((k) => k.includes(s))));
    }, ASYNC_MS)
  );

type Message = { id: number; who: string; at: string; text: string; mentions: MentionRecord[]; me?: boolean };

const SEED: Message[] = [
  { id: 1, who: "林晓", at: "20:41", text: "@周屿 Composer 的 @ 候选今晚能接上吗？#发版计划 里排在周五。", mentions: [{ id: "u-zhouyu", trigger: "@", value: "周屿" }, { id: "topic-0", trigger: "#", value: "发版计划" }] },
  { id: 2, who: "周屿", at: "20:43", text: "可以，直接用 HX-UI 的 MentionInput，顺便让 @代码评审 过一遍。", mentions: [{ id: "agent-review", trigger: "@", value: "代码评审" }] },
];

/** 消息气泡里把提及染成品牌色 */
function Rich({ text, mentions }: { text: string; mentions: MentionRecord[] }) {
  const ranges = mentionRanges(text, mentions);
  if (!ranges.length) return <>{text}</>;
  return (
    <>
      {ranges.map((r, i) => (
        <React.Fragment key={r.start}>
          {text.slice(i ? ranges[i - 1].end : 0, r.start)}
          <span className={cn("font-medium", r.mention.trigger === "#" ? "text-info" : "text-brand")}>{text.slice(r.start, r.end)}</span>
        </React.Fragment>
      ))}
      {text.slice(ranges[ranges.length - 1].end)}
    </>
  );
}

export default function MentionInputDemo({ values, onEvent }: DemoProps) {
  const [text, setText] = React.useState("");
  const [mentions, setMentions] = React.useState<MentionRecord[]>([]);
  const [messages, setMessages] = React.useState<Message[]>(SEED);
  const ta = React.useRef<HTMLTextAreaElement>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const asyncOn = Boolean(values.async);
  const full = values.triggers !== "at";

  const triggers = React.useMemo<MentionTrigger[]>(() => {
    const at: MentionTrigger = { char: "@", items: asyncOn ? searchMembers : AT_ITEMS, label: "提及成员", empty: "群里没有这个人" };
    if (!full) return [at];
    return [
      at,
      { char: "#", items: TOPICS, label: "话题", tone: "info", empty: "回车创建新话题" },
      { char: "/", items: COMMANDS, label: "命令", startOfLine: true, track: false },
    ];
  }, [asyncOn, full]);

  React.useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [messages]);

  const send = () => {
    const body = text.trim();
    if (!body) return;
    setMessages((m) => [...m, { id: Date.now(), who: "我", at: "现在", text: body, mentions, me: true }]);
    setText("");
    onEvent?.(mentions.length ? `已发送，mentions: ${mentions.map((m) => m.id).join(", ")}` : "已发送");
  };

  /** 工具条上的 @ 按钮: 在光标处插入 "@", 直接弹出候选 */
  const insertAt = () => {
    const el = ta.current;
    if (!el) return;
    el.focus();
    const before = el.value.slice(0, el.selectionStart);
    document.execCommand("insertText", false, before && !/\s$/.test(before) ? " @" : "@");
  };

  return (
    <div className="grid w-full max-w-lg gap-3">
      <div className="flex flex-col overflow-hidden rounded-2xl border bg-background/85 shadow-float backdrop-blur">
        <div className="flex items-center gap-2.5 border-b px-4 py-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-brand-soft text-brand [&_svg]:size-4"><UsersIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">HX-AIOA · 前端小组</p>
            <p className="text-[11px] text-muted-foreground">12 位成员 · 3 个 Agent</p>
          </div>
        </div>
        <div ref={list} className="grid max-h-56 content-start gap-3 overflow-y-auto px-4 py-3 scrollbar-thin">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex max-w-[85%] flex-col gap-1", m.me && "ml-auto items-end")}>
              <span className="text-[11px] text-muted-foreground">{m.who} · {m.at}</span>
              <p className={cn("rounded-xl px-3 py-2 text-[13px] leading-5 whitespace-pre-wrap", m.me ? "bg-brand-soft" : "bg-muted/70")}>
                <Rich text={m.text} mentions={m.mentions} />
              </p>
            </div>
          ))}
        </div>
        <div className="border-t p-2">
          <MentionInput
            ref={ta}
            aria-label="消息"
            variant="ghost"
            placeholder={full ? "输入消息，@ 提及，# 话题，行首 / 命令" : "输入消息，@ 提及成员"}
            value={text}
            onValueChange={setText}
            triggers={triggers}
            onMentionsChange={(_, records) => setMentions(records)}
            onMentionSelect={(item, trigger) => trigger === "/" && onEvent?.(`命令 /${item.label}`)}
            maxItems={Number(values.maxItems)}
            highlight={values.highlight === "off" ? false : (values.highlight as "text" | "background")}
            placement={values.placement as MentionPlacement}
            anchor={values.anchor as "trigger" | "caret"}
            autoGrow={Boolean(values.autoGrow)}
            minRows={1}
            maxRows={Number(values.maxRows)}
            hint={Boolean(values.hint)}
            popoverWidth={Number(values.popoverWidth)}
            onKeyDown={(e) => {
              // 候选浮层开着时, Enter 由组件拿去确认, 不会走到这里
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
          />
          <div className="flex items-center gap-0.5 px-1 pt-1">
            <Button type="button" size="icon-sm" variant="ghost" aria-label="提及" onClick={insertAt}><AtSignIcon /></Button>
            <Button type="button" size="icon-sm" variant="ghost" aria-label="表情"><SmileIcon /></Button>
            <Button type="button" size="icon-sm" variant="ghost" aria-label="附件"><PaperclipIcon /></Button>
            <span className="ml-auto pr-2 text-[11px] text-muted-foreground max-sm:hidden">Enter 发送 · Shift+Enter 换行</span>
            <Button type="button" size="sm" className="h-8" disabled={!text.trim()} onClick={send}>
              <SendHorizontalIcon />发送
            </Button>
          </div>
        </div>
      </div>
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-xl border bg-background/60 px-3 py-2 text-xs">
        <span className="font-mono text-muted-foreground">mentions</span>
        {mentions.length ? (
          mentions.map((m) => (
            <span key={m.id} className={cn("rounded-md px-1.5 py-0.5 font-mono", m.trigger === "#" ? "bg-info/15 text-info" : "bg-brand-soft text-brand")}>
              {m.id}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground">[] 打 @ 试试；删掉文字里的 @名字，这里同步移除</span>
        )}
      </div>
    </div>
  );
}
