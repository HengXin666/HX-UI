"use client";

/**
 * 行为规格参照 catalog/micro.md 的 BranchedMenu 条目, 只作出处说明; 实现与命名为 HX 自有.
 */
import { useState, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { BUTTON_TYPE, COMPOSE_EASE_OUT, CSS_PROP, CURRENT_COLOR, FORK, NONE, colorVar, transitionOf, type HxColor } from "../tokens";

export interface ForkLeaf {
  readonly id: string;
  readonly label: ReactNode;
}

export interface ForkBranch {
  readonly id: string;
  readonly label: ReactNode;
  readonly icon?: ReactNode;
  /** 没有分支的组就是一行可选项. */
  readonly children?: readonly ForkLeaf[];
}

export interface ForkMenuProps {
  readonly items: readonly ForkBranch[];
  /** 初始展开的组下标, -1 全部收起. */
  readonly defaultOpen?: number;
  readonly defaultActive?: string;
  readonly onSelect?: (id: string) => void;
  /** 展开的组下标, 收起时为 -1. */
  readonly onToggle?: (index: number) => void;
  readonly color?: HxColor;
  readonly accentColor?: HxColor;
  readonly lineColor?: HxColor;
  readonly width?: number;
  readonly rowHeight?: number;
  readonly indent?: number;
  readonly trunk?: number;
  readonly radius?: number;
  readonly fontSize?: number;
  readonly drawDuration?: number;
  readonly foldDuration?: number;
  readonly className?: string;
}

const CLOSED = -1;
const QUARTER_TURN = 90;

/**
 * 一条分支的路径: 从主干竖下来, 在行中线处以 radius 圆角拐向文字.
 * 主干在 x = trunk, 分支止于 indent - pad.
 */
export function branchPath(index: number, rowHeight: number, trunk: number, indent: number, radius: number): string {
  const cy = index * rowHeight + rowHeight / 2;
  const end = indent - FORK.pad;
  const r = Math.max(0, Math.min(radius, end - trunk, cy));
  return `M ${trunk} 0 V ${cy - r} Q ${trunk} ${cy} ${trunk + r} ${cy} H ${end}`;
}

/** 高亮块的 top: 前面每组一行, 展开的组再加上它的分支行. */
export function activeTop(items: readonly ForkBranch[], open: number, active: string, rowHeight: number): number | null {
  let top = 0;
  for (let i = 0; i < items.length; i += 1) {
    const branch = items[i];
    if (!branch) continue;
    if (branch.id === active) return top;
    top += rowHeight;
    const kids = branch.children ?? [];
    if (i === open) {
      const hit = kids.findIndex((leaf) => leaf.id === active);
      if (hit >= 0) return top + hit * rowHeight;
      top += kids.length * rowHeight;
    }
  }
  return null;
}

/**
 * 分枝菜单: 组标题点开时, 子项从主干分出 1px 分支线逐条画出, 文字随后淡入;
 * 选中项下面垫一块高亮, 换选时高亮滑过去. 组收起时分支线倒退擦掉.
 */
export function ForkMenu({
  items,
  defaultOpen = 0,
  defaultActive = "",
  onSelect,
  onToggle,
  color = "foreground",
  accentColor = "accent-foreground",
  lineColor = "border",
  width = FORK.width,
  rowHeight = FORK.rowHeight,
  indent = FORK.indent,
  trunk = FORK.trunk,
  radius = FORK.radius,
  fontSize = FORK.fontSize,
  drawDuration = FORK.drawMs,
  foldDuration = FORK.foldMs,
  className,
}: ForkMenuProps): JSX.Element {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(defaultOpen);
  const [active, setActive] = useState(defaultActive);
  const top = activeTop(items, open, active, rowHeight);
  const ms = (value: number): number => (reduced ? 0 : value);

  const toggle = (index: number): void => {
    const next = open === index ? CLOSED : index;
    setOpen(next);
    onToggle?.(next);
  };

  const pick = (id: string): void => {
    setActive(id);
    onSelect?.(id);
  };

  const rowStyle = { height: rowHeight, fontSize, borderRadius: radius };
  const inkTransition = reduced ? NONE : transitionOf([[CSS_PROP.color, FORK.colorMs]]);
  const inkOf = (on: boolean): string => colorVar(on ? accentColor : color);

  return (
    <nav data-slot="fork-menu" className={cn("relative select-none", className)} style={{ width, color: colorVar(color) }}>
      <div
        aria-hidden
        data-slot="fork-highlight"
        className="pointer-events-none absolute bg-accent"
        style={{
          left: 0,
          right: 0,
          height: rowHeight,
          top: top ?? 0,
          borderRadius: radius,
          opacity: top === null ? 0 : 1,
          transition: reduced ? NONE : transitionOf([[CSS_PROP.top, ms(FORK.slideMs), COMPOSE_EASE_OUT], [CSS_PROP.opacity, ms(FORK.fadeMs)]]),
        }}
      />
      <ul className="relative m-0 list-none p-0">
        {items.map((branch, index) => {
          const kids = branch.children ?? [];
          const expanded = index === open && kids.length > 0;
          const leafy = kids.length === 0;
          const on = leafy && branch.id === active;
          return (
            <li key={branch.id}>
              <button
                type={BUTTON_TYPE}
                aria-expanded={leafy ? undefined : expanded}
                aria-current={on || undefined}
                onClick={() => (leafy ? pick(branch.id) : toggle(index))}
                className="relative flex w-full items-center gap-2 bg-transparent text-left outline-none focus-visible:ring-1 focus-visible:ring-ring"
                style={{ ...rowStyle, paddingLeft: FORK.pad, paddingRight: FORK.pad, color: inkOf(on), transition: inkTransition }}
              >
                <span aria-hidden className="flex shrink-0 items-center justify-center" style={{ width: FORK.mark, height: FORK.mark }}>
                  {branch.icon ?? (leafy ? null : <Chevron open={expanded} ms={ms(foldDuration)} />)}
                </span>
                <span className="truncate">{branch.label}</span>
              </button>
              {leafy ? null : (
                <div
                  data-slot="fork-branches"
                  className="relative overflow-hidden"
                  style={{
                    height: expanded ? kids.length * rowHeight : 0,
                    transition: reduced ? NONE : transitionOf([[CSS_PROP.height, foldDuration, COMPOSE_EASE_OUT]]),
                  }}
                >
                  <svg aria-hidden className="pointer-events-none absolute left-0 top-0" width={indent} height={kids.length * rowHeight} fill={NONE} style={{ color: colorVar(lineColor) }}>
                    {kids.map((leaf, i) => (
                      <path
                        key={leaf.id}
                        d={branchPath(i, rowHeight, trunk, indent, radius)}
                        pathLength={1}
                        stroke={CURRENT_COLOR}
                        strokeWidth={FORK.lineWidth}
                        strokeDasharray={1}
                        strokeDashoffset={expanded ? 0 : 1}
                        style={{
                          transition: reduced
                            ? NONE
                            : expanded
                              ? transitionOf([[CSS_PROP.dash, drawDuration, COMPOSE_EASE_OUT, i * FORK.drawStaggerMs]])
                              : transitionOf([[CSS_PROP.dash, foldDuration, COMPOSE_EASE_OUT]]),
                        }}
                      />
                    ))}
                  </svg>
                  <ul role="group" className="m-0 list-none p-0">
                    {kids.map((leaf) => {
                      const leafOn = leaf.id === active;
                      return (
                        <li key={leaf.id}>
                          <button
                            type={BUTTON_TYPE}
                            tabIndex={expanded ? 0 : -1}
                            aria-current={leafOn || undefined}
                            onClick={() => pick(leaf.id)}
                            className="relative flex w-full items-center bg-transparent text-left outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            style={{
                              ...rowStyle,
                              paddingLeft: indent,
                              paddingRight: FORK.pad,
                              color: inkOf(leafOn),
                              opacity: expanded ? 1 : 0,
                              transition: reduced
                                ? NONE
                                : transitionOf([
                                    expanded ? [CSS_PROP.opacity, FORK.labelInMs, undefined, FORK.labelInDelayMs] : [CSS_PROP.opacity, FORK.fadeMs],
                                    [CSS_PROP.color, FORK.colorMs],
                                  ]),
                            }}
                          >
                            <span className="truncate">{leaf.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** 展开箭头: 收起朝右, 展开转 90 度朝下. */
function Chevron({ open, ms }: { open: boolean; ms: number }): JSX.Element {
  return (
    <svg
      width={FORK.mark}
      height={FORK.mark}
      viewBox={`0 0 ${FORK.mark} ${FORK.mark}`}
      fill={NONE}
      stroke={CURRENT_COLOR}
      strokeWidth={FORK.lineWidth}
      style={{ transform: `rotate(${open ? QUARTER_TURN : 0}deg)`, transition: transitionOf([[CSS_PROP.transform, ms, COMPOSE_EASE_OUT]]) }}
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}
