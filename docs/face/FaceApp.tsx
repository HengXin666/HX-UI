import type { JSX } from "react";
import { BUTTON_TYPE, ConfirmDialogHost, Toaster } from "@hx/ui";
import { SearchDialog, useSearchHotkey } from "../src/components/SearchDialog";
import { useShellLayout } from "../src/useShellLayout";
import { TopBar } from "./chrome/TopBar";
import { DocsFrame } from "./DocsFrame";
import { CATALOG, GROUPS } from "./docs/catalog";
import { ReducedStage, forceReducedMotion } from "./docs/kinds/ReducedStage";
import { ThumbStage } from "./docs/kinds/ThumbStage";
import { Home } from "./Home";
import { Playground } from "./Playground";
import { FACE_HOME, PREVIEW_KILN, useFaceRoute } from "./router";
import { FieldPage, KilnPage } from "../../src/studio";

/** 搜索结果的分组顺序: 目录的组名. */
const SEARCH_GROUPS: readonly string[] = GROUPS.map((group) => group.label);

/** 公开站点: 首页是门面, #/组件 id 进入文档. 顶栏在 chrome/TopBar, 首页与文档页共用. */
export function FaceApp(): JSX.Element {
  const [route, go] = useFaceRoute();
  const search = useSearchHotkey();
  const { wide: shellWide, mobileNavOpen, setMobileNavOpen } = useShellLayout();
  const docId = route.kind === "doc" ? route.id : "";

  if (route.kind === "thumb") return <ThumbStage id={route.id} />;
  if (route.kind === "reduced") {
    forceReducedMotion();
    return <ReducedStage id={route.id} values={route.values} />;
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <TopBar
        go={go}
        home={route.kind === "home"}
        onMenu={route.kind === "doc" ? () => setMobileNavOpen(true) : undefined}
        menuOpen={mobileNavOpen}
        onSearch={() => search.setOpen(true)}
      />

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

      <SearchDialog open={search.open} onClose={() => search.setOpen(false)} onPick={go} entries={CATALOG} groups={SEARCH_GROUPS} />
      <Toaster position="bottom-right" maxVisible={3} />
      <ConfirmDialogHost />
    </div>
  );
}
