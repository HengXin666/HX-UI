"use client";

import * as React from "react";
import { CheckIcon, CopyIcon, XIcon } from "lucide-react";
import { BUTTON_TYPE } from "../../constants";
import { BLOCK_DEFAULT } from "../../constants/blocks";
import {
  COPY_FEEDBACK_MS,
  COPY_STATE,
  DEV_BLOCK_CLASS,
  INSTALL_BLOCK_CLASS,
  INSTALL_BLOCK_SLOT,
  type INSTALL_BLOCK_SLOTS,
  INSTALL_VARIANT,
  LINE_BREAK,
  MARKETING_V106_DEFAULT,
  TAB_VALUE_PREFIX,
  copyText,
  devLabelsFor,
  type CopyState,
  type DevLabels,
} from "../../constants/blocks-marketing-v106";
import { IconSlot } from "../../layout/Icon";
import { Button } from "../../primitives/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../primitives/tabs";
import { cn } from "../../primitives/utils";
import { BlockShell, resolveSlots } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { CtaGroup, renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, BlockLabels, BlockShellSlot, BlockShellState, Cta, IconName, Rich, SectionHeadingData, SlotClassNames } from "../_shared/types";

/** 区块内部部件的 slot 名 (与 BlockShell 的 root / backdrop / container / content 并列). */
export type InstallBlockSlot = (typeof INSTALL_BLOCK_SLOTS)[number];

/** 一条安装命令 (一个包管理器 tab). command 给数组或含换行的字符串即多行. */
export interface InstallCommand {
  /** 包管理器 / 方式名, 也是 tab 文案: "npm" | "pnpm" | "yarn" | "bun" | "curl" | 任意. */
  manager?: string;
  /** tab 文案; 不给时用 manager. */
  label?: string;
  command: string | string[];
  /** 命令下方的补充说明. */
  note?: Rich;
}

/** 一个操作系统 tab (deno 那种), 内含一条或多条 (多包管理器) 命令. */
export interface InstallPlatform {
  label: string;
  value?: string;
  icon?: IconName;
  commands: InstallCommand[];
}

/** 备用方式 ("或用 Docker"): 可带命令 (同样可复制) 或链接. */
export interface InstallAlternative {
  label: Rich;
  description?: Rich;
  command?: string | string[];
  href?: string;
}

export interface InstallBlockProps extends Omit<BlockBaseProps, "labels" | "classNames"> {
  heading?: SectionHeadingData;
  /** 多包管理器 tabs; 只有一条时不出标签条. 与 platforms 二选一, platforms 优先. */
  commands?: InstallCommand[];
  /** 多操作系统 tabs. */
  platforms?: InstallPlatform[];
  alternatives?: InstallAlternative[];
  /** 备用方式小标题 (可见文案由调用方给). */
  alternativesTitle?: Rich;
  /** pill: 胶囊单行; card: 卡片. */
  variant?: (typeof INSTALL_VARIANT)[keyof typeof INSTALL_VARIANT];
  /** 每行行首提示符, 传空串关闭. */
  prompt?: string;
  /** 轻量版: 不包 BlockShell, 直接嵌进 Hero 等容器. */
  embedded?: boolean;
  actions?: Cta[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  classNames?: SlotClassNames<BlockShellSlot | InstallBlockSlot, BlockShellState>;
  labels?: Partial<BlockLabels & DevLabels>;
  ref?: React.Ref<HTMLElement>;
}

type Labels = BlockLabels & DevLabels;
type Cls = Partial<Record<string, string>>;

const linesOf = (command: string | string[]): string[] => (Array.isArray(command) ? command : command.split(LINE_BREAK));

/** 复制按钮: 成功 / 失败切换 data-state 与图标, 并经 aria-live 播报; 1.5s 后复位. */
function CopyButton({ text, labels, className }: { text: string; labels: Labels; className?: string }): React.JSX.Element {
  const [state, setState] = React.useState<CopyState>(COPY_STATE.idle);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const onCopy = async (): Promise<void> => {
    const ok = await copyText(text);
    setState(ok ? COPY_STATE.copied : COPY_STATE.failed);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState(COPY_STATE.idle), COPY_FEEDBACK_MS);
  };
  const message = state === COPY_STATE.copied ? labels.copied : state === COPY_STATE.failed ? labels.copyFailed : "";
  const Icon = state === COPY_STATE.copied ? CheckIcon : state === COPY_STATE.failed ? XIcon : CopyIcon;
  const iconClass = state === COPY_STATE.copied ? DEV_BLOCK_CLASS.copyIconOk : state === COPY_STATE.failed ? DEV_BLOCK_CLASS.copyIconFail : DEV_BLOCK_CLASS.copyIcon;
  return (
    <>
      <Button type={BUTTON_TYPE} variant="ghost" size="icon-sm" data-slot={INSTALL_BLOCK_SLOT.copy} data-state={state} aria-label={labels.copyCommand} title={labels.copyCommand} onClick={() => void onCopy()} className={cn(DEV_BLOCK_CLASS.copyButton, className)}>
        <Icon aria-hidden className={iconClass} />
      </Button>
      <span data-slot={INSTALL_BLOCK_SLOT.status} role="status" aria-live="polite" className={DEV_BLOCK_CLASS.srOnly}>{message}</span>
    </>
  );
}

