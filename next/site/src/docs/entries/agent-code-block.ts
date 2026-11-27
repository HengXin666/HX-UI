import type { DocEntry } from "../types";

const D = { theme: "dark", title: true, lineNumbers: true, wrap: false, collapse: 0, highlight: true };

export const agentCodeBlock: DocEntry = {
  slug: "code-block",
  name: "CodeBlock",
  title: "代码块",
  section: "ui",
  group: "Agent",
  sub: "内容",
  description:
    "博客同款代码块：One Dark Pro 深色面板，默认带行号，右上角是语言名，换行 / 下载 / 复制平时隐身、悬停时浮现。支持标题栏、行高亮、起始行号、超长折叠。Shiki 高亮（JS 正则引擎，不加载 wasm），语言和主题按需懒加载；流式中节流高亮，写完的行颜色不闪。Markdown 里的围栏、组合选项卡、工具卡片里的代码都是它。",
  file: "src/agent/code/code-block.tsx",
  importFrom: "@hx/ui/agent",
  demo: () => import("./agent-code-block.demo"),
  source: () => import("@/agent/code/code-block.tsx?raw").then((m) => m.default),
  stageHeight: 620,
  remountOnChange: false,
  defaults: D,
  componentDefaults: { theme: "dark", title: false, lineNumbers: true, wrap: false, collapse: 0, highlight: false },
  presets: [
    { label: "博客风格", values: D },
    { label: "折叠长代码", values: { ...D, collapse: 12, highlight: false } },
    { label: "跟随亮暗", values: { ...D, theme: "auto" } },
    { label: "极简", values: { ...D, title: false, lineNumbers: false, highlight: false } },
  ],
  controls: [
    { type: "select", key: "theme", label: "配色", options: [{ value: "dark", label: "One Dark Pro" }, { value: "auto", label: "跟随亮暗" }] },
    { type: "toggle", key: "title", label: "标题栏" },
    { type: "toggle", key: "lineNumbers", label: "行号" },
    { type: "toggle", key: "highlight", label: "行高亮" },
    { type: "toggle", key: "wrap", label: "自动换行" },
    { type: "number", key: "collapse", label: "超过 N 行折叠", min: 0, max: 30, step: 2 },
  ],
  usage: (v) => {
    const a = [`code={source}`, `language="C++"`];
    if (v.title) a.push(`title="next_greater.cpp"`);
    if (v.theme !== "dark") a.push(`theme="${v.theme}"`);
    if (!v.lineNumbers) a.push("lineNumbers={false}");
    if (v.highlight) a.push("highlightLines={[10, 11, 12, 13]}");
    if (v.wrap) a.push("wrap");
    if (Number(v.collapse)) a.push(`collapse={${v.collapse}}`);
    return `import { CodeBlock } from "@hx/ui/agent";\n\n<CodeBlock ${a.join(" ")} />\n\n// Markdown 围栏里写同样的选项:\n// \`\`\`cpp title="a.cpp" {10-13} collapse=12\n// \`\`\`cpp [解法-C++]   相邻同组围栏合成选项卡\n`;
  },
  props: [
    { name: "code", type: "string", description: "代码。" },
    { name: "language", type: "string", description: "语言名，原样显示在右上角（C++）；高亮时归一（cpp）。" },
    { name: "title", type: "ReactNode", description: "标题栏，一般是文件名。" },
    { name: "theme", type: '"dark" | "auto"', default: '"dark"', description: "dark 不论亮暗都是 One Dark Pro；auto 亮色 One Light，暗色 One Dark Pro。" },
    { name: "lineNumbers", type: "boolean", default: "true", description: "行号。" },
    { name: "startLine", type: "number", default: "1", description: "起始行号（读文件片段时用）。" },
    { name: "highlightLines", type: "Iterable<number>", description: "高亮的行（按显示的行号）。" },
    { name: "collapse", type: "number", default: "0", description: "超过多少行折叠，底部出现「展开全部」。" },
    { name: "maxHeight", type: "number", description: "内容区最大高度，超出滚动。" },
    { name: "wrap", type: "boolean", default: "false", description: "默认是否自动换行，右上角按钮可切换。" },
    { name: "incomplete", type: "boolean", default: "false", description: "流式中：节流高亮，末尾光标。" },
    { name: "actions", type: "ReactNode", description: "右上角额外按钮（例如「运行」）。" },
    { name: "bare", type: "boolean", default: "false", description: "不画外框，放进组合块或卡片里用。" },
  ],
};
