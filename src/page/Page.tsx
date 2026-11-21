"use client";

import type { JSX } from "react";
import { PageComposer } from "../blocks/_shared";
import type { BlockNode, BlockRegistry } from "../blocks/_shared";
import { BeatPage } from "./BeatPage";
import { PageHead } from "./PageHead";
import type { PageSpec, SectionOf, SectionRegistry } from "./define";
import { DEFAULT_SECTIONS, type DefaultSections } from "./registry";
import { storyOf } from "./story";

export interface PageProps<R extends SectionRegistry = DefaultSections> {
  spec: PageSpec<R>;
  /** 注册表. 不传用默认注册表; 用 createPage 合并自定义区块. */
  registry?: R;
  /** 根标签, 默认 main. 嵌进已有 main 的应用时传 div. */
  as?: "main" | "div" | "article";
  className?: string;
}

/** 区块描述转组合器节点. 两者字段一致, 只差注册表的类型参数. */
function nodesOf<R extends SectionRegistry>(sections: ReadonlyArray<SectionOf<R>> | undefined): ReadonlyArray<BlockNode<BlockRegistry>> {
  return (sections ?? []) as unknown as ReadonlyArray<BlockNode<BlockRegistry>>;
}

/**
 * 按页面描述渲染一整页. 底层就是 PageComposer, 这里只补默认注册表与类型化的描述,
 * 所以 BlocksProvider 的语言, 文案, 密度与相邻区块留白合并都照旧生效.
 * spec 有 story (或只有 sections 但给了 direction) 时改走 BeatPage: 每拍一个 BeatStage, 拍内仍由 PageComposer 渲染区块.
 *
 * spec 有 meta 时先输出 PageHead (两条路径都要), 没有时渲染结果与以前一致.
 *
 * .agents/notes/implemented/architecture/2026-11-08-layered-entries.md
 * .agents/notes/implemented/architecture/2026-11-19-page-meta-jsonld.md
 */
export function Page<R extends SectionRegistry = DefaultSections>({ spec, registry, as, className }: PageProps<R>): JSX.Element {
  const reg = (registry ?? DEFAULT_SECTIONS) as BlockRegistry;
  const story = storyOf(spec);
  const head = spec.meta ? <PageHead meta={spec.meta} /> : null;
  if (story) {
    const body = (
      <BeatPage
        beats={story}
        direction={spec.direction}
        as={as}
        className={className}
        render={(_, index) => (
          <PageComposer blocks={nodesOf(story[index].sections)} registry={reg} skin={spec.skin} density={spec.density} locale={spec.locale} labels={spec.labels} as="div" />
        )}
      />
    );
    return head ? <>{head}{body}</> : body;
  }
  const body = (
    <PageComposer
      blocks={nodesOf(spec.sections)}
      registry={reg}
      skin={spec.skin}
      density={spec.density}
      locale={spec.locale}
      labels={spec.labels}
      as={as}
      className={className}
    />
  );
  return head ? <>{head}{body}</> : body;
}

export interface PageKit<R extends SectionRegistry> {
  registry: R;
  /** 带自定义区块的 definePage. */
  define: (spec: PageSpec<R>) => PageSpec<R>;
  Page: (props: Omit<PageProps<R>, "registry">) => JSX.Element;
}

/** 把自定义区块并进默认注册表, 返回绑定好类型的 define 与 Page. 同名区块以 extra 为准. */
export function createPage<X extends SectionRegistry>(extra: X): PageKit<Omit<DefaultSections, keyof X> & X> {
  type Merged = Omit<DefaultSections, keyof X> & X;
  const registry = { ...DEFAULT_SECTIONS, ...extra } as unknown as Merged;
  return {
    registry,
    define: (spec) => spec,
    Page: (props) => <Page<Merged> {...props} registry={registry} />,
  };
}
