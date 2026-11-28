"use client";
/**
 * Agent 客户端 / 模型选择与推理强度 (对标 Codex: 模型与强度是两个独立的设置, 强度只走模型声明的档位, Alt+, / Alt+. 升降一档;
 * 客户端 + 模型的菜单对标 T3 Code 的 ProviderModelPicker). 放在 PromptInput 里:
 *   控件栏右边 (status): AgentModelPicker  [客户端图标] 模型名 ⌄, 弹层只管选客户端和模型 (左客户端, 右搜索 + 模型列表, 手机上竖排)
 *   控件栏左边 (toolbar): EffortControl   [脑图标] ▬▬▬●▭ 高, 输入框里直接拖 / 点 / 方向键, 只列当前模型支持的档位, 模型不能调时不画
 *   EffortSlider 是带刻度的大号强度条, 单独用 (设置页等).
 * 换模型时强度吸附到新模型支持的最近一档 (model/models.ts 的 resolveModelSelection).
 * 研究笔记: docs/dsh-conversation-research.md
 */
import * as React from "react";
import { Brain, Check, ChevronDown, LayoutGrid, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { EFFORT_HINT, EFFORT_LABEL, EFFORT_ORDER, effortsOf, findModel, modelName, resolveModelSelection, searchModels, stepEffort, type AgentClientOption, type AgentModelSelection, type ReasoningEffort } from "./model/models";
import { formatTokens } from "./parts/format";
import { EffortBadge } from "./effort-track";

/* ---------------- 强度柱 (T3 EffortGlyph 的做法: 一档一根, 由低到高, 填到当前档) ---------------- */

/** 柱子高度从一半涨到满高 (像素取整, 1x 屏不糊) */
const BAR_MAX = 12;

export function EffortBars({ count, filled, className }: { count: number; filled: number; className?: string }) {
  const step = Math.max(1, Math.round(BAR_MAX / 2 / Math.max(count - 1, 1)));
  return (
    <span aria-hidden data-slot="effort-bars" className={cn("inline-flex h-3 shrink-0 items-end gap-0.5", className)}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={cn("w-0.5 rounded-[1px] bg-current", i >= filled && "opacity-25")} style={{ height: BAR_MAX - (count - 1 - i) * step }} />
      ))}
    </span>
  );
}

/* ---------------- 推理强度条 ---------------- */

export interface EffortSliderProps {
  /** 支持的档位 (会按由低到高排) */
  levels: readonly ReasoningEffort[];
  value?: ReasoningEffort;
  onValueChange: (e: ReasoningEffort) => void;
  /** 读屏名 */
  label?: string;
  disabled?: boolean;
  className?: string;
}

/** 刻度横向位置: 与 Radix 滑块的拇指中心对齐 (拇指 16px, 两端各让 8px) */
const tickLeft = (i: number, n: number) => (n > 1 ? `calc(8px + (100% - 16px) * ${i / (n - 1)})` : "50%");

/**
 * 可拖拽的推理强度条: 基于库里的 Slider (Radix): 指针拖动 / 点轨道, 方向键 / Home / End / PageUp / PageDown, 按档吸附,
 * role=slider + aria-valuetext 念档位名; 下面的刻度也能点.
 */
