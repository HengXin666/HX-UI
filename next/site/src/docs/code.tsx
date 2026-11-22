import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const KW = new Set("import export from default function return const let var if else for while of in new type interface extends as async await typeof keyof null undefined true false void".split(" "));

type Tok = { t: string; c?: string };

/** 够用的 TSX 着色: 注释, 字符串, 数字, 关键字, JSX 标签, 属性名. 不引第三方高亮库 */
export function tokenize(src: string): Tok[] {
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(<\/?[A-Za-z][\w.]*)|(\b\d[\d_.]*\b)|([A-Za-z_$][\w$]*)(?=\s*=(?!=)|\s*\??:\s)|([A-Za-z_$][\w$]*)/g;
  const out: Tok[] = [];
  let last = 0;
  for (let mt = re.exec(src); mt; mt = re.exec(src)) {
    if (mt.index > last) out.push({ t: src.slice(last, mt.index) });
    const [s, com, str, tag, num, attr, word] = mt;
    if (com) out.push({ t: s, c: "text-[var(--code-com)] italic" });
    else if (str) out.push({ t: s, c: "text-[var(--code-str)]" });
    else if (tag) out.push({ t: s, c: "text-[var(--code-tag)]" });
    else if (num) out.push({ t: s, c: "text-[var(--code-num)]" });
    else if (attr) out.push({ t: s, c: KW.has(attr) ? "text-[var(--code-kw)]" : "text-[var(--code-attr)]" });
    else if (word) out.push({ t: s, c: KW.has(word) ? "text-[var(--code-kw)]" : /^[A-Z]/.test(word) ? "text-[var(--code-type)]" : undefined });
    last = mt.index + s.length;
  }
  if (last < src.length) out.push({ t: src.slice(last) });
  return out;
}

export function CopyButton({ text, label = "复制", className }: { text: string; label?: string; className?: string }) {
  const [ok, setOk] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setOk(true);
          window.setTimeout(() => setOk(false), 1400);
        });
      }}
      className={cn("inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", className)}
    >
      {ok ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {ok ? "已复制" : label}
    </button>
  );
}

export function CodeBlock({ code, title, maxHeight }: { code: string; title: string; maxHeight?: number }) {
  const toks = React.useMemo(() => tokenize(code), [code]);
  const lines = code.split("\n").length;
  return (
    <figure className="overflow-hidden rounded-xl border bg-[var(--code-bg)]">
      <figcaption className="flex h-10 items-center justify-between border-b px-4 font-mono text-xs text-muted-foreground">
        <span>{title}</span>
        <CopyButton text={code} />
      </figcaption>
      <div className="overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
        <pre className="flex min-w-max py-4 font-mono text-[13px] leading-6">
          <span aria-hidden className="select-none px-4 text-right text-muted-foreground/50">
            {Array.from({ length: lines }, (_, i) => <span key={i} className="block">{i + 1}</span>)}
          </span>
          <code className="pr-6">{toks.map((t, i) => (t.c ? <span key={i} className={t.c}>{t.t}</span> : t.t))}</code>
        </pre>
      </div>
    </figure>
  );
}
