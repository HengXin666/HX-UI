import type { JSX } from "react";
import { ApiTable, Callout, DocsHome, DocsPager, DocsToc } from "../../../../../src/blocks/docs";
import { DOCS_DOC } from "../../../../../src/constants/blocks-docs-v109";
import { Callout as DocCallout, Code, CodeBlock, H2, P, Preview } from "../../../components/DocKit";
import { DocsShellDemo } from "./DocsShellDemo";
import { DOCS_DEMO_API, DOCS_DEMO_HOME, DOCS_DEMO_PAGER, DOCS_DEMO_SIDEBAR, DOCS_DEMO_TOC } from "./docsDemoData";

const SHELL_CODE = `<DocsShell sidebar={sidebar} toc="auto" brand={<Logo />} pager={{ prev, next }}>
  <h1>Button</h1>
  <h2 id="usage">用法</h2>
  <Callout kind="tip" title="纯图标按钮">必须给 aria-label.</Callout>
  <h2 id="api">API</h2>
  <ApiTable rows={rows} requiredFirst />
</DocsShell>`;

const COMPOSER_CODE = `<PageComposer
  registry={{ DocsHome, ApiTable, Callout }}
  blocks={[
    { type: "DocsHome", props: home },
    { type: "ApiTable", props: { rows, heading: { title: "API" } } },
  ]}
/>`;

const JSON_EXAMPLE = JSON.stringify({ sidebar: DOCS_DEMO_SIDEBAR, toc: DOCS_DEMO_TOC.slice(0, 3), pager: DOCS_DEMO_PAGER, api: DOCS_DEMO_API.slice(0, 2) }, null, 2);

/**
 * V1-09 文档站区块文档页: 完整三栏文档页, 首页, TOC / Pager / ApiTable / Callout 单独演示, JSON 数据示例, PageComposer 用法, 三皮肤演示.
 *
 * .agents/notes/implemented/feature/2026-11-03-blocks-docs-v109.md
 */
export function DocsV109Page(): JSX.Element {
  return (
    <>
      <P>
        文档站区块: <Code>DocsShell</Code>, <Code>DocsToc</Code>, <Code>DocsPager</Code>, <Code>ApiTable</Code>, <Code>Callout</Code>,
        <Code>DocsHome</Code>. 结构对齐 shadcn / mantine / ant.design 的文档站: 侧栏 / 正文 / 本页目录 / 上一页下一页.
      </P>
      <DocCallout title="容器查询">
        外壳容器 ≥ @5xl 显示侧栏 (更窄时进左侧 Sheet), ≥ @7xl 显示右栏目录 (更窄时收进正文顶部的折叠目录). 三栏宽度由 --docs-sidebar-width /
        --docs-main-width / --docs-toc-width 控制.
      </DocCallout>

      <H2>完整文档页</H2>
      <Preview align="stretch" code={SHELL_CODE}>
        <div className={`${DOCS_DOC.stage} ${DOCS_DOC.stageTall}`}>
          <DocsShellDemo idPrefix="dv-" />
        </div>
      </Preview>

      <H2>文档站首页</H2>
      <Preview align="stretch" code={`<DocsHome hero={hero} search={{ placeholder, shortcut: "⌘K", onOpen }} cards={cards} />`}>
        <div className={DOCS_DOC.stage}>
          <DocsHome {...DOCS_DEMO_HOME} pad="md" />
        </div>
      </Preview>

      <H2>DocsToc 与 DocsPager</H2>
      <Preview align="stretch" code={`<DocsToc items={toc} activeId="usage" />\n<DocsPager prev={prev} next={next} />`}>
        <div className={DOCS_DOC.grid}>
          <DocsToc items={DOCS_DEMO_TOC} activeId={DOCS_DEMO_TOC[1].id} />
          <DocsPager {...DOCS_DEMO_PAGER} />
        </div>
      </Preview>

      <H2>Callout 四档</H2>
      <Preview align="stretch" code={`<Callout kind="note" | "tip" | "warning" | "danger" title="…">…</Callout>`}>
        <div className={DOCS_DOC.grid}>
          <Callout kind="note" title="注意">区块只读语义 token, 不感知皮肤名.</Callout>
          <Callout kind="tip" title="提示">相邻同 tone 区块自动合并留白.</Callout>
          <Callout kind="warning" title="警告">区块之间不互相 import.</Callout>
          <Callout kind="danger" title="危险">不要在区块里写颜色字面量.</Callout>
        </div>
      </Preview>

      <H2>ApiTable</H2>
      <Preview align="stretch" code={`<ApiTable rows={rows} requiredFirst collapseAt={48} />`}>
        <ApiTable rows={DOCS_DEMO_API} requiredFirst heading={{ title: "Button props" }} />
      </Preview>

      <H2>JSON 数据示例</H2>
      <P>所有字段都可 JSON 序列化, 适合 PageComposer 或 CMS 直接生成.</P>
      <CodeBlock code={JSON_EXAMPLE} lang="json" />

      <H2>PageComposer 用法</H2>
      <CodeBlock code={COMPOSER_CODE} />

      <H2>三皮肤演示</H2>
      <P>同一份数据在 default / mono / retail 三套皮肤下渲染, 外观差异全部来自令牌.</P>
      <div className={DOCS_DOC.grid}>
        {DOCS_DOC.skins.map((skin) => (
          <div key={skin} data-skin={skin} className={DOCS_DOC.skinFrame}>
            <p className={DOCS_DOC.skinTag}>data-skin="{skin}"</p>
            <DocsShellDemo idPrefix={`dv-${skin}-`} />
          </div>
        ))}
      </div>
    </>
  );
}
