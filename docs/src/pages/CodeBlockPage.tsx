import type { JSX } from "react";
import { CodeBlock, Button } from "@hx/ui";
import { H2, P, Preview, PropsTable, Callout, Code } from "../components/DocKit";

const TS_SAMPLE = `import { useState } from "react";

export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);

  const increment = () => setCount((c) => c + 1);

  // 返回值用对象而不是数组, 调用方读起来更清楚
  return { count, increment, reset: () => setCount(initial) };
}`;

const SH_SAMPLE = `npm i @hx/ui
npm run sync-upstream          # 从 ../../ref/open-vetta 重新拉源码
node scripts/check-icons.mjs   # 图标名门禁, 退出码 1 = 有无效名`;

const CSS_SAMPLE = `@import "tailwindcss";
@import "@hx/ui/tokens.css";

/* 库的类名不在这个工程里, 不显式声明 Tailwind 扫不到 */
@source "../node_modules/@hx/ui/src/**/*.{ts,tsx}";

@theme inline {
  --color-primary: var(--primary);
}`;

export function CodeBlockPage(): JSX.Element {
  return (
    <>
      <P>
        代码高亮用 <Code>shiki</Code> —— VS Code 同款的 TextMate 语法引擎, 主题固定为{" "}
        <Code>One Dark Pro</Code>。不用 highlight.js / prism 是因为它们是正则近似匹配, 遇到嵌套与边缘写法会错色;
        shiki 跑的是真语法, 与编辑器里看到的一致。
      </P>

      <Callout title="主题为什么固定">
        One Dark Pro 是这个组件的外观契约。允许调用方换主题, 等于允许每个使用方各自发明配色,
        那正是这套设计系统要避免的。亮色页面里也用深色代码块 —— 这是常见且被接受的对照手法。
      </Callout>

      <H2>基础</H2>
      <Preview
        align="stretch"
        code={`<CodeBlock lang="ts" code={source} />`}
      >
        <div className="w-full">
          <CodeBlock lang="ts" code={TS_SAMPLE} />
        </div>
      </Preview>

      <H2>带标题与自定义操作</H2>
      <P>标题栏左侧默认显示语言名, 可以用 <Code>title</Code> 覆盖。右上角除自带复制按钮外可再挂操作。</P>
      <Preview
        align="stretch"
        code={`<CodeBlock
  lang="bash"
  title="terminal"
  code={cmds}
  actions={<Button variant="ghost" size="xs" className="text-[#abb2bf] hover:text-white">在新窗口打开</Button>}
/>`}
      >
        <div className="w-full">
          <CodeBlock
            lang="bash"
            title="terminal"
            code={SH_SAMPLE}
            actions={
              <Button variant="ghost" size="xs" className="text-[#abb2bf] hover:text-white">
                在新窗口打开
              </Button>
            }
          />
        </div>
      </Preview>

      <H2>行号与行高亮</H2>
      <P>超过 20 行建议开行号; <Code>highlightLines</Code> 从 1 开始数。</P>
      <Preview
        align="stretch"
        code={`<CodeBlock lang="css" showLineNumbers highlightLines={[4, 5]} code={css} />`}
      >
        <div className="w-full">
          <CodeBlock lang="css" showLineNumbers highlightLines={[4, 5]} code={CSS_SAMPLE} />
        </div>
      </Preview>

      <H2>无标题栏</H2>
      <P>嵌在别的内容里时可以把标题栏关掉, 只留代码本体。</P>
      <Preview
        align="stretch"
        code={`<CodeBlock lang="ts" showHeader={false} code={oneLiner} />`}
      >
        <div className="w-full">
          <CodeBlock lang="ts" showHeader={false} code={`const x = { a: 1, b: "two", c: [3, 4] };`} />
        </div>
      </Preview>

      <H2>属性</H2>
      <PropsTable
        rows={[
          { name: "code", type: "string", default: "-", desc: "源码文本。" },
          { name: "lang", type: "string", default: '"text"', desc: "语言标识。不认得的语言会降级为纯文本。" },
          { name: "title", type: "string", desc: "标题栏文本, 不传显示语言名。" },
          { name: "showLineNumbers", type: "boolean", default: "false", desc: "是否显示行号。" },
          { name: "highlightLines", type: "readonly number[]", desc: "要高亮的行号, 从 1 开始。" },
          { name: "actions", type: "ReactNode", desc: "标题栏右侧额外操作, 排在复制按钮左边。" },
          { name: "showHeader", type: "boolean", default: "true", desc: "是否显示顶部标题栏。" },
        ]}
      />

      <H2>约束</H2>
      <P>
        超过 30000 字符、单行超 2000 字符或超 1000 行的代码**不跑高亮**, 直接退回纯文本 ——
        完整内容仍可读可复制。这比让一次超大粘贴把界面卡住要好。
      </P>
      <P>
        高亮结果按 <Code>[主题, 语言, 源码]</Code> 缓存, 上限 128 条。虚拟列表里滚动时, 重挂的条目首帧就是高亮结果,
        不会出现"先纯文本后高亮"的高度跳动。
      </P>
    </>
  );
}
