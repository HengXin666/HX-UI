import { useState, type JSX } from "react";
import { SegmentedControl } from "@hx/ui";
import { DISPLAY_TAGS } from "../../../../src/constants/typography";
import { FieldPage, KilnPage } from "../../../../src/studio";
import { ShotStage } from "./ShotStage";
import { TextureStage } from "./TextureStage";
import { STUDIO_VIEW, STUDIO_VIEWS, type StudioView } from "./views";

/**
 * 展示画廊 (全站只此一处): 两张整页, 镜头, 以及原来的质感拼贴. 数据层与整页描述各有自己的页 (#/viz, #/page),
 * 这里不再重复放一份.
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
        {view === STUDIO_VIEW.texture ? <TextureStage /> : null}
      </div>
    </div>
  );
}
