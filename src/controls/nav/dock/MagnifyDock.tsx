"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 Dock 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格里的嵌套菜单 (rows / side / point / onBack, Dock.jsx:106-120) 要锚点定位与焦点陷阱, L1 还没有可复用的弹层定位; 本件只给长按回调 onItemHold, 菜单由使用方接.

import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from "react";
import type { SpringSpec } from "../../../craft/spring";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { BACK, DOUBLE, MS_PER_SECOND, NAV_DISABLED, NAV_FOCUS, PLAIN_EASE, PX, transitionOf, useNavMotion } from "../tokens";
import { DOCK_DEFAULTS, DOCK_DOT_MS, DOCK_EDGE, DOCK_HOLD_MS, DOCK_HOP_S, DOCK_LABEL_GAP, DOCK_LABEL_MS, dockSpring, hopFrames, magnifySize } from "./parts/dock-math";

export { DOCK_DEFAULTS, DOCK_EDGE, DOCK_HOLD_MS, DOCK_HOP, DOCK_HOP_S, DOCK_SPRING, dockSpring, hopFrames, magnifySize } from "./parts/dock-math";

export interface DockItem {
  readonly id: string;
  /** 读屏名与悬停标签. */
  readonly label: string;
  /** 图标由使用方给 (建议 size-1/2 跟着格子缩放). */
  readonly icon: ReactNode;
  /** 正在运行 / 当前页: 图标下方一个点. */
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly onSelect?: () => void;
}

