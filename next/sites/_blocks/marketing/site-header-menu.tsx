import * as React from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

/** 页内锚点: 平滑滚到目标, 不改 hash. 减弱动效时直接跳. */
function scrollToHash(href: string) {
  if (!href.startsWith("#") || href.startsWith("#/") || href === "#") return false;
  const el = document.getElementById(decodeURIComponent(href.slice(1)));
  if (!el) return false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  return true;
}

/**
 * 手机菜单: 顶部抽屉. 由 SiteHeader 第一次点开时才加载, 首屏不带 Sheet 的代码.
 * 点链接先关抽屉, 关完再滚动, 避免和滚动锁打架; 没有滚动时焦点回到菜单按钮.
 */
export default function SiteHeaderMenu({ open, onOpenChange, links, menuActions, trigger }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: { label: string; href: string }[];
  menuActions?: React.ReactNode;
  trigger: React.RefObject<HTMLButtonElement | null>;
}) {
  const pending = React.useRef<string | null>(null);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="gap-0 px-5 pt-14 pb-6"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          const href = pending.current;
          pending.current = null;
          if (!(href && scrollToHash(href))) trigger.current?.focus();
        }}
      >
        <SheetTitle className="sr-only">菜单</SheetTitle>
        <SheetDescription className="sr-only">站内导航</SheetDescription>
        <nav aria-label="主导航" className="flex flex-col">
          {links.map((l) => (
            <a
              key={l.href + l.label}
              href={l.href}
              onClick={(e) => {
                if (l.href.startsWith("#") && !l.href.startsWith("#/")) {
                  e.preventDefault();
                  e.stopPropagation();
                  pending.current = l.href;
                }
                onOpenChange(false);
              }}
              className="border-b py-3.5 text-[15px] transition-colors hover:text-muted-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        {menuActions && <div className="mt-6 flex flex-col gap-2 *:w-full">{menuActions}</div>}
      </SheetContent>
    </Sheet>
  );
}
