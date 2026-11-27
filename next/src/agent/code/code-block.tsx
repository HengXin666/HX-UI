"use client";
/**
 * 代码块: 博客 (HXLoLi) 同款风格.
 * One Dark Pro 深色面板, 默认带行号, 右上角语言名, 复制 / 换行 / 下载平时隐身, 悬停代码块时浮现;
 * 可选标题栏, 行高亮, 起始行号, 超长折叠. 流式中 (incomplete) 节流高亮, 末尾有光标.
 * 单独使用或由 <Markdown> 的围栏渲染都走它.
 */
import * as React from "react";
import { ChevronsUpDown, Download, WrapText } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyIconButton, IconButton } from "../parts/copy";
import { ONE_AUTO, ONE_DARK, type HighlightToken } from "./highlight";
import { useHighlight } from "./use-highlight";
import { normalizeLang } from "../markdown/fence";
import "../agent.css";

export type CodeTheme = "dark" | "auto";

export interface CodeBlockProps {
  code: string;
  /** 语言名, 原样展示在右上角 (例如 C++); 高亮时会归一 (cpp) */
  language?: string;
  title?: React.ReactNode;
  /** 默认 true */
  lineNumbers?: boolean;
  startLine?: number;
  /** 高亮的行 (1 起, 相对 startLine 之前的编号) */
  highlightLines?: Iterable<number>;
  /** "dark" (默认): 不论亮暗都是 One Dark Pro 面板; "auto": 亮色 One Light, 暗色 One Dark Pro */
  theme?: CodeTheme;
  /** 超过多少行折叠, 0 不折叠 */
  collapse?: number;
  /** 内容区最大高度 (px), 超出滚动 */
  maxHeight?: number;
  /** 默认是否自动换行 */
  wrap?: boolean;
  /** 流式中: 节流高亮, 末尾光标 */
  incomplete?: boolean;
  /** 下载文件名; 不给就按标题或语言推断 */
  filename?: string;
  /** 不画外框和圆角 (放进组合代码块 / 工具卡片里时用) */
  bare?: boolean;
  /** 右上角按钮区额外的按钮 */
  actions?: React.ReactNode;
  /** 右上角不显示语言名 */
  hideLanguage?: boolean;
  className?: string;
}

const EXT: Record<string, string> = { typescript: "ts", javascript: "js", tsx: "tsx", jsx: "jsx", python: "py", cpp: "cpp", c: "c", rust: "rs", go: "go", java: "java", bash: "sh", json: "json", yaml: "yaml", markdown: "md", html: "html", css: "css", csharp: "cs", kotlin: "kt", sql: "sql", svg: "svg", mermaid: "mmd" };
const LINE_HEIGHT = 22;

function Tokens({ tokens }: { tokens: HighlightToken[] }) {
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} data-tk="" style={t.style} className={cn(t.fontStyle && t.fontStyle & 1 && "italic", t.fontStyle && t.fontStyle & 2 && "font-semibold", t.fontStyle && t.fontStyle & 4 && "underline")}>
          {t.content}
        </span>
      ))}
    </>
  );
}

