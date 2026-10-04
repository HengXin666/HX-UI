"use client";

import type { JSX } from "react";
import { BlueprintPalette } from "./BlueprintPalette";
import type { BlueprintRegistry } from "./types";

/**
 * 画布上的节点选择浮层。
 *
 * ## 两种触发方式, 同一个组件
 *
 *   1. **拖线到空白松手** → `mode="connect"`, 选中的节点自动连到那根线上。
 *      UE5 官方行为: "releasing on empty space opens a context menu with
 *      only relevant nodes"。
 *   2. **Tab** → `mode="add"`, 在视口中心加一个节点。
 *      同样是 UE5: `bOpenCreateMenuOnBlankGraphAreas`, 默认键 Tab。
 *
 * 合成一个组件是因为两者**长得一样、行为只差落点用途**。分成两个组件会
 * 出现"改了一个忘了另一个"。
 */

export function NodePicker({
  registry, mode, onPick, onClose,
}: {
  readonly registry: BlueprintRegistry;
  readonly mode: "connect" | "add";
  readonly onPick: (type: string) => void;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <div
      data-node-picker={mode}
      className="absolute right-2 top-2 z-[var(--z-panel)] w-56 overflow-hidden rounded-lg border border-border bg-card shadow-md"
    >
      <div className="border-b border-border px-2.5 py-1.5 text-[11px] text-muted-foreground">
        {mode === "connect" ? "连到新节点" : "添加节点"}
      </div>
      <div className="max-h-64">
        <BlueprintPalette registry={registry} draggable={false} onPick={onPick} />
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-full border-t border-border px-2.5 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        取消
      </button>
    </div>
  );
}
