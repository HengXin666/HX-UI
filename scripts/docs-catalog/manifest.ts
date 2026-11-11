/**
 * 目录源 docs/face/docs/catalog/catalog.src.json 的读取与结构校验. 只校验形状 (字段, 取值闭集, id 唯一);
 * 导出名对不对得上由 coverage.ts 对表.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export const PAGE_KINDS = ["single", "composite", "block", "control"] as const;
export const PAGE_ROLES = ["component", "guide", "template", "showcase", "overview"] as const;
export type PageKind = (typeof PAGE_KINDS)[number];
export type PageRole = (typeof PAGE_ROLES)[number];

export interface SrcPage {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly kind: PageKind;
  readonly role?: PageRole;
  readonly exports?: readonly string[];
}

/** 左栏每组 (或子组) 最多几件, 超了在目录源里拆子组. */
export const GROUP_MAX = 12;

/** 组里的子组: 组超过 GROUP_MAX 件时按页 id 拆开, 每页恰好落在一个子组里. */
export interface SrcSubgroup {
  readonly id: string;
  readonly label: string;
  readonly pages: readonly string[];
}

export interface SrcGroup {
  readonly id: string;
  readonly layer: string;
  readonly label: string;
  /** 组里还没有页的件按这个页型列进目录 (组件层的组才有). */
  readonly pieceKind?: PageKind;
  readonly subgroups?: readonly SrcSubgroup[];
  readonly pages: readonly SrcPage[];
}

export interface SrcLayer {
  readonly id: string;
  readonly label: string;
}

/** 组件层的一个族目录归到哪一组: dir 是 src 下的目录前缀. */
export interface SrcFamily {
  readonly dir: string;
  readonly group: string;
}

export interface Manifest {
  readonly layers: readonly SrcLayer[];
  readonly families?: readonly SrcFamily[];
  readonly groups: readonly SrcGroup[];
}

/** 页连同它所在的组与层. */
export interface FlatPage extends SrcPage {
  readonly role: PageRole;
  readonly group: string;
  /** 所在子组 id; 组没拆子组时省略. */
  readonly sub?: string;
  readonly layer: string;
}

export const MANIFEST_FILE = path.join("docs", "face", "docs", "catalog", "catalog.src.json");

export function readManifest(root: string): Manifest {
  const manifest = JSON.parse(readFileSync(path.join(root, MANIFEST_FILE), "utf8")) as Manifest;
  const problems = shapeProblems(manifest);
  if (problems.length > 0) throw new Error(`docs-catalog: ${MANIFEST_FILE} 结构有误:\n  ${problems.join("\n  ")}`);
  return manifest;
}

function shapeProblems(manifest: Manifest): string[] {
  const out: string[] = [];
  const layers = new Set(manifest.layers.map((layer) => layer.id));
  const groupIds = new Set<string>();
  const pageIds = new Set<string>();
  for (const group of manifest.groups) {
    if (groupIds.has(group.id)) out.push(`组 id 重复: ${group.id}`);
    groupIds.add(group.id);
    if (!layers.has(group.layer)) out.push(`组 ${group.id} 的层 ${group.layer} 不在 layers 里`);
    for (const page of group.pages) {
      if (pageIds.has(page.id)) out.push(`页 id 重复: ${page.id}`);
      pageIds.add(page.id);
      if (!PAGE_KINDS.includes(page.kind)) out.push(`页 ${page.id} 的页型 ${page.kind} 不在 ${PAGE_KINDS.join("/")} 里`);
      if (page.role && !PAGE_ROLES.includes(page.role)) out.push(`页 ${page.id} 的 role ${page.role} 不认识`);
      if (!page.name || !page.desc) out.push(`页 ${page.id} 缺名称或说明`);
    }
    out.push(...subgroupProblems(group));
  }
  for (const family of manifest.families ?? []) {
    if (!groupIds.has(family.group)) out.push(`族 ${family.dir} 指向不存在的组 ${family.group}`);
  }
  return out;
}

/** 子组: 每页恰好在一个子组里, 每个子组不超过 GROUP_MAX 件. 组本身超限而没拆子组由 build.ts 报 (那时才知道没页的件有几件). */
function subgroupProblems(group: SrcGroup): string[] {
  const out: string[] = [];
  if (!group.subgroups) return out;
  const own = new Set(group.pages.map((page) => page.id));
  const seen = new Set<string>();
  for (const sub of group.subgroups) {
    if (sub.pages.length > GROUP_MAX) out.push(`子组 ${sub.id} 有 ${sub.pages.length} 件, 超过 ${GROUP_MAX}`);
    for (const id of sub.pages) {
      if (!own.has(id)) out.push(`子组 ${sub.id} 列了不在组 ${group.id} 里的页 ${id}`);
      if (seen.has(id)) out.push(`页 ${id} 落在两个子组里`);
      seen.add(id);
    }
  }
  for (const id of own) if (!seen.has(id)) out.push(`组 ${group.id} 拆了子组, 但页 ${id} 不在任何子组里`);
  return out;
}

export function flatPages(manifest: Manifest): FlatPage[] {
  return manifest.groups.flatMap((group) =>
    group.pages.map((page) => {
      const sub = group.subgroups?.find((item) => item.pages.includes(page.id))?.id;
      return { ...page, role: page.role ?? "component", group: group.id, layer: group.layer, ...(sub ? { sub } : {}) };
    }),
  );
}
