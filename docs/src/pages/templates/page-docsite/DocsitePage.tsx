import type { JSX } from "react";
import { PageComposer } from "../../../../../src/blocks/_shared";
import type { BlockRegistry } from "../../../../../src/blocks/_shared/types";
import { DocsHome } from "../../../../../src/blocks/docs";
import { SiteFooter } from "../../../../../src/blocks/site";
import { SkinSwitcher, type TemplateSkin } from "../shared/template-skins";
import { DOCS_ARTICLE_BLOCKS, DOCSITE_BLOCKS } from "./data";
import { DocsWorkspace } from "./DocsWorkspace";

const DOCS_REGISTRY: BlockRegistry = { DocsHome, DocsWorkspace, SiteFooter };

/** 根标签用 div: DocsShell 自带 main 地标, 避免嵌套 main. */
const ROOT_TAG = "div";

/** 文档站首页整页: DocsHome -> DocsShell(侧栏 + Prose 正文 + TOC, 底部 DocsPager) -> SiteFooter. */
export function DocsitePage({ skin }: { skin?: TemplateSkin }): JSX.Element {
  return <PageComposer as={ROOT_TAG} blocks={DOCSITE_BLOCKS} registry={DOCS_REGISTRY} skin={skin} />;
}

/** 文章页示范: DocsShell(正文含 Callout + ApiTable, 底部 DocsPager) -> SiteFooter. */
export function DocsArticlePage({ skin }: { skin?: TemplateSkin }): JSX.Element {
  return <PageComposer as={ROOT_TAG} blocks={DOCS_ARTICLE_BLOCKS} registry={DOCS_REGISTRY} skin={skin} />;
}

/** 文档站用的模板页: 皮肤切换条 (default / mono / linear) + 首页整页. */
export function TemplateDocsitePage(): JSX.Element {
  return <SkinSwitcher>{(skin) => <DocsitePage skin={skin} />}</SkinSwitcher>;
}

/** 文档站用的模板页: 皮肤切换条 + 文章页. */
export function TemplateDocsArticlePage(): JSX.Element {
  return <SkinSwitcher>{(skin) => <DocsArticlePage skin={skin} />}</SkinSwitcher>;
}