interface LineProps { command: string | string[]; pill: boolean; prompt: string; labels: Labels; cls: Cls }

/** 命令本体: 每行一个提示符 (aria-hidden, 不进复制内容); 横向滚动, 不折行. */
function CommandLines({ command, pill, prompt, labels, cls }: LineProps): React.JSX.Element {
  const lines = linesOf(command);
  return (
    <div data-slot={INSTALL_BLOCK_SLOT.command} data-variant={pill ? INSTALL_VARIANT.pill : INSTALL_VARIANT.card} className={cn(pill ? INSTALL_BLOCK_CLASS.pillCommand : INSTALL_BLOCK_CLASS.cardCommand, cls.command)}>
      <pre data-slot={INSTALL_BLOCK_SLOT.lines} tabIndex={0} className={INSTALL_BLOCK_CLASS.lines}>
        {lines.map((line, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 命令行可能重复, 顺序即身份
          <code key={i} data-slot={INSTALL_BLOCK_SLOT.line} className={cn(INSTALL_BLOCK_CLASS.line, cls.line)}>
            {prompt !== "" && <span aria-hidden data-slot={INSTALL_BLOCK_SLOT.prompt} className={cn(INSTALL_BLOCK_CLASS.prompt, cls.prompt)}>{prompt}</span>}
            <span data-slot={INSTALL_BLOCK_SLOT.text} className={INSTALL_BLOCK_CLASS.text}>{line}</span>
          </code>
        ))}
      </pre>
      <CopyButton text={lines.join(LINE_BREAK)} labels={labels} className={cls.copy} />
    </div>
  );
}

interface GroupProps { commands: InstallCommand[]; pill: boolean; prompt: string; labels: Labels; cls: Cls; defaultValue?: string; onValueChange?: (v: string) => void }

/** 包管理器一组: 多条时出 pill 标签条. */
function ManagerGroup({ commands, pill, prompt, labels, cls, defaultValue, onValueChange }: GroupProps): React.JSX.Element | null {
  if (commands.length === 0) return null;
  const line = { pill, prompt, labels, cls };
  const one = (c: InstallCommand): React.ReactNode => (
    <>
      <CommandLines command={c.command} {...line} />
      {c.note !== undefined && <p data-slot={INSTALL_BLOCK_SLOT.note} className={INSTALL_BLOCK_CLASS.note}>{c.note}</p>}
    </>
  );
  if (commands.length === 1) return <div className={INSTALL_BLOCK_CLASS.tabs}>{one(commands[0])}</div>;
  const val = (c: InstallCommand, i: number): string => c.manager ?? `${TAB_VALUE_PREFIX.manager}${i}`;
  return (
    <Tabs data-slot={INSTALL_BLOCK_SLOT.tabs} defaultValue={defaultValue ?? val(commands[0], 0)} onValueChange={onValueChange} className={cn(INSTALL_BLOCK_CLASS.tabs, cls.tabs)}>
      <div className={DEV_BLOCK_CLASS.tabScroller}>
        <TabsList variant="pill" aria-label={labels.managers} data-slot={INSTALL_BLOCK_SLOT.tabList} className={cls["tab-list"]}>
          {commands.map((c, i) => <TabsTrigger key={val(c, i)} value={val(c, i)}>{c.label ?? c.manager ?? val(c, i)}</TabsTrigger>)}
        </TabsList>
      </div>
      {commands.map((c, i) => <TabsContent key={val(c, i)} value={val(c, i)} className={INSTALL_BLOCK_CLASS.tabs}>{one(c)}</TabsContent>)}
    </Tabs>
  );
}

/**
 * 安装命令区块 (tailwind / bun / nextjs 的命令 + 复制, deno 的操作系统 tabs).
 * 复制在 HTTPS 下走 navigator.clipboard, 非安全上下文降级 execCommand, 结果经 aria-live 播报.
 * embedded 时不包 BlockShell, 可直接放进 Hero. 遵循 docs/architecture/component-contract.md.
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-marketing-developer.md
 */
