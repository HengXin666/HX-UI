import * as React from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTheme } from "@/hooks/use-theme";
import { THEME_ACCENTS, type ThemeAccent } from "@/hooks/theme-script";
import { ease, spring } from "@/motion/presets";
import { Sidebar } from "./sidebar";
import { SECTIONS } from "./sections";
import { href, sectionOfRoute, type Route } from "./router";

function ThemeSwitch() {
  const { resolved, setMode } = useTheme();
  const dark = resolved === "dark";
  return (
    <button
      type="button"
      onClick={() => setMode(dark ? "light" : "dark")}
      aria-label={dark ? "切换到亮色" : "切换到暗色"}
      title={dark ? "亮色" : "暗色"}
      className="relative grid size-9 place-items-center overflow-hidden rounded-lg border text-muted-foreground transition-[color,transform] duration-150 hover:text-foreground active:scale-95"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <m.span
          key={dark ? "sun" : "moon"}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={spring.snappy}
          className="grid place-items-center"
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </m.span>
      </AnimatePresence>
    </button>
  );
}

const SKIN_LABEL: Record<ThemeAccent, string> = { indigo: "靛蓝", emerald: "翠绿", rose: "玫红", amber: "琥珀", zinc: "锌灰", ink: "墨" };

/*
 * 顶栏的皮肤切换, 让每个皮肤 (含连中性色一起换的 ink) 在文档站上都能直接看到.
 */
function SkinSwitch() {
  const { accent, setAccent } = useTheme();
  return (
    <select
      aria-label="皮肤"
      title="皮肤"
      value={accent}
      onChange={(e) => setAccent(e.target.value as ThemeAccent)}
      className="h-9 rounded-lg border bg-background px-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
    >
      {THEME_ACCENTS.map((a) => (
        <option key={a} value={a}>{SKIN_LABEL[a]}</option>
      ))}
    </select>
  );
}

export function Logo() {
  return (
    <a href={href.home} className="flex items-center gap-2 font-medium tracking-tight" aria-label="HX-UI 首页">
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
  const section = sectionOfRoute(route);
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
        <button type="button" className="grid size-9 shrink-0 place-items-center rounded-lg border transition-transform duration-150 active:scale-95 md:hidden" aria-label={open ? "关闭菜单" : "打开菜单"} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
        <Logo />
        <nav aria-label="分区" className="ml-4 hidden items-center gap-1 md:flex">
          {SECTIONS.map((x) => (
            <a
              key={x.id}
              href={href.section(x.id)}
              aria-current={section === x.id ? "true" : undefined}
              style={{ "--cat": x.color } as React.CSSProperties}
              className="relative flex h-14 items-center px-3 text-sm text-muted-foreground transition-colors hover:text-foreground aria-[current]:text-foreground"
            >
              {x.title}
              {section === x.id && <m.span layoutId="hdr-active" transition={spring.snappy} aria-hidden className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[var(--cat)]" />}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">React 19 · Tailwind v4 · Motion</span>
          <SkinSwitch />
          <ThemeSwitch />
        </div>
      </header>
      <div className={section ? "md:grid md:grid-cols-[15rem_minmax(0,1fr)]" : undefined}>
        {section && (
          <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] border-r md:block">
            <Sidebar route={route} section={section} />
          </aside>
        )}
        <AnimatePresence>
          {open && (
            <m.div
              id="mobile-nav"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: ease.out }}
              className="fixed inset-0 top-14 z-30 overflow-y-auto bg-background/95 backdrop-blur-md md:hidden"
            >
              <Sidebar route={route} section={section ?? "ui"} showSections onNavigate={() => setOpen(false)} />
            </m.div>
          )}
        </AnimatePresence>
        <main id="main" tabIndex={-1} className="min-w-0 outline-none">{children}</main>
      </div>
    </div>
  );
}
