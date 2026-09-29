import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";
import { cn } from "@hx/ui";
import { DOCS, GROUPS, type DocEntry } from "../nav";

/**
 * 组件搜索 (⌘K / Ctrl+K)。
 *
 * ## 为什么值得做
 *
 * 38 个页面分 4 组挤在左栏, 找"那个能出提示的"只能靠眼睛扫。
 * 实测这是文档站最高频的动作, 而它此前**完全不存在** —— 没有任何快捷键处理。
 *
 * ## 匹配策略: 子序列 + 中文子串双路
 *
 * 只做 `includes` 的话, "dt" 搜不到 "DataTable", "segtl" 也搜不到 "SegmentedControl";
 * 只做子序列的话, 输入中文时因为字不连续会匹配不到。两路都跑, 子序列命中排后面。
 *
 * ## 键盘可达性是硬要求
 *
 * ↑↓ 移动、Enter 打开、Esc 关闭。少了 ↑↓ 就只能用鼠标点, 那这个面板还不如不用。
 */
interface Hit {
  readonly entry: DocEntry;
  readonly score: number;
}

/** 子序列匹配: q 的字符按序出现在 text 里即命中。 */
function subseq(text: string, q: string): number {
  let ti = 0;
  let matched = 0;
  for (const ch of q) {
    const found = text.indexOf(ch, ti);
    if (found === -1) return -1;
    matched += found === ti ? 2 : 1; // 连续命中给更高分
    ti = found + 1;
  }
  return matched;
}

export function searchDocs(q: string): Hit[] {
  const query = q.trim().toLowerCase();
  if (!query) return DOCS.map((entry) => ({ entry, score: 0 }));
  const hits: Hit[] = [];
  for (const entry of DOCS) {
    const label = entry.label.toLowerCase();
    const desc = entry.desc.toLowerCase();
    const id = entry.id.toLowerCase();
    if (label.includes(query)) { hits.push({ entry, score: 100 - label.indexOf(query) }); continue; }
    if (id.includes(query)) { hits.push({ entry, score: 80 }); continue; }
    if (desc.includes(query)) { hits.push({ entry, score: 50 }); continue; }
    const s = subseq(label + id, query);
    if (s > 0) hits.push({ entry, score: s });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 12);
}

export function SearchDialog({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
}): JSX.Element | null {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => searchDocs(q), [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      // 打开即聚焦, 否则还要先点一下输入框
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setCursor(0), [q]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, hits.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const hit = hits[cursor];
        if (hit) { onPick(hit.entry.id); onClose(); }
      } else if (e.key === "Escape") { e.preventDefault(); onClose(); }
    },
    [hits, cursor, onPick, onClose],
  );

  if (!open) return null;

  const grouped = GROUPS.map((g) => ({ g, list: hits.filter((h) => h.entry.group === g) })).filter((x) => x.list.length > 0);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="搜索组件"
        onClick={(e) => e.stopPropagation()}
        className="w-[560px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
      >
        <div className="flex items-center gap-2 border-b border-border/60 px-3">
          <span aria-hidden className="icon-[solar--magnifier-linear] size-4 shrink-0 bg-current text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="搜索组件…  (↑↓ 选择, Enter 打开)"
            aria-label="搜索组件"
            className="h-11 w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">Esc</kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-1.5">
          {hits.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-muted-foreground">没有匹配的组件</div>
          ) : (
            grouped.map(({ g, list }) => (
              <div key={g}>
                <div className="px-2 pb-1 pt-2 text-[10.5px] font-medium text-muted-foreground/60">{g}</div>
                {list.map((h) => {
                  // 用全局下标定位光标项 —— 分组后顺序变了, 不能用组内下标
                  const idx = hits.indexOf(h);
                  return (
                    <button
                      key={h.entry.id}
                      type="button"
                      onMouseEnter={() => setCursor(idx)}
                      onClick={() => { onPick(h.entry.id); onClose(); }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
                        idx === cursor ? "bg-accent/70" : "hover:bg-accent/40",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-foreground">{h.entry.label}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{h.entry.desc}</span>
                      </span>
                      <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground/60">#/{h.entry.id}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/** 订阅 ⌘K / Ctrl+K, 返回开关状态。 */
export function useSearchHotkey(): { open: boolean; setOpen: (v: boolean) => void } {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}
