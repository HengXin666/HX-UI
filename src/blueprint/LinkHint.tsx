"use client";

import type { JSX } from "react";
import { reasonText } from "./canvas-helpers";

/**
 * 拖线时左下角的那行提示。
 *
 * 为什么要它: 连线能不能成、为什么不能, 用户**在松手之前**就该知道。
 * 等松手才发现连不上, 他已经做完了整个拖拽动作 —— 那个反馈来得太晚。
 *
 * 单独成文件: BlueprintCanvas.tsx 是冻结文件 (棘轮只许降), 而这纯粹是展示。
 */
export function LinkHint({
  verdict,
}: {
  readonly verdict?: { ok: boolean; reason?: string; replaces?: string } | null;
}): JSX.Element | null {
  if (verdict?.ok && verdict.replaces) {
    return (
      <div className="pointer-events-none absolute bottom-2 left-2 rounded border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground">
        松手将替换原有连线
      </div>
    );
  }
  if (verdict && !verdict.ok) {
    return (
      <div className="pointer-events-none absolute bottom-2 left-2 rounded border border-destructive/40 bg-card px-2 py-1 text-[11px] text-destructive">
        {reasonText(verdict.reason)}
      </div>
    );
  }
  return null;
}
