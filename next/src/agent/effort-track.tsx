"use client";
/**
 * 推理强度的渐变档位条 (模型菜单 / 模型弹层里的 "推理强度" 一节):
 *   推理强度 …………………… 最高
 *   (•────•────•────◯)   粗圆角胶囊轨道, 渐变 淡蓝紫 → 蓝 → 紫, 每档一个小白点, 白色圆形滑块停在当前档
 *    低   中   高   最高  当前档名用强调色
 * "强度跟档位走: 越高越亮、越鲜艳、越快": 轨道的 saturate / brightness / opacity 随档位升高, 轨道上的流光 (transform 平移) 越高越快;
 * 减弱动效时流光停掉, 滑块直接到位.
 * 交互: 点轨道 / 档名跳到最近一档, 拖动时滑块跟手、松开吸附, ← → ↑ ↓ PageUp PageDown Home End (WAI-ARIA slider).
 * 档位只来自当前模型声明的档 (model/models.ts 的 effortsOf); 几何与强度的纯逻辑在 models.ts (effortIndexAt / effortIntensity / effortKey).
 * 可以作为 Radix 菜单项的 asChild 子元素 (role 换成 slider, 选中事件由调用方 preventDefault 留住菜单).
 * 档名 (下方一排, 标题行右边) 与触发器上的 "最高" 都是 EffortBadge: 每档自己的颜色 / 字重 / 小柱图标 (models.ts 的 effortLook),
 * 关闭 / 低 淡, 中 正常, 高 品牌色, 最高 渐变字 + 光晕.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { EFFORT_GLYPH_BARS, EFFORT_HINT, EFFORT_LABEL, EFFORT_ORDER, effortFractionAt, effortIndexAt, effortIntensity, effortKey, effortLook, nearestEffort, type ReasoningEffort } from "./model/models";
import "./agent.css";

/** 两种尺寸: md 用在桌面菜单, lg 用在手机弹层 (手指好拖) */
const SIZE = {
  md: { thumb: 26, track: 18, label: "text-xs", head: "text-[13px]" },
  lg: { thumb: 34, track: 26, label: "text-[13px]", head: "text-[15px]" },
} as const;

/* ---------------- 档位徽标: 小柱图标 + 档名, 每档一种样子 ---------------- */

/** 小柱图标: 柱高 (px) 由低到高, 2px 宽 1px 圆角, 填到该档的柱数 */
const GLYPH_H = [5, 7, 9, 11] as const;
/** 减弱动效 (站点设置或系统): 光晕停在中间亮度 */
const GLOW_STILL: React.CSSProperties = { animation: "none", opacity: 0.55 };

/** 档位小图标 (4 根柱, 像信号格): 填的柱用该档的颜色, 最高档是渐变, 没填的是淡灰 */
export function EffortGlyph({ effort, className }: { effort: ReasoningEffort; className?: string }) {
  const look = effortLook(effort);
  return (
    <span aria-hidden data-slot="effort-glyph" data-effort-tone={look.tone} className={cn("inline-flex h-[11px] shrink-0 items-end gap-px", className)}>
      {Array.from({ length: EFFORT_GLYPH_BARS }, (_, i) => (
        <span key={i} data-on={i < look.bars || undefined} className="hx-effort-bar w-0.5 rounded-[1px]" style={{ height: GLYPH_H[i] ?? GLYPH_H[GLYPH_H.length - 1] }} />
      ))}
    </span>
  );
}

export interface EffortBadgeProps extends Omit<React.ComponentPropsWithoutRef<"span">, "children"> {
  effort: ReasoningEffort;
  /** 画小柱图标 (默认画) */
  glyph?: boolean;
  /** 最高档的光晕: 默认跟档位走 (只有 "最高" 有), false 关掉 (例如没选中的档名) */
  glow?: boolean;
}

/**
 * 档位徽标 "▂▄▆█ 最高": 触发器 ("hx-opus 最高 ⌄"), 档位条的档名与标题行都用它.
 * 颜色只用语义 token: 关闭 淡 (70% 的弱前景) / 低 弱前景 / 中 前景 / 高 品牌色 + 中等字重 / 最高 渐变字 + 粗一档 + 光晕 (只动 opacity, 减弱动效时静态).
 * 黑白主题下品牌色等于前景色, 靠柱数与字重仍能分出高低.
 */
