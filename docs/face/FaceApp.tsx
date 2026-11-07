import type { JSX } from "react";
import { BUTTON_TYPE, ConfirmDialogHost, Toaster } from "@hx/ui";
import { SearchDialog, useSearchHotkey } from "../src/components/SearchDialog";
import { ThemeToggle } from "../src/components/ThemeToggle";
import { useShellLayout } from "../src/useShellLayout";
import { DocsFrame } from "./DocsFrame";
import { Home } from "./Home";
import { Playground } from "./Playground";
import { FACE_BENCH, FACE_HOME, FACE_PREVIEW, PREVIEW_FIELD, PREVIEW_KILN, useFaceRoute } from "./router";
import { FieldPage, KilnPage } from "../../src/studio";

/** 公开站点: 首页是门面, #/组件 id 进入文档. */
export function FaceApp(): JSX.Element {
  const [route, go] = useFaceRoute();
  const search = useSearchHotkey();
  const { wide: shellWide, mobileNavOpen, setMobileNavOpen } = useShellLayout();
  const docId = route.kind === "doc" ? route.id : "";

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border bg-background px-3 md:px-5">
        {route.kind === "doc" ? (
          <button
            type={BUTTON_TYPE}
            aria-label="打开导航"
            aria-controls="docs-navigation"
            aria-expanded={mobileNavOpen}
            className="grid size-8 place-items-center rounded-md border border-border md:hidden"
            onClick={() => setMobileNavOpen(true)}
          >
            <span aria-hidden className="icon-[solar--hamburger-menu-linear] size-4 bg-current" />
          </button>
        ) : null}
        <button type={BUTTON_TYPE} onClick={() => go(FACE_HOME)} className="text-sm font-semibold tracking-tight">
          HX
        </button>
        <nav aria-label="站点" className="flex items-center gap-3 text-sm">
          <button type={BUTTON_TYPE} className="text-muted-foreground hover:text-foreground" onClick={() => go("install")}>组件</button>
          <button type={BUTTON_TYPE} className="text-muted-foreground hover:text-foreground" onClick={() => go(`${FACE_PREVIEW}/${PREVIEW_FIELD}`)}>页面</button>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            type={BUTTON_TYPE}
            aria-label="打开搜索"
            onClick={() => search.setOpen(true)}
            className="grid size-8 place-items-center rounded-md border border-border sm:hidden"
          >
            <span aria-hidden className="icon-[solar--magnifier-linear] size-4 bg-current" />
          </button>
          <button
            type={BUTTON_TYPE}
            onClick={() => search.setOpen(true)}
            className="hidden h-8 items-center gap-2 rounded-md border border-border px-2 text-xs text-muted-foreground sm:flex"
          >
            搜索
            <kbd className="rounded border border-border px-1 font-mono">⌘K</kbd>
          </button>
          <ThemeToggle />
          <a className="text-sm text-muted-foreground hover:text-foreground" href="https://github.com/HengXin666/HX-UI">源码</a>
        </div>
      </header>

      {route.kind === "home" ? <Home onGo={go} /> : null}
      {route.kind === "bench" ? <Playground onBack={() => go(FACE_HOME)} /> : null}
      {route.kind === "doc" ? (
        <DocsFrame id={docId} onGo={go} wide={shellWide} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} />
      ) : null}
      {route.kind === "preview" ? (
        <main className="min-h-0 flex-1">
          <div className="border-b border-border px-5 py-2">
            <button type={BUTTON_TYPE} className="text-sm text-muted-foreground" onClick={() => go(FACE_HOME)}>回到首页</button>
          </div>
          {route.which === PREVIEW_KILN ? <KilnPage /> : <FieldPage />}
        </main>
      ) : null}

      <SearchDialog open={search.open} onClose={() => search.setOpen(false)} onPick={go} />
      <Toaster position="bottom-right" maxVisible={3} />
      <ConfirmDialogHost />
    </div>
  );
}
