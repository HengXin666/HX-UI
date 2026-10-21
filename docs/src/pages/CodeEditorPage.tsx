import { useState, type JSX } from "react";
import { Button, CodeEditor, VARIANT } from "@hx/ui";
import { H2, P, Preview } from "../components/DocKit";
import { Props } from "../components/DocSpec";

const SAMPLE = `import { useCallback, useState } from "react";

/**
 * 一个能跑的最小示例: 计数器 + 一步, 用来展示主题的各类 token。
 */
export function useStep(initial = 0, step = 1) {
  const [value, setValue] = useState(initial);

  const advance = useCallback(() => setValue((v) => v + step), [step]);
  const reset = useCallback(() => setValue(initial), [initial]);

  return { value, advance, reset, step };
}
`;

const JSON_SAMPLE = `{
  "name": "@hx/ui",
  "version": "0.1.2",
  "exports": {
    ".": { "import": "./dist/index.js" }
  }
}`;

/**
 * 代码编辑器文档页.
 *
 * 编辑器走 monaco (VS Code 内核), 主题是 One Dark Pro Darker, 颜色全部来自
 * tokens.css 的 --code-odp-* 令牌.
 * .agents/notes/implemented/feature/2026-10-22-code-editor-one-dark-pro-darker.md
 */
export function CodeEditorPage(): JSX.Element {
  const [code, setCode] = useState(SAMPLE);
  return (
    <>
      <P>
        可编辑的代码编辑器: 内核是 monaco (VS Code 用的就是它), 主题固定为 One Dark
        Pro Darker。语法着色, 多光标, 查找替换, 代码折叠都与 VS Code 一致; 颜色不写死在组件里,
        而是从 <code className="font-mono text-[12.5px]">tokens.css</code> 的 --code-odp-* 令牌读取。
      </P>
      <P>
        编辑器按需加载, 不进首屏; monaco 默认会从 CDN 拉资源, 这里通过 loader.config 指向本地包,
        离线与内网部署都能用。worker 由使用方的打包器提供 (Vite 用 new URL 引入), 拿不到时退化为
        主线程计算, 编辑功能不受影响。
      </P>

      <H2>可编辑示例</H2>
      <Preview
        align="stretch"
        code={`import { CodeEditor } from "@hx/ui";

const [code, setCode] = useState(SAMPLE);

<CodeEditor value={code} onChange={setCode} language="typescript" height={320} />`}
      >
        <div className="flex w-full min-w-0 flex-col gap-2">
          <CodeEditor value={code} onChange={setCode} language="typescript" height={320} />
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span>当前 {code.split("\n").length} 行</span>
            <Button size={VARIANT.sm} variant={VARIANT.ghost} onClick={() => setCode(SAMPLE)}>恢复示例</Button>
          </div>
        </div>
      </Preview>

      <H2>其它语言</H2>
      <Preview
        align="stretch"
        code={`<CodeEditor value={json} language="json" height={220} minimap={false} />`}
      >
        <div className="w-full min-w-0">
          <CodeEditor value={JSON_SAMPLE} language="json" height={220} readOnly />
        </div>
      </Preview>

      <H2>属性</H2>
      <Props
        spec={`
value ~ string ~ - ~ 受控值
onChange ~ (next: string) => void ~ - ~ 不给时按只读展示
language ~ string ~ "typescript" ~ monaco 语言 id
height ~ number | string ~ 320 ~ 编辑器高度
readOnly ~ boolean ~ false ~ 只读
minimap ~ boolean ~ false ~ 右侧缩略图
lineNumbers ~ boolean ~ true ~ 行号
path ~ string ~ - ~ 模型文件名, 多个编辑器之间区分模型
className ~ string ~ - ~ 外层类名`}
      />
      <H2>与 Code Block 的分工</H2>
      <P>
        CodeBlock 是只读展示, 用 shiki 做静态高亮, 适合文档里的代码片段; CodeEditor 是可编辑的,
        用 monaco, 适合配置编辑, diff 审阅与 playground。两者共用同一套 One Dark Pro 配色,
        但取色路径不同: 前者来自 shiki 主题, 后者来自 CSS 令牌。
      </P>
    </>
  );
}
