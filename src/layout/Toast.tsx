import { createContext, useContext, useEffect, useMemo, useState, type JSX } from "react";
import { AnimatePresence, motion, type TargetAndTransition } from "motion/react";
import { cn } from "../primitives/utils";

/**
 * 消息提醒（toast）。
 *
 * 视觉对标 open-vetta 的 ToasterView（同一套设计语言）:
 *   右下角固定 340px 宽的堆叠、rounded-xl 边框、每种语义用**内环色**区分、
 *   进场 y:16→0 淡入、退场向右滑出。这些数值是上游调过的, 沿用。
 *
 * 上游没做的两件事, 这里补上:
 *   1. position —— 除右下角外还支持顶部居中 (那种"操作成功"的短提示常用顶部)。
 *   2. maxVisible —— 堆叠上限。上游不限制, 连续报错时会铺满半个屏幕。
 *
 * 状态管理不走 jotai (那是上游的宿主选择)。这里用一个模块级 store + 订阅:
 *   - showToast 可以在任何地方直接调, 不需要 React context (事件回调、请求失败分支)
 *   - 组件通过 useSyncExternalStore 订阅, 因此不会因为 store 在组件外面而失效
 * 这样做的好处是与宿主的状态库解耦 —— 换 redux / zustand / jotai 都不用改这个文件。
 */

export type ToastVariant = "info" | "success" | "warning" | "error";
export type ToastPosition = "bottom-right" | "top-center";

export interface ToastAction {
  readonly label: string;
  readonly onClick: () => void;
}

export interface ToastItem {
  readonly id: string;
  readonly variant: ToastVariant;
  /** 可选标题, 渲染在正文上方。 */
  readonly title?: string;
  readonly message: string;
  /** 自动消失的毫秒数。0 表示不自动消失, 只能手动关。 */
  readonly durationMs: number;
  /** 可选的操作按钮 (例如「前往设置」)。 */
  readonly action?: ToastAction;
}

export interface ShowToastInput {
  readonly variant?: ToastVariant;
  readonly title?: string;
  readonly message: string;
  readonly durationMs?: number;
  readonly action?: ToastAction;
}

/**
 * 默认停留 4000ms。
 * 2000 太短 —— 一行以上的正文读不完; 8000 太长 —— 用户会去找关闭按钮。
 * 有 action 的提醒会自动延长 (见 showToast), 因为要留时间让人点。
 */
const DEFAULT_DURATION_MS = 4000;
/** 带操作按钮时的默认停留。操作需要时间, 4 秒不够读题目再决定。 */
const ACTION_DURATION_MS = 8000;

/* ── 模块级 store ──────────────────────────────────────────────────────────
 * 放在模块作用域而不是 React context 的原因: showToast 的调用点常常在组件树之外
 * (请求失败的 catch 分支、定时回调、非 React 的工具函数)。要求那些地方也拿到
 * context 会把简单的调用变成"先传一个 dispatch 下来"。
 *
 * 代价是同一页面上不能开两个独立的 Toaster 栈 —— 对消息提醒来说这是可接受的,
 * 它本来就是一个全局通道。
 */