export function EffortBadge({ effort, glyph = true, glow, className, style, ...rest }: EffortBadgeProps) {
  const look = effortLook(effort);
  const halo = glow ?? look.glow;
  const reduced = useReducedMotion();
  return (
    <span
      {...rest}
      data-slot="effort-badge"
      data-effort={effort}
      data-effort-tone={look.tone}
      className={cn("hx-effort-badge relative inline-flex min-w-0 shrink-0 items-center gap-1", className)}
      style={{ fontWeight: look.weight, ...style }}
    >
      {halo && <span aria-hidden className="hx-effort-glow" style={reduced ? GLOW_STILL : undefined} />}
      {glyph && <EffortGlyph effort={effort} className="relative" />}
      <span className="hx-effort-word relative whitespace-nowrap">{EFFORT_LABEL[effort]}</span>
    </span>
  );
}

export interface EffortTrackProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange" | "defaultValue" | "children"> {
  /** 当前模型支持的档位 (任意顺序, 内部按由低到高排) */
  levels: readonly ReasoningEffort[];
  value: ReasoningEffort | undefined;
  onValueChange: (v: ReasoningEffort) => void;
  /** 标题与读屏名, 默认 "推理强度" */
  label?: string;
  /** 标题行 ("推理强度 …… 高"), 默认显示 */
  header?: boolean;
  /** 轨道下方一行当前档的说明 (EFFORT_HINT), 默认显示 */
  hint?: boolean;
  size?: keyof typeof SIZE;
  disabled?: boolean;
}

/**
 * 渐变档位条. 只有一档时只画标题行 (没得选), 没有档位时什么都不画.
 */
