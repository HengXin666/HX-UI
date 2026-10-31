import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { AppFrame, Badge, BUTTON_TYPE, ConfirmDialogHost, DOC_EVENT, DOC_PAGE_ID, DOC_SHELL_CLS, SidebarNavIcon, Toaster } from "@hx/ui";
import { SearchDialog, useSearchHotkey } from "./components/SearchDialog";
import { PageNav } from "./components/PageNav";
import { TableOfContents } from "./components/TableOfContents";
import { DocsNav } from "./nav/DocsNav";
import { ThemeToggle } from "./components/ThemeToggle";
import { DOCS, GROUPS, WIDE_PAGES, type DocEntry } from "./nav";
import { ButtonPage } from "./pages/ButtonPage";
import { InputPage } from "./pages/InputPage";
import { SwitchPage } from "./pages/SwitchPage";
import { SettingChromePage } from "./pages/SettingChromePage";
import { AppFramePage } from "./pages/AppFramePage";
import { InstallPage } from "./pages/InstallPage";
import { TokensPage } from "./pages/TokensPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { NAV_ICONS, DEFAULT_NAV_ICON } from "./navIcons";
import { useHashRoute } from "./router";
import { CardPage } from "./pages/CardPage";
import { CodeBlockPage } from "./pages/CodeBlockPage";
import { BadgePage } from "./pages/BadgePage";
import { BrowserLivePage } from "./pages/BrowserLivePage";
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
import { ProgressPage } from "./pages/ProgressPage";
import { SkeletonPage } from "./pages/SkeletonPage";
import { ScrollAreaPage } from "./pages/ScrollAreaPage";
import { DataTablePage } from "./pages/DataTablePage";
import { ChromePage } from "./pages/ChromePage";
import { BlueprintPage } from "./pages/BlueprintPage";
import { BlueprintDshPage } from "./pages/BlueprintDshPage";
import { PARITY_PAGES } from "./pages/parity";
import { TEMPLATE_PAGES } from "./pages/templates";
import { CodeEditorPage } from "./pages/CodeEditorPage";
import { TopBar } from "./components/TopBar";
import { BrandLogo } from "./components/BrandLogo";
import { BRAND_LOGO_SIZE } from "./constants/shell";
import { AgentOverviewPage } from "./pages/AgentOverviewPage";
import { StreamingTextPage } from "./pages/agent/StreamingTextPage";
import { AgentProcessPage } from "./pages/agent/AgentProcessPage";
import { ToolCallCardPage } from "./pages/agent/ToolCallCardPage";
import { UsageMeterPage } from "./pages/agent/UsageMeterPage";
import { DiffViewPage } from "./pages/agent/DiffViewPage";

/**
 * 组件文档站,
 *
 * 外壳刻意用 @hx/ui 自己的 AppFrame 与 SidebarNavItemButton 搭 
 * 文档站本身就是这套库的第一个使用方, 它长什么样就是库长什么样,
 * 加一个组件 = nav.ts 加一行 + 下面 switch 加一个分支; 分组导航在 components/DocsNav.tsx,
 * AI 交互页 (agent-*) 复用 src/agent 的组件, 过程件不在这里重写 (思考, 发散, 子代理, 分层待办集中在 agent-process),
 * 对标 shadcn 补齐的页面不进 switch, 由 PARITY_PAGES 按 id 查表.
 * .agents/notes/implemented/process/2026-10-08-repository-agent-notes-v2-adoption.md
 * .agents/notes/implemented/feature/2026-10-17-hx-browser-live-view.md
 * .agents/notes/implemented/feature/2026-10-18-docs-shadcn-site-pages.md
 */
