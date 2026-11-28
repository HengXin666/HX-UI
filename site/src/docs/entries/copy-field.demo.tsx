import * as React from "react";
import { BotIcon, WebhookIcon, KeyRoundIcon, LinkIcon, RefreshCwIcon, TicketIcon, UserPlusIcon } from "lucide-react";
import { CopyField, type CopyFeedback, type CopyFieldSize, type CopyFieldVariant } from "@/components/ui/copy-field";
import { Field } from "@/components/ui/field";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DemoProps } from "../types";

const CARD = "w-full max-w-md rounded-xl border bg-popover text-popover-foreground shadow-float";
const HEAD = "flex items-center gap-2.5 border-b px-4 py-3";
const BODY = "grid gap-4 p-4";

type Common = {
  size: CopyFieldSize;
  variant: CopyFieldVariant;
  masked: boolean;
  maskPeek: number;
  feedback: CopyFeedback;
  copiedDuration: number;
  showLabel: boolean;
  mono: boolean;
  maxHeight: number;
  wrap: "word" | "anywhere";
  clickToCopy: boolean;
  onEvent?: (msg: string) => void;
};

/** 每个 CopyField 都吃的公共参数 */
const shared = (p: Common) => ({
  size: p.size,
  variant: p.variant,
  feedback: p.feedback,
  copiedDuration: p.copiedDuration,
  showLabel: p.showLabel,
  mono: p.mono,
  clickToCopy: p.clickToCopy,
});
const short = (s: string) => (s.length > 18 ? `${s.slice(0, 18)}…` : s);

/* ---------- 数据源接入 (Sources.tsx) ---------- */

const WEBHOOK = "https://aioa.hengxin.dev/api/hooks/gh/7f3c2a91-4d0b-4b8e-9c55-1e2f6a8d0b37";
const SECRET = "whsec_Q2x5bWZqY2xpZW50c2VjcmV0X2E5RjI";
const API_KEY = "hxk_live_8KfP2mQv7XrT1nLc4WbZ9yHs6JdA3eGu";

function Webhook(p: Common) {
  const [key, setKey] = React.useState(API_KEY);
  return (
    <div className={CARD}>
      <div className={HEAD}>
        <span className="grid size-8 place-items-center rounded-md border bg-muted"><WebhookIcon className="size-4" /></span>
        <div className="grid">
          <span className="text-sm font-medium">GitHub 数据源</span>
          <span className="text-xs text-muted-foreground">把下面的地址和密钥填到仓库的 Webhooks 设置里</span>
        </div>
        <Badge variant="outline" dot="success" live className="ml-auto">已连接</Badge>
      </div>
      <div className={BODY}>
        <CopyField
          {...shared(p)}
          label="Payload URL"
          value={WEBHOOK}
          leading={<span className="rounded bg-brand-soft px-1 font-mono text-[10px] leading-4 font-semibold text-brand">POST</span>}
          onCopy={() => p.onEvent?.("已复制 Webhook 地址")}
        />
        <CopyField
          {...shared(p)}
          label="Secret"
          aside="只显示一次"
          description="GitHub 用它给每次推送签名，服务端据此校验来源。"
          value={SECRET}
          masked={p.masked}
          maskPeek={p.maskPeek}
          onCopy={() => p.onEvent?.("已复制 Secret")}
        />
        <CopyField
          {...shared(p)}
          label="API Key"
          value={key}
          masked={p.masked}
          maskPeek={p.maskPeek}
          leading={<KeyRoundIcon />}
          actions={
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label="重新生成"
              title="重新生成"
              className="text-muted-foreground"
              onClick={() => {
                setKey(`hxk_live_${Math.random().toString(36).slice(2, 14)}${Math.random().toString(36).slice(2, 14)}`);
                p.onEvent?.("已生成新的 API Key，旧的立即失效");
              }}
            >
              <RefreshCwIcon />
            </Button>
          }
          onCopy={(t) => p.onEvent?.(`已复制 ${short(t)}`)}
        />
      </div>
    </div>
  );
}

