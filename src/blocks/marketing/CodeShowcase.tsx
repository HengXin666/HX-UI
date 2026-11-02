"use client";

import * as React from "react";
import { CheckIcon, CopyIcon, XIcon } from "lucide-react";
import { BUTTON_TYPE } from "../../constants";
import { BLOCK_DEFAULT } from "../../constants/blocks";
import {
  CODE_SHOWCASE_CLASS,
  CODE_SHOWCASE_LAYOUT,
  CODE_SHOWCASE_SLOT,
  type CODE_SHOWCASE_SLOTS,
  COPY_FEEDBACK_MS,
  COPY_STATE,
  DEV_BLOCK_CLASS,
  MARKETING_V106_DEFAULT,
  TAB_VALUE_PREFIX,
  copyText,
  devLabelsFor,
  type CopyState,
  type DevLabels,
} from "../../constants/blocks-marketing-v106";
import { CodeBlock } from "../../layout/CodeBlock";
import { IconSlot } from "../../layout/Icon";
import { BrowserFrame } from "../../media/frames/browser-frame";
import { Button } from "../../primitives/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../primitives/tabs";
import { cn } from "../../primitives/utils";
import { BlockShell, resolveSlots } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { CtaGroup, renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, BlockLabels, BlockShellSlot, BlockShellState, Cta, IconName, SectionHeadingData, SlotClassNames } from "../_shared/types";

/** 区块内部部件的 slot 名 (与 BlockShell 的 root / backdrop / container / content 并列). */
export type CodeShowcaseSlot = (typeof CODE_SHOWCASE_SLOTS)[number];

/** 一段示例代码 (内层 tab). 代码一律是字符串, 由调用方 / JSON 提供. */
export interface CodeSample {
  label: string;
  /** 标签值; 不给时按下标生成. */
  value?: string;
  code: string;
  /** shiki 语言名 (tsx / python / bash ...); 不给时继承外层 tab 的 language. */
  language?: string;
  /** 代码头左侧的文件名; 不给时显示语言名. */
  filename?: string;
  /** 高亮行号, 从 1 开始. */
  highlightLines?: number[];
  /** 运行结果 / 实时预览节点; split 布局时放进 BrowserFrame. */
  preview?: React.ReactNode;
  /** 预览浏览器框地址栏文字. */
  previewAddress?: string;
}

/** 外层 tab (语言): 自身即一段代码, 或携带 subTabs (框架 / 示例). */
export interface CodeShowcaseTab extends Partial<Omit<CodeSample, "label" | "value">> {
  label: string;
  value?: string;
  icon?: IconName;
  subTabs?: CodeSample[];
}

export interface CodeShowcaseProps extends Omit<BlockBaseProps, "labels" | "classNames"> {
  /** 外壳 slot + 内部部件 slot 的类名; 函数形态收到 BlockShell 状态. */
  classNames?: SlotClassNames<BlockShellSlot | CodeShowcaseSlot, BlockShellState>;
  heading?: SectionHeadingData;
  tabs: CodeShowcaseTab[];
  /** code: 纯代码; split: 代码 + 预览并排. 不给时有任一 preview 即 split. */
  layout?: (typeof CODE_SHOWCASE_LAYOUT)[keyof typeof CODE_SHOWCASE_LAYOUT];
  showLineNumbers?: boolean;
  /** 尾部动作: 在 GitHub 打开 / 下载 ZIP 等. */
  actions?: Cta[];
  /** 外层 tab 受控 / 非受控. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 预览区宽高比 (宽 / 高); 不给时由内容撑开. */
  previewRatio?: number;
  copyable?: boolean;
  labels?: Partial<BlockLabels & DevLabels>;
  ref?: React.Ref<HTMLElement>;
}

type Labels = BlockLabels & DevLabels;

