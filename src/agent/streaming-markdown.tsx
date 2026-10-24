"use client";

import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import MarkdownRender, { setCustomComponents, type CustomComponentMap } from "markstream-react";
import { CodeBlock } from "../layout/CodeBlock";
import { cn } from "../primitives/utils";
import { ARIA, SPACE } from "../constants";
import {
  LIVE_HIGHLIGHT_MS, MD_NEWLINE, MODE_ATTRIBUTE, MODE_LIGHT, STREAMING_ATTR, TYPEOF_UNDEFINED,
} from "../constants/markdown";

/** 围栏行: 可缩进 (列表项内), 反引号或波浪线至少三个. */
const FENCE_LINE = /^\s*(`{3,}|~{3,})/;

/** 本组件注册代码块渲染器的 markstream 作用域; 模块加载时注册一次, 渲染期不再写全局表. */
const RENDER_SCOPE = "hx-streaming-markdown";

/**
 * 把 markstream 自带的配色与线条拉回本库的语义 token.
 *
 * 它的样式表在 node_modules 里, 用 :where() 包选择器 (特异度 0), 所以这里用
 * "父级任意变体" 声明就能盖过, 不需要 !important. 变量声明同理: --link-color 这类
 * 只在消费处带默认值, 从父级继承即可生效.
 */
const SKIN = [
  "[--link-color:var(--link)]",
  "[--table-border:var(--border)]",
  "[--footnote-border:var(--border)]",
  "[--blockquote-border-color:var(--border)]",
  "[&_.inline-code]:bg-muted",
  "[&_.inline-code]:text-foreground",
  "[&_.blockquote-node]:border-l-[1px]",
  "[&_.blockquote-node]:border-border",
  "[&_.typewriter-cursor]:border-r-[1px]",
  "[&_table]:text-[12.5px]",
  "[&_th]:font-medium",
  "[&_th]:text-muted-foreground]",
  // 表格线: markstream 只给单元格内边距不画线, 这里用 !important 的 utilities 压过它
  // 未分层的预编译规则 (分层里的 !important 胜过来分层的普通声明).
  "[&_table.table-node]:!border",
  "[&_table.table-node]:!border-border",
  "[&_th]:!border-b",
  "[&_th]:!border-border",
  "[&_th]:!bg-muted",
  "[&_td]:!border-b",
  "[&_td]:!border-border",
].join(SPACE);

function readDark(): boolean {
  if (typeof document === TYPEOF_UNDEFINED) {
    return true;
  }
  return document.documentElement.getAttribute(MODE_ATTRIBUTE) !== MODE_LIGHT;
}

/**
 * 跟随根元素的明暗切换, 让 markstream 的代码块与内嵌层用同一套明暗.
 * 显式传 isDark 时以调用方为准, 不再观察 DOM.
 */
function useIsDark(override?: boolean): boolean {
  const [dark, setDark] = useState(readDark);
  useEffect(() => {
    if (override !== undefined || typeof MutationObserver === TYPEOF_UNDEFINED) {
      return undefined;
    }
    const observer = new MutationObserver(() => setDark(readDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [MODE_ATTRIBUTE] });
    return () => observer.disconnect();
  }, [override]);
  return override ?? dark;
}

/** markstream 交给代码块渲染器的节点 (stream-markdown-parser 的 CodeBlockNode 子集). */
interface FenceNode {
  readonly code: string;
  readonly language?: string;
  /** 围栏还没闭合: 流式中途仍在写入. */
  readonly loading?: boolean;
}

/** info string 只取第一个语言 token: `ts title="a.ts"` 与 `ts{1,3}` 都按 ts 高亮. */
function fenceLang(info: string | undefined): string | undefined {
  return info?.trim().match(/^[^\s{:]+/)?.[0];
}

/**
 * 未闭合期间把代码节流后再交给 CodeBlock: 每个 token 都跑一次完整 shiki 会让长回复卡顿.
 * 定时器从上一次放行算起, 所以持续写入时也按固定间隔刷新, 而不是一直等到停顿.
 * 闭合后立即放行最终代码.
 */
function useLiveCode(code: string, live: boolean): string {
  const [shown, setShown] = useState(code);
  const flushedAt = useRef(0);
  useEffect(() => {
    if (!live) {
      return undefined;
    }
    const wait = Math.max(0, flushedAt.current + LIVE_HIGHLIGHT_MS - Date.now());
    const timer = setTimeout(() => {
      flushedAt.current = Date.now();
      setShown(code);
    }, wait);
    return () => clearTimeout(timer);
  }, [code, live]);
  return live ? shown : code;
}

/**
 * 代码块渲染器, 挂在 markstream 自己的 AST 上.
 *
 * 为什么不用它默认的代码块: 默认交给 stream-diffs 的 <diffs-container>, 那个 web component
 * 在可选 peer 缺失或初始化失败时只画标题栏, 正文空白且不报错. 用 setCustomComponents 按节点
 * 类型替换, 代码块仍留在原来的容器里 (列表项, 引用), 嵌套关系与 markstream 解析结果一致.
 */
function FenceBlock({ node }: { readonly node: FenceNode }): JSX.Element {
  const code = useLiveCode(node.code.replace(/\n$/, ""), Boolean(node.loading));
  const lang = fenceLang(node.language);
  return <CodeBlock className="my-3" code={code} {...(lang ? { lang } : {})} showLineNumbers />;
}

/** 图表类语言也走 CodeBlock, 与之前"所有围栏都是代码块"的行为一致. */
setCustomComponents(RENDER_SCOPE, {
  code_block: FenceBlock,
  mermaid: FenceBlock,
  infographic: FenceBlock,
  d2: FenceBlock,
  d2lang: FenceBlock,
} as CustomComponentMap);

/**
 * 内容是否以代码块结束 (含未闭合的围栏). markstream 的光标只跟随文本节点,
 * 结尾是代码块时它找不到落点, 由组件自己在末尾补一个光标.
 */
function endsWithFence(markdown: string): boolean {
  let fence: string | null = null;
  let lastIsFence = false;
  for (const line of markdown.split(MD_NEWLINE)) {
    const marker = FENCE_LINE.exec(line)?.[1];
    if (fence === null) {
      if (marker) {
        fence = marker;
        lastIsFence = true;
      } else if (line.trim()) {
        lastIsFence = false;
      }
    } else if (marker && marker[0] === fence[0] && marker.length >= fence.length && !line.trim().slice(marker.length).trim()) {
      fence = null;
    }
  }
  return fence !== null || lastIsFence;
}

/**
 * .agents/notes/implemented/feature/2026-10-22-streaming-markdown-markstream.md
 */
export interface StreamingMarkdownProps {
  /** 已到达的 Markdown 原文. 不完整的语法在流式期间按半成品渲染, 结束后再收尾. */
  readonly content: string;
  /** 仍在生成. 为 true 时保留流式光标, 且解析器不会把未闭合的块当成最终结果. */
  readonly streaming?: boolean;
  /** 流已结束. 与 streaming 同时给时以 final 为准, 便于直接接 SSE 的结束事件. */
  readonly final?: boolean;
  readonly className?: string;
  /** 每条消息一个 id, 作为节点 key 的前缀. 代码块由本库渲染, 不再需要它区分 DOM id. */
  readonly customId?: string;
  /** 明暗主题. 缺省跟随根元素的 data-mode, 也可以由调用方显式指定. */
  readonly isDark?: boolean;
}

/**
 * 流式 Markdown 渲染.
 *
 * 样式不由本组件注入, 使用方 (或文档站) 必须引入一次 markstream-react/index.css,
 * 库的样式入口 src/styles.css 已经带上它, 引了 @hx/ui/styles.css 就不用再引.
 *
 * 整篇交给 markstream 解析, 只有代码块节点换成本库的 CodeBlock (见 FenceBlock 的说明):
 * 未闭合的标题, 列表, 表格与引用在流式中途都能按半成品渲染.
 * fade 关闭: 逐节点淡入会和调用方自己的逐字追加叠成两层节奏, 看起来像抖动;
 * 光标平时由 markstream 的 typewriter 提供, 它在系统要求减弱动效时自动停闪;
 * 结尾没有文本可跟随时由组件自己补一个.
 */
export function StreamingMarkdown({
  content,
  streaming = true,
  final,
  className,
  customId,
  isDark,
}: StreamingMarkdownProps): JSX.Element {
  const done = final ?? !streaming;
  const dark = useIsDark(isDark);
  /** 还没有首个字符, 或以代码块结束: markstream 的光标没有文本落点, 改由这里补在末尾. */
  const ownCursor = useMemo(() => !done && (!content.trim() || endsWithFence(content)), [content, done]);

  return (
    <div
      data-slot="streaming-markdown"
      data-streaming={done ? STREAMING_ATTR.done : STREAMING_ATTR.live}
      className={cn("min-w-0 text-[13.5px] leading-relaxed text-foreground", SKIN, className)}
    >
      <MarkdownRender
        content={content}
        final={done}
        fade={false}
        typewriter={!done && !ownCursor}
        smoothStreaming={false}
        isDark={dark}
        customId={RENDER_SCOPE}
        {...(customId ? { indexKey: customId } : {})}
      />
      {ownCursor ? (
        <span
          aria-hidden={ARIA.true}
          data-slot="streaming-markdown-cursor"
          className="inline-block h-[1em] w-px animate-pulse bg-foreground/70 align-baseline motion-reduce:animate-none"
        />
      ) : null}
    </div>
  );
}
