import { type JSX } from "react";
import { AppFrame, Badge, SidebarNavItemButton, Toaster, type SidebarNavItem } from "@hx/ui";
import { DOCS, GROUPS, type DocEntry } from "./nav";
import { ButtonPage } from "./pages/ButtonPage";
import { InputPage } from "./pages/InputPage";
import { SwitchPage } from "./pages/SwitchPage";
import { SettingChromePage } from "./pages/SettingChromePage";
import { AppFramePage } from "./pages/AppFramePage";
import { InstallPage } from "./pages/InstallPage";
import { TokensPage } from "./pages/TokensPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { SettingsPageDemo } from "./pages/SettingsPageDemo";
import { NAV_ICONS, DEFAULT_NAV_ICON } from "./navIcons";
import { useHashRoute } from "./router";
import { CardPage } from "./pages/CardPage";
import { CodeBlockPage } from "./pages/CodeBlockPage";
import { BadgePage } from "./pages/BadgePage";
import { SidebarNavPage } from "./pages/SidebarNavPage";
import { SelectPage } from "./pages/SelectPage";
import { DialogPage } from "./pages/DialogPage";
import { DrawerPage } from "./pages/DrawerPage";
import { DropdownMenuPage } from "./pages/DropdownMenuPage";
import { PopoverPage } from "./pages/PopoverPage";
import { CalendarPage } from "./pages/CalendarPage";
import { SliderPage } from "./pages/SliderPage";
import { SpinPage } from "./pages/SpinPage";
import { SegmentedControlPage } from "./pages/SegmentedControlPage";
import { CollapsePanelPage } from "./pages/CollapsePanelPage";
import { ToastPage } from "./pages/ToastPage";
import { StepperPage } from "./pages/StepperPage";
import { ChartsPage } from "./pages/ChartsPage";

/**
 * 组件文档站。
 *
 * 外壳刻意用 @hx/ui 自己的 AppFrame 与 SidebarNavItemButton 搭 ——
 * 文档站本身就是这套库的第一个使用方, 它长什么样就是库长什么样。
 * 加一个组件 = nav.ts 加一行 + 下面 switch 加一个分支。
 */
function renderPage(entry: DocEntry): JSX.Element {
  switch (entry.id) {
    case "install": return <InstallPage />;
    case "settings-demo": return <SettingsPageDemo />;
    case "tokens": return <TokensPage />;
    case "button": return <ButtonPage />;
    case "input": return <InputPage />;
    case "switch": return <SwitchPage />;
    case "card": return <CardPage />;
    case "code-block": return <CodeBlockPage />;
    case "badge": return <BadgePage />;
    case "setting-chrome": return <SettingChromePage />;
    case "app-frame": return <AppFramePage />;
    case "sidebar-nav": return <SidebarNavPage />;
    case "select": return <SelectPage />;
    case "dialog": return <DialogPage />;
    case "drawer": return <DrawerPage />;
    case "dropdown-menu": return <DropdownMenuPage />;
    case "popover": return <PopoverPage />;
    case "calendar": return <CalendarPage />;
    case "slider": return <SliderPage />;
    case "spin": return <SpinPage />;
    case "segmented-control": return <SegmentedControlPage />;
    case "collapse-panel": return <CollapsePanelPage />;
    case "toast": return <ToastPage />;
    case "stepper": return <StepperPage />;
    case "charts": return <ChartsPage />;
    default: return <PlaceholderPage label={entry.label} desc={entry.desc} />;
  }
}

export function App(): JSX.Element {
  // 页面 id 的唯一事实源是 URL —— 组件里不存 currentPage, 否则刷新与后退都会失效。
  const [active, navigate] = useHashRoute();
  const entry = DOCS.find((d) => d.id === active) ?? DOCS[0];

  return (
    <AppFrame>
      <div className="relative z-10 flex min-h-0 flex-1 gap-2 p-2">
        {/* 侧栏: 面板容器手写, 里面的导航项用库组件 */}
        <aside className="flex w-60 shrink-0 flex-col overflow-hidden rounded-xl border border-border/40 bg-card/25">
          <div className="flex h-11 shrink-0 items-center gap-2 px-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/15 text-[11px] font-semibold text-primary">
              HX
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">HX UI</span>
            <Badge variant="outline">v0.1</Badge>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2.5 pb-2.5">
            {GROUPS.map((g) => (
              <div key={g}>
                <div className="px-2 pb-1 pt-1.5 text-[11px] font-medium text-muted-foreground/80">{g}</div>
                <div className="flex flex-col gap-px">
                  {DOCS.filter((d) => d.group === g).map((d) => {
                    const item: SidebarNavItem = {
                      id: d.id,
                      label: d.label,
                      icon: NAV_ICONS[d.id] ?? DEFAULT_NAV_ICON,
                      active: d.id === active,
                    };
                    return (
                      /*
                       * 外面包一层 <a href="#/xxx">, 让每个导航项都是**真链接**:
                       *   中键 / Ctrl+点击 → 新标签打开
                       *   右键 → 复制链接地址
                       *   悬停 → 状态栏显示真实 URL
                       *   搜索引擎与无障碍工具能识别导航结构
                       * SidebarNavItemButton 是上游的 <button>, 不支持 href;
                       * 给它加 asChild 要改上游源码, 用外层 <a> 是更小的代价。
                       * 点击仍走 navigate 做 SPA 切换, 不整页刷新。
                       */
                      <a
                        key={d.id}
                        href={`#/${d.id}`}
                        onClick={(e) => { e.preventDefault(); navigate(d.id); }}
                        className="contents"
                      >
                        <SidebarNavItemButton
                          item={item}
                          className={d.id === active ? "bg-primary/10 ring-1 ring-inset ring-primary/25" : undefined}
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* 主区: 面板容器手写 (不加 bg-card, 它该是页面底色) */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/40">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className={"mx-auto w-full px-8 py-8 " + (entry.group === "示例" ? "max-w-[1720px]" : "max-w-[880px]")}>
              <h1 className="text-[26px] font-bold text-foreground">{entry.label}</h1>
              <p className="mt-1 text-[13px] text-muted-foreground">{entry.desc}</p>
              <div className="mt-6">{renderPage(entry)}</div>
              <footer className="mt-16 border-t border-border pt-4 text-[11px] text-muted-foreground">
                组件源码整份取自 open-vetta (Apache-2.0), 视觉类名未改动。
              </footer>
            </div>
          </div>
        </main>
      </div>
      {/* 提醒容器整个应用只挂一次, 放在最外层 ——
          每个页面各挂一个的话, 切页时正在显示的提醒会跟着页面卸载一起消失。 */}
      <Toaster position="bottom-right" maxVisible={3} />
    </AppFrame>
  );
}