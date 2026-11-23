import { memo } from "react";
import type { BlueprintComment } from "../types";

/**
 * Comment box. The body lets pointers through (so marquee and nodes inside work); the title bar
 * moves it (carrying the nodes fully inside), the corner resizes it. The title font grows as you
 * zoom out (CSS, from --bp-z) so a zoomed-out graph still reads by its comments.
 *
 * Delegation attributes: data-comment="<id>", data-part="bar" | "size".
 */
export const CommentView = memo(function CommentView({ comment: c, selected }: { comment: BlueprintComment; selected: boolean }) {
  return (
    <div className="bp-comment" data-comment={c.id} data-tone={c.tone ?? "default"} data-selected={selected || undefined}
      style={{ transform: `translate(${c.x}px, ${c.y}px)`, width: c.w, height: c.h }}>
      <div className="bp-comment-bar" data-part="bar" />
      <div className="bp-comment-title" data-part="bar">{c.title || "注释"}</div>
      {c.body ? <div className="bp-comment-body">{c.body}</div> : null}
      <div className="bp-comment-size" data-part="size" aria-hidden />
    </div>
  );
});

export const COMMENT_TONES = ["default", "primary", "info", "success", "warning", "danger", "neutral"] as const;
export const TONE_LABEL: Record<(typeof COMMENT_TONES)[number], string> = {
  default: "默认", primary: "品牌", info: "信息", success: "成功", warning: "提醒", danger: "危险", neutral: "中性",
};
