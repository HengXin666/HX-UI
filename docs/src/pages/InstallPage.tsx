import type { JSX } from "react";
import { H2, P, CodeBlock } from "../components/DocKit";

export function InstallPage(): JSX.Element {
  return (
    <>
      <P>这套库的组件源码整份取自 open-vetta, <strong className="text-foreground">视觉类名一个字没改</strong>。只把包名引用改成了相对路径。</P>

      <H2>安装</H2>
      <CodeBlock code={`npm i @hx/ui`} />

      <H2>接入样式</H2>
      <P>必须引一次样式入口, 它里面 import 了令牌与 Tailwind 桥接层。项目自己的 CSS 要额外 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">@source</code> 扫库源码, 否则它的类名不会被生成。</P>
      <CodeBlock code={`/* src/styles.css —— 项目的样式入口 */
@import "tailwindcss";
@import "@hx/ui/tokens.css";

/* 关键: 库的类名不在这个工程里, 不显式声明 Tailwind 扫不到 */
@source "../node_modules/@hx/ui/src/**/*.{ts,tsx}";

@custom-variant dark (&:is([data-mode="dark"] *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  /* ...其余 token 见 tokens.css */
}`} />

      <H2>用起来</H2>
      <CodeBlock code={`import { AppFrame, SettingSection, SettingRow, Input } from "@hx/ui";

export function SettingsPage() {
  return (
    <AppFrame>
      <div className="relative z-10 flex min-h-0 flex-1 gap-2 p-2">
        <main className="min-w-0 flex-1 overflow-y-auto rounded-xl border border-border/40">
          <div className="mx-auto w-full max-w-[680px] px-8 pt-2 pb-4">
            <h1 className="mb-6 text-[20px] font-bold text-foreground">设置</h1>
            <SettingSection section={{ id: "general" }} title="常规">
              <SettingRow title="工作区" description="新建项目时的目录">
                <Input defaultValue="/tmp/workspace" className="w-64" />
              </SettingRow>
            </SettingSection>
          </div>
        </main>
      </div>
    </AppFrame>
  );
}`} />

      <H2>换肤</H2>
      <P>改 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">tokens.css</code> 里的 CSS 变量即可, 组件代码一行不动。暗色是默认, 亮色靠根元素的 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">data-mode="light"</code>。</P>

      <H2>同步上游</H2>
      <P>上游更新后跑同步脚本重新拉源码。脚本只改包名引用, 不动视觉类名。</P>
      <CodeBlock code={`npm run sync-upstream          # 默认从 ../../ref/open-vetta 拉
npm run sync-upstream /path/to/open-vetta`} />
    </>
  );
}