/* ---------- Agent 接入语 (AgentSettings.tsx), 多行 ---------- */

const PROMPT = `你是 HX-AIOA 的接入 Agent「邮件分拣」。
连接方式：POST https://aioa.hengxin.dev/api/agents/mail-triage/events
鉴权：请求头 Authorization: Bearer hxa_9c1e7b2f40d84a6e8f5b3c2d1a0e9f87

职责：
1. 读取新邮件，按「通知 / 账单 / 人工」分类；
2. 通知类自动归档，账单类提取金额与到期日写入待办；
3. 需要人工处理的邮件置顶，并用一句话摘要说明原因。

约束：不要回复任何邮件；不确定的分类一律交给人工；每次处理完把结果以 JSON 回传到上面的地址。`;

function Prompt(p: Common) {
  return (
    <div className={CARD}>
      <div className={HEAD}>
        <span className="grid size-8 place-items-center rounded-md bg-chart-2/20 text-chart-2"><BotIcon className="size-4" /></span>
        <div className="grid">
          <span className="text-sm font-medium">邮件分拣</span>
          <span className="text-xs text-muted-foreground">把接入语整段发给你的 Agent</span>
        </div>
      </div>
      <div className={BODY}>
        <CopyField
          {...shared(p)}
          label="接入语"
          description={`超出 ${p.maxHeight}px 后在框内滚动；复制的是完整文本。`}
          value={PROMPT}
          multiline
          maxHeight={p.maxHeight}
          wrap={p.wrap}
          masked={p.masked}
          onCopy={() => p.onEvent?.(`已复制接入语（${PROMPT.length} 字）`)}
        />
      </div>
    </div>
  );
}

/* ---------- 验证码 / 邀请码 ---------- */

function Codes(p: Common) {
  return (
    <div className={cn(CARD, "max-w-sm")}>
      <div className={cn(BODY, "gap-5 p-5")}>
        <div className="grid gap-1 text-center">
          <span className="text-sm font-medium">登录验证码</span>
          <span className="text-xs text-muted-foreground">5 分钟内有效，{p.clickToCopy ? "点数字即可复制" : "点右侧按钮复制"}</span>
        </div>
        <CopyField
          {...shared(p)}
          aria-label="验证码"
          value="482913"
          masked={p.masked}
          className="h-14"
          valueClassName="text-center text-2xl font-semibold tracking-[0.4em] pl-[calc(0.75rem+0.4em)]"
          onCopy={() => p.onEvent?.("已复制验证码 482913")}
        />
        <div className="h-px bg-border" />
        <CopyField
          {...shared(p)}
          label="团队邀请码"
          aside="剩余 3 次"
          value="HXUI-7KQ2-M9TA"
          masked={p.masked}
          maskPeek={p.maskPeek}
          leading={<TicketIcon />}
          onCopy={(t) => p.onEvent?.(`已复制邀请码 ${t}`)}
        />
      </div>
    </div>
  );
}

/* ---------- 放进 Field ---------- */

function InField(p: Common) {
  const [rotated, setRotated] = React.useState(false);
  return (
    <div className={CARD}>
      <div className={HEAD}><span className="text-sm font-medium">邮件转发</span></div>
      <div className={BODY}>
        {/* 外层用现有的 Field: CopyField 读它的 id / aria-describedby, <label> 点了会聚焦并全选值 */}
        <Field
          label="转发到这个地址"
          description="在原邮箱里设置自动转发，邮件会进入 AIOA 的收件箱。"
          error={rotated ? undefined : "该地址 30 天未收到邮件，建议重新生成。"}
          aside={<button type="button" className="text-xs underline-offset-4 hover:underline" onClick={() => setRotated(true)}>重新生成</button>}
        >
          <CopyField {...shared(p)} value={rotated ? "in-k3v9q2@mail.aioa.dev" : "in-7f3c2a@mail.aioa.dev"} onCopy={(t) => p.onEvent?.(`已复制 ${t}`)} />
        </Field>
        <Field label="SMTP 密码" description="只用于发信，不能登录账号。" disabled={false}>
          <CopyField {...shared(p)} value="sm7p-Xq4v-Rk8L-2nTe" masked={p.masked} maskPeek={p.maskPeek} onCopy={() => p.onEvent?.("已复制 SMTP 密码")} />
        </Field>
        <Field label="停用的旧密钥" disabled>
          <CopyField {...shared(p)} value="hxk_live_old_0000000000" masked={p.masked} />
        </Field>
      </div>
    </div>
  );
}

