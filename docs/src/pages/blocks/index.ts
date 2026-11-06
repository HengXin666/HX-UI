/**
 * 区块层文档页桶 (V1 集成).
 * App.tsx 以 `import * as L from "./pages/blocks"` 取用, 新增区块文档页在此登记一行.
 * 各分类的页面给 nav.ts 的 id 用, 路由分支在 App.tsx 的 switch 里.
 */

export { SiteBlocksPage } from "./site-v101/SiteBlocksPage";
export { MarketingV102Page } from "./marketing-v102/MarketingV102Page";
export { MarketingV103Page } from "./marketing-v103/MarketingV103Page";
export { MarketingV104Page } from "./marketing-v104/MarketingV104Page";
export { MarketingV105Page } from "./marketing-v105/MarketingV105Page";
export { MarketingV106Page } from "./marketing-v106/MarketingV106Page";
export { CommerceBrowsePage } from "./commerce-v107/CommerceBrowsePage";
export { CommerceTradePage } from "./commerce-v108/CommerceTradePage";
export { DocsV109Page } from "./docs-v109/DocsV109Page";
export { DashboardV110Page } from "./dashboard-v110/DashboardV110Page";
export { PortfolioV111Page } from "./portfolio-v111/PortfolioV111Page";

/* V0 视觉基座的示例页 (媒体 / 版式), 由集成任务接进同一条 import * as L 通道. */
export { ImagePage } from "../media/ImagePage";
export { ThemedImagePage } from "../media/ThemedImagePage";
export { VideoPage } from "../media/VideoPage";
export { LightboxPage } from "../media/LightboxPage";
export { FramesPage } from "../media/FramesPage";
export { GalleryPage as MediaGalleryPage } from "../media/GalleryPage";
export { TypographyPage as DisplayTypePage } from "../typography/TypographyPage";
