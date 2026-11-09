"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 Folder 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格是 WebGL 纸张网格 (书脊弯折, 挤压, 倒角光照, 拖出投放). 这里是 DOM 3D 变换近似, 见 note.

import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import * as F from "./parts/folder-spec";
import { KIT_FOCUS, kitTone, useKitMotion, type KitTone } from "./tokens";

export { FOLDER_BOOK, FOLDER_FLAP, FOLDER_MAX_ITEMS, coverAngle, itemPose, type FolderPose, type ItemPose } from "./parts/folder-spec";

export interface FolderItem {
  readonly label: string;
  readonly content?: ReactNode;
}

export interface FileFolderProps {
  readonly items: readonly FolderItem[];
  readonly label?: string;
  readonly tone?: KitTone;
  readonly size?: number;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onItemClick?: (index: number) => void;
  readonly spread?: number;
  readonly lift?: number;
  readonly fan?: number;
  readonly className?: string;
}

/**
 * 文件夹: 最多 6 份文件插在夹里. 悬停或聚焦时封面与插页微开 (探看), 文件上探; 点击或 Enter / 空格打开, 封面翻下, 文件在夹上方扇形散开,
 * 每份是可点的按钮; Escape 或再点合上. open 可受控. 封面与文件各走弹簧, 文件错峰 40ms. 减弱动效时直接到位.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
export function FileFolder({
  items,
  label = "Folder",
  tone = "primary",
  size = 160,
  open,
  defaultOpen = false,
  onOpenChange,
  onItemClick,
  spread = 54,
  lift = 120,
  fan = 14,
  className,
}: FileFolderProps): JSX.Element {
  const still = useReducedMotion();
  const [own, setOwn] = useState(defaultOpen);
  const [peek, setPeek] = useState(false);
  const [hot, setHot] = useState(-1);
  const isOpen = open ?? own;
  const pose: F.FolderPose = isOpen ? "open" : peek ? "peek" : "rest";
  const list = F.clampItems(items);
  const count = list.length;
  const cover = useRef<HTMLDivElement>(null);
  const flap = useRef<HTMLDivElement>(null);
  const papers = useRef<Array<HTMLElement | null>>([]);
  const h = size * 0.78;

  const motion = useKitMotion((m) => {
    if (cover.current) cover.current.style.transform = `rotateX(${m.get("cover").toFixed(2)}deg)`;
    if (flap.current) flap.current.style.transform = `rotateX(${(0 - m.get("flap")).toFixed(2)}deg)`;
    papers.current.forEach((el, i) => {
      if (!el) return;
      el.style.transform = `translate(${m.get(`x${i}`).toFixed(2)}px, ${m.get(`y${i}`).toFixed(2)}px) rotate(${m.get(`r${i}`).toFixed(2)}deg) scale(${m.get(`s${i}`, 1).toFixed(4)})`;
    });
  }, still);

  useEffect(() => {
    motion.spring("cover", F.coverAngle(pose), F.FOLDER_COVER_SPRING);
    motion.spring("flap", F.FOLDER_FLAP[pose], F.FOLDER_COVER_SPRING);
    for (let i = 0; i < count; i += 1) {
      const p = F.itemPose(i, count, pose, spread, lift, fan, i === hot);
      const delay = pose === "open" ? i * F.FOLDER_STAGGER_MS : 0;
      motion.spring(`x${i}`, p.x, F.FOLDER_ITEM_SPRING, undefined, delay);
      motion.spring(`y${i}`, p.y, F.FOLDER_ITEM_SPRING, undefined, delay);
      motion.spring(`r${i}`, p.r, F.FOLDER_ITEM_SPRING, undefined, delay);
      motion.spring(`s${i}`, p.s, F.FOLDER_ITEM_SPRING);
    }
    motion.paint();
  }, [pose, hot, count, spread, lift, fan, motion]);

  const setOpen = (next: boolean): void => {
    if (open === undefined) setOwn(next);
    onOpenChange?.(next);
  };
  const onKey = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setOpen(false);
    }
  };
  const t = kitTone(tone);

  return (
    <div data-slot="file-folder" data-pose={pose} onKeyDown={onKey} className={cn("relative inline-grid place-items-end", className)} style={{ width: size, height: h + (isOpen ? lift : 30), perspective: 700 }} onPointerEnter={() => setPeek(true)} onPointerLeave={() => setPeek(false)}>
      <div aria-hidden data-slot="file-folder-back" className="absolute bottom-0 left-0 w-full rounded-lg" style={{ height: h, background: `color-mix(in oklab, ${t} 70%, var(--background))` }}>
        <div ref={flap} className="absolute -top-3 left-0 h-4 w-2/5 origin-bottom rounded-t-md" style={{ background: `color-mix(in oklab, ${t} 70%, var(--background))` }} />
      </div>
      <ul className="absolute bottom-2 left-0 grid w-full place-items-center" style={{ zIndex: isOpen ? F.FOLDER_LAYERS.out : 1 }} aria-label={label} hidden={!isOpen && list.length === 0}>
        {list.map((item, i) => (
          <li key={i} className="col-start-1 row-start-1" style={{ zIndex: i === hot ? F.FOLDER_LAYERS.focus : i }}>
            <button
              type="button"
              ref={(node) => {
                papers.current[i] = node;
              }}
              tabIndex={isOpen ? 0 : -1}
              aria-hidden={!isOpen}
              data-slot="file-folder-item"
              onPointerEnter={() => setHot(i)}
              onPointerLeave={() => setHot(-1)}
              onFocus={() => setHot(i)}
              onBlur={() => setHot(-1)}
              onClick={() => onItemClick?.(i)}
              className={cn("grid origin-bottom place-items-center rounded-md border border-border bg-card p-2 text-xs text-card-foreground shadow-sm", KIT_FOCUS)}
              style={{ width: size * 0.62, height: h * 0.8 }}
            >
              {item.content ?? item.label}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={label}
        onFocus={() => setPeek(true)}
        onBlur={() => setPeek(false)}
        onClick={() => setOpen(!isOpen)}
        className={cn("absolute bottom-0 left-0 w-full", KIT_FOCUS)}
        style={{ height: h * 0.86, zIndex: 60, perspective: 700 }}
      >
        <div ref={cover} data-slot="file-folder-cover" className="h-full w-full origin-bottom rounded-lg border border-border" style={{ background: `color-mix(in oklab, ${t} 85%, var(--background))`, boxShadow: "var(--shadow-md)" }} />
      </button>
    </div>
  );
}
