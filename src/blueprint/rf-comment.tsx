"use client";

import type { JSX } from "react";
import { cn } from "../primitives/utils";
import { COMMENT_TONE } from "./canvas-parts";
import type { BlueprintComment } from "./types";
import type { RfNode } from "./rf-adapter";

/**
 * 注释框 —— React Flow 版的自定义节点。
 *
 * ## 它和节点卡片是**两种东西**
 *
 * 上一版图省事直接复用了节点组件 (NODE_TYPES 里 bpComment: BpNode),
 * 结果注释被画成一个"深色块 + 标题栏"的卡片 —— 没有底色、没有正文、
 * 也没有 tone 颜色, 在画布上根本分辨不出它和背景。用户原话:
 * "颜色感觉是全透明的, 根本就区分不了它和背景"。
 *
 * UE5 的注释长这样:
 *   1. 整块**半透明底色** (能透出下面的节点与连线, 但一眼看出"这片属于它")
 *   2. 顶部一条**实色标题栏** (颜色就是 Comment Color)
 *   3. 下面是正文
 *   4. 右下角有 resize 把手
 *
 * ## 底色为什么必须"半透明但不全透"
 *
 * 注释的意义是把一片节点**圈出来**。全透 = 圈不住任何东西;
 * 不透明 = 把里面的节点全糊住。所以是低透明度实色。
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