export function EffortSlider({ levels: raw, value, onValueChange, label = "推理强度", disabled, className }: EffortSliderProps) {
  const levels = React.useMemo(() => EFFORT_ORDER.filter((e) => raw.includes(e)), [raw]);
  const index = Math.max(0, value ? levels.indexOf(value) : 0);
  if (!levels.length) return null;
  const max = levels.length - 1;
  return (
    <div data-slot="effort-slider" className={cn("grid gap-1.5", className)}>
      <Slider
        min={0}
        max={Math.max(1, max)}
        step={1}
        value={[index]}
        disabled={disabled || max === 0}
        onValueChange={([i]) => levels[i] && levels[i] !== value && onValueChange(levels[i])}
        aria-label={label}
        formatValue={(i) => EFFORT_LABEL[levels[i]] ?? ""}
        className="py-1.5"
      />
      <div className="relative h-8">
        {levels.map((l, i) => (
          <button
            key={l}
            type="button"
            tabIndex={-1}
            aria-label={`${label}设为${EFFORT_LABEL[l]}`}
            disabled={disabled}
            onClick={() => onValueChange(l)}
            className={cn(
              "absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1 rounded px-1 text-[11px] leading-none whitespace-nowrap transition-colors duration-150 hover:text-foreground disabled:pointer-events-none",
              i === index ? "font-medium text-foreground" : "text-muted-foreground",
            )}
            style={{ left: tickLeft(i, levels.length) }}
          >
            <span aria-hidden className={cn("size-1 rounded-full", i <= index ? "bg-primary" : "bg-border")} />
            {EFFORT_LABEL[l]}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 输入框里的推理强度 (内联) ---------------- */


/** 一档的宽度与间隔 (px): 段 12, 隔 3; 拇指 12 */
const SEG = 12;
const GAP = 3;
/** 改完后气泡停留多久 */
const BUBBLE_MS = 1200;

export interface EffortControlProps {
  /** 当前模型支持的档位 (会按由低到高排); 空数组时不画 (模型不能调推理强度) */
  levels: readonly ReasoningEffort[];
  value?: ReasoningEffort;
  onValueChange: (e: ReasoningEffort) => void;
  /** 读屏名, 也是宽时显示的前缀 */
  label?: string;
  /** 紧凑: 不显示 "推理" 前缀 (手机) */
  compact?: boolean;
  /** Alt+, / Alt+. 降 / 升一档 (Codex 同款), 默认开 */
  hotkeys?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * 输入框控件栏里的推理强度: 一档一段的短条 + 拇指 + 当前档名. 拖动 (指针捕获, 拖出控件也跟手), 点某一段, 方向键 / Home / End,
 * Alt+, / Alt+. 全局快捷键; 改动时上方冒一个气泡 "高 · 复杂改动, 多想几步". role=slider, aria-valuetext 念档名.
 */
export function EffortControl({ levels: raw, value, onValueChange, label = "推理强度", compact, hotkeys = true, disabled, className }: EffortControlProps) {
  const levels = React.useMemo(() => EFFORT_ORDER.filter((e) => raw.includes(e)), [raw]);
  const track = React.useRef<HTMLSpanElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [bubble, setBubble] = React.useState(false);
  // 指针点进来的焦点不画焦点框 (键盘操作后再画)
  const [byPointer, setByPointer] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  const index = Math.max(0, value ? levels.indexOf(value) : 0);
  const max = levels.length - 1;
  const latest = React.useRef({ levels, value, onValueChange, disabled });
  latest.current = { levels, value, onValueChange, disabled };

  const flash = React.useCallback(() => {
    setBubble(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBubble(false), BUBBLE_MS);
  }, []);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const set = React.useCallback(
    (e: ReasoningEffort | undefined) => {
      const cur = latest.current;
      if (!e || cur.disabled) return;
      flash();
      if (e !== cur.value) cur.onValueChange(e);
    },
    [flash],
  );

  // Alt+, / Alt+. (按物理键位, 不受输入法 / 布局影响)
  React.useEffect(() => {
    if (!hotkeys) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || (e.code !== "Comma" && e.code !== "Period")) return;
      const cur = latest.current;
      if (!cur.levels.length || cur.disabled) return;
      e.preventDefault();
      set(stepEffort(cur.levels, cur.value, e.code === "Period" ? 1 : -1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkeys, set]);

  if (!levels.length) return null;
  const at = (clientX: number) => {
    const r = track.current?.getBoundingClientRect();
    if (!r) return;
    const k = Math.round((clientX - r.left - SEG / 2) / (SEG + GAP));
    set(levels[Math.min(max, Math.max(0, k))]);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const go: Record<string, number | undefined> = { ArrowRight: index + 1, ArrowUp: index + 1, ArrowLeft: index - 1, ArrowDown: index - 1, Home: 0, End: max, PageUp: max, PageDown: 0 };
    const k = go[e.key];
    if (k === undefined) return;
    e.preventDefault();
    set(levels[Math.min(max, Math.max(0, k))]);
  };
  const name = value ? EFFORT_LABEL[value] : "";
  const hint = value ? EFFORT_HINT[value] : undefined;
  return (
    <div
      data-slot="effort-control"
      data-dragging={dragging || undefined}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={index}
      aria-valuetext={hint ? `${name}, ${hint}` : name}
      aria-disabled={disabled || undefined}
      aria-keyshortcuts={hotkeys ? "Alt+Comma Alt+Period" : undefined}
      title={`${label}: ${name}${hint ? ` · ${hint}` : ""}${hotkeys ? " (Alt+, / Alt+. 调整)" : ""}`}
      onKeyDown={(e) => {
        setByPointer(false);
        onKeyDown(e);
      }}
      onBlur={() => setByPointer(false)}
      className={cn(
        "relative inline-flex h-8 min-w-0 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors duration-150 select-none hover:bg-accent/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
        dragging && "bg-accent/60 text-foreground",
        byPointer && "focus-visible:outline-none",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <Brain aria-hidden className="size-3.5 shrink-0" />
      {!compact && <span className="shrink-0">推理</span>}
      <span
        ref={track}
        aria-hidden
        data-slot="effort-track"
        className="relative -my-2 flex h-8 shrink-0 cursor-ew-resize touch-none items-center"
        style={{ gap: GAP }}
        onPointerDown={(e) => {
          if (disabled || e.button !== 0) return;
          e.preventDefault();
          setByPointer(true);
          e.currentTarget.parentElement?.focus({ preventScroll: true });
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
          at(e.clientX);
        }}
        onPointerMove={(e) => dragging && at(e.clientX)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        {levels.map((l, k) => (
          <span key={l} className={cn("h-1.5 shrink-0 rounded-full transition-colors duration-150", k <= index ? "bg-brand" : "bg-muted-foreground/25")} style={{ width: SEG }} />
        ))}
        <span
          className={cn("absolute top-1/2 left-0 size-3 rounded-full border border-brand bg-background shadow-xs transition-transform duration-150", dragging && "duration-75")}
          style={{ transform: `translate(${index * (SEG + GAP)}px, -50%) scale(${dragging ? 1.2 : 1})` }}
        />
      </span>
      {/* 档名按档位区分样式 (与模型菜单的触发器同一套: 低淡, 高品牌色, 最高渐变) */}
      {value ? <EffortBadge effort={value} glyph={false} className="min-w-[2em]" /> : <span className="min-w-[2em] shrink-0" />}
      {/* 拖动 / 改动时的气泡: 档名 + 说明 */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-full left-0 z-10 mb-1.5 flex items-center gap-1.5 rounded-md border bg-popover px-2 py-1 text-[11px] whitespace-nowrap text-popover-foreground shadow-soft transition-[opacity,transform] duration-150",
          dragging || bubble ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        )}
      >
        <span className="font-medium">{name}</span>
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </span>
    </div>
  );
}

/* ---------------- 客户端 + 模型选择 ---------------- */

export interface AgentModelPickerProps {
  clients: readonly AgentClientOption[];
  /** 选中的客户端 / 模型; effort 在换模型时会被吸附到新模型支持的档位, 但强度本身在 EffortControl 里调 */
  value: AgentModelSelection;
  onValueChange: (v: AgentModelSelection) => void;
  disabled?: boolean;
  /** 弹层对齐, 默认 end (控件栏右边) */
  align?: "start" | "center" | "end";
  /** 紧凑: 触发器只露图标与截短的模型名 */
  compact?: boolean;
  className?: string;
}

const ALL = "__all__";

/**
 * 客户端 + 模型的下拉 (放在输入框控件栏右边, 发送按钮左侧). 弹层: 左边一列客户端 (全部 / Codex / Claude Code ...,
 * 不可用的置灰说明原因), 右边搜索 + 按客户端分组的模型 (简介, 角标, 窗口, 支持的强度档数). 上下键 + Enter 选.
 */
export function AgentModelPicker({ clients, value, onValueChange, disabled, align = "end", compact, className }: AgentModelPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<string>(ALL);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const search = React.useRef<HTMLInputElement>(null);
  const listId = React.useId();
  const { client, model } = findModel(clients, value.client, value.model);
  const groups = React.useMemo(() => searchModels(tab === ALL ? clients : clients.filter((c) => c.id === tab), query), [clients, tab, query]);
  const flat = React.useMemo(() => groups.flatMap((g) => g.models.map((m) => ({ client: g.client, model: m }))), [groups]);
  React.useEffect(() => setActive(0), [tab, query]);
  const choose = (c: AgentClientOption, m: (typeof flat)[number]["model"]) => {
    if (c.unavailable || m.disabled) return;
    const next = resolveModelSelection(clients, { client: c.id, model: m.id, effort: value.effort });
    if (next) onValueChange(next);
    setOpen(false);
  };
  const onListKey = (e: React.KeyboardEvent) => {
    if (!flat.length) return;
    if (e.key === "ArrowDown") setActive((a) => (a + 1) % flat.length);
    else if (e.key === "ArrowUp") setActive((a) => (a - 1 + flat.length) % flat.length);
    else if (e.key === "Enter") {
      const it = flat[active];
      if (it) choose(it.client, it.model);
    } else return;
    e.preventDefault();
  };
  let row = -1;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="model-picker"
          disabled={disabled}
          aria-label={`选择 Agent 客户端与模型, 当前 ${client?.name ?? ""} ${model ? modelName(model) : ""}`}
          className={cn(
            "inline-flex h-8 min-w-0 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 data-[state=open]:bg-accent data-[state=open]:text-foreground [&_svg:not([class*='size-'])]:size-3.5",
            className,
          )}
        >
          {client?.icon && <span className="grid size-4 shrink-0 place-items-center [&_svg]:size-3.5">{client.icon}</span>}
          <span className={cn("min-w-0 truncate text-foreground/90", compact && "max-w-[7.5rem]")}>{model ? modelName(model) : "选择模型"}</span>
          <ChevronDown aria-hidden className="shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align={align}
        sideOffset={8}
        collisionPadding={12}
        aria-label="Agent 客户端与模型"
        className="w-[min(34rem,calc(100vw-1.5rem))] overflow-hidden p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          search.current?.focus();
        }}
      >
        <div className="flex h-[21rem] min-h-0 max-sm:h-auto max-sm:max-h-[min(30rem,75vh)] max-sm:flex-col">
          {/* 客户端 */}
          <div role="tablist" aria-label="Agent 客户端" aria-orientation="vertical" className="flex w-36 shrink-0 flex-col gap-0.5 overflow-y-auto border-r bg-muted/40 p-1 scrollbar-thin max-sm:w-full max-sm:flex-row max-sm:overflow-x-auto max-sm:border-r-0 max-sm:border-b">
            {[{ id: ALL, name: "全部", icon: <LayoutGrid />, unavailable: undefined as string | undefined, description: undefined as string | undefined }, ...clients].map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={tab === c.id}
                title={c.unavailable ? `${c.name}: ${c.unavailable}` : c.description}
                onClick={() => setTab(c.id)}
                className={cn(
                  "flex h-8 min-w-0 shrink-0 items-center gap-2 rounded-md px-2 text-left text-xs transition-colors duration-150 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring",
                  tab === c.id ? "bg-background text-foreground shadow-xs" : "text-muted-foreground",
                  c.unavailable && "opacity-60",
                )}
              >
                <span className="grid size-4 shrink-0 place-items-center [&_svg]:size-3.5">{c.icon}</span>
                <span className="min-w-0 truncate">{c.name}</span>
                {c.id === value.client && <span aria-hidden className="ml-auto size-1.5 shrink-0 rounded-full bg-brand max-sm:ml-0" />}
              </button>
            ))}
          </div>
          {/* 模型 */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <label className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
              <Search aria-hidden className="size-3.5 text-muted-foreground" />
              <input
                ref={search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onListKey}
                placeholder="搜索模型"
                aria-label="搜索模型"
                aria-controls={listId}
                aria-activedescendant={flat[active] ? `${listId}-${active}` : undefined}
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
            </label>
            <div id={listId} role="listbox" aria-label="模型" className="min-h-0 flex-1 overflow-y-auto p-1 scrollbar-thin max-sm:max-h-72">
              {!groups.length && <p className="px-3 py-6 text-center text-xs text-muted-foreground">没有匹配的模型</p>}
              {groups.map((g) => (
                <div key={g.client.id} role="group" aria-label={g.client.name} className="pb-1">
                  {(tab === ALL || g.client.unavailable) && (
                    <div className="flex min-w-0 items-center gap-1.5 px-2 pt-1.5 pb-1 text-[11px] text-muted-foreground">
                      <span className="grid size-3.5 place-items-center [&_svg]:size-3">{g.client.icon}</span>
                      <span className="font-medium text-foreground/80">{g.client.name}</span>
                      {g.client.unavailable ? <span className="truncate text-warning">{g.client.unavailable}</span> : g.client.description && <span className="truncate">{g.client.description}</span>}
                    </div>
                  )}
                  {g.models.map((m) => {
                    row++;
                    const i = row;
                    const selected = g.client.id === value.client && m.id === value.model;
                    const off = !!g.client.unavailable || !!m.disabled;
                    const lv = effortsOf(m).filter((l) => l !== "off");
                    return (
                      <div
                        key={m.id}
                        id={`${listId}-${i}`}
                        role="option"
                        aria-selected={selected}
                        aria-disabled={off || undefined}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => choose(g.client, m)}
                        className={cn("flex min-w-0 cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5", i === active && "bg-accent", off && "cursor-not-allowed opacity-50")}
                      >
                        <span className="grid size-4 shrink-0 place-items-center text-muted-foreground [&_svg]:size-3.5">{g.client.icon}</span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="flex min-w-0 items-center gap-1.5 text-[13px]">
                            <span className="truncate">{modelName(m)}</span>
                            {m.badge && <span className="shrink-0 rounded border px-1 text-[10px] leading-4 text-muted-foreground">{m.badge}</span>}
                          </span>
                          {m.description && <span className="truncate text-[11px] text-muted-foreground">{m.description}</span>}
                        </span>
                        <span className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground tabular">
                          {m.contextWindow && <span className="max-sm:hidden">{formatTokens(m.contextWindow)}</span>}
                          {lv.length > 0 ? <span title={`推理强度 ${lv.length} 档`}><EffortBars count={lv.length} filled={lv.length} className="opacity-60" /></span> : <span className="text-[10px] opacity-70">不推理</span>}
                        </span>
                        <span className="grid size-4 shrink-0 place-items-center">{selected && <Check aria-hidden className="size-3.5" />}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="flex h-8 shrink-0 items-center gap-1.5 border-t px-3 text-[11px] text-muted-foreground">
              <Brain aria-hidden className="size-3" />
              推理强度在输入框里单独调 · <kbd className="font-mono">Alt+,</kbd> / <kbd className="font-mono">Alt+.</kbd>
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
