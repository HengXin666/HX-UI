/**
 * 生成 catalog.gen.json: 导航, 搜索, 计数, 上下页, 总览只读它. 条目按 层 -> 组 -> 页 排:
 * 目录源里的页在前 (page: true), 组件层里还没有页的件随后 (page: false, 按件名排), 后者也进主导航.
 */
import type { Piece } from "./exports.ts";
import type { FlatPage, Manifest } from "./manifest.ts";
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
  /** 没有页的件: 声明文件, 总览卡与缩略图用. */
  readonly source?: string;
}

export interface GenCatalog {
  readonly layers: readonly { readonly id: string; readonly label: string }[];
  readonly groups: readonly { readonly id: string; readonly layer: string; readonly label: string }[];
  readonly entries: readonly GenEntry[];
}

const COMPONENT_LAYERS = new Set(["surface", "kits", "controls"]);

export const kebab = (name: string): string =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();

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
      entries.push({ id: page.id, name: page.name, layer: page.layer, group: group.id, kind: page.kind, role: page.role, exports: claimed(page), desc: page.desc, page: true });
    }
    const own = loose.filter((piece) => familyGroup(manifest, piece) === group.id).sort((a, b) => a.name.localeCompare(b.name));
    for (const piece of own) {
      const id = kebab(piece.name);
      if (ids.has(id)) throw new Error(`docs-catalog: 件 ${piece.name} 的 id ${id} 与已有页重名`);
      ids.add(id);
      entries.push({ id, name: piece.name, layer: piece.layer, group: group.id, kind: group.pieceKind ?? "single", role: "component", exports: piece.members, desc: "", page: false, source: piece.file });
    }
  }
  const placed = new Set(entries.flatMap((entry) => (entry.page ? [] : entry.exports)));
  const orphan = loose.find((piece) => !piece.members.some((member) => placed.has(member)));
  if (orphan) throw new Error(`docs-catalog: ${orphan.name} 的族目录指向的组不存在`);
  return {
    layers: manifest.layers.map(({ id, label }) => ({ id, label })),
    groups: manifest.groups.map(({ id, layer, label }) => ({ id, layer, label })),
    entries,
  };
}
