import type { JSX } from "react";
import { BUTTON_TYPE, CodeBlock, DocsPager, InstallBlock, cn } from "@hx/ui";
import { REPO_URL } from "../../../src/components/site";
import { VERSION } from "../../home/site-facts";
import { CATALOG } from "../catalog";
import { ICON, ICON_XS, INSTALL_ID, PAGER_CLASS, PKG, TOOL_GROUP } from "../constants";
import { copyText } from "../page/copy";

interface Snippet {
  readonly label?: string;
  readonly code: string;
  readonly lang: string;
}
interface Step {
  readonly title: string;
  readonly text: string;
  readonly snippets: readonly Snippet[];
}
interface Part {
  readonly title: string;
  readonly steps: readonly Step[];
}

const BASH = "bash";
const GAP = "\n\n";
const TITLE = "安装与使用";
const LEAD = "整个库是一个 npm 包, 组件, 令牌与样式都在里面. 用 npm 装一条命令就够; 想锁在自己的构建上, 也可以从源码打包.";
const STYLE_CSS = `/* src/styles.css: 项目的样式入口 */
@import "${PKG}/styles.css";

/* 路径相对于本 CSS 文件, 按项目目录层级调整 */
@source "../node_modules/${PKG}/src/**/*.{ts,tsx}";`;
const USAGE = `import { Button, SplitText } from "${PKG}";

export function Hero() {
  return (
    <section>
      <SplitText text="你好, HX UI!" className="text-6xl font-bold" />
      <Button variant="primary">开始</Button>
    </section>
  );
}`;
const TARBALL = `hx-ui-${VERSION}.tgz`;

/** 安装页的全部内容. 页面与 "复制为 Markdown" 都从这一份数据出. */
const PARTS: readonly Part[] = [
  {
    title: "用 npm 安装",
    steps: [
      { title: "安装包", text: "需要 React 19. 样式桥接用 Tailwind v4; 不用 Tailwind 时只引 tokens.css 也能拿到全部令牌.", snippets: [{ label: "npm", code: `npm i ${PKG}`, lang: BASH }] },
      { title: "接入样式", text: "在样式入口引入完整样式文件, 并让 Tailwind 扫描库源码. 只引令牌会漏掉组件样式.", snippets: [{ code: STYLE_CSS, lang: "css" }] },
      { title: "引入并使用", text: "和其他组件一样渲染. 每个组件页的代码页签会跟着调参实时给出用法.", snippets: [{ code: USAGE, lang: "tsx" }] },
    ],
  },
  {
    title: "从源码打包",
    steps: [
      { title: "克隆仓库", text: "源码就是发布内容, 改动后自己打包即可.", snippets: [{ code: `git clone ${REPO_URL}.git`, lang: BASH }] },
      { title: "安装依赖并构建", text: "构建产物在 dist/, 由仓库的门禁脚本调度.", snippets: [{ code: "npm ci\nnpm run build", lang: BASH }] },
      { title: "打包", text: `生成 ${TARBALL}.`, snippets: [{ code: "npm pack", lang: BASH }] },
      { title: "在项目里安装压缩包", text: "之后接入样式与使用同上.", snippets: [{ code: `npm i ./${TARBALL}`, lang: BASH }] },
    ],
  },
];
const OUTRO_TITLE = "就这些";
const OUTRO = "换肤只改 tokens.css 里的 CSS 变量, 组件代码一行不动; 亮色靠根元素的 data-mode=\"light\".";

function toMarkdown(): string {
  const parts = PARTS.map(
    (part) =>
      `## ${part.title}${GAP}` +
      part.steps
        .map((step, index) => `${index + 1}. **${step.title}**${GAP}   ${step.text}${GAP}` + step.snippets.map((snippet) => "```" + snippet.lang + "\n" + snippet.code + "\n```").join(GAP))
        .join(GAP),
  );
  return [`# ${TITLE}`, LEAD, ...parts, `## ${OUTRO_TITLE}`, OUTRO].join(GAP);
}

/** 一条终端命令: 库 InstallBlock 的单行加复制 (复制结果经 aria-live 播报), 有标签时标签在上. */
function Command({ snippet }: { readonly snippet: Snippet }): JSX.Element {
  return (
    <div className="rounded-xl border border-border/60 bg-background/70 py-3 pr-3 pl-4">
      {snippet.label ? <p className="mb-1.5 text-[13px] font-semibold text-foreground">{snippet.label}</p> : null}
      <InstallBlock
        embedded
        variant="pill"
        prompt=""
        commands={[{ command: snippet.code }]}
        labels={{ copyCommand: "复制命令" }}
        classNames={{
          command: "flex w-full max-w-none items-center justify-between gap-3 rounded-none border-0 bg-transparent p-0 [&>pre]:min-w-0 [&>pre]:flex-1",
          line: "font-mono text-[12.5px] text-muted-foreground",
          copy: "size-8 shrink-0 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground",
        }}
      />
    </div>
  );
}

/** 安装页, 对标 reactbits /get-started/installation: 编号步骤, 每段代码可复制, 整页可复制为 Markdown. */
export function InstallGuide(): JSX.Element {
  const index = CATALOG.findIndex((entry) => entry.id === INSTALL_ID);
  const next = CATALOG[index + 1];
  return (
    <article className="mx-auto flex max-w-[676px] flex-col">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-[44px] leading-[1.1] font-bold tracking-[-0.03em] text-foreground">{TITLE}</h1>
        <button type={BUTTON_TYPE} onClick={() => copyText(toMarkdown(), "整页 Markdown")} className={cn(TOOL_GROUP, "mt-2 shrink-0 gap-2 px-3 text-[13px] text-muted-foreground hover:text-foreground")}>
          <span aria-hidden className={cn(ICON.copy, ICON_XS)} />
          复制为 Markdown
        </button>
      </div>
      <p className="mt-5 text-[18px] leading-[1.6] text-foreground/85">{LEAD}</p>

      {PARTS.map((part) => (
        <section key={part.title} aria-labelledby={part.title} className="mt-16">
          <h2 id={part.title} className="scroll-mt-24 text-[24px] font-bold tracking-tight text-foreground">
            {part.title}
          </h2>
          <ol className="mt-6 flex flex-col gap-9">
            {part.steps.map((step, stepIndex) => (
              <li key={step.title}>
                <h3 className="flex items-center gap-3 text-[16px] font-semibold text-foreground">
                  <span className="grid size-6 place-items-center rounded-md border border-border bg-muted/50 font-mono text-[12px]">{stepIndex + 1}</span>
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">{step.text}</p>
                {step.snippets.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-1.5">
                    {step.snippets.map((snippet) =>
                      snippet.lang === BASH ? <Command key={snippet.code} snippet={snippet} /> : <CodeBlock key={snippet.code} code={snippet.code} lang={snippet.lang} showLineNumbers />,
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ))}

      <section aria-labelledby={OUTRO_TITLE} className="mt-16">
        <h2 id={OUTRO_TITLE} className="scroll-mt-24 text-[24px] font-bold tracking-tight text-foreground">
          {OUTRO_TITLE}
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{OUTRO}</p>
      </section>

      <DocsPager
        aria-label="页面导航"
        className="mt-20"
        labels={{ next: "下一页" }}
        next={next ? { label: next.label, href: `#/${next.id}` } : undefined}
        classNames={PAGER_CLASS}
      />
    </article>
  );
}
