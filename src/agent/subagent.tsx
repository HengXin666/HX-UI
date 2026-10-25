'use client';

import * as React from 'react';
import { Collapsible as CollapsiblePrimitive } from 'radix-ui';
import { BotIcon, ChevronRightIcon, GitBranchIcon, WorkflowIcon } from 'lucide-react';
import { cn } from '../primitives/utils';
import { StatusGlyph, type TodoStatus } from './todo-tree';
import { useElapsedSeconds } from './thinking';
import { TODO_STATUS } from '../constants/agent';
import { AGENT_CLS, AGENT_UNIT } from '../constants/agent';

/**
 * 子代理与发散思考的可视化.
 *
 * - SubagentCard: 一个子代理一张卡. 头部是状态, 角色, 任务, 计时; 主体放它自己的轨迹 (一般是 TraceLive).
 * 进行中自动展开, 完成后收起, 只留一行结果摘要.
 * - SubagentGroup: 并行的一组子代理, 头部自动统计完成数与进度, 左侧连接线接到父级.
 * - ThinkingBranches: 发散思考. 进行中展开每个方向的进展, 选定后收成一行, 落选的置灰并保留放弃理由.
 */
function isClosed(status: TodoStatus | undefined): boolean {
  return status === TODO_STATUS.done || status === TODO_STATUS.skipped;
}

const COLLAPSE_CONTENT = AGENT_CLS.collapse;
const CHEVRON = 'size-3.5 shrink-0 text-muted-foreground transition-transform duration-(--duration-base)';

export interface SubagentCardProps {
  readonly role: React.ReactNode;
  readonly task: React.ReactNode;
  readonly status?: TodoStatus;
  readonly startedAt?: number;
  readonly endedAt?: number;
  /** 完成后折叠态下显示的一行结果. */
  readonly summary?: React.ReactNode;
  readonly icon?: React.ReactNode;
  readonly className?: string;
  /** 子代理自己的轨迹. */
  readonly children?: React.ReactNode;
}

export function SubagentCard({ role, task, status = TODO_STATUS.running, startedAt, endedAt, summary, icon, className, children }: SubagentCardProps): React.JSX.Element {
  const running = status === TODO_STATUS.running;
  const seconds = useElapsedSeconds(startedAt, endedAt, running);
  const active = running || status === TODO_STATUS.error;
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
  const hasBody = React.Children.toArray(children).length > 0;
  return (
    <CollapsiblePrimitive.Root
      data-slot='subagent'
      data-status={status}
      open={open}
      onOpenChange={setOpen}
      className={cn('flex min-w-0 flex-col rounded-lg border border-border-muted bg-muted/30 transition-colors duration-(--duration-base)', running && 'border-link/30', className)}
    >
      <CollapsiblePrimitive.Trigger
        disabled={!hasBody}
        className='group/subagent flex min-h-8 w-full items-center gap-2 px-2.5 text-left text-[13px] outline-none enabled:cursor-pointer focus-visible:text-link'
      >
        <StatusGlyph status={status} />
        <span className='flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-3.5'>{icon ?? <BotIcon />}</span>
        <span className='shrink-0 font-medium text-heading'>{role}</span>
        <span className={cn(AGENT_CLS.truncMuted, running && AGENT_CLS.shimmer)}>{task}</span>
        {startedAt !== undefined && <span className='shrink-0 text-[12px] tabular-nums text-muted-foreground'>{seconds + AGENT_UNIT.second}</span>}
        {hasBody && <ChevronRightIcon aria-hidden className={cn(CHEVRON, 'group-data-[state=open]/subagent:rotate-90')} />}
      </CollapsiblePrimitive.Trigger>
      {!open && isClosed(status) && summary && (
        <div className='truncate px-2.5 pb-1.5 pl-[34px] text-[12px] text-muted-foreground animate-in fade-in-0 duration-(--duration-base) motion-reduce:animate-none'>{summary}</div>
      )}
      {hasBody && (
        <CollapsiblePrimitive.Content className={COLLAPSE_CONTENT}>
          <div className='border-t border-border-muted px-2.5 py-2'>{children}</div>
        </CollapsiblePrimitive.Content>
      )}
    </CollapsiblePrimitive.Root>
  );
}

export interface SubagentGroupProps {
  /** 组标题; 缺省为 并行 N 个子任务. */
  readonly title?: React.ReactNode;
  readonly className?: string;
  /** 若干 SubagentCard; 完成数从它们的 status 读取. */
  readonly children?: React.ReactNode;
}