function renderPage(entry: DocEntry): JSX.Element {
  switch (entry.id) {
    case "install": return <InstallPage />;
    case "tokens": return <TokensPage />;
    case DOC_PAGE_ID.button: return <ButtonPage />;
    case DOC_PAGE_ID.input: return <InputPage />;
    case DOC_PAGE_ID.switch: return <SwitchPage />;
    case "card": return <CardPage />;
    case "code-block": return <CodeBlockPage />;
    case "code-editor": return <CodeEditorPage />;
    case "badge": return <BadgePage />;
    case "setting-chrome": return <SettingChromePage />;
    case "app-frame": return <AppFramePage />;
    case "sidebar-nav": return <SidebarNavPage />;
    case DOC_PAGE_ID.select: return <SelectPage />;
    case DOC_PAGE_ID.dialog: return <DialogPage />;
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
    case "progress": return <ProgressPage />;
    case "scroll-area": return <ScrollAreaPage />;
    case "data-table":
    case "stat-card": return <DataTablePage />;
    case "empty-state":
    case "page-header": return <ChromePage />;
    case "browser-live": return <BrowserLivePage />;
    case "blueprint": return <BlueprintPage />;
    case "blueprint-dsh": return <BlueprintDshPage />;
    case "agent-overview": return <AgentOverviewPage />;
    case "agent-toolcall": return <ToolCallCardPage />;
    case "agent-stream": return <StreamingTextPage />;
    case "agent-usage": return <UsageMeterPage />;
    case "agent-diff": return <DiffViewPage />;
    case "agent-process": return <AgentProcessPage />;
    default: {
      const Page = PARITY_PAGES[entry.id] ?? TEMPLATE_PAGES[entry.id];
      return Page ? <Page /> : <PlaceholderPage label={entry.label} desc={entry.desc} />;
    }
  }
}

