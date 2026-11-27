"use client";
/**
 * 输入框: 自适应高度, Enter 发送 / Shift+Enter 换行 (输入法组字时不发), 附件 (选择, 拖拽, 粘贴),
 * "/" 命令与 "@" 提及菜单 (上下键选, Enter / Tab 确认, Esc 关), 生成中按钮变成停止.
 */
import * as React from "react";
import { ArrowUp, Paperclip, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "./parts/format";
import { IconButton } from "./parts/copy";

export interface PromptSuggestion {
  /** 插入的文字 (命令名 / 文件路径) */
  value: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface PromptInputProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  onSubmit: (text: string, files: File[]) => void;
  /** 生成中: 发送按钮变停止 */
  busy?: boolean;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  /** 允许附件 (默认 true); accept 同 <input type=file> */
  attachments?: boolean;
  accept?: string;
  /** "/" 开头时的命令候选 */
  commands?: PromptSuggestion[];
  /** "@" 后的候选, 按当前查询返回 (可以异步) */
  mentions?: (query: string) => PromptSuggestion[] | Promise<PromptSuggestion[]>;
  /** 左下工具区 (模型选择, 模式切换 ...) */
  toolbar?: React.ReactNode;
  /** 右下, 发送按钮左边 (用量环 ...) */
  status?: React.ReactNode;
  /** 最大高度 (px, 默认 240) */
  maxHeight?: number;
  autoFocus?: boolean;
  className?: string;
}

type Trigger = { kind: "/" | "@"; start: number; query: string } | null;

function findTrigger(text: string, caret: number): Trigger {
  const before = text.slice(0, caret);
  const slash = before.match(/^\/([\w:-]*)$/);
  if (slash) return { kind: "/", start: 0, query: slash[1] };
  const at = before.match(/(^|\s)@([^\s@]*)$/);
  if (at) return { kind: "@", start: caret - at[2].length - 1, query: at[2] };
  return null;
}

export function PromptInput({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  busy = false,
  onStop,
  placeholder = "给 Agent 发消息…",
  disabled,
  attachments = true,
  accept,
  commands,
  mentions,
  toolbar,
  status,
  maxHeight = 240,
  autoFocus,
  className,
}: PromptInputProps) {
  const [inner, setInner] = React.useState(defaultValue);
  const value = valueProp ?? inner;
  const setValue = (v: string) => {
    if (valueProp === undefined) setInner(v);
    onValueChange?.(v);
  };
  const [files, setFiles] = React.useState<File[]>([]);
  const [drag, setDrag] = React.useState(false);
  const [trigger, setTrigger] = React.useState<Trigger>(null);
  const [items, setItems] = React.useState<PromptSuggestion[]>([]);
  const [active, setActive] = React.useState(0);
  const ta = React.useRef<HTMLTextAreaElement>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);
  const listId = React.useId();

  // 候选
  React.useEffect(() => {
    let alive = true;
    if (!trigger) return setItems([]);
    const q = trigger.query.toLowerCase();
    if (trigger.kind === "/") setItems((commands ?? []).filter((c) => c.value.toLowerCase().includes(q)).slice(0, 8));
    else if (mentions) void Promise.resolve(mentions(trigger.query)).then((r) => alive && setItems(r.slice(0, 8)));
    setActive(0);
    return () => {
      alive = false;
    };
  }, [trigger, commands, mentions]);

  // 自适应高度
  React.useLayoutEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  const addFiles = (list: FileList | File[] | null) => {
    if (!list || !attachments) return;
    const arr = Array.from(list);
    if (arr.length) setFiles((f) => [...f, ...arr]);
  };

  const submit = () => {
    if (busy || disabled) return;
    const text = value.trim();
    if (!text && !files.length) return;
    onSubmit(text, files);
    setValue("");
    setFiles([]);
    setTrigger(null);
  };

  const pick = (s: PromptSuggestion) => {
    if (!trigger) return;
    const caret = ta.current?.selectionStart ?? value.length;
    const insert = trigger.kind === "/" ? `/${s.value} ` : `@${s.value} `;
    const next = value.slice(0, trigger.start) + insert + value.slice(caret);
    setValue(next);
    setTrigger(null);
    requestAnimationFrame(() => {
      const pos = trigger.start + insert.length;
      ta.current?.setSelectionRange(pos, pos);
      ta.current?.focus();
    });
  };

  const menuOpen = trigger != null && items.length > 0;
  const canSend = !disabled && (value.trim() !== "" || files.length > 0);

  return (
    <div
      data-slot="prompt-input"
      data-drag={drag || undefined}
      onDragOver={(e) => {
        if (!attachments || !e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        if (!attachments) return;
        e.preventDefault();
        setDrag(false);
        addFiles(e.dataTransfer.files);
      }}
      className={cn("relative rounded-2xl border bg-card shadow-soft transition-[border-color,box-shadow] duration-150 focus-within:border-ring/60 data-[drag]:border-brand data-[drag]:ring-2 data-[drag]:ring-brand/20", className)}
    >
      {menuOpen && (
        <div id={listId} role="listbox" className="absolute inset-x-2 bottom-full z-20 mb-2 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-float animate-in fade-in-0 slide-in-from-bottom-1">
          {items.map((s, i) => (
            <div
              key={s.value}
              role="option"
              id={`${listId}-${i}`}
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setActive(i)}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] aria-selected:bg-accent"
            >
              {s.icon && <span className="text-muted-foreground [&_svg]:size-4">{s.icon}</span>}
              <span className="font-mono">{trigger?.kind}{s.label ?? s.value}</span>
              {s.description && <span className="truncate text-xs text-muted-foreground">{s.description}</span>}
            </div>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 pt-3">
          {files.map((f, i) => (
            <span key={i} className="inline-flex max-w-56 items-center gap-1.5 rounded-lg border bg-muted/50 py-1 pl-2.5 pr-1 text-xs">
              <Paperclip className="size-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{f.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatBytes(f.size)}</span>
              <IconButton label={`移除 ${f.name}`} className="size-5" onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}>
                <X />
              </IconButton>
            </span>
          ))}
        </div>
      )}
      <textarea
        ref={ta}
        value={value}
        rows={1}
        autoFocus={autoFocus}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? listId : undefined}
        aria-activedescendant={menuOpen ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          setValue(e.target.value);
          setTrigger(findTrigger(e.target.value, e.target.selectionStart));
        }}
        onSelect={(e) => setTrigger(findTrigger(e.currentTarget.value, e.currentTarget.selectionStart))}
        onPaste={(e) => {
          if (e.clipboardData.files.length) {
            e.preventDefault();
            addFiles(e.clipboardData.files);
          }
        }}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) return;
          if (menuOpen) {
            if (e.key === "ArrowDown") return (e.preventDefault(), setActive((a) => (a + 1) % items.length));
            if (e.key === "ArrowUp") return (e.preventDefault(), setActive((a) => (a - 1 + items.length) % items.length));
            if (e.key === "Enter" || e.key === "Tab") return (e.preventDefault(), pick(items[active]));
            if (e.key === "Escape") return (e.preventDefault(), setTrigger(null));
          }
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape" && busy && onStop) {
            e.preventDefault();
            onStop();
          }
        }}
        className="block w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[15px] leading-6 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed scrollbar-thin"
        style={{ maxHeight }}
      />
      <div className="flex items-center gap-1 px-2 pb-2">
        {attachments && (
          <>
            <IconButton label="添加附件" className="size-8 text-muted-foreground [&_svg]:size-4" onClick={() => fileInput.current?.click()} disabled={disabled}>
              <Paperclip />
            </IconButton>
            <input ref={fileInput} type="file" multiple accept={accept} hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))} />
          </>
        )}
        {toolbar}
        <div className="ml-auto flex items-center gap-2">
          {status}
          {busy ? (
            <button type="button" aria-label="停止" onClick={onStop} disabled={!onStop} className="grid size-8 place-items-center rounded-full bg-foreground text-background transition-transform duration-150 active:scale-95 disabled:opacity-40">
              <Square className="size-3 fill-current" />
            </button>
          ) : (
            <button type="button" aria-label="发送" onClick={submit} disabled={!canSend} className="grid size-8 place-items-center rounded-full bg-foreground text-background transition-[transform,opacity] duration-150 active:scale-95 disabled:opacity-30">
              <ArrowUp className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
