import type { ComponentProps, ComponentType } from "react";
import type { BlockDensity, BlockLabels } from "../blocks/_shared";
import type { DefaultSections } from "./registry";

// 与 BlockRegistry 一样用 any: 注册表只要求值是组件, props 由下面的映射类型逐项推导.
export type SectionRegistry = Record<string, ComponentType<any>>;

/** 一个区块的描述. type 只能是注册表里的名字, props 按该组件的类型检查. */
export type SectionOf<R extends SectionRegistry> = {
  [K in keyof R & string]: {
    type: K;
    /** React key 与默认锚点. */
    key?: string;
    props: ComponentProps<R[K]>;
  };
}[keyof R & string];

/** 一整页的描述. 可以手写, 也可以由 CMS 或 Agent 生成后过一遍 definePage 做类型检查. */
export interface PageSpec<R extends SectionRegistry = DefaultSections> {
  sections: ReadonlyArray<SectionOf<R>>;
  /** 皮肤名, 写到根节点 data-skin. */
  skin?: string;
  density?: BlockDensity;
  locale?: string;
  labels?: Partial<BlockLabels>;
}

/** 用默认注册表描述一页. 运行时原样返回, 价值在编译期: 区块名拼错, 必填字段漏写都会报错. */
export function definePage(spec: PageSpec<DefaultSections>): PageSpec<DefaultSections> {
  return spec;
}

/** 单个区块的描述, 方便把区块拆到别的文件再拼. */
export function section<K extends keyof DefaultSections & string>(type: K, props: ComponentProps<DefaultSections[K]>, key?: string): SectionOf<DefaultSections> {
  return { type, props, key } as SectionOf<DefaultSections>;
}
