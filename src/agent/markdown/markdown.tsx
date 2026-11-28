"use client";
/**
 * 流式 Markdown. 解析与切块借 Streamdown (react-markdown 兼容, 按顶层块切开逐块 memo, remend 补全未闭合语法),
 * 外观全部是本库的: 元素用语义令牌, 代码围栏走 CodeBlock / 组合代码块 / 自定义渲染器.
 *
 *   <Markdown streaming={isGenerating}>{text}</Markdown>
 *   <Markdown fences={{ ...mermaidFences, chart: MyChart }} plugins={{ math }}>{text}</Markdown>
 *
 * - streaming: 只有最后一块随 token 重渲染; 末尾有光标; 新文字淡入 (animated)
 * - 结束后同一棵树原地停下, 不重挂, 已高亮的代码不重算
 */
import * as React from "react";
import { Streamdown, defaultRemarkPlugins, type Components, type MathPlugin, type CjkPlugin } from "streamdown";
import { cn } from "@/lib/utils";
import type { CodeTheme } from "../code/code-block";
import { MarkdownSettingsContext, type FenceRenderers, type MarkdownSettings } from "./context";
import { markdownComponents } from "./elements";
import { CODE_GROUP_TAG, parseBlocksWithGroups, remarkCodeGroups } from "./groups";

export interface MarkdownProps {
  children: string;
  /** 还在生成: 末尾光标, 新文字淡入, 未闭合语法按补全后的样子显示 */
  streaming?: boolean;
  /** 新文字淡入, 默认跟随 streaming */
  animated?: boolean;
  /** 自定义围栏渲染器, 按语言: { mermaid: MermaidFence, chart: MyChart } */
  fences?: FenceRenderers;
  /** Streamdown 插件 (公式: "@hx/ui/agent/math" 的 math; 中日韩标点: @streamdown/cjk) */
  plugins?: { math?: MathPlugin; cjk?: CjkPlugin };
  /** 代码配色: "dark" (默认, One Dark Pro) 或 "auto" (跟随亮暗) */
  codeTheme?: CodeTheme;
  /** 代码块超过多少行折叠, 0 不折叠 (围栏里写 collapse=N 优先) */
  codeCollapse?: number;
  /** 代码块内容区最大高度 (px) */
  codeMaxHeight?: number;
  /** 链接点击 (例如把文件路径交给编辑器打开); 返回 true 阻止默认跳转 */
  onLinkClick?: MarkdownSettings["onLinkClick"];
  /** 覆盖某些元素的渲染 */
  components?: Components;
  /** 追加 remark 插件 (在 GFM 之后) */
  remarkPlugins?: Pluggable[];
  /** "base" (默认) 或 "sm" (紧凑, 思考过程 / 工具输出里用) */
  size?: "sm" | "base";
  className?: string;
}

type Pluggable = NonNullable<React.ComponentProps<typeof Streamdown>["remarkPlugins"]>[number];

const REMARK: Pluggable[] = [...Object.values(defaultRemarkPlugins), remarkCodeGroups];
const ALLOWED = { [CODE_GROUP_TAG]: ["dataGroup"] };
const ANIMATE = { animation: "fadeIn", duration: 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)" } as const;

export const Markdown = React.memo(function Markdown({
  children,
  streaming = false,
  animated,
  fences,
  plugins,
  codeTheme = "dark",
  codeCollapse = 0,
  codeMaxHeight,
  onLinkClick,
  components,
  remarkPlugins,
  size = "base",
  className,
}: MarkdownProps) {
  const settings = React.useMemo<MarkdownSettings>(() => ({ fences: fences ?? {}, codeTheme, codeCollapse, codeMaxHeight, onLinkClick }), [fences, codeTheme, codeCollapse, codeMaxHeight, onLinkClick]);
  const comps = React.useMemo(() => (components ? { ...markdownComponents, ...components } : markdownComponents), [components]);
  const remark = React.useMemo(() => (remarkPlugins?.length ? [...REMARK, ...remarkPlugins] : REMARK), [remarkPlugins]);
  const animate = animated ?? streaming;
  return (
    <MarkdownSettingsContext.Provider value={settings}>
      <Streamdown
        mode="streaming"
        isAnimating={streaming}
        parseIncompleteMarkdown
        parseMarkdownIntoBlocksFn={parseBlocksWithGroups}
        remarkPlugins={remark}
        allowedTags={ALLOWED}
        components={comps}
        plugins={plugins}
        animated={animate ? ANIMATE : false}
        controls={false}
        lineNumbers
        data-streaming={streaming || undefined}
        className={cn("hx-md min-w-0 text-foreground [overflow-wrap:anywhere]", size === "sm" ? "text-[13px] [&_p]:leading-6" : "text-[15px]", className)}
      >
        {children}
      </Streamdown>
      {streaming && children.trim() === "" && <span aria-hidden className="hx-caret text-muted-foreground" />}
    </MarkdownSettingsContext.Provider>
  );
});
