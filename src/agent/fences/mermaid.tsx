"use client";
/**
 * ```mermaid 围栏 (拓展入口 "@hx/ui/agent/mermaid", mermaid 是可选 peer, 只有引了这个入口才需要装).
 *
 *   引入: MermaidFence (自 "@hx/ui/agent/mermaid")
 *   <Markdown fences={{ mermaid: MermaidFence }}>{text}</Markdown>
 *
 * - 围栏闭合后才渲染 (生成中显示源码, 不会每个 token 重画一次)
 * - 配色取本库令牌 (--foreground, --border, --brand ...), 亮暗切换时重画
 * - 语法错误: 回落到源码 + 错误信息
 */
import * as React from "react";
import { CodeBlock } from "../code/code-block";
import type { FenceRendererProps } from "../markdown/context";
import { DiagramFrame } from "../parts/diagram-frame";

type MermaidApi = typeof import("mermaid").default;
let api: Promise<MermaidApi> | null = null;
let queue: Promise<unknown> = Promise.resolve();
let seq = 0;

/** CSS 颜色 (含 oklch / var) -> #rrggbb; mermaid 的取色库不认 oklch */
function resolveColor(expr: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const probe = document.createElement("span");
  probe.style.color = expr;
  probe.style.display = "none";
  document.body.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx || !c) return fallback;
  ctx.fillStyle = "#000";
  ctx.fillStyle = c;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function themeVariables(dark: boolean) {
  const fg = resolveColor("var(--foreground)", dark ? "#eeeeee" : "#222222");
  const bg = resolveColor("var(--card)", dark ? "#1c1c1f" : "#ffffff");
  const muted = resolveColor("var(--muted)", dark ? "#2a2a2e" : "#f4f4f5");
  const border = resolveColor("color-mix(in oklch, var(--foreground) 28%, var(--card))", "#888888");
  const brand = resolveColor("var(--brand)", "#6366f1");
  const soft = resolveColor("color-mix(in oklch, var(--brand) 14%, var(--card))", muted);
  return {
    darkMode: dark,
    background: bg,
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, PingFang SC, Microsoft YaHei, sans-serif",
    fontSize: "14px",
    primaryColor: soft,
    primaryTextColor: fg,
    primaryBorderColor: brand,
    secondaryColor: muted,
    tertiaryColor: muted,
    lineColor: border,
    textColor: fg,
    mainBkg: soft,
    nodeBorder: brand,
    clusterBkg: muted,
    clusterBorder: border,
    edgeLabelBackground: bg,
    noteBkgColor: muted,
    noteTextColor: fg,
    noteBorderColor: border,
    actorBkg: soft,
    actorBorder: brand,
    actorTextColor: fg,
    signalColor: fg,
    signalTextColor: fg,
    labelBoxBkgColor: muted,
    labelTextColor: fg,
  };
}

async function render(code: string, dark: boolean): Promise<string> {
  api ??= import("mermaid").then((m) => m.default);
  const mermaid = await api;
  // mermaid 的配置是全局的: 串行渲染, 每次按当前亮暗重新 initialize
  const job = queue.then(async () => {
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "base", themeVariables: themeVariables(dark), flowchart: { curve: "basis", htmlLabels: true } });
    const { svg } = await mermaid.render(`hx-mermaid-${++seq}`, code);
    return naturalSize(svg);
  });
  queue = job.catch(() => undefined);
  return job;
}

/**
 * mermaid 默认 width="100%" + max-width: 自然宽, 宽的横向流程图会被压到容器宽, 字缩到看不清.
 * 改成自然宽度, 放不下时外框横向滚动 (全屏里还能缩放).
 */
function naturalSize(svg: string): string {
  const w = /max-width:\s*([\d.]+)px/.exec(svg)?.[1];
  if (!w) return svg;
  return svg.replace(/^<svg([^>]*?)\swidth="100%"/, `<svg$1 width="${w}"`).replace(/max-width:\s*[\d.]+px;?/, "");
}

function useDarkClass(): boolean {
  const [dark, setDark] = React.useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
  React.useEffect(() => {
    const el = document.documentElement;
    const mo = new MutationObserver(() => setDark(el.classList.contains("dark")));
    mo.observe(el, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

export function MermaidFence({ code, incomplete, theme, meta }: FenceRendererProps) {
  const dark = useDarkClass();
  const [state, setState] = React.useState<{ svg?: string; error?: string; for?: string }>({});
  const key = `${dark}\u0000${code}`;
  React.useEffect(() => {
    if (incomplete) return;
    let alive = true;
    render(code, dark).then(
      (svg) => alive && setState({ svg, for: key }),
      (e: unknown) => alive && setState({ error: e instanceof Error ? e.message.split("\n").slice(0, 3).join(" ") : String(e), for: key }),
    );
    return () => {
      alive = false;
    };
  }, [code, dark, incomplete, key]);
  const ready = state.for === key;
  const rendering = !incomplete && !ready;
  return (
    <DiagramFrame
      label={meta.title ?? "mermaid"}
      source={code}
      showSource={incomplete || rendering}
      error={ready ? (state.error ?? null) : null}
      status={incomplete ? <span className="hx-shimmer-text text-xs">生成中</span> : rendering ? <span className="hx-shimmer-text text-xs">渲染中</span> : null}
      download={() => (state.svg ? [`${meta.title ?? "diagram"}.svg`, state.svg, "image/svg+xml"] : null)}
      sourceView={<CodeBlock bare code={code} language="mermaid" theme={theme} incomplete={incomplete} hideLanguage maxHeight={420} />}
    >
      {ready && state.svg ? <div className="mx-auto w-fit [&>svg]:block [&>svg]:h-auto [&>svg]:max-w-none" dangerouslySetInnerHTML={{ __html: state.svg }} /> : null}
    </DiagramFrame>
  );
}

