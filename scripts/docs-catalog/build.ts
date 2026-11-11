/**
 * 生成 catalog.gen.json: 导航, 搜索, 计数, 上下页, 总览只读它. 条目按 层 -> 组 -> 页 排:
 * 目录源里的页在前 (page: true), 组件层里还没有页的件随后 (page: false, 按件名排), 后者也进主导航.
 */
import type { Piece } from "./exports.ts";
import { GROUP_MAX, type FlatPage, type Manifest } from "./manifest.ts";
import type { Coverage } from "./coverage.ts";

export interface GenEntry {
  readonly id: string;
  readonly name: string;
  readonly layer: string;
  readonly group: string;
  readonly kind: string;
  readonly role: string;
  readonly exports: readonly string[];
  readonly desc: string;
  readonly page: boolean;
  /** 所在子组 id (组拆了子组时才有). */
  readonly sub?: string;
  /** 没有页的件: 声明文件, 总览卡与缩略图用. */
  readonly source?: string;
  /** 没有页的件: import 的模块名 (@hx/ui 或 @hx/ui/<子路径>), 页型模板的用法代码用. */
  readonly from?: string;
}

export interface GenGroup {
  readonly id: string;
  readonly layer: string;
  readonly label: string;
  /** 子组, 左栏在组内按它分段; 组不超过 GROUP_MAX 件时省略. */
  readonly subs?: readonly { readonly id: string; readonly label: string }[];
}

export interface GenCatalog {
  readonly layers: readonly { readonly id: string; readonly label: string }[];
  readonly groups: readonly GenGroup[];
  readonly entries: readonly GenEntry[];
}

const COMPONENT_LAYERS = new Set(["surface", "kits", "controls"]);

export const kebab = (name: string): string =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();

const PKG = "@hx/ui";

/** 件从哪个入口 import: 优先子路径 (三层只从子路径发布), 只有根入口时用包名. */
function importFrom(piece: Piece): string {
  const sub = piece.entries.find((entry) => entry !== ".") ?? ".";
  return sub === "." ? PKG : `${PKG}/${sub.replace(/^\.\//, "")}`;
}

/** 组件层的件归哪一组: 声明文件落在哪个族目录下. 没有组认领时报错, 新件必须先决定放哪. */
function familyGroup(manifest: Manifest, piece: Piece): string {
  const family = (manifest.families ?? []).filter((item) => piece.file.startsWith(item.dir)).sort((a, b) => b.dir.length - a.dir.length)[0];
  if (!family) throw new Error(`docs-catalog: ${piece.layer} 层的 ${piece.name} (${piece.file}) 没有族目录认领, 在 catalog.src.json 的 families 里加一条`);
  return family.group;
}

export function buildCatalog(manifest: Manifest, pages: readonly FlatPage[], pieces: readonly Piece[], result: Coverage, claimed: (page: FlatPage) => string[]): GenCatalog {
  const entries: GenEntry[] = [];
  const ids = new Set(pages.map((page) => page.id));
  const loose = result.uncovered.filter((piece) => COMPONENT_LAYERS.has(piece.layer));
  for (const group of manifest.groups) {
    for (const page of pages.filter((item) => item.group === group.id)) {
      entries.push({ id: page.id, name: page.name, layer: page.layer, group: group.id, kind: page.kind, role: page.role, exports: claimed(page), desc: page.desc, page: true, ...(page.sub ? { sub: page.sub } : {}) });
    }
    const own = loose.filter((piece) => familyGroup(manifest, piece) === group.id).sort((a, b) => a.name.localeCompare(b.name));
    for (const piece of own) {
      const id = kebab(piece.name);
      if (ids.has(id)) throw new Error(`docs-catalog: 件 ${piece.name} 的 id ${id} 与已有页重名`);
      ids.add(id);
      entries.push({ id, name: piece.name, layer: piece.layer, group: group.id, kind: group.pieceKind ?? "single", role: "component", exports: piece.members, desc: "", page: false, source: piece.file, from: importFrom(piece) });
    }
    const size = entries.filter((entry) => entry.group === group.id).length;
    if (size > GROUP_MAX && !group.subgroups) throw new Error(`docs-catalog: 组 ${group.id} 有 ${size} 件, 超过 ${GROUP_MAX}, 在 catalog.src.json 里给它拆 subgroups`);
    if (group.subgroups && own.length > 0) throw new Error(`docs-catalog: 组 ${group.id} 拆了子组, 没页的件 (${own.map((piece) => piece.name).join(", ")}) 无处落脚, 先给它们建页或换组`);
  }
  const placed = new Set(entries.flatMap((entry) => (entry.page ? [] : entry.exports)));
  const orphan = loose.find((piece) => !piece.members.some((member) => placed.has(member)));
  if (orphan) throw new Error(`docs-catalog: ${orphan.name} 的族目录指向的组不存在`);
  return {
    layers: manifest.layers.map(({ id, label }) => ({ id, label })),
    groups: manifest.groups.map(({ id, layer, label, subgroups }) => ({ id, layer, label, ...(subgroups ? { subs: subgroups.map((sub) => ({ id: sub.id, label: sub.label })) } : {}) })),
    entries,
  };
}
