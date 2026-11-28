"use client";
/** ```math / ```latex / ```katex / ```tex 围栏: 闭合后用 KaTeX 渲染, 生成中显示源码. 入口见 math-entry.ts */
import * as React from "react";
import { CodeBlock } from "../code/code-block";
import type { FenceRendererProps } from "../markdown/context";
import { DiagramFrame } from "../parts/diagram-frame";

type Katex = typeof import("katex").default;
let katex: Promise<Katex> | null = null;

export function MathFence({ code, incomplete, theme, meta }: FenceRendererProps) {
  const [out, setOut] = React.useState<{ html?: string; error?: string; for?: string }>({});
  React.useEffect(() => {
    if (incomplete) return;
    let alive = true;
    katex ??= import("katex").then((m) => m.default);
    katex.then((k) => {
      if (!alive) return;
      try {
        setOut({ html: k.renderToString(code, { displayMode: true, throwOnError: true, output: "htmlAndMathml" }), for: code });
      } catch (e) {
        setOut({ error: e instanceof Error ? e.message : String(e), for: code });
      }
    });
    return () => {
      alive = false;
    };
  }, [code, incomplete]);
  const ready = out.for === code;
  return (
    <DiagramFrame
      label={meta.title ?? meta.rawLang ?? "math"}
      source={code}
      showSource={incomplete || !ready}
      error={ready ? (out.error ?? null) : null}
      sourceView={<CodeBlock bare code={code} language="latex" theme={theme} incomplete={incomplete} hideLanguage />}
    >
      {ready && out.html ? <div className="max-w-full overflow-x-auto text-[1.05em] text-foreground" dangerouslySetInnerHTML={{ __html: out.html }} /> : null}
    </DiagramFrame>
  );
}

