"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type JSX,
  type ReactNode,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { cn } from "./utils";

/**
 * 确认对话框。
 *
 * 两种调用方式, 覆盖两类真实场景:
 *
 *   一、**命令式** `await confirmDialog({ title, message })` —— 用在事件回调里。
 *       删除、覆盖、清空这类高危操作往往发生在 async 分支的中间, 此时手边没有
 *       React 状态可用, 声明式写不进去。命令式返回 Promise<boolean>, 一行拿到答案。
 *       要求应用根部挂一次 <ConfirmDialogHost />。
 *
 *   二、**声明式** `<ConfirmDialog open title ... />` —— 用在已有状态的地方。
 *
 * 为什么必须有 `variant="danger"` 这一档而不是让使用方传红色按钮: 危险操作的按钮
 * 颜色如果由每个调用点自觉传, 迟早会出现"清空全部"配一个蓝色主按钮。把它做成
 * variant 后, 危险语义无法被漏掉。
 *
 * 关于确认词输入 (requireText): 真·不可逆的操作 (删除整个数据集) 用点一次按钮
 * 挡住是不够的, 人手快会直接点过去。要求输入确认词是唯一真正有效的摩擦。
 */

export interface ConfirmDialogOptions {
  readonly title: ReactNode;
  readonly message?: ReactNode;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly variant?: "default" | "danger";
  /** 要求用户输入这段文字才能确认 (不可逆操作用)。 */
  readonly requireText?: string;
  /** 额外提示, 显示在按钮上方。 */
  readonly hint?: ReactNode;
}

export interface ConfirmDialogProps extends ConfirmDialogOptions {
  readonly open: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  /** 关掉右上角的关闭按钮 (必须做出选择时用)。 */
  readonly dismissible?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
  requireText,
  hint,
  dismissible = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): JSX.Element {
  const [typed, setTyped] = useState("");
  // 每次打开都把输入清空: 上一次输过的确认词留着, 等于把摩擦白加了
  const wasOpen = useRef(false);
  if (open !== wasOpen.current) {
    wasOpen.current = open;
    if (open && typed) setTyped("");
  }

  const satisfied = !requireText || typed.trim() === requireText;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && dismissible) onCancel();
      }}
    >
      <DialogContent
        showCloseButton={dismissible}
        onEscapeKeyDown={(e) => {
          if (!dismissible) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (!dismissible) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle
            className={cn(variant === "danger" && "flex items-center gap-1.5 text-destructive")}
          >
            {variant === "danger" ? (
              <span aria-hidden className="icon-[solar--danger-triangle-linear] size-4 shrink-0 bg-current" />
            ) : null}
            {title}
          </DialogTitle>
          {message ? (
            <DialogDescription className="whitespace-pre-wrap break-words">
              {message}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {requireText ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-[length:var(--fs-xs-half)] text-muted-foreground">
              输入 <span className="font-mono font-medium text-foreground">{requireText}</span> 以继续
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              spellCheck={false}
              aria-label="确认词"
              className="h-8 w-full rounded-lg border border-border/60 bg-transparent px-2.5 font-mono text-[length:var(--fs-sm)] text-foreground outline-none transition-colors hover:border-border focus-visible:border-ring/60"
            />
          </div>
        ) : null}

        {hint ? <div className="text-[length:var(--fs-xs)] text-muted-foreground/80">{hint}</div> : null}

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel ?? "取消"}
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "primary"}
            disabled={!satisfied}
            onClick={onConfirm}
          >
            {confirmLabel ?? "确定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── 命令式入口 ────────────────────────────────────────────────────────────
 * 不用 React context 的原因与 Toast 相同: confirmDialog() 要能在任何地方调用
 * (事件回调、请求失败分支、非 React 代码), 而不能要求调用方先拿到 context。
 * 模块级 store + useSyncExternalStore 让宿主组件订阅它, 于是两者解耦。
 * ──────────────────────────────────────────────────────────────────────── */

interface PendingConfirm extends ConfirmDialogOptions {
  readonly id: number;
  resolve: (ok: boolean) => void;
}

let pending: PendingConfirm = { id: 0, title: "", resolve: () => {} };
let hasPending = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

/** 弹一个确认框, 返回用户的选择。需要根部挂 <ConfirmDialogHost />。 */
export function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  // 上一个还没答完就被新的顶掉时, 旧的那个按"取消"结算 —— 否则调用方的 await 永远悬着
  if (hasPending) pending.resolve(false);
  return new Promise<boolean>((resolve) => {
    pending = { ...options, id: pending.id + 1, resolve };
    hasPending = true;
    emit();
  });
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot(): number {
  return pending.id;
}

/** 命令式入口的宿主。整个应用挂一次即可 (通常放在 <App/> 最外层)。 */
export function ConfirmDialogHost(): JSX.Element | null {
  const subscribeStable = useMemo(() => subscribe, []);
  const id = useSyncExternalStore(subscribeStable, getSnapshot, () => 0);

  const settle = useCallback((ok: boolean) => {
    hasPending = false;
    const p = pending;
    emit();
    p.resolve(ok);
  }, []);

  if (!hasPending) return null;

  return (
    <ConfirmDialog
      key={id}
      open
      title={pending.title}
      message={pending.message}
      confirmLabel={pending.confirmLabel}
      cancelLabel={pending.cancelLabel}
      variant={pending.variant}
      requireText={pending.requireText}
      hint={pending.hint}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );
}

/** 需要读当前是否有确认框待答时用 (渲染遮罩、禁掉快捷键等)。 */
export const ConfirmContext = createContext(false);
export function useConfirmPending(): boolean {
  return useContext(ConfirmContext);
}