import type { DocEntry } from "../types";

export const agentMarkdown: DocEntry = {
  slug: "markdown",
  name: "Markdown",
  title: "流式 Markdown",
  section: "agent",
  group: "内容",
  description:
    "给 AI 回答用的 Markdown。按顶层块切开逐块 memo，只有最后一块随 token 重渲染；半截的粗体、链接、代码围栏在生成中就按补全后的样子显示，不露标记；末尾有光标，新文字淡入。代码围栏走博客同款代码块（One Dark Pro、行号、组合选项卡），mermaid、svg、公式在围栏闭合后才渲染，生成中先显示源码。外观全部是本库令牌，解析与切块借 Streamdown。",
  file: "src/agent/markdown/markdown.tsx",
  importFrom: "@hx/ui/agent",
  demo: () => import("./agent-markdown.demo"),
  source: () => import("@/agent/markdown/markdown.tsx?raw").then((m) => m.default),
  bleed: true,
  stageHeight: 680,
  remountOnChange: false,
  defaults: { cps: 160, animated: true, codeTheme: "dark" },
  componentDefaults: { animated: true, codeTheme: "dark" },
  demoOnly: ["cps"],
  presets: [
    { label: "正常语速", values: { cps: 160, animated: true, codeTheme: "dark" } },
    { label: "极快", values: { cps: 900, animated: false, codeTheme: "dark" } },
    { label: "跟随亮暗", values: { cps: 160, animated: true, codeTheme: "auto" } },
  ],
  controls: [
    { type: "number", key: "cps", label: "每秒字数", min: 20, max: 1200, step: 20 },
    { type: "toggle", key: "animated", label: "新文字淡入" },
    { type: "select", key: "codeTheme", label: "代码配色", options: [{ value: "dark", label: "One Dark Pro" }, { value: "auto", label: "跟随亮暗" }] },
  ],
  usage: (v) => `import { Markdown } from "@hx/ui/agent";
import { mermaidFences } from "@hx/ui/agent/mermaid";      // 可选: npm i mermaid
import { math, mathFences } from "@hx/ui/agent/math";      // 可选: npm i @streamdown/math katex
import "katex/dist/katex.min.css";

const fences = { ...mermaidFences, ...mathFences, chart: MyChart }; // 自定义围栏: ({ code, lang, meta, incomplete }) => ReactNode

export function Answer({ text, generating }: { text: string; generating: boolean }) {
  return (
    <Markdown streaming={generating}${v.animated ? "" : " animated={false}"}${v.codeTheme === "auto" ? ' codeTheme="auto"' : ""} fences={fences} plugins={{ math }}>
      {text}
    </Markdown>
  );
}
`,
  props: [
    { name: "children", type: "string", description: "Markdown 文本，流式时每次传累积后的全文。" },
    { name: "streaming", type: "boolean", default: "false", description: "还在生成：末尾光标、未闭合语法补全、新文字淡入。结束后原地停下，不重挂。" },
    { name: "animated", type: "boolean", default: "跟随 streaming", description: "新到的文字淡入（只动 opacity）。" },
    { name: "fences", type: "Record<string, FenceRenderer>", description: "按语言注册的围栏渲染器，拿到 { code, lang, meta, incomplete, theme }；incomplete 表示围栏还没闭合。内置 svg，mermaid / 公式从可选入口引。" },
    { name: "plugins", type: "{ math?, cjk? }", description: "Streamdown 插件：$$ 公式（@hx/ui/agent/math 的 math）、中日韩标点。" },
    { name: "codeTheme", type: '"dark" | "auto"', default: '"dark"', description: "代码配色：dark 不论亮暗都是 One Dark Pro 面板；auto 亮色 One Light。" },
    { name: "codeCollapse", type: "number", default: "0", description: "代码块超过多少行折叠；围栏里写 collapse=N 优先。" },
    { name: "onLinkClick", type: "(href, e) => boolean | void", description: "链接点击，返回 true 阻止默认跳转（例如把文件路径交给编辑器打开）。" },
    { name: "size", type: '"base" | "sm"', default: '"base"', description: "sm 是紧凑排版，思考过程和工具输出里用。" },
  ],
};
