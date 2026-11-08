import type { ReactNode } from "react";
import { BlocksProvider, DENSITY_LIST, SKIN_LIST } from "@hx/ui";

/**
 * 整块页共用的舞台: 皮肤与密度写在包裹层的 data-skin / data-density 上, 区块只读语义令牌.
 * .agents/notes/implemented/feature/2026-11-08-docs-component-pages.md
 */

export const SKINS = SKIN_LIST.map((skin) => skin.name);
export const DENSITIES = DENSITY_LIST.map((density) => density.name);
/** 区块共有的槽位与样式钩子, 每个区块都有, 不在每张表里重复. */
export const BLOCK_HOOKS = ["id", "className", "style", "classNames", "styles", "as", "labels", "slots", "aria-label", "aria-labelledby"];
export const HOOKS_NOTE = "另有区块共有的 id, className, style, classNames / styles 槽位, as, labels, slots 与 aria-label(ledby), 每个区块都一样, 见区块总述.";

export function Skinned({ skin, density, children }: { readonly skin: unknown; readonly density?: unknown; readonly children: ReactNode }) {
  return (
    <div data-skin={String(skin)} data-density={density ? String(density) : undefined} className="min-h-full bg-background text-foreground">
      <BlocksProvider locale="zh-CN">{children}</BlocksProvider>
    </div>
  );
}