let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function emit(): void {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot(): ToastItem[] {
  return toasts;
}

/** 生成 id。优先用 crypto.randomUUID, 老环境退回时间戳加随机数。 */
function makeId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

/**
 * 弹出一条提醒。可在任何地方直接调用, 不依赖 React context。
 * 返回该条的 id, 调用方可以拿它提前关闭 (例如请求成功后关掉"上传中")。
 */
export function showToast(input: ShowToastInput): string {
  const id = makeId();
  const hasAction = Boolean(input.action);
  const durationMs = input.durationMs ?? (hasAction ? ACTION_DURATION_MS : DEFAULT_DURATION_MS);
  const item: ToastItem = {
    id,
    variant: input.variant ?? "info",
    title: input.title,
    message: input.message,
    durationMs,
    action: input.action,
  };
  toasts = [...toasts, item];
  emit();
  if (durationMs > 0) {
    timers.set(id, setTimeout(() => dismissToast(id), durationMs));
  }
  return id;
}

export function dismissToast(id: string): void {
  const t = timers.get(id);
  if (t) { clearTimeout(t); timers.delete(id); }
  toasts = toasts.filter((x) => x.id !== id);
  emit();
}

/** 清空全部。用在路由切换这类"上一页的提醒不该跟着过来"的场合。 */
export function dismissAllToasts(): void {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
  toasts = [];
  emit();
}

/** 四种语义的快捷方法。比记 variant 字符串省事, 也是文档里推荐的首选写法。 */
export const toast = {
  info: (message: string, opts?: Omit<ShowToastInput, "variant" | "message">) =>
    showToast({ ...opts, variant: "info", message }),
  success: (message: string, opts?: Omit<ShowToastInput, "variant" | "message">) =>
    showToast({ ...opts, variant: "success", message }),
  warning: (message: string, opts?: Omit<ShowToastInput, "variant" | "message">) =>
    showToast({ ...opts, variant: "warning", message }),
  error: (message: string, opts?: Omit<ShowToastInput, "variant" | "message">) =>
    showToast({ ...opts, variant: "error", message }),
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
};

/**
 * 每种语义的样式。对标上游: 用**内环**区分而不是换整个底色 ——
 * 换底色会让提醒在最需要被看清的时候变成一个彩色方块, 反而压过正文。
 * 环色取语义色, 图标跟着同色, 正文保持中性。
 */
const VARIANT_STYLES: Record<ToastVariant, { ring: string; icon: string; iconColor: string }> = {
  info: { ring: "ring-border", icon: "icon-[solar--info-circle-linear]", iconColor: "text-foreground/70" },
  success: { ring: "ring-emerald-500/30", icon: "icon-[solar--check-circle-linear]", iconColor: "text-emerald-500" },
  warning: { ring: "ring-amber-500/30", icon: "icon-[solar--danger-triangle-linear]", iconColor: "text-amber-500" },
  error: { ring: "ring-destructive/40", icon: "icon-[solar--close-circle-linear]", iconColor: "text-destructive" },
};

/** 位置对应的容器类。数值对标上游的 bottom-4 right-4。 */
const POSITION_CLASS: Record<ToastPosition, string> = {
  "bottom-right": "fixed bottom-4 right-4 w-[340px] flex-col justify-end",
  "top-center": "fixed top-4 left-1/2 -translate-x-1/2 w-[min(420px,calc(100vw-2rem))] flex-col",
};

/** 进场与退场的位移方向按位置分开 —— 从下方来就该回下方去。 */
const POSITION_MOTION: Record<
  ToastPosition,
  { initial: TargetAndTransition; exit: TargetAndTransition }
> = {
  "bottom-right": {
    initial: { opacity: 0, y: 16, scale: 0.96 },
    exit: { opacity: 0, x: 24, scale: 0.96 },
  },
  "top-center": {
    initial: { opacity: 0, y: -16, scale: 0.96 },
    exit: { opacity: 0, y: -12, scale: 0.96 },
  },
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }): JSX.Element {
  const style = VARIANT_STYLES[item.variant];
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-2.5 rounded-xl border border-border bg-popover px-3.5 py-3 shadow-xl ring-1 ring-inset",
        style.ring,
      )}
    >
      <span className={cn(style.icon, "mt-0.5 size-4 shrink-0", style.iconColor)} aria-hidden />
      <div className="min-w-0 flex-1">
        {item.title ? <div className="text-[13px] font-medium text-foreground">{item.title}</div> : null}
        <div className="break-words text-[12px] leading-[1.5] text-muted-foreground">{item.message}</div>
        {item.action ? (
          <button
            type="button"
            onClick={() => { item.action?.onClick(); onDismiss(item.id); }}
            className="mt-1.5 text-[12px] font-medium text-primary transition-colors hover:text-primary/80"
          >
            {item.action.label}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="关闭"
        className="shrink-0 text-muted-foreground/60 transition-colors hover:text-foreground"
      >
        <span className="icon-[solar--close-circle-linear] size-3.5" />
      </button>
    </div>
  );
}

export interface ToastViewportProps {
  /** 弹出位置。默认右下角。 */
  position?: ToastPosition;
  /**
   * 最多同时显示几条。默认 3 —— 再多会盖住页面内容。
   * 超出时从最旧的一条开始丢 (最新的最可能是用户刚触发的, 更该被看到)。
   * 传 0 表示不限制。
   */
  maxVisible?: number;
}

/**
 * 提醒的容器。**整个应用挂一个就够了** —— 挂在根布局里, 而不是每个页面各挂一个,
 * 否则切页时正在显示的提醒会跟着页面的卸载一起消失。
 */
export function Toaster({ position = "bottom-right", maxVisible = 3 }: ToastViewportProps): JSX.Element {
  const [all, setAll] = useState<ToastItem[]>(getSnapshot);

  useEffect(() => subscribe(() => setAll(getSnapshot())), []);

  const visible = useMemo(() => {
    if (maxVisible <= 0 || all.length <= maxVisible) return all;
    // 保留最新的 maxVisible 条
    return all.slice(all.length - maxVisible);
  }, [all, maxVisible]);

  const motionCfg = POSITION_MOTION[position];

  return (
    <div
      className={cn("pointer-events-none z-[200] flex gap-2", POSITION_CLASS[position])}
      // 无障碍: 提醒是 live region, 屏幕阅读器会在内容更新时朗读
      role="region"
      aria-live="polite"
      aria-label="消息提醒"
    >
      <AnimatePresence initial={false}>
        {visible.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={motionCfg.initial}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={motionCfg.exit}
            transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <ToastCard item={item} onDismiss={dismissToast} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ── 命令式的辅助 hook ────────────────────────────────────────────────────
 * 让组件里可以 `const t = useToast(); t.success("已保存")`, 语义比裸调 showToast 清楚。
 * 它只是把模块级函数包一层, 没有自己的状态 —— 因此不会因为用到它就多一次渲染。
 */
export function useToast(): typeof toast {
  return toast;
}

/** 只取消订阅用的 context 占位。保留导出是为了将来支持"局部 Toaster"时不必改签名。 */
export const ToastContext = createContext<null>(null);
export function useToastContext(): null { return useContext(ToastContext); }

/** 手动触发一次订阅清理。测试里用来避免跨用例的 store 残留。 */
export function __resetToastsForTest(): void {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
  toasts = [];
  // 不 emit —— 调用方通常是测试, 没有订阅者
}