export const EffortTrack = React.forwardRef<HTMLDivElement, EffortTrackProps>(function EffortTrack(
  { levels: raw, value, onValueChange, label = "推理强度", header = true, hint = true, size = "md", disabled, className, style, onKeyDown, ...rest },
  ref,
) {
  const levels = React.useMemo(() => EFFORT_ORDER.filter((e) => raw.includes(e)), [raw]);
  const reduced = useReducedMotion();
  const dim = SIZE[size];
  const cur = nearestEffort(levels, value);
  const index = cur ? levels.indexOf(cur) : 0;
  const n = levels.length;
  const rail = React.useRef<HTMLDivElement>(null);
  const [drag, setDrag] = React.useState<number | null>(null);
  const latest = React.useRef({ levels, cur, onValueChange });
  latest.current = { levels, cur, onValueChange };
  if (!n) return null;

  const pick = (i: number) => {
    const next = latest.current.levels[i];
    if (next && next !== latest.current.cur) latest.current.onValueChange(next);
  };
  const at = (clientX: number) => {
    const el = rail.current;
    if (!el) return null;
    const box = el.getBoundingClientRect();
    const x = clientX - box.left;
    return { i: effortIndexAt(x, box.width, dim.thumb / 2, n), f: effortFractionAt(x, box.width, dim.thumb / 2) };
  };
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || n < 2 || e.button !== 0) return;
    const hit = at(e.clientX);
    if (!hit) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    (e.currentTarget.closest("[role=slider]") as HTMLElement | null)?.focus({ preventScroll: true });
    setDrag(hit.f);
    pick(hit.i);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag == null) return;
    const hit = at(e.clientX);
    if (!hit) return;
    setDrag(hit.f);
    pick(hit.i);
  };
  const endDrag = () => setDrag(null);

  const level = effortIntensity(index, n);
  const frac = drag ?? (n > 1 ? index / (n - 1) : 1);
  const name = cur ? EFFORT_LABEL[cur] : "—";
  const inset = dim.thumb / 2;
  return (
    <div
      ref={ref}
      {...rest}
      role="slider"
      tabIndex={rest.tabIndex ?? (disabled ? -1 : 0)}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.max(0, n - 1)}
      aria-valuenow={index}
      aria-valuetext={name}
      aria-orientation="horizontal"
      aria-disabled={disabled || undefined}
      data-slot="effort-track"
      data-level={cur}
      data-dragging={drag != null || undefined}
      onKeyDown={(e) => {
        if (!disabled && !e.altKey && !e.ctrlKey && !e.metaKey) {
          const next = effortKey(levels, cur, e.key);
          const known = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.key);
          if (known) {
            // 到头也吃掉这个键, 不让外层菜单把焦点挪走
            e.preventDefault();
            e.stopPropagation();
            if (next) onValueChange(next);
          }
        }
        onKeyDown?.(e);
      }}
      className={cn("block min-w-0 select-none outline-none focus-visible:outline-2 focus-visible:outline-ring aria-disabled:opacity-50", className)}
      style={style}
    >
      {header && (
        <div className={cn("flex min-w-0 items-baseline gap-3 pb-1.5", dim.head)}>
          <span className="min-w-0 flex-1 truncate text-foreground">{label}</span>
          {cur ? <EffortBadge effort={cur} className="shrink-0" /> : <span className="shrink-0 text-muted-foreground">{name}</span>}
        </div>
      )}
      {n > 1 && (
        <>
          <div
            ref={rail}
            data-slot="effort-track-rail"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            className={cn("relative touch-none", disabled ? "cursor-not-allowed" : "cursor-pointer")}
            style={{ height: dim.thumb }}
          >
            {/* 轨道: 渐变 + 流光, 档位越高越亮越鲜艳 (filter / opacity), 流光越快 */}
            <span aria-hidden className="absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-muted" style={{ height: dim.track }}>
              <span
                className="hx-effort-fill absolute inset-0 rounded-full transition-[filter,opacity] duration-300 ease-out"
                style={{ filter: `saturate(${level.saturate}) brightness(${level.brightness})`, opacity: level.opacity }}
              />
              {!reduced && <span className="hx-effort-sheen" style={{ animationDuration: `${level.sheenMs}ms`, opacity: 0.35 + 0.45 * level.t }} />}
            </span>
            {/* 刻度与滑块都在留出滑块半径的内轨上 */}
            <span aria-hidden className="pointer-events-none absolute inset-y-0" style={{ left: inset, right: inset }}>
              {levels.map((e, i) => (
                <span
                  key={e}
                  className={cn("hx-effort-tick absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-200", i === index ? "opacity-0" : "opacity-80")}
                  style={{ left: `${(i / (n - 1)) * 100}%` }}
                />
              ))}
              {/* 移动层与内轨同宽, translateX 的百分比就是进度; 滑块挂在它的左边缘 */}
              <span className={cn("absolute inset-0", drag == null && "transition-transform duration-200 ease-out motion-reduce:transition-none")} style={{ transform: `translateX(${frac * 100}%)` }}>
                <span
                  data-slot="effort-track-thumb"
                  className="hx-effort-knob absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-soft"
                  style={{ width: dim.thumb, height: dim.thumb }}
                />
              </span>
            </span>
          </div>
          <div aria-hidden className={cn("relative mt-1 h-6", dim.label)} style={{ marginInline: inset }}>
            {levels.map((e, i) => (
              <button
                key={e}
                type="button"
                tabIndex={-1}
                disabled={disabled}
                onClick={() => pick(i)}
                data-current={i === index || undefined}
                className={cn(
                  // 每档自己的颜色 / 字重 / 柱数; 当前档再加一层底色, 没选中的压低一点, 悬停复原
                  "absolute top-0 inline-flex h-6 items-center rounded-full px-1.5 whitespace-nowrap transition-[background-color,opacity] duration-150",
                  // 两端的档名贴边对齐 (带图标的档名比滑块半径宽, 居中会出界), 中间的居中在刻度下
                  i > 0 && i < n - 1 && "-translate-x-1/2",
                  i === index ? "bg-accent" : "opacity-60 hover:opacity-100",
                )}
                style={i === 0 ? { left: -inset } : i === n - 1 ? { right: -inset } : { left: `${(i / (n - 1)) * 100}%` }}
              >
                <EffortBadge effort={e} glow={i === index ? undefined : false} />
              </button>
            ))}
          </div>
        </>
      )}
      {hint && cur && EFFORT_HINT[cur] && <p className="truncate pt-1 text-[11px] text-muted-foreground">{EFFORT_HINT[cur]}</p>}
    </div>
  );
});
