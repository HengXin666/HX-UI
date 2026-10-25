'use client';

import * as React from 'react';
import { CheckIcon, ChevronRightIcon, CircleDashedIcon, Loader2Icon, MinusCircleIcon, XIcon } from 'lucide-react';
import { cn } from '../primitives/utils';
import { TONE, UI_CLASSES } from '../constants';
import { TODO_STATUS } from '../constants/agent';
import { AGENT_BUTTON_TYPE, AGENT_CLS, AGENT_TOGGLE, AGENT_UNIT } from '../constants/agent';

/**
 * 分层 todo (对标 omp 的实时任务树).
 *
 * - 树状缩进, 子任务左侧 1px 连接线.
 * - 父节点状态由子任务推导: 有失败即失败, 有进行中或部分完成即进行中, 全部完成即完成.
 * - 进行中 / 失败的分支自动展开, 完成的分支自动折叠; 用户手动切换后保持, 直到状态再次变化.
 * - 原地更新: 同一棵树随数据变化, 不在消息流里重复打印.
 */
export type TodoStatus = (typeof TODO_STATUS)[keyof typeof TODO_STATUS];

export interface TodoNode {
  readonly id: string;
  readonly title: React.ReactNode;
  /** 叶子节点的状态; 有 children 时由子节点推导, 这里的值被忽略. */
  readonly status?: TodoStatus;
  /** 进行中时显示在标题下方的一句进展. */
  readonly note?: React.ReactNode;
  readonly children?: readonly TodoNode[];
}

const ICON: Record<TodoStatus, React.ReactNode> = {
  pending: <CircleDashedIcon className={UI_CLASSES.muted} />,
  running: <Loader2Icon className='animate-spin text-link motion-reduce:animate-none' />,
  done: <CheckIcon className={TONE.successFg} />,
  error: <XIcon className={TONE.dangerFg} />,
  skipped: <MinusCircleIcon className={UI_CLASSES.muted} />,
};

const TITLE: Record<TodoStatus, string> = {
  pending: UI_CLASSES.muted,
  running: 'font-medium text-heading hx-shimmer',
  done: UI_CLASSES.muted,
  error: TONE.dangerFg,
  skipped: cn(UI_CLASSES.muted, 'line-through'),
};

/** 状态图标, 与 Trace / 子代理卡共用一套视觉. key 随状态变化, 切换时缩放进场. */
export function StatusGlyph({ status, className }: { readonly status: TodoStatus; readonly className?: string }): React.JSX.Element {
  return (
    <span
      key={status}
      data-slot='status-glyph'
      data-status={status}
      className={cn('flex size-4 shrink-0 items-center justify-center animate-in zoom-in-75 fade-in-0 duration-(--duration-base) motion-reduce:animate-none [&_svg]:size-3.5', className)}
    >
      {ICON[status]}
    </span>
  );
}

function isClosed(status: TodoStatus): boolean {
  return status === TODO_STATUS.done || status === TODO_STATUS.skipped;
}

export function deriveTodoStatus(node: TodoNode): TodoStatus {
  const kids = node.children ?? [];
  if (kids.length === 0) {
    return node.status ?? TODO_STATUS.pending;
  }
  const states = kids.map(deriveTodoStatus);
  if (states.includes(TODO_STATUS.error)) {
    return TODO_STATUS.error;
  }
  if (states.every(isClosed)) {
    return TODO_STATUS.done;
  }
  if (states.some((s) => s === TODO_STATUS.running || isClosed(s))) {
    return TODO_STATUS.running;
  }
  return TODO_STATUS.pending;
}

function countLeaves(nodes: readonly TodoNode[]): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const node of nodes) {
    const kids = node.children ?? [];
    if (kids.length > 0) {
      const sub = countLeaves(kids);
      done += sub.done;
      total += sub.total;
    } else {
      total += 1;
      if (isClosed(node.status ?? TODO_STATUS.pending)) {
        done += 1;
      }
    }
  }
  return { done, total };
}

function TodoItem({ node }: { readonly node: TodoNode }): React.JSX.Element {
  const status = deriveTodoStatus(node);
  const kids = node.children ?? [];
  const hasKids = kids.length > 0;
  const active = status === TODO_STATUS.running || status === TODO_STATUS.error;
  const [open, setOpen] = React.useState(active);
  const [prevStatus, setPrevStatus] = React.useState(status);
  if (prevStatus !== status) {
    setPrevStatus(status);
    if (isClosed(status)) {
      setOpen(false);
    } else if (active) {
      setOpen(true);
    }
  }
  const closedKids = kids.filter((kid) => isClosed(deriveTodoStatus(kid))).length;
  return (
    <li data-slot='todo-item' data-status={status} className={AGENT_CLS.col}>
      <div className={cn('flex min-h-6 items-center gap-1.5 rounded-md px-1 text-[13px] transition-colors duration-(--duration-base)', status === TODO_STATUS.running && 'bg-link/5')}>
        {hasKids ? (
          <button
            type={AGENT_BUTTON_TYPE}
            aria-expanded={open}
            aria-label={open ? AGENT_TOGGLE.collapse : AGENT_TOGGLE.expand}
            onClick={() => setOpen((value) => !value)}
            className='flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground outline-none hover:text-heading focus-visible:text-link'
          >
            <ChevronRightIcon className={cn('size-3.5 transition-transform duration-(--duration-base)', open && AGENT_CLS.rotate)} />
          </button>
        ) : (
          <span aria-hidden className={AGENT_CLS.iconLg} />
        )}
        <StatusGlyph status={status} />
        <span className={cn(AGENT_CLS.trunc, TITLE[status])}>{node.title}</span>
        {hasKids && <span className='shrink-0 text-[12px] tabular-nums text-muted-foreground'>{closedKids + AGENT_UNIT.slash + kids.length}</span>}
      </div>
      {status === TODO_STATUS.running && node.note && (
        <div className='truncate pl-12 text-[12px] text-muted-foreground animate-in fade-in-0 duration-(--duration-base) motion-reduce:animate-none'>{node.note}</div>
      )}
      {hasKids && open && (
        <ul className='ml-[15px] flex flex-col border-l border-border pl-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-(--duration-base) motion-reduce:animate-none'>
          {kids.map((kid) => <TodoItem key={kid.id} node={kid} />)}
        </ul>
      )}
    </li>
  );
}

export interface TodoTreeProps {
  readonly items: readonly TodoNode[];
  /** 头部标题; null 不显示头部 (嵌在别的卡里时). */
  readonly title?: React.ReactNode | null;
  readonly className?: string;
}

export function TodoTree({ items, title, className }: TodoTreeProps): React.JSX.Element {
  const { done, total } = countLeaves(items);
  const ratio = total > 0 ? done / total : 0;
  return (
    <div data-slot='todo-tree' className={cn('flex flex-col gap-1', className)}>
      {title !== null && (
        <div className='flex items-center gap-2 px-1 text-[12px] text-muted-foreground'>
          <span className={AGENT_CLS.heading}>{title ?? '计划'}</span>
          <span className={AGENT_CLS.nums}>{done + AGENT_UNIT.slash + total}</span>
          <span aria-hidden className='h-1 flex-1 overflow-hidden rounded-full bg-muted'>
            <span
              className='block h-full origin-left rounded-full bg-success/60 transition-transform duration-(--duration-slow) ease-out motion-reduce:transition-none'
              style={{ transform: 'scaleX(' + ratio + ')' }}
            />
          </span>
        </div>
      )}
      <ul className={AGENT_CLS.col}>
        {items.map((node) => <TodoItem key={node.id} node={node} />)}
      </ul>
    </div>
  );
}
