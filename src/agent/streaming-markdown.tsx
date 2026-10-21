"use client";

import { useEffect, useState, type JSX } from "react";
import MarkdownRender from "markstream-react";
import { cn } from "../primitives/utils";

/**
 * 根元素上的主题属性与取值 (tokens.css 用 data-mode 区分明暗).
 * 读不到时按暗色处理: 库的默认皮肤是暗色, 文档站首屏也是暗色.
 */
const MODE_ATTRIBUTE = "data-mode";
const MODE_LIGHT = "light";

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
  "[&_th]:text-muted-foreground",
].join(" ");

function readDark(): boolean {
  if (typeof document === "undefined") {
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
    if (override !== undefined || typeof MutationObserver === "undefined") {
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
 * 流式 Markdown 渲染: 把不断增长的 Markdown 原文交给 markstream-react,
 * 由它处理未闭合的标题, 列表, 表格与代码块.
 *
 * 样式不由本组件注入. 使用方 (或文档站) 必须显式引入一次:
 *
 *     import "markstream-react/index.css";
 *
 * 漏了这一行不会有任何报错, 表现是"内容渲染出来了但没有排版".
 * fade 关闭: 逐节点淡入会和调用方自己的逐字追加叠成两层节奏, 看起来像抖动;
 * 光标由 markstream 的 typewriter 提供, 它在系统要求减弱动效时自动停闪.
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
  return (
    <div
      data-slot="streaming-markdown"
      data-streaming={done ? "false" : "true"}
      className={cn("min-w-0 text-[13.5px] leading-relaxed text-foreground", SKIN, className)}
    >
      <MarkdownRender
        content={content}
        final={done}
        fade={false}
        typewriter={!done}
        smoothStreaming={false}
        isDark={dark}
        customId={customId}
      />
    </div>
  );
}
