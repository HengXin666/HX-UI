"use client";
/**
 * Codex 式输入栏的零件 (对照 OpenAI Codex 桌面 App / IDE 扩展的 composer 与 codex-rs/tui 的 footer):
 *   ComposerModelMenu   触发器是 Codex 的 "模型名 强度 ⌄"; 点开是一张卡片: "模型 …… hx-opus ›" (子菜单 / 手机进模型列表),
 *                       下面 "推理强度 …… 高" + 渐变档位条 EffortTrack (越高越亮越鲜艳越快). 手机上是底部弹层 (DSH Go 的模型弹层).
 *                       Alt+, / Alt+. 降 / 升一档 (Codex TUI), 滑块聚焦时 ← → 换档.
 *   ComposerSelect      输入框里 / 下方的小下拉: 权限 ("请求批准 ⌄") 与运行位置 ("本地 ⌄"), 图标 + 文字 + 箭头, 淡色.
 *   ComposerActivity    生成中输入框正上方的一条: "• 工作中 (12s · esc 中断)" (TUI 的 status indicator) + 此刻在做什么 + 速率;
 *                       点一下打开轨迹 (DSH Go 的活动条).
 *   ComposerSheet       手机上的底部弹层外壳 (把手, 标题, 关闭), 弹层代替悬浮菜单与侧栏.
 * 输入框本体是 PromptInput (左下 "+", 右下圆形发送 / 停止). 研究笔记: next/docs/dsh-conversation-research.md
 */
import * as React from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EFFORT_LABEL, EFFORT_ORDER, effortsOf, findModel, modelName, resolveModelSelection, stepEffort, type AgentClientOption, type AgentModelSelection, type ReasoningEffort } from "./model/models";
import { EffortBadge, EffortTrack } from "./effort-track";
import { useElapsed } from "./parts/elapsed";
import { formatDuration } from "./parts/format";

/** 输入框里那一排小控件的共同样子 (Codex: 无边框, 淡色字, 悬停变深) */
export const COMPOSER_CHIP =
  "inline-flex h-7 min-w-0 shrink-0 items-center gap-1 rounded-full px-2 text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 data-[state=open]:bg-accent data-[state=open]:text-foreground [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5";

/* ---------------- 底部弹层 ---------------- */

export interface ComposerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** 弹层最高占屏幕多少 (默认 85dvh) */
  maxHeight?: string;
  children: React.ReactNode;
  className?: string;
}

/** 手机上的底部弹层: 顶部把手可拖下关, 标题行右边关闭键, 内容可滚, 底部让出安全区 */
export function ComposerSheet({ open, onOpenChange, title, description, maxHeight = "85dvh", children, className }: ComposerSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent data-slot="composer-sheet" className={cn("rounded-t-2xl", className)} style={{ maxHeight }}>
        <div className="flex h-11 shrink-0 items-center gap-2 px-4">
          <DrawerTitle className="min-w-0 flex-1 truncate text-[15px]">{title}</DrawerTitle>
          <DrawerClose aria-label="关闭" className="-mr-1.5 grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="size-4" />
          </DrawerClose>
        </div>
        <DrawerDescription className={cn(description ? "-mt-1 px-4 pb-2 text-xs" : "sr-only")}>{description ?? title}</DrawerDescription>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(0.75rem,env(safe-area-inset-bottom))] scrollbar-thin">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}

