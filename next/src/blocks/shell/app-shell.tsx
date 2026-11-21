import * as React from "react";
import { motion } from "motion/react";
import { Menu, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { spring } from "@/motion/presets";

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
}
export interface NavGroup {
  label?: string;
  items: NavItem[];
}

interface AppShellProps {
  brand: React.ReactNode;
  nav: NavGroup[];
  active: string;
  onNavigate: (id: string) => void;
  /** 顶栏右侧: 搜索 / 主题 / 头像 */
  actions?: React.ReactNode;
  /** 侧栏底部: 用户卡 / 套餐 */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

function NavList({ nav, active, onNavigate, collapsed }: Pick<AppShellProps, "nav" | "active" | "onNavigate"> & { collapsed?: boolean }) {
  return (
    <nav className="flex flex-col gap-5">
      {nav.map((g, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {g.label && !collapsed && <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{g.label}</div>}
          {g.items.map((it) => {
            const on = it.id === active;
            return (
              <button
                key={it.id}
                type="button"
                title={collapsed ? it.label : undefined}
                onClick={() => onNavigate(it.id)}
                className={cn(
                  "relative flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors",
                  on ? "text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                {on && <motion.span layoutId="hx-nav-active" transition={spring.snappy} className="absolute inset-0 rounded-lg bg-accent shadow-soft" />}
                {it.icon && <it.icon className="relative size-4 shrink-0" />}
                {!collapsed && <span className="relative flex-1 truncate text-left">{it.label}</span>}
                {!collapsed && it.badge && <span className="relative">{it.badge}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/** 应用外壳: 可折叠侧栏 (移动端抽屉) + 粘性顶栏 + 内容区. 运维面板 / 后台 / 统计页通用. */
export function AppShell({ brand, nav, active, onNavigate, actions, footer, children }: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobile, setMobile] = React.useState(false);
  return (
    <div className="flex min-h-svh bg-background">
      <motion.aside
        animate={{ width: collapsed ? 68 : 244 }}
        transition={spring.smooth}
        className="sticky top-0 hidden h-svh shrink-0 flex-col border-r bg-sidebar px-3 py-4 md:flex"
      >
        <div className={cn("mb-6 flex h-8 items-center px-2", collapsed && "justify-center px-0")}>{collapsed ? <span className="size-6 rounded-md bg-brand" /> : brand}</div>
        <div className="flex-1 overflow-y-auto">
          <NavList nav={nav} active={active} onNavigate={onNavigate} collapsed={collapsed} />
        </div>
        {footer && !collapsed && <div className="mt-4">{footer}</div>}
      </motion.aside>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="w-72 bg-sidebar p-4">
          <SheetTitle className="mb-6">{brand}</SheetTitle>
          <NavList nav={nav} active={active} onNavigate={(id) => { onNavigate(id); setMobile(false); }} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/75 px-4 backdrop-blur-xl">
          <Button variant="ghost" size="icon" className="size-9 md:hidden" onClick={() => setMobile(true)} aria-label="打开导航"><Menu className="size-4" /></Button>
          <Button variant="ghost" size="icon" className="hidden size-9 md:inline-flex" onClick={() => setCollapsed((c) => !c)} aria-label="折叠侧栏"><PanelLeft className="size-4" /></Button>
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