export function App(): JSX.Element {
  // 页面 id 的唯一事实源是 URL  组件里不存 currentPage, 否则刷新与后退都会失效,
  const [active, navigate] = useHashRoute();
  const entry = DOCS.find((d) => d.id === active) ?? DOCS[0];
  const search = useSearchHotkey();
  const [openGroups, setOpenGroups] = useState<readonly string[]>(() => [GROUPS[0], entry.group]);
  // TOC 从渲染后的 DOM 里读标题, 所以需要内容容器的引用
  const contentRef = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setOpenGroups((prev) => (prev.includes(entry.group) ? prev : [...prev, entry.group]));
  }, [entry.group]);

  const toggleGroup = (group: string): void => {
    setOpenGroups((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
  };

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onEscape = (event: KeyboardEvent): void => {
      if (event.key === DOC_EVENT.escape) setMobileNavOpen(false);
    };
    window.addEventListener(DOC_EVENT.keydown, onEscape);
    return () => window.removeEventListener(DOC_EVENT.keydown, onEscape);
  }, [mobileNavOpen]);

  // 窄屏 (>1280px 才显示右栏) 时给内容多留一点宽度
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const sync = (): void => setWide(mq.matches);
    sync();
    mq.addEventListener(DOC_EVENT.change, sync);
    return () => mq.removeEventListener(DOC_EVENT.change, sync);
  }, []);

  // 切页后回到顶部,不做这件事时, 从长页面跳到短页面会停在半空的滚动位置,
  const go = useCallback((id: string) => {
    navigate(id);
    setMobileNavOpen(false);
    contentRef.current?.scrollTo({ top: 0 });
  }, [navigate]);

  const prev = DOCS[DOCS.findIndex((d) => d.id === active) - 1];
  const next = DOCS[DOCS.findIndex((d) => d.id === active) + 1];

  return (
    <AppFrame>
      <div className="relative z-10 flex min-h-0 min-w-0 w-full flex-1 gap-2 p-2">
        {mobileNavOpen && (
          <button type={BUTTON_TYPE} aria-label="关闭导航" className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setMobileNavOpen(false)} />
        )}
        {/* 侧栏: 链接保留原生新标签与复制地址行为 */}
        <aside id="docs-navigation" className={`${mobileNavOpen ? DOC_SHELL_CLS.show : DOC_SHELL_CLS.hide} fixed inset-y-2 left-2 z-30 w-60 flex-col overflow-hidden rounded-xl border border-border/40 bg-card shadow-lg md:static md:flex md:bg-card/25 md:shadow-none`}>
          <div className="flex h-11 shrink-0 items-center gap-2 px-3">
            <BrandLogo size={BRAND_LOGO_SIZE.sidebar} />
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">HX UI</span>
            <ThemeToggle />
            <button type={BUTTON_TYPE} aria-label="关闭导航" className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent md:hidden" onClick={() => setMobileNavOpen(false)}>
              <span aria-hidden className="icon-[solar--close-circle-linear] size-4 bg-current" />
            </button>
          </div>

          {/* 搜索入口: 点击或 ⌘K 都能唤起 */}
          <div className="px-2.5 pb-1">
            <button
              type={BUTTON_TYPE}
              onClick={() => search.setOpen(true)}
              className="flex h-8 w-full items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-2.5 text-left text-[12px] text-muted-foreground transition-colors hover:border-border hover:bg-accent/40"
            >
              <span aria-hidden className="icon-[solar--magnifier-linear] size-3.5 shrink-0 bg-current" />
              <span className={DOC_SHELL_CLS.fill}>搜索组件…</span>
              <kbd className="shrink-0 rounded border border-border/60 px-1 py-px font-mono text-[10px]">⌘K</kbd>
            </button>
          </div>

          <DocsNav
            groups={GROUPS}
            docs={DOCS}
            active={active}
            openGroups={openGroups}
            onToggle={toggleGroup}
            onGo={go}
          />
        </aside>

        {/* 主区: 面板容器手写 (不加 bg-card, 它该是页面底色) */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/40">
          <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border/40 px-3 md:hidden">
            <button type={BUTTON_TYPE} aria-label="打开导航" aria-controls="docs-navigation" aria-expanded={mobileNavOpen} className="grid size-8 place-items-center rounded-md hover:bg-accent" onClick={() => setMobileNavOpen(true)}>
              <span aria-hidden className="icon-[solar--hamburger-menu-linear] size-4 bg-current" />
            </button>
            <span className="truncate text-[13px] font-semibold">HX UI / {entry.label}</span>
            <div className={DOC_SHELL_CLS.pushRight}><ThemeToggle /></div>
          </div>
          <TopBar onGo={go} />
          <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto">
            <div
              className={
                "mx-auto flex w-full gap-10 px-4 py-6 md:px-8 md:py-8 " +
                (WIDE_PAGES.has(entry.id) ? "max-w-[1720px]" : wide ? "max-w-[1100px]" : "max-w-[880px]")
              }
            >
              <article className="w-full min-w-0 flex-1">
                {/* 标题区: 组名做小标签 + 标题 + 说明,比原来光秃秃一个 h1 更容易定位 */}
                <div className="mb-1 text-[11px] font-medium text-link/80">{entry.group}</div>
                <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-foreground md:text-[30px]">
                  {entry.label}
                </h1>
                <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-muted-foreground">
                  {entry.desc}
                </p>

                <div className="mt-8">{renderPage(entry)}</div>

                <PageNav prev={prev} next={next} onGo={go} />

                <footer className="mt-10 border-t border-border pt-4 text-[11px] text-muted-foreground">
                  组件源码整份取自 open-vetta (Apache-2.0), 视觉类名未改动,
                </footer>
              </article>

              {/* 页内目录: 只有宽屏才显示第二栏 */}
              <TableOfContents container={contentRef.current} deps={active} className="w-52 shrink-0" />
            </div>
          </div>
        </main>
      </div>
      {/* 提醒容器整个应用只挂一次, 放在最外层 
          每个页面各挂一个的话, 切页时正在显示的提醒会跟着页面卸载一起消失, */}
      <Toaster position="bottom-right" maxVisible={3} />
      {/* 命令式 confirmDialog() 的宿主,整个应用挂一次  少了它, confirmDialog()
          返回的 Promise 永远不会 settle, await 它的代码会静默停住, */}
      <ConfirmDialogHost />
      {/* 搜索面板: 与 Toaster 同理, 整个应用挂一次 */}
      <SearchDialog open={search.open} onClose={() => search.setOpen(false)} onPick={go} />
    </AppFrame>
  );
}