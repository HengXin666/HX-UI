'use client';

import * as React from 'react';
import { Collapsible as CollapsiblePrimitive } from 'radix-ui';
import { BrainIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '../primitives/utils';
import { AGENT_NEWLINE, AGENT_NUMBERS, AGENT_SLOT } from '../constants/agent';
import { TASK_STATUS } from '../constants/ui';
import { AGENT_CLS, isAgentText, AGENT_UNIT } from '../constants/agent';

/**
 * 思考过程 (对标 Claude / Codex 的 thinking 折叠块).
 *
 * 进行中: 图标呼吸 + 标题扫光 + 秒级计时, 下方一行实时摘要 (取最新的标题或粗体行), 摘要变化时上滑淡入.
 * 结束: 自动收成 已思考 18s 一行, 点开看全文.
 * 首个 token 到达前 (content 为空) 也要渲染, 这是让用户感知到在思考的关键.
 * 展开的全文贴底跟随; 用户上滚后停止跟随, 滚回底部再恢复.
 */
const NEWLINE = AGENT_NEWLINE;
const { headlineMax: HEADLINE_MAX, tickMs: TICK_MS, stickPx: STICK_THRESHOLD_PX } = AGENT_NUMBERS;
const BOLD = '**';
const HEADING = '#';

export type ThinkingStatus = typeof TASK_STATUS.running | typeof TASK_STATUS.done;

export interface ThinkingProps {
  /** 已到达的思考原文. */
  readonly content: string;
  readonly status?: ThinkingStatus;
  /** 开始时间 (ms). 给了才显示计时. */
  readonly startedAt?: number;
  /** 结束时间 (ms). done 时用它定格耗时. */
  readonly endedAt?: number;
  /** 覆盖自动提取的摘要 (例如后端直接给了 summary). */
  readonly headline?: React.ReactNode;
  readonly defaultOpen?: boolean;
  readonly labels?: { readonly running?: string; readonly done?: string };
  readonly className?: string;
}

function isMarked(line: string): boolean {
  return line.startsWith(HEADING) || (line.startsWith(BOLD) && line.endsWith(BOLD) && line.length > BOLD.length + BOLD.length);
}

function stripMarks(line: string): string {
  let text = line;
  while (text.startsWith(HEADING)) {
    text = text.slice(HEADING.length);
  }
  text = text.trim();
  if (text.startsWith(BOLD) && text.endsWith(BOLD) && text.length > BOLD.length + BOLD.length) {
    text = text.slice(BOLD.length, -BOLD.length);
  }
  return text.trim();
}

/** 从思考流里取当前小节标题: 优先最新的标题/粗体行, 否则最后一行. */
export function extractHeadline(content: string): string {
  const lines = content.split(NEWLINE).map((line) => line.trim()).filter((line) => line.length > 0);
  const marked = [...lines].reverse().find(isMarked);
  const text = stripMarks(marked ?? lines[lines.length - 1] ?? '');
  return text.length > HEADLINE_MAX ? text.slice(0, HEADLINE_MAX) + '…' : text;
}

export function useElapsedSeconds(startedAt: number | undefined, endedAt: number | undefined, running: boolean): number {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!running) {
      return undefined;
    }
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [running]);
  if (startedAt === undefined) {
    return 0;
  }
  const end = endedAt ?? (running ? now : startedAt);
  return Math.max(0, Math.round((end - startedAt) / TICK_MS));
}

export function Thinking({
  content,
  status = TASK_STATUS.running,
  startedAt,
  endedAt,
  headline,
  defaultOpen = false,
  labels,
  className,
}: ThinkingProps): React.JSX.Element {
  const running = status === TASK_STATUS.running;
  const seconds = useElapsedSeconds(startedAt, endedAt, running);
  const [open, setOpen] = React.useState(defaultOpen);
  const [prevStatus, setPrevStatus] = React.useState(status);
  if (prevStatus !== status) {
    setPrevStatus(status);
    if (status === TASK_STATUS.done) {
      setOpen(false);
    }
  }
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const stick = React.useRef(true);
  const onScroll = React.useCallback(() => {
    const el = bodyRef.current;
    if (el) {
      stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX;
    }
  }, []);
  React.useLayoutEffect(() => {
    const el = bodyRef.current;
    if (el && stick.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [content, open]);
  const line = headline ?? extractHeadline(content);
  const label = running ? (labels?.running ?? '思考中') : (labels?.done ?? '已思考');
  const hasBody = content.trim().length > 0;
  const showTimer = startedAt !== undefined && (running || seconds > 0);
  return (
    <CollapsiblePrimitive.Root
      data-slot={AGENT_SLOT.thinking}
      data-status={status}
      open={open}
      onOpenChange={setOpen}
      className={cn(AGENT_CLS.colMin, className)}
    >
      <CollapsiblePrimitive.Trigger
        disabled={!hasBody}
        className='group/thinking flex min-h-6 items-center gap-1.5 text-left text-[13px] text-muted-foreground outline-none enabled:cursor-pointer enabled:hover:text-heading focus-visible:text-link'
      >
        <BrainIcon aria-hidden className={cn(AGENT_CLS.icon, running && 'animate-pulse text-link motion-reduce:animate-none')} />
        <span data-slot='thinking-label' className={cn(AGENT_CLS.medium, running && AGENT_CLS.shimmer)}>{label}</span>
        {showTimer && <span className={AGENT_CLS.nums}>{running ? '· ' + seconds + AGENT_UNIT.second : seconds + AGENT_UNIT.second}</span>}
        {hasBody && (
          <ChevronRightIcon aria-hidden className='size-3.5 shrink-0 transition-transform duration-(--duration-base) group-data-[state=open]/thinking:rotate-90' />
        )}
      </CollapsiblePrimitive.Trigger>
      {running && !open && line && (
        <div
          key={isAgentText(line) ? line : undefined}
          data-slot='thinking-headline'
          className='truncate pl-5 text-[12px] text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-1 duration-(--duration-base) motion-reduce:animate-none'
        >
          {line}
        </div>
      )}
      {hasBody && (
        <CollapsiblePrimitive.Content className={AGENT_CLS.collapse}>
          <div
            ref={bodyRef}
            onScroll={onScroll}
            data-slot='thinking-body'
            className='mt-1 ml-1.5 max-h-60 overflow-y-auto border-l border-border pl-3 text-[12px] leading-relaxed whitespace-pre-wrap text-muted-foreground [mask-image:linear-gradient(to_bottom,transparent,black_16px)]'
          >
            {content}
          </div>
        </CollapsiblePrimitive.Content>
      )}
    </CollapsiblePrimitive.Root>
  );
}