export function SubagentGroup({ title, className, children }: SubagentGroupProps): React.JSX.Element {
  const cards = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<{ status?: TodoStatus }>[];
  const total = cards.length;
  const done = cards.filter((card) => isClosed(card.props.status)).length;
  const ratio = total > 0 ? done / total : 0;
  return (
    <div data-slot='subagent-group' className={cn(AGENT_CLS.colGap, className)}>
      <div className='flex items-center gap-2 text-[12px] text-muted-foreground'>
        <WorkflowIcon aria-hidden className={AGENT_CLS.icon} />
        <span className={cn(AGENT_CLS.heading, done < total && AGENT_CLS.shimmer)}>{title ?? '并行 ' + total + ' 个子任务'}</span>
        <span className={AGENT_CLS.nums}>{done + AGENT_UNIT.slash + total}</span>
        <span aria-hidden className='h-1 flex-1 overflow-hidden rounded-full bg-muted'>
          <span
            className='block h-full origin-left rounded-full bg-success/60 transition-transform duration-(--duration-slow) ease-out motion-reduce:transition-none'
            style={{ transform: 'scaleX(' + ratio + ')' }}
          />
        </span>
      </div>
      <div className='ml-[7px] flex flex-col gap-1.5 border-l border-border pl-3'>{children}</div>
    </div>
  );
}

export interface ThinkingBranch {
  readonly id: string;
  readonly label: React.ReactNode;
  readonly status?: TodoStatus;
  /** 进行中的一句进展. */
  readonly note?: React.ReactNode;
  /** 落选理由 (或选中理由), 收敛后展开可见. */
  readonly reason?: React.ReactNode;
}

export interface ThinkingBranchesProps {
  readonly branches: readonly ThinkingBranch[];
  /** 选定的分支; 给了即视为收敛. */
  readonly chosenId?: string;
  readonly className?: string;
}

export function ThinkingBranches({ branches, chosenId, className }: ThinkingBranchesProps): React.JSX.Element {
  const decided = chosenId !== undefined;
  const chosen = branches.find((branch) => branch.id === chosenId);
  const [open, setOpen] = React.useState(!decided);
  const [prevDecided, setPrevDecided] = React.useState(decided);
  if (prevDecided !== decided) {
    setPrevDecided(decided);
    setOpen(!decided);
  }
  const count = branches.length;
  return (
    <CollapsiblePrimitive.Root data-slot='thinking-branches' data-decided={decided} open={open} onOpenChange={setOpen} className={cn(AGENT_CLS.colMin, className)}>
      <CollapsiblePrimitive.Trigger className='group/branches flex min-h-6 items-center gap-1.5 text-left text-[13px] text-muted-foreground outline-none cursor-pointer hover:text-heading focus-visible:text-link'>
        <GitBranchIcon aria-hidden className={cn(AGENT_CLS.icon, !decided && 'animate-pulse text-link motion-reduce:animate-none')} />
        <span className={cn(AGENT_CLS.medium, !decided && AGENT_CLS.shimmer)}>{decided ? '比较了 ' + count + ' 个方向' : '正在比较 ' + count + ' 个方向'}</span>
        {chosen && (
          <span className='min-w-0 truncate'>
            {'→ 选定 '}
            <span className={AGENT_CLS.heading}>{chosen.label}</span>
          </span>
        )}
        <ChevronRightIcon aria-hidden className={cn(CHEVRON, 'group-data-[state=open]/branches:rotate-90')} />
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content className={COLLAPSE_CONTENT}>
        <ul className='mt-1 ml-1.5 flex flex-col gap-0.5 border-l border-border pl-3'>
          {branches.map((branch) => {
            const isChosen = branch.id === chosenId;
            const dropped = decided && !isChosen;
            return (
              <li
                key={branch.id}
                data-slot='thinking-branch'
                className={cn('flex min-h-6 items-center gap-1.5 rounded-md px-1 text-[12.5px] transition-opacity duration-(--duration-base)', isChosen && 'bg-link/5', dropped && 'opacity-60')}
              >
                <StatusGlyph status={dropped ? TODO_STATUS.skipped : (branch.status ?? (decided ? TODO_STATUS.done : TODO_STATUS.running))} />
                <span className={cn(AGENT_CLS.shrink, isChosen ? AGENT_CLS.heading : AGENT_CLS.fg, dropped && 'line-through')}>{branch.label}</span>
                {(decided ? branch.reason : branch.note) && (
                  <span className={AGENT_CLS.truncMuted}>{decided ? branch.reason : branch.note}</span>
                )}
              </li>
            );
          })}
        </ul>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}
