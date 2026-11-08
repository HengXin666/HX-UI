"use client";

import type { JSX } from "react";
import { PageComposer } from "../blocks/_shared";
import type { BlockNode, BlockRegistry } from "../blocks/_shared";
import type { PageSpec, SectionRegistry } from "./define";
import { DEFAULT_SECTIONS, type DefaultSections } from "./registry";

export interface PageProps<R extends SectionRegistry = DefaultSections> {
  spec: PageSpec<R>;
  /** 注册表. 不传用默认注册表; 用 createPage 合并自定义区块. */
  registry?: R;
  /** 根标签, 默认 main. 嵌进已有 main 的应用时传 div. */
  as?: "main" | "div" | "article";
  className?: string;
}

/**
 * 按页面描述渲染一整页. 底层就是 PageComposer, 这里只补默认注册表与类型化的描述,
 * 所以 BlocksProvider 的语言, 文案, 密度与相邻区块留白合并都照旧生效.
 *
 * .agents/notes/implemented/architecture/2026-11-08-layered-entries.md
 */
export function Page<R extends SectionRegistry = DefaultSections>({ spec, registry, as, className }: PageProps<R>): JSX.Element {
  const blocks = spec.sections as unknown as ReadonlyArray<BlockNode<BlockRegistry>>;
  return (
    <PageComposer
      blocks={blocks}
      registry={(registry ?? DEFAULT_SECTIONS) as BlockRegistry}
      skin={spec.skin}
      density={spec.density}
      locale={spec.locale}
      labels={spec.labels}
      as={as}
      className={className}
    />
  );
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