export interface MagnifyDockProps {
  readonly items: readonly DockItem[];
  /** 静止边长 px. */
  readonly size?: number;
  /** 指针正对时的边长 px. */
  readonly magnified?: number;
  /** 放大的影响半径 px. */
  readonly distance?: number;
  readonly gap?: number;
  /** 尺寸弹簧, 缺项取规格默认 0.1 / 150 / 12. */
  readonly spring?: Partial<SpringSpec>;
  /** 点选后图标起跳一次. */
  readonly hop?: boolean;
  /** 悬停或聚焦时显示标签. */
  readonly labels?: boolean;
  readonly disabled?: boolean;
  readonly onSelect?: (id: string) => void;
  /** 按住 DOCK_HOLD_MS 触发, 这次点击不再算选中. */
  readonly onItemHold?: (id: string) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

const channel = (i: number): string => `size${i}`;

function keyboardFocus(node: Element): boolean {
  try {
    return node.matches(":focus-visible");
  } catch {
    return true;
  }
}

/**
 * 放大坞: 指针沿坞移动, 附近图标按余弦钟形放大, 每格一根弹簧 (保留速度, 指针一动即改目标).
 * 键盘方向键漫游, 聚焦格按指针正对处理. 减弱动效时尺寸直接落到目标, 不起跳.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
export function MagnifyDock({
  items,
  size = DOCK_DEFAULTS.size,
  magnified = DOCK_DEFAULTS.magnified,
  distance = DOCK_DEFAULTS.distance,
  gap = DOCK_DEFAULTS.gap,
  spring,
  hop = true,
  labels = true,
  disabled = false,
  onSelect,
  onItemHold,
  ariaLabel = "Dock",
  className,
}: MagnifyDockProps): JSX.Element {
  const reduced = useReducedMotion();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const [roving, setRoving] = useState(0);
  const [shown, setShown] = useState<number | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const held = useRef(false);
  const spec = dockSpring(spring);

  const motion = useNavMotion((m) => {
    refs.current.forEach((node, i) => {
      if (!node) return;
      const s = m.get(channel(i), size);
      node.style.width = s + PX;
      node.style.height = s + PX;
    });
  }, reduced);

  useEffect(() => {
    items.forEach((_, i) => motion.jump(channel(i), size));
    // 项数或静止尺寸变了才重新摆位
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, size]);

  useEffect(() => () => clearTimeout(holdTimer.current), []);

  const aim = (pointerX: number | null): void => {
    refs.current.forEach((node, i) => {
      if (!node) return;
      let target = size;
      if (pointerX !== null && !disabled) {
        const rect = node.getBoundingClientRect();
        target = magnifySize(pointerX - (rect.left + rect.width / DOUBLE), size, magnified, distance);
      }
      motion.spring(channel(i), target, spec);
    });
  };

  const aimAt = (i: number): void => {
    const rect = refs.current[i]?.getBoundingClientRect();
    if (rect) aim(rect.left + rect.width / DOUBLE);
  };

  const endHold = (): void => clearTimeout(holdTimer.current);

  const select = (item: DockItem, i: number): void => {
    if (held.current) {
      held.current = false;
      return;
    }
    if (disabled || item.disabled) return;
    item.onSelect?.();
    onSelect?.(item.id);
    const face = refs.current[i]?.firstElementChild as HTMLElement | null;
    if (hop && !reduced) face?.animate?.(hopFrames(motion.get(channel(i), size)), { duration: DOCK_HOP_S * MS_PER_SECOND });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const last = items.length - 1;
    const moves: Record<string, number> = { ArrowRight: roving + 1, ArrowDown: roving + 1, ArrowLeft: roving - 1, ArrowUp: roving - 1, Home: 0, End: last };
    const next = moves[event.key];
    if (next === undefined || last < 0) return;
    event.preventDefault();
    const wrapped = (next + items.length) % items.length;
    setRoving(wrapped);
    refs.current[wrapped]?.focus();
  };

  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      aria-disabled={disabled || undefined}
      data-slot="magnify-dock"
      onKeyDown={onKeyDown}
      onPointerMove={(event) => {
        if (event.pointerType !== "touch") aim(event.clientX);
      }}
      onPointerLeave={() => {
        aim(null);
        setShown(null);
      }}
      onPointerCancel={() => aim(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          aim(null);
          setShown(null);
        }
      }}
      className={cn("relative inline-flex items-end rounded-2xl border border-border bg-card", disabled && "opacity-[0.45]", className)}
      style={{ padding: DOCK_EDGE, gap, height: size + DOCK_EDGE * DOUBLE }}
    >
      {items.map((item, i) => (
        <button
          key={item.id}
          ref={(node) => {
            refs.current[i] = node;
          }}
          type="button"
          aria-label={item.label}
          aria-current={item.active ? "page" : undefined}
          tabIndex={i === roving ? 0 : BACK}
          disabled={disabled || item.disabled}
          data-active={item.active || undefined}
          onFocus={(event) => {
            setRoving(i);
            if (keyboardFocus(event.currentTarget)) {
              aimAt(i);
              setShown(i);
            }
          }}
          onPointerEnter={() => setShown(i)}
          onPointerDown={(event) => {
            if (event.button !== 0 || !onItemHold) return;
            held.current = false;
            endHold();
            holdTimer.current = setTimeout(() => {
              held.current = true;
              onItemHold(item.id);
            }, DOCK_HOLD_MS);
          }}
          onPointerUp={endHold}
          onPointerCancel={endHold}
          onPointerLeave={endHold}
          onClick={() => select(item, i)}
          className={cn("relative shrink-0 select-none rounded-xl", NAV_FOCUS, NAV_DISABLED)}
          style={{ width: size, height: size }}
        >
          <span aria-hidden className="flex size-full items-center justify-center rounded-[inherit] border border-border bg-muted text-foreground">
            {item.icon}
          </span>
          {labels ? (
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground"
              style={{
                bottom: `calc(100% + ${DOCK_LABEL_GAP}px)`,
                opacity: shown === i ? 1 : 0,
                transform: `translate(-50%, ${shown === i ? 0 : DOCK_LABEL_GAP / DOUBLE}px)`,
                transition: transitionOf([["opacity", DOCK_LABEL_MS, PLAIN_EASE], ["transform", DOCK_LABEL_MS, PLAIN_EASE]], reduced),
              }}
            >
              {item.label}
            </span>
          ) : null}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 size-1 -translate-x-1/2 rounded-full bg-foreground"
            style={{ top: `calc(100% + ${DOCK_EDGE / DOUBLE - DOUBLE}px)`, opacity: item.active ? 1 : 0, transition: transitionOf([["opacity", DOCK_DOT_MS, PLAIN_EASE]], reduced) }}
          />
        </button>
      ))}
    </div>
  );
}