/** 弹层里的一行选项: 44px 高 (手指好点), 左文字右勾 */
function SheetRow({ selected, disabled, onClick, children, hint }: { selected?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={!!selected}
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-11 w-full min-w-0 items-center gap-3 px-4 py-1.5 text-left text-[15px] transition-colors duration-150 active:bg-accent disabled:opacity-50"
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{children}</span>
        {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span className="grid size-5 shrink-0 place-items-center text-brand">{selected && <Check className="size-4" />}</span>
    </button>
  );
}

/* ---------------- 模型 · 强度 ---------------- */

export interface ComposerModelMenuProps {
  clients: readonly AgentClientOption[];
  value: AgentModelSelection;
  onValueChange: (v: AgentModelSelection) => void;
  /** 手机: 点开是底部弹层 */
  sheet?: boolean;
  /** Alt+, / Alt+. 降 / 升一档 (默认开) */
  hotkeys?: boolean;
  disabled?: boolean;
  align?: "start" | "end";
  className?: string;
}

/**
 * "hx-opus ▂▄▆ 高 ⌄": 模型名常色, 强度是 EffortBadge (每档不同样式, 一眼看出高低), 一个下拉 (Codex App 的触发器). 菜单是卡片式 (DSH 的 Model / Effort 两行):
 * "模型 …… 当前模型 ›" 子菜单 (按客户端分组), 下面推理强度的渐变档位条 (只走当前模型声明的档).
 * 模型不能调推理时没有档位条, 触发器只写模型名.
 */
export function ComposerModelMenu({ clients, value, onValueChange, sheet, hotkeys = true, disabled, align = "end", className }: ComposerModelMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState<"main" | "models">("main");
  const { client, model } = findModel(clients, value.client, value.model);
  const levels = React.useMemo(() => EFFORT_ORDER.filter((e) => effortsOf(model).includes(e)), [model]);
  const latest = React.useRef({ levels, value, onValueChange, disabled });
  latest.current = { levels, value, onValueChange, disabled };
  const setEffort = (effort: ReasoningEffort) => effort !== value.effort && onValueChange({ ...value, effort });
  const setModel = (c: AgentClientOption, m: AgentClientOption["models"][number]) => {
    if (c.unavailable || m.disabled) return;
    const next = resolveModelSelection(clients, { client: c.id, model: m.id, effort: value.effort });
    if (next) onValueChange(next);
  };

  React.useEffect(() => {
    if (!hotkeys) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || (e.code !== "Comma" && e.code !== "Period")) return;
      const cur = latest.current;
      if (!cur.levels.length || cur.disabled) return;
      e.preventDefault();
      const next = stepEffort(cur.levels, cur.value.effort as ReasoningEffort | undefined, e.code === "Period" ? 1 : -1);
      if (next && next !== cur.value.effort) cur.onValueChange({ ...cur.value, effort: next });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkeys]);

  const effort = value.effort && levels.includes(value.effort as ReasoningEffort) ? (value.effort as ReasoningEffort) : undefined;
  const label = (
    <>
      <span className="min-w-0 truncate text-foreground">{model ? modelName(model) : "选择模型"}</span>
      {/* 档名按档位区分: 关闭 / 低 淡, 中 正常, 高 品牌色, 最高 渐变字 + 光晕, 前面是同一套小柱图标 */}
      {effort && <EffortBadge effort={effort} />}
      <ChevronDown aria-hidden className="text-muted-foreground" />
    </>
  );
  const aria = `模型与推理强度: ${model ? modelName(model) : "未选"}${effort ? ` ${EFFORT_LABEL[effort]}` : ""}`;

  const modelList = (onPick: () => void) =>
    clients.map((c) => (
      <div key={c.id} role="group" aria-label={c.name} className="border-t py-1 first:border-t-0">
        <p className="flex items-center gap-1.5 px-4 pt-1.5 pb-0.5 text-xs text-muted-foreground [&_svg]:size-3.5">
          {c.icon}
          {c.name}
          {c.unavailable && <span>· {c.unavailable}</span>}
        </p>
        {c.models.map((m) => (
          <SheetRow key={m.id} selected={c.id === value.client && m.id === value.model} disabled={!!c.unavailable || m.disabled} hint={m.description} onClick={() => (setModel(c, m), onPick())}>
            {modelName(m)}
          </SheetRow>
        ))}
      </div>
    ));

  if (sheet) {
    return (
      <>
        <button type="button" data-slot="composer-model" disabled={disabled} aria-label={aria} aria-haspopup="dialog" onClick={() => (setPage("main"), setOpen(true))} className={cn(COMPOSER_CHIP, "gap-1.5 text-sm", className)}>
          {label}
        </button>
        <ComposerSheet open={open} onOpenChange={setOpen} title={page === "models" ? "选择模型" : "模型与推理"}>
          {page === "models" ? (
            <div data-slot="composer-model-list">
              <button type="button" onClick={() => setPage("main")} className="flex h-10 w-full items-center gap-1 px-3 text-sm text-muted-foreground active:bg-accent">
                <ChevronLeft className="size-4" />
                返回
              </button>
              {modelList(() => setPage("main"))}
            </div>
          ) : (
            <div className="px-4 pb-3">
              {/* 一张卡片: "模型 …… hx-opus ›" 进模型列表, 下面是推理强度的渐变档位条 (DSH Go 的模型弹层) */}
              <div data-slot="composer-model-card" className="rounded-2xl border bg-card px-4 pt-1 pb-3 shadow-xs">
                <button type="button" data-slot="composer-model-row" onClick={() => setPage("models")} className="-mx-4 flex h-12 w-[calc(100%+2rem)] min-w-0 items-center gap-2 px-4 text-left text-[15px] active:bg-accent">
                  <span className="shrink-0 text-foreground">模型</span>
                  <span className="ml-auto flex min-w-0 items-center gap-1.5 text-muted-foreground [&_svg]:size-4">
                    {client?.icon}
                    <span className="min-w-0 truncate">{model ? modelName(model) : "选择模型"}</span>
                  </span>
                  <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                </button>
                {levels.length > 0 ? (
                  <EffortTrack levels={levels} value={effort} onValueChange={setEffort} size="lg" className="pt-1" />
                ) : (
                  <p className="pt-1 text-[13px] text-muted-foreground">这个模型不能调推理</p>
                )}
              </div>
            </div>
          )}
        </ComposerSheet>
      </>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button type="button" data-slot="composer-model" aria-label={aria} className={cn(COMPOSER_CHIP, "gap-1.5", className)}>
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align={align} sideOffset={6} collisionPadding={12} data-slot="composer-model-card" className="w-72 rounded-xl p-1.5">
        {/* 卡片式: 第一行 "模型 …… hx-opus ›" 是子菜单, 下面是推理强度的渐变档位条 (替换原来顶层的档位文字列表) */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger data-slot="composer-model-row" className="h-9 rounded-lg px-2.5 text-[13px] [&>svg:last-child]:size-3.5">
            <span className="shrink-0 text-foreground">模型</span>
            <span className="ml-auto flex min-w-0 items-center gap-1.5 text-muted-foreground [&_svg]:size-3.5">
              {client?.icon}
              <span className="min-w-0 truncate">{model ? modelName(model) : "选择模型"}</span>
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent sideOffset={6} collisionPadding={12} className="max-h-[min(26rem,70vh)] w-64 overflow-y-auto rounded-xl p-1 scrollbar-thin">
            {clients.map((c, i) => (
              <React.Fragment key={c.id}>
                {i > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="flex items-center gap-1.5 px-2 pt-1 pb-0.5 text-xs font-normal text-muted-foreground [&_svg]:size-3.5">
                  {c.icon}
                  {c.name}
                  {c.unavailable && <span className="ml-auto">{c.unavailable}</span>}
                </DropdownMenuLabel>
                {c.models.map((m) => {
                  const on = c.id === value.client && m.id === value.model;
                  return (
                    <DropdownMenuItem key={m.id} role="menuitemradio" aria-checked={on} disabled={!!c.unavailable || m.disabled} onSelect={() => setModel(c, m)} className="min-h-8 items-start rounded-lg px-2 py-1.5 text-[13px]">
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate">{modelName(m)}</span>
                        {m.description && <span className="truncate text-[11px] text-muted-foreground">{m.description}</span>}
                      </span>
                      {on && <Check className="mt-0.5 size-3.5 text-foreground" />}
                    </DropdownMenuItem>
                  );
                })}
              </React.Fragment>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {levels.length > 0 ? (
          // 滑块本身是菜单里的一项 (上下键能走到它), role 换成 slider; 选中事件留住菜单, 左右键在滑块里换档
          <DropdownMenuPrimitive.Item asChild onSelect={(e) => e.preventDefault()} textValue="推理强度">
            <EffortTrack levels={levels} value={effort} onValueChange={setEffort} className="mt-0.5 rounded-lg px-2.5 pt-2 pb-1.5 data-[highlighted]:bg-accent/40" />
          </DropdownMenuPrimitive.Item>
        ) : (
          <DropdownMenuLabel className="px-2.5 py-1.5 text-xs font-normal text-muted-foreground">这个模型不能调推理</DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <p className="px-2.5 pt-0.5 pb-1 text-[11px] text-muted-foreground">← → 换档 · Alt+, / Alt+. 降 / 升推理</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------------- 权限 / 运行位置 ---------------- */

export interface ComposerOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface ComposerSelectProps<T extends string = string> {
  options: readonly ComposerOption<T>[];
  value: T;
  onValueChange: (v: T) => void;
  /** 读屏与弹层标题 ("权限") */
  label: string;
  /** 手机: 底部弹层 */
  sheet?: boolean;
  /** 只画图标 (窄处) */
  iconOnly?: boolean;
  side?: "top" | "bottom";
  align?: "start" | "end";
  disabled?: boolean;
  className?: string;
}

/** "⚙ 请求批准 ⌄" / "🖥 本地 ⌄": 输入框里的权限与输入框下方的运行位置 (Codex), 选项带一句说明 */
export function ComposerSelect<T extends string = string>({ options, value, onValueChange, label, sheet, iconOnly, side = "top", align = "start", disabled, className }: ComposerSelectProps<T>) {
  const [open, setOpen] = React.useState(false);
  const cur = options.find((o) => o.value === value) ?? options[0];
  const trigger = (
    <>
      {cur?.icon}
      <span className={cn("min-w-0 truncate", iconOnly && "sr-only")}>{cur?.label}</span>
      {!iconOnly && <ChevronDown aria-hidden className="size-3! opacity-70" />}
    </>
  );
  if (sheet) {
    return (
      <>
        <button type="button" data-slot="composer-select" aria-label={`${label}: ${cur?.label ?? ""}`} aria-haspopup="dialog" disabled={disabled} onClick={() => setOpen(true)} className={cn(COMPOSER_CHIP, className)}>
          {trigger}
        </button>
        <ComposerSheet open={open} onOpenChange={setOpen} title={label}>
          {options.map((o) => (
            <SheetRow key={o.value} selected={o.value === value} hint={o.description} onClick={() => (onValueChange(o.value), setOpen(false))}>
              <span className="inline-flex items-center gap-2 [&_svg]:size-4 [&_svg]:text-muted-foreground">
                {o.icon}
                {o.label}
              </span>
            </SheetRow>
          ))}
        </ComposerSheet>
      </>
    );
  }
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button type="button" data-slot="composer-select" aria-label={`${label}: ${cur?.label ?? ""}`} className={cn(COMPOSER_CHIP, className)}>
          {trigger}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} sideOffset={6} collisionPadding={12} className="w-64 rounded-xl p-1">
        <DropdownMenuLabel className="px-2 pt-1 pb-0.5 text-xs font-normal text-muted-foreground">{label}</DropdownMenuLabel>
        {options.map((o) => (
          <DropdownMenuItem key={o.value} role="menuitemradio" aria-checked={o.value === value} onSelect={() => onValueChange(o.value)} className="min-h-8 items-start rounded-lg px-2 py-1.5 text-[13px] [&_svg]:mt-0.5">
            {o.icon}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate">{o.label}</span>
              {o.description && <span className="text-[11px] leading-snug text-muted-foreground">{o.description}</span>}
            </span>
            {o.value === value && <Check className="size-3.5 text-foreground" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------------- 生成中的活动条 ---------------- */

export interface ComposerActivityProps {
  /** 本轮开始时刻 (ms) */
  startedAt?: number;
  /** 此刻在做什么 ("运行 npm test" / "思考") */
  activity?: React.ReactNode;
  /** 右侧小字 (速率 "82 tok/s · 3 路", 进度 "3/9") */
  meta?: React.ReactNode;
  /** 点一下 (打开轨迹) */
  onOpen?: () => void;
  /** 显示 "esc 中断" 提示 (有键盘的宽屏) */
  escHint?: boolean;
  className?: string;
}

/**
 * 输入框正上方的一条 (只在生成中出现): "• 工作中 (12 秒 · esc 中断)  运行 npm test   82 tok/s".
 * 文案取 Codex TUI 的 status indicator ("• Working (0s • esc to interrupt)"); 位置与 "点开看轨迹" 取 DSH Go 的活动条.
 */
export function ComposerActivity({ startedAt, activity, meta, onOpen, escHint = true, className }: ComposerActivityProps) {
  const ms = useElapsed(startedAt, undefined, startedAt != null);
  const secs = startedAt != null ? formatDuration(Math.max(0, ms)) : undefined;
  const body = (
    <>
      <span aria-hidden className="relative inline-flex size-1.5 shrink-0">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand" />
        <span className="relative size-1.5 rounded-full bg-brand" />
      </span>
      <span className="hx-shimmer-text shrink-0 font-medium text-foreground">工作中</span>
      <span className="shrink-0 text-muted-foreground tabular">
        ({[secs, escHint ? "esc 中断" : null].filter(Boolean).join(" · ")})
      </span>
      {activity && <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-muted-foreground">{activity}</span>}
      {meta && <span className="ml-auto shrink-0 text-muted-foreground tabular">{meta}</span>}
      {onOpen && <ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />}
    </>
  );
  const cls = cn("flex h-8 w-full min-w-0 items-center gap-2 px-3 text-[13px] leading-none", className);
  return onOpen ? (
    <button type="button" data-slot="composer-activity" aria-live="off" onClick={onOpen} className={cn(cls, "rounded-full text-left transition-colors duration-150 hover:bg-accent/60 active:bg-accent")}>
      {body}
    </button>
  ) : (
    <div data-slot="composer-activity" className={cls}>
      {body}
    </div>
  );
}
