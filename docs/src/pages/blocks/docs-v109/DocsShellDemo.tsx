import type { JSX } from "react";
import { ApiTable, Callout, DocsShell } from "../../../../../src/blocks/docs";
import { DOCS_DOC } from "../../../../../src/constants/blocks-docs-v109";
import { DOCS_DEMO_API, DOCS_DEMO_PAGER, DOCS_DEMO_SIDEBAR, DOCS_DEMO_TOC } from "./docsDemoData";

/** 完整文档页: 内置顶栏 + 侧栏 + 正文 (标题自动采集进目录) + 右栏目录 + 上一页下一页. idPrefix 避免多实例锚点冲突. */
export function DocsShellDemo({ idPrefix = "", autoToc = false }: { idPrefix?: string; autoToc?: boolean }): JSX.Element {
  const id = (raw: string): string => `${idPrefix}${raw}`;
  const toc = autoToc ? "auto" : DOCS_DEMO_TOC.map((item) => ({ ...item, id: id(item.id) }));
  return (
    <DocsShell
      sidebar={DOCS_DEMO_SIDEBAR}
      toc={toc}
      brand={<span className={DOCS_DOC.brand}>HX-UI</span>}
      pager={DOCS_DEMO_PAGER}
      mainId={id("v109-main")}
    >
      <h1 className={DOCS_DOC.brand}>Button</h1>
      <p className={DOCS_DOC.muted}>触发一个操作或事件, 例如提交表单, 打开对话框.</p>
      <h2 id={id("v109-usage")}>用法</h2>
      <p>从 primitives 引入 Button, 用 variant 与 size 切换外观.</p>
      <h3 id={id("v109-variants")}>变体</h3>
      <p>default, secondary, outline, ghost, link, destructive.</p>
      <h3 id={id("v109-sizes")}>尺寸</h3>
      <p>xs 到 lg, 外加三档纯图标尺寸.</p>
      <h2 id={id("v109-a11y")}>可访问性</h2>
      <Callout kind="tip" title="纯图标按钮">
        必须给 aria-label, 否则读屏只能读出 "按钮".
      </Callout>
      <h2 id={id("v109-api")}>API</h2>
      <ApiTable rows={DOCS_DEMO_API} caption="Button props" requiredFirst />
    </DocsShell>
  );
}
