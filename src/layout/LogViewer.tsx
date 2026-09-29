"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type JSX, type ReactNode } from "react";
import { cn } from "../primitives/utils";

/**
 * 日志框。用来显示流式输出的行 (HTTP 请求响应、WebSocket 消息、构建输出、任务进度)。
 *
 * 三个它必须解决的问题, 也是它与"一个滚动 div"的区别:
 *
 *   1. 自动滚动要"粘底但不锁死"。
 *      新行进来时若用户已经在底部, 就跟着滚; 若用户往上翻了在看历史, 就**不要**动 ——
 *      强行滚动会把用户正在读的内容顶走。这是日志组件最容易做错的一处。
 *
 *   2. 等宽对齐与折行。
 *      日志里常见"时间戳 级别 内容"的列对齐。用等宽字体 + pre-wrap 保留前导空格,
 *      同时长行要能折行而不是撑出横向滚动条 (后者会破坏列对齐的视觉)。
 *
 *   3. 级别过滤与计数。
 *      出错时用户第一件事就是"只看 error"。过滤要即时, 并且要显示每级的条数 ——
 *      否则过滤后看不出"总共出了几条错"。
 *
 * 数据由外部提供 (lines 数组)。组件不自己去订阅 ——
 * 订阅 HTTP / WebSocket 是使用方的事, 这里只管显示与滚动。
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "success";

export interface LogLine {
  readonly id: string;
  readonly level: LogLevel;
  readonly message: string;
  /** 时间戳。字符串形式直接显示 (由使用方决定格式), 数字会被格式化成 HH:MM:SS.mmm。 */
  readonly time?: string | number;
  /** 附加的结构化数据。展开显示在正文下方。 */
  readonly detail?: string;
}

export interface LogViewerProps {
  readonly lines: readonly LogLine[];
  /** 高度。默认 320px。用 max-h 而不是固定 height, 行数少时不该留一大片空白。 */
  readonly height?: number | string;
  /** 是否显示级别过滤。默认显示。 */
  readonly showFilter?: boolean;
  /** 是否显示时间戳列。 */
  readonly showTime?: boolean;
  /** 超出这个行数时只保留末尾的 (由使用方裁剪更可控, 这里只是兜底提示)。 */
  readonly className?: string;
  /** 空状态。 */
  readonly emptyText?: string;
}

const LEVEL_STYLE: Record<LogLevel, { text: string; label: string }> = {
  debug: { text: "text-muted-foreground/70", label: "DEBUG" },
  info: { text: "text-foreground/85", label: "INFO" },
  warn: { text: "text-amber-500", label: "WARN" },
  error: { text: "text-destructive", label: "ERROR" },
  success: { text: "text-emerald-500", label: "OK" },
};

const LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error", "success"];

/** 把数字时间戳格式化成 HH:MM:SS.mmm。字符串则原样用, 格式交给使用方。 */
function formatTime(t: string | number): string {
  if (typeof t === "string") return t;
  const d = new Date(t);
  const pad = (n: number, w = 2): string => String(n).padStart(w, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

export function LogViewer({
  lines,
  height = 320,
  showFilter = true,
  showTime = true,
  className,
  emptyText = "暂无日志",
}: LogViewerProps): JSX.Element {
  const [hidden, setHidden] = useState<ReadonlySet<LogLevel>>(() => new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  /**
   * 「是否粘底」。用 ref 而不是 state: 它只在滚动事件里读写, 不需要触发渲染,
   * 用 state 会让每次滚动都重渲染整个日志列表。
   */
  const pinnedRef = useRef(true);

  const toggle = useCallback((level: LogLevel) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }, []);

  // 每级条数。过滤按钮上要显示它, 否则过滤后看不出总共出了几条错。
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of lines) c[l.level] = (c[l.level] ?? 0) + 1;
    return c;
  }, [lines]);

  const visible = useMemo(
    () => (hidden.size === 0 ? lines : lines.filter((l) => !hidden.has(l.level))),
    [lines, hidden],
  );

  /**
   * 自动滚动。只在「用户处于底部」时跟随。
   *
   * 判定留了 24px 容差 —— 用 === scrollHeight 判会因为亚像素误差在临界点抖动,
   * 表现为"有时跟着滚有时不跟"。
   */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !pinnedRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [visible.length]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    pinnedRef.current = distanceToBottom < 24;
  }, []);

  return (
    <div
      className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}
    >
      {showFilter ? (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-3 py-2">
          {LEVELS.map((lv) => {
            const off = hidden.has(lv);
            const n = counts[lv] ?? 0;
            return (
              <button
                key={lv}
                type="button"
                onClick={() => toggle(lv)}
                aria-pressed={!off}
                className={cn(
                  "rounded-md border px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wide transition-colors",
                  off
                    ? "border-border/50 text-muted-foreground/40 hover:text-muted-foreground"
                    : cn("border-border", LEVEL_STYLE[lv].text),
                )}
              >
                {LEVEL_STYLE[lv].label}
                {/* 条数为 0 时不显示 —— 一排 "0" 是噪音 */}
                {n > 0 ? <span className="ml-1 opacity-60">{n}</span> : null}
              </button>
            );
          })}
          <span className="ml-auto text-[11px] text-muted-foreground">
            {visible.length} / {lines.length}
          </span>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="overflow-y-auto px-3 py-2 font-mono text-[11.5px] leading-[1.7]"
        style={{ maxHeight: typeof height === "number" ? `${height}px` : height }}
        role="log"
        aria-live="polite"
      >
        {visible.length === 0 ? (
          <div className="py-6 text-center text-[12px] text-muted-foreground">{emptyText}</div>
        ) : (
          visible.map((line) => (
            <div key={line.id} className="flex gap-2">
              {showTime && line.time !== undefined ? (
                <span className="shrink-0 select-none text-muted-foreground/50">
                  {formatTime(line.time)}
                </span>
              ) : null}
              <span className={cn("shrink-0 select-none", LEVEL_STYLE[line.level].text)}>
                {LEVEL_STYLE[line.level].label.padEnd(5, " ")}
              </span>
              {/*
                whitespace-pre-wrap 保留前导空格 (日志里常用来对齐),
                break-words 让长行折行而不是撑出横向滚动条 —— 横滚条会破坏列对齐的观感。
              */}
              <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-foreground/90">
                {line.message}
                {line.detail ? (
                  <span className="mt-0.5 block text-muted-foreground/70">{line.detail}</span>
                ) : null}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * 把日志行按"流的方向"上色。给 HTTP / WebSocket 场景用。
 *
 * 为什么单独给一个工具: 网络日志里最常见的问题是"分不清哪条是发出去的、哪条是收到的"。
 * 光靠文案区分不够快, 加一个方向标记能一眼扫出一来一回。
 */
export type LogDirection = "send" | "recv" | "system";

export function networkLogLine(
  direction: LogDirection,
  message: string,
  opts?: { id?: string; time?: number; detail?: string },
): LogLine {
  const prefix = direction === "send" ? "→ " : direction === "recv" ? "← " : "· ";
  // 方向标记用 success 级别露出来, 系统行用 info
  const level: LogLevel = direction === "system" ? "info" : "success";
  return {
    id: opts?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    time: opts?.time ?? Date.now(),
    message: prefix + message,
    detail: opts?.detail,
  };
}