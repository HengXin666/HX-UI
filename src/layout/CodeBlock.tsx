import { useEffect, useMemo, useRef, useState, type JSX, type ReactNode } from "react";
import { codeToHtml } from "shiki";
import { cn } from "../primitives/utils";

/**
 * 代码块 —— VS Code 同款语法引擎 (shiki), 主题固定为 One Dark Pro。
 *
 * 为什么是 shiki 而不是 highlight.js / prism:
 *   前两者是正则匹配的近似着色, 在嵌套与边缘写法上会错。shiki 直接跑 VS Code 的
 *   TextMate 语法, 与编辑器里看到的结果一致 —— 这对"看起来专业"这件事是决定性的。
 *
 * 主题为什么固定而不是可切:
 *   One Dark Pro 是这个组件的外观契约。允许调用方换主题, 就等于允许每个使用方
 *   各自发明一套配色, 那正是这套设计系统要避免的。
 *   亮色模式下也一样用它 —— 深色代码块在浅色页面里是常见且被接受的对照手法。
 *
 * 上游同款实现在 open-vetta 的 `theme-ui/src/shared/SyntaxHighlightedCode.tsx`,
 * 这里补上了上游没有的: 语言标签、行号、行高亮、复制按钮的独立反馈。
 */

/**
 * 主题常量。改这一行就换全站代码块外观。
 *
 * 为什么可以放心依赖 shiki 的 one-dark-pro:
 *   已逐条实测比对 —— shiki 的 275 条 tokenColors 与官方 One Dark Pro 3.20.2
 *   的 themes/OneDark-Pro.json **完全相同** (顺序、name、scope 形态一致)。
 *   实测渲染出的色值也吻合: keyword #C678DD / string #98C379 / number #D19A66 /
 *   comment #7F848E + italic / function #61AFEF / variable #E06C75 / type #E5C07B。
 *
 * 两个流传较广的错误写法, 不要"修"成它们:
 *   - 注释不是 #5C6370。官方只在 comment markup.link 等三处用它, 正文是 #7F848E。
 *   - 算术 / 比较 / 赋值算子不是 keyword.operator 的 #ABB2BF, 而是 #56B6C2。
 */
export const CODE_THEME = "one-dark-pro" as const;

/**
 * One Dark Pro 的 UI 色, 用来让外壳与语法区浑然一体。
 *
 * 来源是官方 `themes/OneDark-Pro.json` 的 `editor.*` 项, **不要从 shiki 包里读** ——
 * shiki 的 colors 是官方 222 键的裁剪子集 (只留了 143 键), 另外 5 键还是旧版残留。
 * 语法色可以信 shiki (逐条一致), UI 色不可以。
 */
export const ONE_DARK_PRO = {
  background: "#282c34",
  foreground: "#abb2bf",
  lineNumber: "#495162",
  lineHighlight: "#2c313c",
  selection: "#67769660",
} as const;

/**
 * 高亮结果缓存。
 *
 * 虚拟列表里条目滚出视窗会被卸载、滚回来重新挂载; 没有缓存时每次重挂都要重跑 shiki,
 * 而且要先渲染纯文本、拿到 HTML 再换 —— 高度变两次, 列表跟着重测量两次, 表现为卡顿与跳动。
 * 命中缓存时首帧就是高亮结果, 只有一次布局。
 */
const HTML_CACHE = new Map<string, string>();
const MAX_ENTRIES = 128;
const MAX_UNITS = 4_000_000;
let cacheUnits = 0;

function putCache(key: string, html: string): void {
  const prev = HTML_CACHE.get(key);
  if (prev !== undefined) {
    cacheUnits -= key.length + prev.length;
    HTML_CACHE.delete(key);
  }
  while (HTML_CACHE.size >= MAX_ENTRIES || cacheUnits + key.length + html.length > MAX_UNITS) {
    const oldest = HTML_CACHE.keys().next().value;
    if (oldest === undefined) return;
    cacheUnits -= oldest.length + (HTML_CACHE.get(oldest)?.length ?? 0);
    HTML_CACHE.delete(oldest);
  }
  HTML_CACHE.set(key, html);
  cacheUnits += key.length + html.length;
}

/**
 * 只对规模合理的代码跑高亮。
 *
 * 超过上限时退回纯文本 —— 完整源码仍然可读可复制, 只是没有着色。
 * 这比让一次超大粘贴把界面卡住要好。
 */
function withinBudget(code: string, lang: string): boolean {
  if (code.length > 30000 || lang.length > 128) return false;
  let lineLength = 0;
  let lines = 1;
  for (const ch of code) {
    if (ch === "\n") { lineLength = 0; lines++; }
    else lineLength++;
    if (lineLength > 2000 || lines > 1000) return false;
  }
  return true;
}