export function InstallBlock({
  heading,
  commands = [],
  platforms,
  alternatives,
  alternativesTitle,
  variant = MARKETING_V106_DEFAULT.installVariant,
  prompt = MARKETING_V106_DEFAULT.prompt,
  embedded = false,
  actions,
  defaultValue,
  onValueChange,
  classNames,
  labels: labelsProp,
  ...shell
}: InstallBlockProps): React.JSX.Element {
  const ctx = useBlocks();
  const labels: Labels = { ...ctx.labels, ...devLabelsFor(ctx.locale), ...labelsProp } as Labels;
  const state: BlockShellState = { tone: shell.tone ?? BLOCK_DEFAULT.tone, pad: shell.pad ?? BLOCK_DEFAULT.pad, width: shell.width ?? BLOCK_DEFAULT.width, align: shell.align ?? BLOCK_DEFAULT.align };
  const cls: Cls = resolveSlots(classNames, state);
  const pill = variant === INSTALL_VARIANT.pill;
  const group = { pill, prompt, labels, cls };
  const pval = (p: InstallPlatform, i: number): string => p.value ?? `${TAB_VALUE_PREFIX.platform}${i}`;

  const main =
    platforms && platforms.length > 0 ? (
      <Tabs data-slot={INSTALL_BLOCK_SLOT.tabs} defaultValue={defaultValue ?? pval(platforms[0], 0)} onValueChange={onValueChange} className={cn(INSTALL_BLOCK_CLASS.tabs, cls.tabs)}>
        <div className={DEV_BLOCK_CLASS.tabScroller}>
          <TabsList aria-label={labels.platforms} data-slot={INSTALL_BLOCK_SLOT.tabList} className={cls["tab-list"]}>
            {platforms.map((p, i) => (
              <TabsTrigger key={pval(p, i)} value={pval(p, i)}>
                {p.icon !== undefined && <span aria-hidden data-slot={INSTALL_BLOCK_SLOT.tabIcon} className={DEV_BLOCK_CLASS.tabIcon}><IconSlot source={p.icon} /></span>}
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {platforms.map((p, i) => <TabsContent key={pval(p, i)} value={pval(p, i)}><ManagerGroup commands={p.commands} {...group} /></TabsContent>)}
      </Tabs>
    ) : (
      <ManagerGroup commands={commands} {...group} defaultValue={defaultValue} onValueChange={onValueChange} />
    );

  const extras = alternatives && alternatives.length > 0 && (
    <div data-slot={INSTALL_BLOCK_SLOT.alternatives} className={cn(INSTALL_BLOCK_CLASS.alternatives, cls.alternatives)}>
      {alternativesTitle !== undefined && <p data-slot={INSTALL_BLOCK_SLOT.alternativesTitle} className={INSTALL_BLOCK_CLASS.alternativesTitle}>{alternativesTitle}</p>}
      {alternatives.map((alt, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: label 可为节点, 顺序即身份
        <div key={i} data-slot={INSTALL_BLOCK_SLOT.alternative} className={INSTALL_BLOCK_CLASS.alternative}>
          {alt.href !== undefined ? <a href={alt.href} className={INSTALL_BLOCK_CLASS.alternativeLink}>{alt.label}</a> : <span className={INSTALL_BLOCK_CLASS.alternativesTitle}>{alt.label}</span>}
          {alt.description !== undefined && <p className={INSTALL_BLOCK_CLASS.note}>{alt.description}</p>}
          {alt.command !== undefined && <CommandLines command={alt.command} {...group} />}
        </div>
      ))}
    </div>
  );

  const body = (
    <div data-slot={INSTALL_BLOCK_SLOT.root} data-variant={variant} className={embedded ? cn(INSTALL_BLOCK_CLASS.rootEmbedded, shell.className) : INSTALL_BLOCK_CLASS.root} style={embedded ? shell.style : undefined} id={embedded ? shell.id : undefined}>
      {main}
      {extras}
      {actions && actions.length > 0 && <div data-slot={INSTALL_BLOCK_SLOT.actions} className={DEV_BLOCK_CLASS.actions}><CtaGroup items={actions} /></div>}
    </div>
  );
  if (embedded) return body;
  return (
    <BlockShell {...shell} classNames={classNames as BlockBaseProps["classNames"]} heading={heading} renderHeading={renderSectionHeading}>
      {body}
    </BlockShell>
  );
}