/** 复制按钮: 成功 / 失败切换 data-state 与图标, 并经 aria-live 播报; 1.5s 后复位. */
function CopyButton({ text, labels }: { text: string; labels: Labels }): React.JSX.Element {
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
      <Button
        type={BUTTON_TYPE}
        variant="ghost"
        size="icon-sm"
        data-slot={CODE_SHOWCASE_SLOT.copy}
        data-state={state}
        aria-label={labels.copyCode}
        title={labels.copyCode}
        onClick={() => void onCopy()}
        className={DEV_BLOCK_CLASS.copyButton}
      >
        <Icon aria-hidden className={iconClass} />
      </Button>
      <span data-slot={CODE_SHOWCASE_SLOT.status} role="status" aria-live="polite" className={DEV_BLOCK_CLASS.srOnly}>
        {message}
      </span>
    </>
  );
}

interface PaneProps {
  sample: CodeSample;
  split: boolean;
  lineNumbers: boolean;
  copyable: boolean;
  previewRatio?: number;
  labels: Labels;
  cls: Partial<Record<string, string>>;
}

/** 一段代码 (+ 可选预览). 代码区 min-w-0 + CodeBlock 内部横向滚动, 长行不折行也不撑破栅格. */
function SamplePane({ sample, split, lineNumbers, copyable, previewRatio, labels, cls }: PaneProps): React.JSX.Element {
  const language = sample.language ?? MARKETING_V106_DEFAULT.codeLanguage;
  const withPreview = split && sample.preview !== undefined;
  return (
    <div data-slot={CODE_SHOWCASE_SLOT.pane} data-layout={withPreview ? CODE_SHOWCASE_LAYOUT.split : CODE_SHOWCASE_LAYOUT.code} className={cn(withPreview ? CODE_SHOWCASE_CLASS.paneSplit : CODE_SHOWCASE_CLASS.pane, cls.pane)}>
      <div data-slot={CODE_SHOWCASE_SLOT.code} className={cn(CODE_SHOWCASE_CLASS.code, cls.code)}>
        <div data-slot={CODE_SHOWCASE_SLOT.codeHeader} className={cn(CODE_SHOWCASE_CLASS.codeHeader, cls["code-header"])}>
          <span data-slot={CODE_SHOWCASE_SLOT.filename} className={CODE_SHOWCASE_CLASS.filename}>{sample.filename ?? language}</span>
          {copyable && <CopyButton text={sample.code} labels={labels} />}
        </div>
        <CodeBlock code={sample.code} lang={language} showHeader={false} showLineNumbers={lineNumbers} highlightLines={sample.highlightLines} className={CODE_SHOWCASE_CLASS.codeBlock} />
      </div>
      {withPreview && (
        <div data-slot={CODE_SHOWCASE_SLOT.preview} role="region" aria-label={labels.preview} className={cn(CODE_SHOWCASE_CLASS.preview, cls.preview)}>
          <BrowserFrame address={sample.previewAddress ?? MARKETING_V106_DEFAULT.previewAddress} ratio={previewRatio}>
            <div className={CODE_SHOWCASE_CLASS.previewBody}>{sample.preview}</div>
          </BrowserFrame>
        </div>
      )}
    </div>
  );
}

/** 把外层 tab 归一成内层示例列表 (无 subTabs 时它自身就是唯一示例). */
function samplesOf(tab: CodeShowcaseTab): CodeSample[] {
  if (tab.subTabs && tab.subTabs.length > 0) {
    return tab.subTabs.map((s) => ({ ...s, language: s.language ?? tab.language, previewAddress: s.previewAddress ?? tab.previewAddress }));
  }
  return [{ ...tab, code: tab.code ?? "", label: tab.label }];
}

/**
 * 代码展示区 (resend 两级 tabs + 行号代码块, react.dev 左代码右浏览器预览).
 * 外层 tab = 语言, 内层 tab = 框架 / 示例; 高亮复用 layout/CodeBlock (shiki); 代码全部来自 props.
 * 只有一个外层 tab 时不渲染标签条. 遵循 docs/architecture/component-contract.md.
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-marketing-developer.md
 */
