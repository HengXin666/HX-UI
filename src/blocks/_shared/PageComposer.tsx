"use client";

import * as React from "react";
import { BLOCK_ATTR, BLOCK_CLASS, BLOCK_SLOT } from "../../constants/blocks";
import { cn } from "../../primitives/utils";
import { BlocksProvider, useBlockLabels } from "./BlocksProvider";
import { resolveSlots } from "./BlockShell";
import type { BackdropRenderer, BackdropVariant, BlockDensity, BlockLabels, BlockNode, BlockRegistry, PageComposerSlot, SlotClassNames } from "./types";

export interface PageComposerProps<R extends BlockRegistry = BlockRegistry> {
  /** 区块序列 (Agent / CMS 生成的 JSON). */
  blocks: ReadonlyArray<BlockNode<R>>;
  /** 区块名 -> 组件. 以参数注入, 本组件不 import 任何区块, 避免循环依赖. */
  registry: R;
  /** 皮肤名, 写到根节点 data-skin (皮肤 css 由 V0 skins 任务提供). */
  skin?: string;
  density?: BlockDensity;
  locale?: string;
  labels?: Partial<BlockLabels>;
  backdrops?: Partial<Record<BackdropVariant, BackdropRenderer>>;
  /** 未注册的 type: 默认开发环境渲染虚线占位, 生产环境跳过. 传函数自定义. */
  renderMissing?: (node: BlockNode<R>, index: number) => React.ReactNode;
  /** 每块之间插入的节点 (分隔, 广告位). 不传时不插入, 留白由 BlockShell 的同 tone 合并处理. */
  renderBetween?: (prev: BlockNode<R>, next: BlockNode<R>, index: number) => React.ReactNode;
  /** 根标签, 默认 main. */
  as?: "main" | "div" | "article";
  id?: string;
  className?: string;
  classNames?: SlotClassNames<PageComposerSlot, { count: number }>;
  ref?: React.Ref<HTMLElement>;
}

/** 区块的锚点: props.id > node.key; 都没有时不写 id. */
function anchorOf(node: BlockNode): string | undefined {
  const own = node.props?.id;
  return typeof own === "string" ? own : node.key;
}

function isDev(): boolean {
  return (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !== "production";
}

function Missing({ type, className }: { type: string; className?: string }): React.JSX.Element {
  const labels = useBlockLabels();
  return (
    <div role="note" data-slot={BLOCK_SLOT.pageMissing} className={cn(BLOCK_CLASS.missing, className)}>
      {`${labels.missingBlock}: ${type}`}
    </div>
  );
}

/**
 * 整页组合器: 按 BlockNode 数组依次渲染 registry 中的区块, 同时下发 BlocksProvider (locale / labels / 密度 / 背景注入).
 * 区块直接平铺为兄弟节点 (不加包裹层), 相邻同 tone 留白合并由 BlockShell 的 CSS 兄弟选择器生效;
 * 每块的 id 取 props.id 或 node.key, 作为锚点与 ScrollSpy 目标.
 * ref 作为普通 prop 指向根元素 (React 19), 不使用 forwardRef.
 */
export function PageComposer<R extends BlockRegistry = BlockRegistry>({
  blocks,
  registry,
  skin,
  density,
  locale,
  labels,
  backdrops,
  renderMissing,
  renderBetween,
  as = "main",
  id,
  className,
  classNames,
  ref,
}: PageComposerProps<R>): React.JSX.Element {
  const cls = resolveSlots(classNames, { count: blocks.length });
  const Root = as as React.ElementType;
  const attrs = { [BLOCK_ATTR.page]: "", "data-skin": skin };
  return (
    <BlocksProvider locale={locale} labels={labels} density={density} backdrops={backdrops}>
      <Root ref={ref} id={id} data-slot={BLOCK_SLOT.page} {...attrs} className={cn("flex w-full flex-col", cls.root, className)}>
        {blocks.map((node, index) => {
          const key = node.key ?? `${node.type}-${index}`;
          const Block = registry[node.type] as React.ComponentType<Record<string, unknown>> | undefined;
          const between = index > 0 && renderBetween ? renderBetween(blocks[index - 1], node, index) : null;
          let rendered: React.ReactNode;
          if (Block) {
            const anchor = anchorOf(node as BlockNode);
            rendered = <Block {...node.props} id={anchor} />;
          } else if (renderMissing) {
            rendered = renderMissing(node, index);
          } else {
            rendered = isDev() ? <Missing type={node.type} className={cls.missing} /> : null;
          }
          return (
            <React.Fragment key={key}>
              {between}
              {rendered}
            </React.Fragment>
          );
        })}
      </Root>
    </BlocksProvider>
  );
}
