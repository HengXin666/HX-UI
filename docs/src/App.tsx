import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import {
  AppFrame, Badge, ConfirmDialogHost, SidebarNavItemButton, Toaster, type SidebarNavItem,
} from "@hx/ui";
import { SearchDialog, useSearchHotkey } from "./components/SearchDialog";
import { TableOfContents } from "./components/TableOfContents";
import { ThemeToggle } from "./components/ThemeToggle";
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
import { ProxyChainPage } from "./pages/ProxyChainPage";
import { ChartsPage } from "./pages/ChartsPage";
import { TooltipPage } from "./pages/TooltipPage";
import { TextareaPage } from "./pages/TextareaPage";
import { TimePickerPage } from "./pages/TimePickerPage";
import { ConfirmDialogPage } from "./pages/ConfirmDialogPage";
import { TabsPage } from "./pages/TabsPage";
import { AccordionPage } from "./pages/AccordionPage";
import { FeedbackPage } from "./pages/FeedbackPage";
import { DataTablePage } from "./pages/DataTablePage";
import { ChromePage } from "./pages/ChromePage";

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
    case "proxy-chain": return <ProxyChainPage />;
    case "charts": return <ChartsPage />;
    case "tooltip": return <TooltipPage />;
    case "textarea": return <TextareaPage />;
    case "time-picker": return <TimePickerPage />;
    case "confirm-dialog": return <ConfirmDialogPage />;
    case "tabs": return <TabsPage />;
    case "accordion": return <AccordionPage />;
    case "scroll-area":
    case "progress": return <FeedbackPage />;
    case "data-table":
    case "stat-card": return <DataTablePage />;
    case "empty-state":
    case "page-header": return <ChromePage />;
    default: return <PlaceholderPage label={entry.label} desc={entry.desc} />;
  }
}

export function App(): JSX.Element {
  // 页面 id 的唯一事实源是 URL —— 组件里不存 currentPage, 否则刷新与后退都会失效。
  const [active, navigate] = useHashRoute();
  const entry = DOCS.find((d) => d.id === active) ?? DOCS[0];
  const search = useSearchHotkey();
  // TOC 从渲染后的 DOM 里读标题, 所以需要内容容器的引用
  const contentRef = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);

  // 窄屏 (>1280px 才显示右栏) 时给内容多留一点宽度
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const sync = (): void => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // 切页后回到顶部。不做这件事时, 从长页面跳到短页面会停在半空的滚动位置。
  const go = useCallback((id: string) => {
    navigate(id);
    contentRef.current?.scrollTo({ top: 0 });
  }, [navigate]);

  const prev = DOCS[DOCS.findIndex((d) => d.id === active) - 1];
  const next = DOCS[DOCS.findIndex((d) => d.id === active) + 1];

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
            <ThemeToggle />
          </div>

          {/* 搜索入口: 点击或 ⌘K 都能唤起 */}
          <div className="px-2.5 pb-1">
            <button
              type="button"
              onClick={() => search.setOpen(true)}
              className="flex h-8 w-full items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-2.5 text-left text-[12px] text-muted-foreground transition-colors hover:border-border hover:bg-accent/40"
            >
              <span aria-hidden className="icon-[solar--magnifier-linear] size-3.5 shrink-0 bg-current" />
              <span className="min-w-0 flex-1 truncate">搜索组件…</span>
              <kbd className="shrink-0 rounded border border-border/60 px-1 py-px font-mono text-[10px]">⌘K</kbd>
            </button>
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
          <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto">
            <div
              className={
                "mx-auto flex w-full gap-10 px-8 py-8 " +
                (entry.group === "示例" ? "max-w-[1720px]" : wide ? "max-w-[1100px]" : "max-w-[880px]")
              }
            >
              <article className="min-w-0 flex-1">
                {/* 标题区: 组名做小标签 + 标题 + 说明。比原来光秃秃一个 h1 更容易定位 */}
                <div className="mb-1 text-[11px] font-medium text-primary/80">{entry.group}</div>
                <h1 className="text-[30px] font-bold leading-tight tracking-[-0.02em] text-foreground">
                  {entry.label}
                </h1>
                <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-muted-foreground">
                  {entry.desc}
                </p>

                <div className="mt-8">{renderPage(entry)}</div>

                {/* 上一页 / 下一页: 38 页靠侧栏点很累, 顺序阅读时的基本配置 */}
                <nav className="mt-14 grid grid-cols-2 gap-3" aria-label="页面导航">
                  {prev ? (
                    <button
                      type="button"
                      onClick={() => go(prev.id)}
                      className="group flex flex-col gap-0.5 rounded-xl border border-border/50 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-card/40"
                    >
                      <span className="text-[11px] text-muted-foreground">上一页</span>
                      <span className="truncate text-[13px] font-medium text-foreground">← {prev.label}</span>
                    </button>
                  ) : <span />}
                  {next ? (
                    <button
                      type="button"
                      onClick={() => go(next.id)}
                      className="group flex flex-col items-end gap-0.5 rounded-xl border border-border/50 px-4 py-3 text-right transition-colors hover:border-primary/40 hover:bg-card/40"
                    >
                      <span className="text-[11px] text-muted-foreground">下一页</span>
                      <span className="truncate text-[13px] font-medium text-foreground">{next.label} →</span>
                    </button>
                  ) : <span />}
                </nav>

                <footer className="mt-10 border-t border-border pt-4 text-[11px] text-muted-foreground">
                  组件源码整份取自 open-vetta (Apache-2.0), 视觉类名未改动。
                </footer>
              </article>

              {/* 页内目录: 只有宽屏才显示第二栏 */}
              <TableOfContents container={contentRef.current} deps={active} className="w-52 shrink-0" />
            </div>
          </div>
        </main>
      </div>
      {/* 提醒容器整个应用只挂一次, 放在最外层 ——
          每个页面各挂一个的话, 切页时正在显示的提醒会跟着页面卸载一起消失。 */}
      <Toaster position="bottom-right" maxVisible={3} />
      {/* 命令式 confirmDialog() 的宿主。整个应用挂一次 —— 少了它, confirmDialog()
          返回的 Promise 永远不会 settle, await 它的代码会静默停住。 */}
      <ConfirmDialogHost />
      {/* 搜索面板: 与 Toaster 同理, 整个应用挂一次 */}
      <SearchDialog open={search.open} onClose={() => search.setOpen(false)} onPick={go} />
    </AppFrame>
  );
}