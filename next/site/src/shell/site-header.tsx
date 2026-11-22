import * as React from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  brand: React.ReactNode;
  links: { label: string; href: string }[];
  actions?: React.ReactNode;
  /** 手机菜单底部的按钮, 一般放主按钮 */
  menuActions?: React.ReactNode;
  /** 内容宽度, 与页面栏线对齐. 默认 max-w-6xl */
  width?: string;
  className?: string;
}

const loadMenu = () => import("./site-header-menu");
const SiteHeaderMenu = React.lazy(loadMenu);

/**
 * 站点顶栏: 通栏, 滚动后出现底部发丝线与半透明底.
 * 不做胶囊收缩: 成熟产品站 (Linear / Vercel / Stripe) 的顶栏都很安静.
 * 手机上链接收进顶部抽屉; 抽屉代码在按钮被按下 / 触摸时才加载.
 */
export function SiteHeader({ brand, links, actions, menuActions, width = "max-w-6xl", className }: SiteHeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const trigger = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color] duration-200",
        scrolled || open ? "border-border bg-background/80 backdrop-blur-lg backdrop-saturate-150" : "border-transparent",
        className,
      )}
    >
      <div className={cn("mx-auto flex h-14 items-center gap-8 px-5 md:px-8", width)}>
        <div className="text-[15px] font-semibold tracking-tight">{brand}</div>
        <nav aria-label="主导航" className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a key={l.href + l.label} href={l.href} className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">{l.label}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {actions}
          <button
            ref={trigger}
            type="button"
            aria-label="打开菜单"
            aria-haspopup="dialog"
            aria-expanded={open}
            onPointerDown={() => void loadMenu()}
            onClick={() => { setMenu(true); setOpen(true); }}
            className="-mr-2 inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground md:hidden"
          >
            <Menu className="size-[18px]" />
          </button>
          {menu && (
            <React.Suspense fallback={null}>
              <SiteHeaderMenu brand={brand} open={open} onOpenChange={setOpen} links={links} menuActions={menuActions} trigger={trigger} />
            </React.Suspense>
          )}
        </div>
      </div>
    </header>
  );
}
