import { useEffect, useState, type CSSProperties, type JSX } from "react";
import { Sheet, SheetContent, SheetTitle } from "@hx/ui";
import { HEADER_PX } from "./home/shots/stage";
import { CATALOG, OVERVIEW_ROLE, findEntry } from "./docs/catalog";
import { INDEX_ID, INSTALL_ID, SHELL } from "./docs/constants";
import { IndexPage } from "./docs/index/IndexPage";
import { InstallGuide } from "./docs/install/InstallGuide";
import { KindPage } from "./docs/kinds/KindPage";
import { OverviewPage } from "./docs/kinds/OverviewPage";
import { SpecPage } from "./docs/page/SpecPage";
import { Rail } from "./docs/rail/Rail";
import { RightRail } from "./docs/rail/RightRail";

/** 顶栏里控制抽屉的菜单键. */
const MENU_BUTTON = "[aria-controls=docs-navigation]";

/** 两侧栏吸顶: 顶栏下留一档外边距, 高度减去上下两档. */
const STICKY: CSSProperties = { top: HEADER_PX + SHELL.gutter, height: `calc(100svh - ${HEADER_PX + SHELL.gutter * 2}px)` };

/**
 * 文档外壳, 对标 reactbits.dev 组件页: 左栏圆角卡 (目录), 中栏正文, 右栏安装卡与本页目录.
 * 页面整体随窗口滚动, 两侧栏吸顶; 窄屏时左栏收进顶栏的 "打开导航" 抽屉, 右栏隐藏.
 */
export function DocsFrame({
  id,
  onGo,
  mobileNavOpen,
  setMobileNavOpen,
}: {
  readonly id: string;
  readonly onGo: (id: string) => void;
  readonly wide?: boolean;
  readonly mobileNavOpen: boolean;
  readonly setMobileNavOpen: (open: boolean) => void;
}): JSX.Element {
  const entry = id === INDEX_ID ? undefined : (findEntry(id) ?? CATALOG[0]);
  const [article, setArticle] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMobileNavOpen(false);
    window.scrollTo({ top: 0 });
  }, [id, setMobileNavOpen]);

  let body: JSX.Element;
  if (!entry) body = <IndexPage onGo={onGo} />;
  else if (entry.id === INSTALL_ID) body = <InstallGuide />;
  else if (entry.role === OVERVIEW_ROLE) body = <OverviewPage key={entry.id} entry={entry} onGo={onGo} />;
  else if (entry.spec) body = <SpecPage key={entry.id} entry={entry} spec={entry.spec} onGo={onGo} />;
  else body = <KindPage key={entry.id} entry={entry} onGo={onGo} />;

  return (
    <div className="flex w-full flex-1 items-start">
      <aside aria-label="组件导航" style={STICKY} className="hidden shrink-0 md:sticky md:ml-4 md:block md:w-64">
        <Rail active={entry?.id ?? INDEX_ID} onGo={onGo} />
      </aside>
      {/* 窄屏抽屉: 库的 Sheet 给焦点陷阱, Esc 关闭与焦点归还; 外观仍是左侧悬浮的那张圆角卡. */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          id="docs-navigation"
          side="left"
          showCloseButton={false}
          aria-describedby={undefined}
          overlayClassName="bg-background/70 backdrop-blur-none"
          onCloseAutoFocus={(event) => {
            // 抽屉由顶栏的菜单键打开 (不是 SheetTrigger), 关上后把焦点交还给它.
            event.preventDefault();
            document.querySelector<HTMLElement>(MENU_BUTTON)?.focus();
          }}
          style={STICKY}
          className="inset-y-auto left-3 w-[min(320px,calc(100vw-24px))] max-w-none gap-0 overflow-visible border-0 bg-transparent p-0 shadow-none sm:max-w-none md:hidden"
        >
          <SheetTitle className="sr-only">组件导航</SheetTitle>
          <Rail active={entry?.id ?? INDEX_ID} onGo={onGo} />
        </SheetContent>
      </Sheet>
      <main ref={setArticle} className="min-w-0 flex-1 px-4 pt-8 pb-24 md:pr-8 md:pl-8 lg:pl-12 xl:pt-10">
        <div className="mx-auto w-full max-w-[1100px]">{body}</div>
      </main>
      <aside aria-label="本页信息" style={STICKY} className="mr-8 hidden w-[300px] shrink-0 overflow-y-auto xl:sticky xl:block">
        <RightRail importName={entry?.spec?.importName} source={entry?.spec?.source} container={article} />
      </aside>
    </div>
  );
}
