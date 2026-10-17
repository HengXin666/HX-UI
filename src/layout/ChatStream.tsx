import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type JSX,
  type ReactNode,
} from "react";
import { CLASSES, ERROR, PAD_CHAR, PAD_WIDTH, STICK_TOLERANCE, USER, isString } from "../constants";
import { cn } from "../primitives/utils";

/**
 * 会话流. 用于"人与 agent 一来一回"的对话展示.
 *
 * 它与日志框的区别, 也是它独立存在的理由:
 *
 * 1. **分组而非平铺**.
 * 日志是"一条条同质的行", 对话是"一轮轮交替的角色块". 同一角色连续输出要并成
 * 一块 (否则工具调用与正文之间会出现重复的头像与时间戳, 视觉上像两个人).
 *
 * 2. **滚动单位是块而不是行**.
 * 粘底判定要按整个消息块的高度走, 长回答滚动到一半时不该被判成"已到底".
 *
 * 3. **流式追加**.
 * 正在生成的那一块要能原地增长, 而不是每来一个 token 就新建一块.
 */

export type ChatRole = "user" | "assistant" | "system";

export type ChatStatus = "pending" | "streaming" | "done" | "error";

export interface ChatMessage {
  readonly id: string;
  readonly role: ChatRole;
  readonly content: string;
  readonly status?: ChatStatus;
  /** 时间戳. 字符串直接显示, 数字格式化成 HH:MM:SS. */
  readonly time?: string | number;
  /** 角色块下方的补充区, 用于工具调用, 附件, 引用. */
  readonly extra?: ReactNode;
  /** 出错时的原因, 显示在正文下方. */
  readonly error?: string;
}

export interface ChatStreamProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  readonly messages: readonly ChatMessage[];
  /** 底部占位, 通常放输入框. 给出时会话区与它分栏, 各自滚动. */
  readonly footer?: ReactNode;
  /** 无消息时的空态. */
  readonly empty?: ReactNode;
  /** 是否显示时间戳. 默认显示. */
  readonly showTime?: boolean;
  readonly className?: string;
}

function fmtTime(t: string | number): string {
  if (isString(t)) return t;
  const d = new Date(t);
  const p = (n: number, w = PAD_WIDTH) => String(n).padStart(w, PAD_CHAR);
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const ROLE_LABEL: Record<ChatRole, string> = {
  user: "你",
  assistant: "Hark",
  system: "系统",
};

/** 头像块. 用首字母而非图标, 避免为三个角色各挑一个图标色. */
function Avatar({ role }: { readonly role: ChatRole }): JSX.Element {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium",
        role === USER
          ? "border-border bg-accent/60 text-foreground"
          : "border-border bg-primary/10 text-link",
      )}
    >
      {role === USER ? "U" : role === "assistant" ? "H" : "S"}
    </span>
  );
}

function MessageBlock({
  msg,
  showTime,
}: {
  readonly msg: ChatMessage;
  readonly showTime: boolean;
}): JSX.Element {
  const streaming = msg.status === "streaming";
  const failed = msg.status === ERROR;
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-xl border px-3 py-2.5 transition-colors",
        msg.role === USER ? "border-border/60 bg-accent/30" : "border-border/50 bg-card/40",
        failed && "border-destructive/50 bg-destructive/5",
      )}
    >
      <Avatar role={msg.role} />
      <div className={CLASSES.grow}>
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-foreground">{ROLE_LABEL[msg.role]}</span>
          {showTime && msg.time !== undefined && (
            <span className={CLASSES.meta}>{fmtTime(msg.time)}</span>
          )}
          {streaming && (
            <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-label="生成中" />
          )}
        </div>
        <div className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground/90">
          {msg.content}
          {streaming && (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary/70 align-middle" />
          )}
        </div>
        {msg.extra !== undefined && <div className="mt-2">{msg.extra}</div>}
        {msg.error !== undefined && (
          <div className="mt-1.5 text-xs text-destructive">{msg.error}</div>
        )}
      </div>
    </div>
  );
}

export function ChatStream({
  messages,
  footer,
  empty,
  showTime = true,
  className,
  ...props
}: ChatStreamProps): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stuckRef = useRef(true);

  /** 粘底判定留 48px 容差: 长回答末尾的换行与内边距会让严格等于永远不成立. */
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el === null) return;
    stuckRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_TOLERANCE;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el === null || !stuckRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const view = useMemo(
    () => (
      <div className={CLASSES.stack}>
        {messages.map((m) => (
          <MessageBlock key={m.id} msg={m} showTime={showTime} />
        ))}
      </div>
    ),
    [messages, showTime],
  );

  return (
    <div className={cn("flex min-h-0 flex-col", className)} {...props}>
      <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {empty ?? "还没有消息"}
          </div>
        ) : (
          view
        )}
      </div>
      {footer !== undefined && <div className="border-t border-border px-3 py-2.5">{footer}</div>}
    </div>
  );
}
