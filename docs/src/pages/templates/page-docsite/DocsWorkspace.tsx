import type { JSX } from "react";
import { ApiTable, Callout, DocsShell } from "../../../../../src/blocks/docs";
import { Prose } from "../../../../../src/typography/Prose";
import type { DocsArticle, DocsSection, DocsWorkspaceData } from "./data";

/** 一节正文: 标题与段落进 Prose (排版全部来自 Prose), Callout / ApiTable 作为独立区块紧随其后. */
function Section({ section }: { section: DocsSection }): JSX.Element {
  const Heading = section.depth === 2 ? "h2" : "h3";
  return (
    <>
      <Prose>
        <Heading id={section.id}>{section.title}</Heading>
        {section.paragraphs.map((text) => (
          <p key={text}>{text}</p>
        ))}
        {section.code !== undefined && (
          <pre>
            <code>{section.code}</code>
          </pre>
        )}
      </Prose>
      {section.callout !== undefined && (
        <Callout kind={section.callout.kind} title={section.callout.title}>
          {section.callout.body}
        </Callout>
      )}
      {section.api !== undefined && <ApiTable rows={section.api.rows} caption={section.api.caption} requiredFirst />}
    </>
  );
}

function Article({ article }: { article: DocsArticle }): JSX.Element {
  return (
    <>
      <Prose size="lg">
        <h1>{article.title}</h1>
        <p>{article.lead}</p>
      </Prose>
      {article.sections.map((section) => (
        <Section key={section.id} section={section} />
      ))}
    </>
  );
}

/**
 * 文档站三栏一屏: DocsShell 的内置顶栏 + 侧栏 + Prose 正文 + 右栏目录, 正文底部由 pager 渲染 DocsPager.
 * 作为 PageComposer 的 registry 项使用, 只收 data.ts 里的 DocsWorkspaceData.
 */
export function DocsWorkspace({ id, data }: { id?: string; data: DocsWorkspaceData }): JSX.Element {
  return (
    <DocsShell
      id={id}
      brand={data.brand}
      sidebar={data.sidebar}
      currentHref={data.currentHref}
      toc={data.toc}
      pager={data.pager}
      mainId={id === undefined ? undefined : `${id}-main`}
    >
      <Article article={data.article} />
    </DocsShell>
  );
}