export const CodeBlock = React.memo(function CodeBlock({
  code,
  language = "",
  title,
  lineNumbers = true,
  startLine = 1,
  highlightLines,
  theme = "dark",
  collapse = 0,
  maxHeight,
  wrap: wrapDefault = false,
  incomplete = false,
  filename,
  bare = false,
  actions,
  hideLanguage = false,
  className,
}: CodeBlockProps) {
  const lang = normalizeLang(language || "plaintext");
  const themes = theme === "auto" ? ONE_AUTO : ONE_DARK;
  const { lines } = useHighlight(code, lang, themes, incomplete);
  const [wrap, setWrap] = React.useState(wrapDefault);
  const [open, setOpen] = React.useState(false);
  const hl = React.useMemo(() => new Set(highlightLines ?? []), [highlightLines]);
  const folded = collapse > 0 && lines.length > collapse && !open && !incomplete;
  const lnWidth = String(startLine + lines.length - 1).length;

  const download = () => {
    const name = filename ?? (typeof title === "string" && title.includes(".") ? title : `code.${EXT[lang] ?? "txt"}`);
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const hasTitle = title != null && title !== "";
  // 博客同款: 平时右上角只有语言名, 悬停 (或键盘聚焦) 时语言名淡出, 换行 / 下载 / 复制在同一位置淡入
  const reveal = "transition-opacity duration-150";
  const controls = (
    <div className="relative flex h-7 shrink-0 items-center justify-end text-[var(--hx-code-fg)]">
      {!hideLanguage && language && (
        <span className={cn("px-1.5 font-mono text-xs text-[var(--hx-code-muted)] select-none group-hover/code:opacity-0 group-focus-within/code:opacity-0 [@media(hover:none)]:opacity-0", reveal)}>{language}</span>
      )}
      <div className={cn("absolute inset-y-0 right-0 flex items-center gap-0.5 opacity-0 group-hover/code:opacity-100 group-focus-within/code:opacity-100 [@media(hover:none)]:opacity-100", reveal)}>
        {actions}
        <IconButton label={wrap ? "不换行" : "自动换行"} active={wrap} onClick={() => setWrap((w) => !w)}>
          <WrapText />
        </IconButton>
        <IconButton label="下载" onClick={download}>
          <Download />
        </IconButton>
        <CopyIconButton text={code} />
      </div>
    </div>
  );

  return (
    <figure
      data-slot="code-block"
      data-code-theme={theme}
      data-incomplete={incomplete || undefined}
      className={cn("hx-code group/code relative min-w-0 text-[13px] text-[var(--hx-code-fg)]", !bare && "my-4 overflow-hidden rounded-lg border border-[var(--hx-code-border)] bg-[var(--hx-code-bg)]", className)}
    >
      {hasTitle && (
        <figcaption className="flex h-9 items-center gap-2 border-b border-[var(--hx-code-border)] pl-4 pr-1.5 font-mono text-xs text-[var(--hx-code-fg)]/85">
          <span className="min-w-0 flex-1 truncate">{title}</span>
          {controls}
        </figcaption>
      )}
      <div className="relative">
        {!hasTitle && <div className="absolute right-1.5 top-1.5 z-10 rounded-md bg-[var(--hx-code-bg)]/85">{controls}</div>}
        <div
          className={cn("scrollbar-thin overflow-auto", folded && "overflow-hidden")}
          style={{ maxHeight: folded ? collapse * LINE_HEIGHT + 16 : maxHeight }}
          tabIndex={0}
          role="region"
          aria-label={typeof title === "string" ? title : `${language || "代码"} 代码`}
        >
          <pre className={cn("m-0 py-3 font-mono leading-[22px]", wrap ? "min-w-0" : "w-max min-w-full")}>
            <code className="block" style={{ ["--ln-w" as string]: `${lnWidth}ch` }}>
              {lines.map((l, i) => {
                const n = startLine + i;
                const last = i === lines.length - 1;
                return (
                  <span key={i} data-hl={hl.has(n) || undefined} className="hx-code-row flex data-[hl]:bg-[var(--hx-code-hl)] data-[hl]:shadow-[inset_2px_0_0_var(--hx-code-hl-bar)]">
                    {lineNumbers && <span aria-hidden className="w-[calc(var(--ln-w)+2rem)] shrink-0 select-none pl-4 pr-4 text-right text-[var(--hx-code-ln)] tabular">{n}</span>}
                    <span className={cn("min-w-0 flex-1 pr-24", !lineNumbers && "pl-4", wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre")}>
                      {l.tokens ? <Tokens tokens={l.tokens} /> : l.text}
                      {l.text === "" && !l.tokens && "\u200b"}
                      {last && incomplete && <span aria-hidden className="hx-caret" />}
                    </span>
                  </span>
                );
              })}
            </code>
          </pre>
        </div>
        {collapse > 0 && lines.length > collapse && !incomplete && (
          <div className={cn("flex justify-center", folded ? "absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--hx-code-bg)] from-30% to-transparent pb-2 pt-10" : "border-t border-[var(--hx-code-border)] py-1.5")}>
            <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-[var(--hx-code-fg)]/75 transition-colors duration-150 hover:bg-[var(--hx-code-fg)]/10 hover:text-[var(--hx-code-fg)]">
              <ChevronsUpDown className="size-3.5" />
              {folded ? `展开全部 ${lines.length} 行` : "收起"}
            </button>
          </div>
        )}
      </div>
    </figure>
  );
});
