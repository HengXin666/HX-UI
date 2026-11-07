"use client";

import { useEffect, useId, useRef, useState, type JSX, type KeyboardEvent } from "react";
import { useTrack } from "../use-track";
import { SPRING_THUMB } from "../tokens";

export interface CraftOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

/**
 * 选择. 面板从 scaleY 0.96 打开, 再按立即反向, 速度保留.
 * 键盘上下与点击同一条高亮. 字母跳到匹配项.
 */
export function CraftSelect({
  options,
  value,
  onChange,
  disabled,
  invalid,
  placeholder = "选择",
  label,
}: {
  readonly options: readonly CraftOption[];
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  readonly placeholder?: string;
  readonly label: string;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const scale = useTrack(0, SPRING_THUMB);
  const id = useId();
  const listId = `${id}-list`;
  const typed = useRef("");
  const typedAt = useRef(0);
  const current = options.find((item) => item.value === value);

  useEffect(() => {
    scale.setTarget(open ? 1 : 0);
  }, [open, scale.setTarget]);

  const move = (delta: number): void => {
    const count = options.length;
    if (!count) return;
    let next = highlight;
    for (let step = 0; step < count; step += 1) {
      next = (next + delta + count) % count;
      if (!options[next]?.disabled) break;
    }
    setHighlight(next);
  };

  const onKey = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (disabled) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      move(-1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) setOpen(true);
      else {
        const item = options[highlight];
        if (item && !item.disabled) onChange(item.value);
        setOpen(false);
      }
    } else if (event.key === "Escape") setOpen(false);
    else if (event.key.length === 1) {
      const now = performance.now();
      typed.current = now - typedAt.current < 500 ? typed.current + event.key : event.key;
      typedAt.current = now;
      const found = options.findIndex((item) => item.label.toLowerCase().startsWith(typed.current.toLowerCase()));
      if (found >= 0) {
        setHighlight(found);
        setOpen(true);
      }
    }
  };

  const shown = Math.max(0, Math.min(1, scale.value));

  return (
    <div className="relative inline-block text-sm">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onKey}
        className="flex h-8 min-w-36 items-center justify-between gap-2 rounded-lg border border-border bg-card px-2.5 text-foreground outline-none focus-visible:border-ring disabled:opacity-[0.45] aria-invalid:border-destructive"
        aria-invalid={invalid || undefined}
      >
        <span>{current?.label ?? placeholder}</span>
        <span aria-hidden className="text-muted-foreground" style={{ transform: "translateY(-0.5px)" }}>v</span>
      </button>
      <ul
        id={listId}
        role="listbox"
        aria-label={label}
        className="absolute left-0 z-30 mt-1 w-full origin-top overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md"
        style={{
          opacity: shown,
          transform: `translate3d(0, ${(1 - shown) * 4}px, 0) scaleY(${0.96 + shown * 0.04})`,
          pointerEvents: shown < 0.2 ? "none" : "auto",
        }}
      >
        {options.map((item, index) => (
          <li key={item.value} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={item.value === value}
              disabled={item.disabled}
              className="flex h-8 w-full items-center rounded-md px-2 text-left text-foreground transition-[background-color,transform] duration-150 hover:bg-accent/60 active:scale-[0.98] motion-reduce:active:scale-100 disabled:opacity-40"
              onMouseEnter={() => setHighlight(index)}
              onClick={() => {
                if (!item.disabled) onChange(item.value);
                setOpen(false);
              }}
            >
              <span className="mr-2 h-3 w-px bg-foreground" style={{ opacity: item.value === value ? 1 : 0 }} />
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
