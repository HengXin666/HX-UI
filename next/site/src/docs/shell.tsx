import * as React from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Sidebar } from "./sidebar";
import { href, type Route } from "./router";

function ThemeSwitch() {
  const { resolved, setMode } = useTheme();
  const dark = resolved === "dark";
  return (
    <button
      type="button"
      onClick={() => setMode(dark ? "light" : "dark")}
      aria-label={dark ? "切换到亮色" : "切换到暗色"}
      title={dark ? "亮色" : "暗色"}
      className="grid size-9 place-items-center rounded-lg border text-muted-foreground transition-colors hover:text-foreground"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function Logo() {
  return (
    <a href={href.overview} className="flex items-center gap-2 font-medium tracking-tight" aria-label="HX-UI 首页">
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
        <rect width="24" height="24" rx="6" className="fill-foreground" />
        <path d="M7 7v10M17 7v10M7 12h10" className="stroke-background" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      HX-UI
    </a>
  );
}

export function Shell({ route, children }: { route: Route; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => setOpen(false), [route]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="docs min-h-svh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2">跳到正文</a>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-5">
        <button type="button" className="grid size-9 place-items-center rounded-lg border md:hidden" aria-label={open ? "关闭菜单" : "打开菜单"} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
        <Logo />
        <span aria-hidden className="text-muted-foreground/50">/</span>
        <span className="text-sm text-muted-foreground">组件</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">React 19 · Tailwind v4 · Motion</span>
          <ThemeSwitch />
        </div>
      </header>
      <div className="md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] border-r md:block">
          <Sidebar route={route} />
        </aside>
        {open && (
          <div id="mobile-nav" className="fixed inset-0 top-14 z-30 bg-background md:hidden">
            <Sidebar route={route} onNavigate={() => setOpen(false)} />
          </div>
        )}
        <main id="main" tabIndex={-1} className="min-w-0 outline-none">{children}</main>
      </div>
    </div>
  );
}
