import { useState, type JSX } from "react";
import { SegmentedControl } from "@hx/ui";
import { DISPLAY_TAGS } from "../../../../src/constants/typography";
import { FieldPage, KilnPage } from "../../../../src/studio";
import { PageStage } from "./PageStage";
import { ShotStage } from "./ShotStage";
import { TextureStage } from "./TextureStage";
import { VizStage } from "./VizStage";
import { STUDIO_VIEW, STUDIO_VIEWS, type StudioView } from "./views";

/**
 * 展示画廊改成工作室入口: 两张整页, 镜头, 数据层, 一份页面描述拼出的商品页, 以及原来的质感拼贴.
 *
 * .agents/notes/implemented/feature/2026-11-06-studio-shot-language.md
 */
export function GalleryPage(): JSX.Element {
  const [view, setView] = useState<StudioView>(STUDIO_VIEW.field);
  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl items={[...STUDIO_VIEWS]} value={view} onChange={setView} />
      <div className="-mx-4 border-t border-border md:-mx-8">
        {view === STUDIO_VIEW.field ? <FieldPage heading={DISPLAY_TAGS[1]} /> : null}
        {view === STUDIO_VIEW.kiln ? <KilnPage heading={DISPLAY_TAGS[1]} /> : null}
        {view === STUDIO_VIEW.shots ? <ShotStage /> : null}
        {view === STUDIO_VIEW.viz ? <VizStage /> : null}
        {view === STUDIO_VIEW.page ? <PageStage /> : null}
        {view === STUDIO_VIEW.texture ? <TextureStage /> : null}
      </div>
    </div>
  );
}
