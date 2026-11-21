import * as React from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { cn } from "@/lib/utils";

/** 站点顶栏: 滚动后收成悬浮玻璃胶囊. */
export function SiteHeader({ brand, links, actions }: { brand: React.ReactNode; links: { label: string; href: string }[]; actions?: React.ReactNode }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));
  return (
    <div className="sticky top-0 z-40 px-4 pt-3">
      <motion.header
        animate={{ maxWidth: scrolled ? 960 : 1200 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className={cn(
          "mx-auto flex h-14 items-center gap-6 rounded-2xl px-4 transition-[background-color,box-shadow,border-color] duration-300",
          scrolled ? "border bg-background/70 shadow-float backdrop-blur-xl" : "border border-transparent",
        )}
      >
        <div className="font-semibold">{brand}</div>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">{l.label}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </motion.header>
    </div>
  );
}
