import { useEffect, useState, type JSX, type ReactNode } from "react";
import { BUTTON_TYPE, useClipboard, useReducedMotion } from "@hx/ui";
import { WIN } from "./layout";
import { useNear } from "./use-loop";

/** 逐字打字的节拍 (ms / 字) 与开打前的停顿. */
const TYPE_MS = 55;
const TYPE_DELAY_MS = 700;
const COPIED_MS = 1600;

const KEYWORDS = new Set(["import", "from", "export", "default", "function", "return", "const", "let", "interface", "readonly", "type", "extends", "if", "else", "new", "true", "false", "null", "undefined"]);
const TOKEN = /(\/\/.*$|\/\*.*?\*\/|^\s*\*.*$|"[^"]*"|'[^']*'|`[^`]*`|\b[A-Za-z_]\w*\b|\d+(?:\.\d+)?)/g;

/** 一行源码的极简着色: 关键字与注释压暗, 其余亮. 颜色只用前景与次级前景两档令牌. */
export function tint(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let at = 0;
  for (const match of line.matchAll(TOKEN)) {
    const text = match[0];
    const index = match.index ?? 0;
    if (index > at) out.push(<span key={`p${at}`} className="text-muted-foreground">{line.slice(at, index)}</span>);
    const dim = KEYWORDS.has(text) || text.startsWith("//") || text.startsWith("/*") || text.trimStart().startsWith("*");
    out.push(<span key={`t${index}`} className={dim ? "text-muted-foreground" : "text-foreground"}>{text}</span>);
    at = index + text.length;
  }
  if (at < line.length) out.push(<span key={`p${at}`} className="text-muted-foreground">{line.slice(at)}</span>);
  return out;
}

/** 带行号的代码区: 每行 24 高, 14px 等宽. */
export function CodeLines({ lines, className }: { readonly lines: readonly ReactNode[]; readonly className?: string }): JSX.Element {
  return (
    <ol className={`m-0 list-none py-4 pl-0 pr-4 font-mono text-[13px] leading-6 md:text-[14px] ${className ?? ""}`}>
      {lines.map((line, index) => (
        <li key={index} className="flex min-w-0 whitespace-pre">
          <span aria-hidden className="w-12 shrink-0 select-none pr-5 text-right text-muted-foreground/60">{index + 1}</span>
          <span className="min-w-0 overflow-hidden text-ellipsis">{line}</span>
        </li>
      ))}
    </ol>
  );
}

/** 窗口外框: 标题栏居中文件名, 右上可选一个小按钮. */
export function Win({ title, tool, className, children }: { readonly title: string; readonly tool?: ReactNode; readonly className?: string; readonly children: ReactNode }): JSX.Element {
  return (
    <div className={`${WIN.frame} ${className ?? ""}`}>
      <div className={WIN.bar}>
        {title}
        {tool ? <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{tool}</span> : null}
      </div>
      <div className={WIN.body}>{children}</div>
    </div>
  );
}

/** 终端: 进视口后逐字打出命令, 打完再给出后续行. 右上复制按钮复制的就是这条命令. */
export function Terminal({ command, after, className }: { readonly command: string; readonly after: readonly string[]; readonly className?: string }): JSX.Element {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const near = useNear(box, "0px", true);
  const [count, setCount] = useState(0);
  const clip = useClipboard({ timeout: COPIED_MS });
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!near) return;
    // 减弱动效: 命令直接给全, 不逐字打.
    if (reduced) {
      setCount(command.length);
      return;
    }
    let n = 0;
    let timer = window.setTimeout(function step() {
      n += 1;
      setCount(n);
      if (n < command.length) timer = window.setTimeout(step, TYPE_MS);
    }, TYPE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [near, command, reduced]);
  const done = count >= command.length;
  const copied = clip.copied;
  const tool = (
    <button
      type={BUTTON_TYPE}
      onClick={() => clip.copy(command)}
      aria-label={copied ? "已复制" : "复制命令"}
      className="grid size-6 place-items-center rounded-md text-muted-foreground transition-[color] hover:text-foreground focus-visible:outline-1 focus-visible:outline-ring"
    >
      <span aria-hidden className={`${copied ? "icon-[solar--check-circle-linear]" : "icon-[solar--copy-linear]"} size-3.5 bg-current`} />
    </button>
  );
  return (
    <Win title="终端" tool={tool} className={className}>
      <div ref={setBox} className="px-4 py-3.5 font-mono text-[13px] leading-[22px]">
        <p className="m-0 whitespace-pre text-foreground">
          <span className="text-muted-foreground">$ </span>
          {command.slice(0, count)}
          {done ? null : <span aria-hidden className="ml-px inline-block h-4 w-2 translate-y-[3px] animate-pulse bg-foreground" />}
        </p>
        <span className="sr-only">{command}</span>
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? "已复制" : clip.error ? "复制失败" : ""}
        </span>
        {after.map((line, index) => (
          <p key={line} className="m-0 whitespace-pre text-muted-foreground transition-[opacity] duration-300" style={{ opacity: done ? 1 : 0, transitionDelay: `${index * 160}ms` }}>
            {line}
          </p>
        ))}
      </div>
    </Win>
  );
}
