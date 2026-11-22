import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 站点顶栏: 通栏, 滚动后出现底部发丝线与半透明底.
 * 不做胶囊收缩: 成熟产品站 (Linear / Vercel / Stripe) 的顶栏都很安静.
 */
export function SiteHeader({ brand, links, actions, className }: {
  brand: React.ReactNode;
  links: { label: string; href: string }[];
  actions?: React.ReactNode;
  className?: string;
}) {
  const [scrolled, setScrolled] = React.useState(false);
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
        scrolled ? "border-border bg-background/80 backdrop-blur-lg backdrop-saturate-150" : "border-transparent",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-5 md:px-8">
        <div className="text-[15px] font-semibold tracking-tight">{brand}</div>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">{l.label}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
