"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import MarkdownRender from "markstream-react";
import { cn } from "../primitives/utils";
import { SPACE } from "../constants";
import { MODE_ATTRIBUTE, MODE_LIGHT, SEGMENT_KIND, STREAMING_ATTR, TYPEOF_UNDEFINED } from "../constants/markdown";
import { FenceBlock, needsTailCursor, splitSegments } from "./streaming-markdown-parts";

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
  /** 每条消息一个解析器 id, 让同一页里多个实例的代码块 DOM id 不撞车. */
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
 * 代码块由本库的 CodeBlock 渲染 (见 streaming-markdown-parts 的 splitSegments 说明),
 * 其余节点交给 markstream: 未闭合的标题, 列表, 表格与引用在流式中途都能按半成品渲染.
 * fade 关闭: 逐节点淡入会和调用方自己的逐字追加叠成两层节奏, 看起来像抖动;
 * 光标由 markstream 的 typewriter 提供, 它在系统要求减弱动效时自动停闪;
 * 内容为空或以代码块结束时 typewriter 没有文本可跟, 这里补一个自己的光标.
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
  const segments = useMemo(() => splitSegments(content), [content]);
  const tailCursor = !done && needsTailCursor(content);

  return (
    <div
      data-slot="streaming-markdown"
      data-streaming={done ? STREAMING_ATTR.done : STREAMING_ATTR.live}
      className={cn("min-w-0 text-[13.5px] leading-relaxed text-foreground", SKIN, className)}
    >
      {segments.map((segment, index) => {
        const key = `${index}-${segment.kind}`;
        if (segment.kind === SEGMENT_KIND.code) {
          return <FenceBlock key={key} code={segment.text} open={segment.open === true} {...(segment.lang ? { lang: segment.lang } : {})} />;
        }
        return (
          <MarkdownRender
            key={key}
            content={segment.text}
            final={done}
            fade={false}
            typewriter={!done && index === segments.length - 1}
            smoothStreaming={false}
            isDark={dark}
            {...(customId ? { customId } : {})}
          />
        );
      })}
      {tailCursor ? (
        <span
          data-slot="stream-cursor"
          aria-hidden
          className="ml-0.5 inline-block h-[1em] w-px animate-caret-blink bg-foreground/70 align-text-bottom motion-reduce:animate-none"
        />
      ) : null}
    </div>
  );
}
