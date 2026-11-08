"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type JSX, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../../primitives/utils";
import { BUTTON_TYPE, COMPOSE_EASE_IN_OUT, COMPOSE_EASE_OUT, COMPOSER, CSS_PROP, HALF, NONE, transitionOf } from "../tokens";

/** 可选的来源 (例如 Web / 文件 / 代码库). */
export interface ComposerSource {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
}

const KEY = { up: "ArrowUp", down: "ArrowDown", enter: "Enter", space: " ", escape: "Escape", tab: "Tab" } as const;
const EQ_BARS = [0, COMPOSER.eqStepMs, COMPOSER.eqStepMs * HALF];
/** 列表行高 = 输入行高 + 2px; 列表内边距与 p-1 一致. */
const ROW_H = COMPOSER.line + HALF;
const LIST_PAD_PX = 4;
const ICON_BOX = "0 0 16 16";
const ICON_SIZE = 16;
const ARROW_PATH = "M8 13V3M3.5 7.5L8 3l4.5 4.5";
const SQUARE_PATH = "M4.5 4.5h7v7h-7z";
const HIDDEN_SCALE = 0.6;

const POP_FRAMES: Keyframe[] = [
  { opacity: 0, transform: "translateY(4px) scale(0.98)" },
  { opacity: 1, transform: NONE },
];

/** 弹层出现时的一次 pop. 减弱动效不播. */
export function popIn(el: HTMLElement | null, ms: number, reduced: boolean): void {
  if (!el || reduced) return;
  el.animate?.(POP_FRAMES, { duration: ms, easing: COMPOSE_EASE_OUT, fill: "backwards" });
}

/**
 * 发送 / 停止 两个图形交叉淡变, 时长 morphMs, 进出曲线. 中途切换时 CSS transition 从当前值反向.
 */
export function SendGlyph({ busy, morphMs }: { busy: boolean; morphMs: number }): JSX.Element {
  const morph = transitionOf([
    [CSS_PROP.opacity, morphMs, COMPOSE_EASE_IN_OUT],
    [CSS_PROP.transform, morphMs, COMPOSE_EASE_IN_OUT],
  ]);
  const face = (shown: boolean): CSSProperties => ({
    opacity: shown ? 1 : 0,
    transform: shown ? "scale(1)" : `scale(${HIDDEN_SCALE})`,
    transformOrigin: "center",
    transformBox: "fill-box",
    transition: morph,
  });
  return (
    <svg aria-hidden viewBox={ICON_BOX} width={ICON_SIZE} height={ICON_SIZE} fill="none">
      <path d={ARROW_PATH} stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" style={face(!busy)} />
      <path d={SQUARE_PATH} fill="currentColor" style={face(busy)} />
    </svg>
  );
}

/** 收音中的三根均衡条. 900ms 一个来回, 依次错开 150ms. */
export function ListeningBars({ reduced }: { reduced: boolean }): JSX.Element {
  const refs = useRef<Array<HTMLSpanElement | null>>([]);
  useEffect(() => {
    if (reduced) return undefined;
    const running = refs.current.map((el, index) =>
      el?.animate?.(
        [{ transform: `scaleY(${COMPOSER.eqFloor})` }, { transform: "scaleY(1)" }, { transform: `scaleY(${COMPOSER.eqFloor})` }],
        { duration: COMPOSER.eqMs, delay: EQ_BARS[index], iterations: Infinity, easing: "ease-in-out" },
      ),
    );
    return () => running.forEach((animation) => animation?.cancel());
  }, [reduced]);
  return (
    <span data-slot="composer-eq" aria-hidden className="inline-flex h-4 items-center gap-0.5 text-primary">
      {EQ_BARS.map((delay, index) => (
        <span
          key={delay}
          ref={(el) => {
            refs.current[index] = el;
          }}
          className="block h-full w-0.5 origin-center rounded-full bg-current"
          style={{ transform: `scaleY(${reduced ? HIDDEN_SCALE : COMPOSER.eqFloor})` }}
        />
      ))}
    </span>
  );
}

/**
 * 来源选择: 按钮 + listbox. 高亮块用 top / height 220ms 出场曲线滑到当前项, 透明度 150ms.
 */
export function SourcePicker({
  sources,
  value,
  onChange,
  reduced,
  disabled,
}: {
  sources: readonly ComposerSource[];
  value: string;
  onChange: (id: string) => void;
  reduced: boolean;
  disabled?: boolean;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, sources.findIndex((s) => s.id === value)));
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const current = sources.find((s) => s.id === value) ?? sources[0];

  useLayoutEffect(() => {
    if (!open) return;
    popIn(listRef.current, COMPOSER.menuPopMs, reduced);
    listRef.current?.focus();
  }, [open, reduced]);

  const close = (focusTrigger: boolean): void => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };
  const choose = (index: number): void => {
    const picked = sources[index];
    if (picked) onChange(picked.id);
    close(true);
  };
  const onListKey = (event: KeyboardEvent<HTMLUListElement>): void => {
    if (event.key === KEY.down || event.key === KEY.up) {
      event.preventDefault();
      const step = event.key === KEY.down ? 1 : -1;
      setActive((index) => (index + step + sources.length) % sources.length);
    } else if (event.key === KEY.enter || event.key === KEY.space) {
      event.preventDefault();
      choose(active);
    } else if (event.key === KEY.escape) {
      event.preventDefault();
      close(true);
    } else if (event.key === KEY.tab) {
      close(false);
    }
  };

  const rowSlide = transitionOf([
    [CSS_PROP.top, COMPOSER.slideMs, COMPOSE_EASE_OUT],
    [CSS_PROP.height, COMPOSER.slideMs, COMPOSE_EASE_OUT],
    [CSS_PROP.opacity, COMPOSER.fadeMs],
  ]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type={BUTTON_TYPE}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          setActive(Math.max(0, sources.findIndex((s) => s.id === value)));
          setOpen((was) => !was);
        }}
        className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border px-2.5 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:border-ring disabled:opacity-50 motion-safe:active:scale-[0.94]"
        style={{ transition: transitionOf([[CSS_PROP.color, COMPOSER.colorMs], [CSS_PROP.transform, COMPOSER.pressMs, COMPOSE_EASE_OUT]]) }}
      >
        {current?.icon}
        <span>{current?.label}</span>
      </button>
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null) && event.relatedTarget !== triggerRef.current) close(false);
          }}
          className="absolute bottom-full left-0 z-50 mb-2 min-w-40 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none"
        >
          <li
            aria-hidden
            role="presentation"
            className="pointer-events-none absolute inset-x-1 rounded-lg bg-accent"
            style={{ top: LIST_PAD_PX + active * ROW_H, height: ROW_H, transition: reduced ? NONE : rowSlide }}
          />
          {sources.map((source, index) => (
            <li
              key={source.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={source.id === value}
              onPointerEnter={() => setActive(index)}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
              className="relative flex cursor-default items-center gap-2 rounded-lg px-2.5 text-[13px]"
              style={{ height: ROW_H }}
            >
              {source.icon}
              {source.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