export function CodeShowcase({
  heading,
  tabs,
  layout,
  showLineNumbers = MARKETING_V106_DEFAULT.lineNumbers,
  actions,
  value,
  defaultValue,
  onValueChange,
  previewRatio,
  copyable = true,
  labels: labelsProp,
  classNames,
  ...shell
}: CodeShowcaseProps): React.JSX.Element {
  const ctx = useBlocks();
  const labels: Labels = { ...ctx.labels, ...devLabelsFor(ctx.locale), ...labelsProp } as Labels;
  const state: BlockShellState = { tone: shell.tone ?? BLOCK_DEFAULT.tone, pad: shell.pad ?? BLOCK_DEFAULT.pad, width: shell.width ?? BLOCK_DEFAULT.width, align: shell.align ?? BLOCK_DEFAULT.align };
  const cls: Partial<Record<string, string>> = resolveSlots(classNames, state);
  const hasPreview = tabs.some((t) => t.preview !== undefined || t.subTabs?.some((s) => s.preview !== undefined));
  const split = (layout ?? (hasPreview ? CODE_SHOWCASE_LAYOUT.split : CODE_SHOWCASE_LAYOUT.code)) === CODE_SHOWCASE_LAYOUT.split;
  const outerValue = (tab: CodeShowcaseTab, index: number): string => tab.value ?? `${TAB_VALUE_PREFIX.lang}${index}`;
  const paneProps = { split, lineNumbers: showLineNumbers, copyable, previewRatio, labels, cls };

  const renderTab = (tab: CodeShowcaseTab): React.ReactNode => {
    const samples = samplesOf(tab);
    if (samples.length === 1) return <SamplePane sample={samples[0]} {...paneProps} />;
    const subValue = (s: CodeSample, i: number): string => s.value ?? `${TAB_VALUE_PREFIX.sample}${i}`;
    return (
      <Tabs data-slot={CODE_SHOWCASE_SLOT.subTabs} defaultValue={subValue(samples[0], 0)} className={CODE_SHOWCASE_CLASS.subTabs}>
        <div className={DEV_BLOCK_CLASS.tabScroller}>
          <TabsList variant="pill" aria-label={labels.samples} data-slot={CODE_SHOWCASE_SLOT.subTabList} className={cls["sub-tab-list"]}>
            {samples.map((s, i) => <TabsTrigger key={subValue(s, i)} value={subValue(s, i)}>{s.label}</TabsTrigger>)}
          </TabsList>
        </div>
        {samples.map((s, i) => (
          <TabsContent key={subValue(s, i)} value={subValue(s, i)}>
            <SamplePane sample={s} {...paneProps} />
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  const body =
    tabs.length === 1 ? (
      renderTab(tabs[0])
    ) : (
      <Tabs data-slot={CODE_SHOWCASE_SLOT.tabs} value={value} defaultValue={value === undefined ? (defaultValue ?? outerValue(tabs[0], 0)) : undefined} onValueChange={onValueChange} className={cn(CODE_SHOWCASE_CLASS.subTabs, cls.tabs)}>
        <div className={DEV_BLOCK_CLASS.tabScroller}>
          <TabsList aria-label={labels.languages} data-slot={CODE_SHOWCASE_SLOT.tabList} className={cls["tab-list"]}>
            {tabs.map((t, i) => (
              <TabsTrigger key={outerValue(t, i)} value={outerValue(t, i)}>
                {t.icon !== undefined && <span aria-hidden data-slot={CODE_SHOWCASE_SLOT.tabIcon} className={DEV_BLOCK_CLASS.tabIcon}><IconSlot source={t.icon} /></span>}
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {tabs.map((t, i) => <TabsContent key={outerValue(t, i)} value={outerValue(t, i)}>{renderTab(t)}</TabsContent>)}
      </Tabs>
    );

  return (
    <BlockShell {...shell} classNames={classNames as BlockBaseProps["classNames"]} heading={heading} renderHeading={renderSectionHeading}>
      <div data-slot={CODE_SHOWCASE_SLOT.root} className={CODE_SHOWCASE_CLASS.root}>
        {body}
        {actions && actions.length > 0 && (
          <div data-slot={CODE_SHOWCASE_SLOT.actions} role="group" aria-label={labels.actions} className={cn(DEV_BLOCK_CLASS.actions, cls.actions)}>
            <CtaGroup items={actions} />
          </div>
        )}
      </div>
    </BlockShell>
  );
}
