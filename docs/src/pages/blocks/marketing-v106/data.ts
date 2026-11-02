/**
 * marketing-v106 文档页的 JSON 数据示例: 全部可序列化 (字符串 / 数组 / 对象), 演示 "数据驱动" 用法.
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-marketing-developer.md
 */
import type { CodeShowcaseProps, CodeShowcaseTab } from "../../../../../src/blocks/marketing/CodeShowcase";
import type { InstallBlockProps } from "../../../../../src/blocks/marketing/InstallBlock";

const SEND_TS = `import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({ from: "hello@example.com", to: ["user@example.com"], subject: "Welcome aboard, this subject line is intentionally long to prove horizontal scrolling", html: "<strong>It works!</strong>" });
`;

const SEND_NEXT = `export async function POST() {
  const { data, error } = await resend.emails.send({ from: "hello@example.com", to: ["user@example.com"], subject: "Hi" });
  return Response.json(error ?? data);
}
`;

const SEND_PY = `import resend

resend.api_key = "re_123"
resend.Emails.send({"from": "hello@example.com", "to": ["user@example.com"], "subject": "Hi", "html": "<p>Hi</p>"})
`;

const SEND_GO = `client := resend.NewClient("re_123")
sent, err := client.Emails.Send(&resend.SendEmailRequest{From: "hello@example.com", To: []string{"user@example.com"}, Subject: "Hi"})
`;

const COUNTER_TSX = `export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>点了 {count} 次</button>;
}
`;

/** CodeShowcase: 两级 tabs (语言 → 框架) + 尾部动作. */
export const CODE_SHOWCASE_JSON: Pick<CodeShowcaseProps, "heading" | "tabs" | "actions"> = {
  heading: { eyebrow: "Integrate", title: "几行代码接入", description: "外层选语言, 内层选框架; 代码全部来自 props." },
  tabs: [
    {
      label: "Node.js",
      language: "ts",
      subTabs: [
        { label: "SDK", filename: "send.ts", code: SEND_TS, highlightLines: [5] },
        { label: "Next.js", filename: "app/api/send/route.ts", code: SEND_NEXT },
      ],
    },
    { label: "Python", language: "python", filename: "send.py", code: SEND_PY },
    { label: "Go", language: "go", filename: "main.go", code: SEND_GO },
  ],
  actions: [
    { label: "在 GitHub 打开", href: "https://github.com/", external: true, variant: "secondary" },
    { label: "下载 ZIP", href: "#download", variant: "ghost" },
  ],
};

/** CodeShowcase 并排模式的代码 (预览节点在页面里给, 不进 JSON). */
export const COUNTER_SAMPLE: CodeShowcaseTab = { label: "Counter.tsx", filename: "Counter.tsx", language: "tsx", code: COUNTER_TSX, previewAddress: "localhost:5173" };

/** InstallBlock: 多包管理器 + 备用方式. */
export const INSTALL_JSON: Pick<InstallBlockProps, "heading" | "commands" | "alternativesTitle" | "alternatives"> = {
  heading: { title: "开始使用", description: "选一个包管理器, 复制即可." },
  commands: [
    { manager: "npm", command: "npm install @hx/ui" },
    { manager: "pnpm", command: "pnpm add @hx/ui" },
    { manager: "yarn", command: "yarn add @hx/ui" },
    { manager: "bun", command: "bun add @hx/ui" },
  ],
  alternativesTitle: "其他方式",
  alternatives: [{ label: "或用 Docker", description: "免安装体验文档站.", command: ["docker pull hx/ui-docs", "docker run -p 8080:80 hx/ui-docs"] }],
};

/** InstallBlock: 多操作系统 (deno 式). */
export const INSTALL_PLATFORMS_JSON: Pick<InstallBlockProps, "platforms"> = {
  platforms: [
    { label: "macOS / Linux", commands: [{ manager: "curl", command: "curl -fsSL https://deno.land/install.sh | sh" }] },
    { label: "Windows", commands: [{ manager: "powershell", command: "irm https://deno.land/install.ps1 | iex" }] },
    {
      label: "包管理器",
      commands: [
        { manager: "brew", command: "brew install deno" },
        { manager: "npm", command: "npm install -g deno" },
      ],
    },
  ],
};

/** 三皮肤演示用的皮肤名. */
export const V106_SKINS = ["mono", "fintech", "emerald"] as const;
