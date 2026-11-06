/**
 * 作品集区块桶文件 (V1-11). 名字逐个写出, 不用 export *.
 * 接入 src/blocks/index.ts 与 src/index.ts 归集成任务 (V1-Z).
 */
export { ProfileHero, type ProfileHeroProps } from "./ProfileHero";
export { StickyProfileLayout, type StickyProfileAside, type StickyProfileLayoutProps } from "./StickyProfileLayout";
export { ExperienceTimeline, type ExperienceTimelineProps } from "./ExperienceTimeline";
export { ProjectGrid, type ProjectGridProps } from "./ProjectGrid";
export { PostList, type PostListProps } from "./PostList";
export { HoverPreviewLink, type HoverPreviewLinkProps } from "./extras/HoverPreviewLink";
export { useScrollSpy, hashTarget, type ScrollSpyOptions } from "./parts/useScrollSpy";
export { groupPostsByYear, type PostYearGroup } from "./parts/groupPosts";
export type { ExperienceItem, PostItem, ProfileData, ProfileHeroLayout, ProjectGridLayout, ProjectItem } from "../_shared/types";
export { PORTFOLIO_HERO_LAYOUT, PORTFOLIO_PROJECT_LAYOUT } from "../../constants/blocks-portfolio-v111";
