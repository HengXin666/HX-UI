/**
 * 对表: 导出清单 (exports.ts) x 目录源 (manifest.ts) x 组件页定义 (specs.ts). 口径:
 * - 一页认领的导出 = 目录源里它的 exports, 加上同 id 组件页定义的 importName 与 parts.
 * - 有页: 至少一个成员被某页认领的件. 没页: 一个成员都没被认领的件 (白名单里的导出不计).
 * - 页指向不存在导出: 认领了清单里没有的导出名的页, 以及一个导出都没认领的组件页 (role 为 component).
 * - 一件两处: 有成员被两页以上同时认领的件; 目录源里同一个 id 出现两次也算在这里.
 */
import type { FlatPage } from "./manifest.ts";
import type { Piece } from "./exports.ts";
import type { SpecInfo } from "./specs.ts";

export interface Coverage {
  readonly covered: readonly Piece[];
  readonly uncovered: readonly Piece[];
  /** 页 id -> 认领了但不存在的导出名 (空数组表示组件页一个都没认领). */
  readonly dangling: ReadonlyMap<string, readonly string[]>;
  /** 件 -> 认领它的页. */
  readonly doubled: ReadonlyMap<Piece, readonly string[]>;
  /** 页 id -> 认领到的件. */
  readonly claims: ReadonlyMap<string, readonly Piece[]>;
}

const QUALIFIER = "@";

/** 导出名 (可带 @入口) -> 件. 同名多件且没写入口时返回全部, 由调用方报歧义. */
export function resolver(pieces: readonly Piece[]): (name: string) => Piece[] {
  const byName = new Map<string, Piece[]>();
  for (const piece of pieces) for (const member of piece.members) byName.set(member, [...(byName.get(member) ?? []), piece]);
  return (raw) => {
    const [name, entry] = raw.split(QUALIFIER);
    const hits = byName.get(name) ?? [];
    return entry ? hits.filter((piece) => piece.entries.includes(entry)) : hits;
  };
}

/** 一页认领的导出名: 目录源 exports 与组件页定义合并去重. */
export function claimedNames(page: FlatPage, specs: readonly SpecInfo[]): string[] {
  const spec = specs.find((item) => item.id === page.id);
  return [...new Set([...(page.exports ?? []), ...(spec ? [spec.importName, ...spec.parts] : [])])];
}

export function coverage(pages: readonly FlatPage[], specs: readonly SpecInfo[], pieces: readonly Piece[], allowed: ReadonlySet<string>): Coverage {
  const resolve = resolver(pieces);
  const dangling = new Map<string, string[]>();
  const claims = new Map<string, Piece[]>();
  /** 件 -> 成员 -> 认领页. */
  const owners = new Map<Piece, Map<string, Set<string>>>();
  const seen = new Map<string, number>();
  for (const page of pages) seen.set(page.id, (seen.get(page.id) ?? 0) + 1);
  for (const page of pages) {
    const names = claimedNames(page, specs);
    const bad: string[] = [];
    const mine: Piece[] = [];
    for (const raw of names) {
      const hits = resolve(raw);
      if (hits.length !== 1) {
        bad.push(hits.length === 0 ? raw : `${raw} (重名, 写成 名字@入口)`);
        continue;
      }
      const piece = hits[0];
      if (!mine.includes(piece)) mine.push(piece);
      const members = owners.get(piece) ?? new Map<string, Set<string>>();
      owners.set(piece, members);
      const member = raw.split(QUALIFIER)[0];
      members.set(member, (members.get(member) ?? new Set<string>()).add(page.id));
    }
    claims.set(page.id, mine);
    if (bad.length > 0 || (page.role === "component" && names.length === 0)) dangling.set(page.id, bad);
  }
  const counted = pieces.filter((piece) => !piece.members.every((member) => allowed.has(member)));
  const doubled = new Map<Piece, string[]>();
  for (const [piece, members] of owners) {
    const pagesOf = [...members.values()].find((set) => set.size > 1);
    if (pagesOf) doubled.set(piece, [...pagesOf].sort());
  }
  for (const [id, count] of seen) {
    if (count < 2) continue;
    for (const piece of claims.get(id) ?? []) doubled.set(piece, [id, id]);
  }
  return {
    covered: counted.filter((piece) => owners.has(piece)),
    uncovered: counted.filter((piece) => !owners.has(piece)),
    dangling,
    doubled,
    claims,
  };
}

/** 四个数. */
export function counts(result: Coverage): { withPage: number; withoutPage: number; dangling: number; doubled: number } {
  return { withPage: result.covered.length, withoutPage: result.uncovered.length, dangling: result.dangling.size, doubled: result.doubled.size };
}