export interface CodeBlockProps {
  readonly code: string;
  /** 语言标识, 例如 tsx / bash / css。不认得的语言会被 shiki 降级为纯文本。 */
  readonly lang?: string;
  /** 标题栏左侧文本。不传时显示语言名。 */
  readonly title?: string;
  /** 是否显示行号。超过 20 行时建议开。 */
  readonly showLineNumbers?: boolean;
  /** 要高亮的行号 (从 1 开始)。 */
  readonly highlightLines?: readonly number[];
  /** 右上角额外操作 (复制按钮自带)。 */
  readonly actions?: ReactNode;
  /** 是否显示顶部标题栏。 */
  readonly showHeader?: boolean;
  readonly className?: string;
}

/** 复制按钮。两态反馈, 1.2 秒后复位。 */
function CopyButton({ text }: { text: string }): JSX.Element {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className={cn(
        "rounded-md border px-2 py-1 text-[11px] transition-colors",
        copied
          ? "border-emerald-500/40 text-emerald-400"
          : "border-white/15 text-[#abb2bf] hover:border-white/30 hover:text-white",
      )}
      style={{ background: copied ? undefined : "transparent" }}
    >
      {copied ? "已复制" : "复制"}
    </button>
  );
}

export function CodeBlock({
  code,
  lang = "text",
  title,
  showLineNumbers = false,
  highlightLines,
  actions,
  showHeader = true,
  className,
}: CodeBlockProps): JSX.Element {
  const language = lang || "text";
  const eligible = useMemo(() => withinBudget(code, language), [code, language]);
  const cacheKey = useMemo(
    () => (eligible ? JSON.stringify([CODE_THEME, language, code]) : ""),
    [eligible, language, code],
  );

  const [html, setHtml] = useState<string | null>(() => HTML_CACHE.get(cacheKey) ?? null);
  const [failed, setFailed] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    if (!eligible) { setHtml(null); return; }

    const cached = HTML_CACHE.get(cacheKey);
    if (cached !== undefined) { setHtml(cached); return; }

    setHtml(null);
    void codeToHtml(code, { lang: language, theme: CODE_THEME })
      .then((result) => {
        if (cancelled.current) return;
        putCache(cacheKey, result);
        setHtml(result);
      })
      .catch(() => {
        if (!cancelled.current) setFailed(true);
      });

    return () => { cancelled.current = true; };
  }, [cacheKey, code, language, eligible]);

  const lineCount = useMemo(() => code.replace(/\n$/, "").split("\n").length, [code]);
  const lineNumberWidth = String(lineCount).length;

  return (
    <div
      className={cn("overflow-hidden rounded-xl border", className)}
      style={{ background: ONE_DARK_PRO.background, borderColor: "rgba(255,255,255,0.09)" }}
    >
      {showHeader ? (
        <div
          className="flex h-9 shrink-0 items-center gap-2 border-b px-3"
          style={{ borderColor: "rgba(255,255,255,0.09)" }}
        >
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] tracking-wide" style={{ color: ONE_DARK_PRO.lineNumber }}>
            {title ?? language}
          </span>
          {actions}
          <CopyButton text={code} />
        </div>
      ) : null}

      <div className="relative flex text-[12px] leading-[1.6]">
        {showLineNumbers ? (
          <div
            aria-hidden
            className="shrink-0 select-none border-r py-3 text-right font-mono"
            style={{
              borderColor: "rgba(255,255,255,0.06)",
              color: ONE_DARK_PRO.lineNumber,
              width: `${lineNumberWidth + 2}ch`,
            }}
          >
            {Array.from({ length: lineCount }, (_, i) => {
              const n = i + 1;
              const on = highlightLines?.includes(n);
              return (
                <div key={n} className="px-2" style={on ? { color: ONE_DARK_PRO.foreground } : undefined}>
                  {n}
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="min-w-0 flex-1 overflow-x-auto">
          {html && !failed ? (
            <div
              className={[
                "font-mono",
                // shiki 自带 pre/code 的底色与内边距, 这里统一压平, 由外壳决定观感
                "[&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-3 [&_code]:!bg-transparent [&_code]:!font-mono",
                // 高亮行: 用半透明白叠在 One Dark Pro 的当前行色上。
                // 选择器逐个生成而不是拼一个逗号列表 —— 后者在模板串里容易出错, 也难读。
                ...(highlightLines ?? []).map(
                  (n) => `[&_.line:nth-child(${n})]:!bg-white/[0.05]`,
                ),
              ].join(" ")}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki 生成的是安全 HTML
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <pre className="m-0 overflow-x-auto p-3" style={{ color: ONE_DARK_PRO.foreground }}>
              <code className="font-mono">{code.replace(/\n$/, "")}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