/* ---------- 列表里的紧凑用法 (Members.tsx 邀请链接) ---------- */

const INVITES = [
  { id: "i1", who: "设计组", role: "成员", link: "https://aioa.dev/join/Dk29fQ", uses: "2 / 10" },
  { id: "i2", who: "外包 · 王工", role: "访客", link: "https://aioa.dev/join/p8LmZ3", uses: "0 / 1" },
  { id: "i3", who: "实习生", role: "成员", link: "https://aioa.dev/join/Hw7Rt0", uses: "4 / 5" },
];

function List(p: Common) {
  return (
    <div className={CARD}>
      <div className={HEAD}>
        <UserPlusIcon className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-sm font-medium">邀请链接</span>
        <span className="ml-auto text-xs text-muted-foreground">{INVITES.length} 个有效</span>
      </div>
      <div className="p-1.5">
        <ItemGroup>
          {INVITES.map((it, i) => (
            <Item key={it.id} className="flex-wrap">
              <ItemMedia>
                <Avatar size="sm"><AvatarFallback className={cn("text-[11px]", i % 2 ? "bg-chart-3/20 text-chart-3" : "bg-chart-1/20 text-chart-1")}>{it.who[0]}</AvatarFallback></Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{it.who}</ItemTitle>
                <ItemDescription>{it.role} · 已用 {it.uses}</ItemDescription>
              </ItemContent>
              <CopyField
                {...shared(p)}
                aria-label={`${it.who} 的邀请链接`}
                value={it.link}
                masked={p.masked}
                maskPeek={p.maskPeek}
                leading={<LinkIcon className="size-3.5" />}
                className="w-56 max-sm:w-full"
                onCopy={(t) => p.onEvent?.(`已复制 ${t}`)}
              />
            </Item>
          ))}
        </ItemGroup>
      </div>
    </div>
  );
}

const EXAMPLES: Record<string, (p: Common) => React.ReactElement> = { webhook: Webhook, prompt: Prompt, code: Codes, field: InField, list: List };

export default function CopyFieldDemo({ values, onEvent }: DemoProps) {
  const Example = EXAMPLES[String(values.example)] ?? Webhook;
  const size = (["sm", "default", "lg"].includes(String(values.size)) ? values.size : "default") as CopyFieldSize;
  const variant = (["default", "muted", "ghost"].includes(String(values.variant)) ? values.variant : "default") as CopyFieldVariant;
  const feedback = (["pop", "fade", "none"].includes(String(values.feedback)) ? values.feedback : "pop") as CopyFeedback;
  return (
    <Example
      size={size}
      variant={variant}
      masked={Boolean(values.masked)}
      maskPeek={Number(values.maskPeek ?? 0)}
      feedback={feedback}
      copiedDuration={Number(values.copiedDuration ?? 1600)}
      showLabel={Boolean(values.showLabel)}
      mono={values.mono !== false}
      maxHeight={Number(values.maxHeight ?? 160)}
      wrap={values.wrap === "anywhere" ? "anywhere" : "word"}
      clickToCopy={Boolean(values.clickToCopy)}
      onEvent={onEvent}
    />
  );
}
