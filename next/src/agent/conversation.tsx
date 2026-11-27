"use client";
/**
 * 会话滚动容器: 贴底跟随 (内容长高时自动滚到底), 用户往上翻就停住, 右下出现 "回到最新".
 * 内容高度变化用 ResizeObserver 监听, 不依赖消息数组 (代码高亮, 图片加载, 折叠展开都算).
 */
import * as React from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** 离底部多少像素以内算 "在底部" */
export const STICK_THRESHOLD = 48;

export interface StickToBottom {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  atBottom: boolean;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

export function useStickToBottom(): StickToBottom {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = React.useState(true);
  const stick = React.useRef(true);
  const programmatic = React.useRef(false);

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    stick.current = true;
    setAtBottom(true);
    programmatic.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior });
    window.setTimeout(() => (programmatic.current = false), behavior === "smooth" ? 400 : 0);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    const onScroll = () => {
      const near = el.scrollHeight - el.scrollTop - el.clientHeight <= STICK_THRESHOLD;
      if (!programmatic.current) stick.current = near;
      setAtBottom(near);
    };
    // 用户主动往上滚 (滚轮 / 触摸 / 键盘) 时立刻松开, 不等 scroll 事件
    const release = (e: Event) => {
      if (e instanceof WheelEvent && e.deltaY >= 0) return;
      programmatic.current = false;
      stick.current = false;
    };
    const ro = new ResizeObserver(() => {
      if (stick.current) el.scrollTop = el.scrollHeight;
    });
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", release, { passive: true });
    el.addEventListener("touchmove", release, { passive: true });
    ro.observe(content);
    el.scrollTop = el.scrollHeight;
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", release);
      el.removeEventListener("touchmove", release);
      ro.disconnect();
    };
  }, []);

  return { scrollRef, contentRef, atBottom, scrollToBottom };
}

export interface ConversationProps extends React.ComponentProps<"div"> {
  /** 内容区的类名 (默认居中, 最大宽 48rem) */
  contentClassName?: string;
  /** 底部固定区 (输入框) */
  footer?: React.ReactNode;
}

export function Conversation({ children, className, contentClassName, footer, ...rest }: ConversationProps) {
  const { scrollRef, contentRef, atBottom, scrollToBottom } = useStickToBottom();
  return (
    <div data-slot="conversation" className={cn("relative flex min-h-0 flex-col", className)} {...rest}>
      <div ref={scrollRef} role="log" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto scrollbar-thin [overflow-anchor:none]">
        <div ref={contentRef} className={cn("mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6", contentClassName)}>
          {children}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 flex justify-center" style={{ bottom: footer ? "calc(var(--hx-footer-h, 0px) + 12px)" : 12 }}>
        <button
          type="button"
          aria-label="回到最新"
          tabIndex={atBottom ? -1 : 0}
          onClick={() => scrollToBottom()}
          className={cn(
            "pointer-events-auto inline-flex h-8 items-center gap-1.5 rounded-full border bg-background/90 px-3 text-xs text-muted-foreground shadow-soft backdrop-blur transition-[opacity,transform] duration-200 hover:text-foreground",
            atBottom ? "pointer-events-none translate-y-2 opacity-0" : "translate-y-0 opacity-100",
          )}
        >
          <ArrowDown className="size-3.5" />
          回到最新
        </button>
      </div>
      {footer && <FooterMeasure>{footer}</FooterMeasure>}
    </div>
  );
}

function FooterMeasure({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => el.parentElement?.style.setProperty("--hx-footer-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="shrink-0">
      {children}
    </div>
  );
}
