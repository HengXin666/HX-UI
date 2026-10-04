"use client";

import type { JSX } from "react";
import { cn } from "../primitives/utils";
import { COMMENT_TONE } from "./canvas-parts";
import type { BlueprintComment } from "./types";
import type { RfNode } from "./rf-adapter";

/**
 * 注释框 —— 画布上用于圈出一片节点的分组标记。
 *
 * 结构与节点卡片不同, 它不是一个"卡片":
 *   1. 整块半透明底色 —— 能透出下面的节点与连线, 但一眼看出"这片属于它"
 *   2. 顶部一条实色标题栏 —— 颜色即 Comment Color
 *   3. 下面是正文
 *
 * 底色必须**半透明但不全透**: 全透就圈不住任何东西, 不透明则把里面的节点
 * 全糊住。所以取中等明度的低饱和色。
 *
 * 它不参与连线 (没有 Handle), 也不参与求值 —— 只是给人看的标记。
 */

export interface RfCommentData extends Record<string, unknown> {
  readonly comment: BlueprintComment;
}

export function BpCommentNode({ data, selected }: { data: RfCommentData; selected?: boolean }): JSX.Element {
  const c = data.comment;
  const tone = c.tone ?? "default";
  const toneCls = COMMENT_TONE[tone] ?? COMMENT_TONE.default;

  return (
    <div
      data-comment-tone={tone}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md border border-bp-node-border",
        toneCls.bg,
        toneCls.fg,
        selected && "ring-1 ring-primary/60"
      )}
    >
      {/* 标题栏: 实色 (靠 bg-current 取 tone 的文字色), UE5 就是这样区分"标题/正文" */}
      <div
        className={cn("flex shrink-0 items-center gap-1 border-b border-bp-node-border px-2", toneCls.bar)}
        style={{ height: 22 }}
      >
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium">{c.title ?? "注释"}</span>
      </div>

      {/* 正文 */}
      <div className="min-h-0 flex-1 overflow-hidden px-2 py-1 text-[11px] leading-snug opacity-90">
        {c.body ?? ""}
      </div>
    </div>
  );
}

/** 类型守卫: 这个 React Flow 节点是不是注释。 */
export function isCommentData(data: unknown): data is RfCommentData {
  return typeof data === "object" && data !== null && "comment" in data;
}
