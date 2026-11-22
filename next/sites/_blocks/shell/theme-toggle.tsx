import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };

/**
 * 轻量亮暗切换: 不依赖弹层, 首屏可用.
 * 支持 View Transitions 的浏览器里, 新主题从点击处圆形展开; 减弱动效时直接切换.
 * 需要强调色等更多选项时用 ThemeMenu.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { setMode } = useTheme();

  // 图标和下一档都从 <html class="dark"> 读, 不从 React 状态读: 预渲染的 HTML 与客户端一致, 不会水合不匹配
  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    const doc = document as ViewTransitionDoc;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduce) {
      setMode(next);
      return;
    }
    const { clientX: x, clientY: y } = e;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = doc.startViewTransition(() => flushSync(() => setMode(next)));
    void vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
  };

  return (
    <Button type="button" variant="ghost" size="icon" className={cn("size-9", className)} aria-label="切换亮色 / 暗色" onClick={onClick}>
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  );
}
