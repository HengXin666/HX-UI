"use client";

import { useEffect, useMemo, type JSX, type ReactNode } from "react";
import type { ClockDriver } from "../motion/drive/clock";
import { DIRECTIONS, validateBeats, type Beat, type BeatIssue, type DirectionName } from "./beat";
import { BeatStage } from "./BeatStage";

export interface BeatPageProps {
  beats: readonly Beat[];
  /** 美术方向, 写到根节点 data-direction; 校验时用它的镜头白名单与重效果预算. */
  direction?: DirectionName;
  /** 每一拍里放什么. 拍的版式, 时钟与配方由 BeatStage 负责. */
  render: (beat: Beat, index: number) => ReactNode;
  /** 所有拍共用的时钟驱动, 默认 view. */
  driver?: ClockDriver;
  /** 校验有问题时回调 (挂载与 beats 变化时各一次). 开发期接到浮层或日志, 门禁读根节点 data-beat-issues. */
  onIssues?: (issues: BeatIssue[]) => void;
  as?: "main" | "div" | "article";
  className?: string;
}

/**
 * 按拍渲染一页: 根节点写方向, 每拍一个 BeatStage, 并跑 validateBeats.
 * 问题数写到 data-beat-issues, 不阻断渲染; 是否报错由门禁决定.
 *
 * .agents/notes/implemented/architecture/2026-11-18-omni-page-beats.md
 */
export function BeatPage({ beats, direction, render, driver, onIssues, as: Tag = "main", className }: BeatPageProps): JSX.Element {
  const issues = useMemo(() => validateBeats(beats, direction ? DIRECTIONS[direction] : undefined), [beats, direction]);
  useEffect(() => {
    if (issues.length > 0) onIssues?.(issues);
  }, [issues, onIssues]);
  return (
    <Tag className={className} data-direction={direction} data-beat-issues={issues.length}>
      {beats.map((beat, index) => (
        <BeatStage key={beat.id} beat={beat} driver={driver}>
          {render(beat, index)}
        </BeatStage>
      ))}
    </Tag>
  );
}
