# Agent Note: 作品集区块 (ProfileHero, StickyProfileLayout, ExperienceTimeline, ProjectGrid, PostList, HoverPreviewLink)

Status: implemented

Decision-ID: blocks-portfolio-v111

## Code

- `src/blocks/portfolio/StickyProfileLayout.tsx`
- `src/blocks/portfolio/parts/useScrollSpy.ts`
- `src/blocks/portfolio/extras/HoverPreviewLink.tsx`
- `src/constants/blocks-portfolio-v111.ts`
- `docs/src/pages/blocks/portfolio-v111/PortfolioV111Page.tsx`

## Problem

视觉审计 B19 与 2.4: 个人站 (brittanychiang.com / leerob.com / rauno.me) 只能用 Timeline + Card 勉强拼,
缺粘性侧栏, scrollspy, 项目卡, 按年分组的文章列表与悬停预览.

## Decision

- 目录 `src/blocks/portfolio/`: 5 个区块 + index.ts 共 6 个直接文件; 共享零件进 `parts/`
  (PortfolioMedia, SocialLinks, TagList, ProjectCard, useScrollSpy, groupPosts), 附带件进 `extras/` (HoverPreviewLink).
- 数据类型 (ProfileData, ExperienceItem, ProjectItem, PostItem, 两个版式枚举) 追加到 `src/blocks/_shared/types.ts`,
  区块只从那里 import 类型; 取值与全部视觉类名放 `src/constants/blocks-portfolio-v111.ts`, 区块内无颜色 / 字号 / 间距字面量.
- 每个区块包 BlockShell (props 继承 BlockBaseProps), 标题组走 renderSectionHeading; 正文 (bio, 经历描述, 项目描述, 文章行) 一律包 Prose.
- StickyProfileLayout: 容器查询 @5xl 起左栏 sticky + max-h-dvh, 否则堆叠并隐藏导航 (设计文档 3.3 用容器查询而非视口断点);
  scrollspy 是 IntersectionObserver (rootMargin 判定带), 多节同时可见取文档顺序靠前者, 全部离开时保留上次结果; 当前项 aria-current="location".
- ProjectGrid: 缩略图复用 src/media/Image; 标题链接用 after:inset-0 拉伸覆盖整卡, 额外外链抬到 z-10; hover/focus-within 时图放大与箭头位移只用 transform, motion-reduce 下静止.
- PostList: 默认按年倒序分组, 日期走 BlocksProvider.formatDate (Intl); 标题行 RSS 图标位与"全部文章"入口作为 SectionHeading 的 children.
- HoverPreviewLink: 指针位置写 CSS 变量 (无 state), 显隐只过渡 opacity/translate, 预览图 aria-hidden.
- 可见兜底文案 (精选, 在职, 页内导航 ...) 在常量里, 全部可经 props 覆盖; aria 文案 (expand/collapse/externalLink) 走 useBlockLabels.

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 widgets/Timeline + Card + motion/StickyScroll 已能手拼. 否决: 每个调用方都要重写粘性栏的
  容器查询, scrollspy 与可访问性, 审计判定为"勉强", 而这是最常见的个人站类型.
- scrollspy 用 scroll 事件 + getBoundingClientRect: 否决, 每帧强制布局, 任务硬要求 IntersectionObserver.
- 数据类型写在各区块文件内: 否决, 违反"类型只从 _shared/types.ts 导入", 且 JSON/CMS 需要一处稳定的 schema.
- 视口断点 lg: 实现粘性栏: 否决, 放进文档预览或窄栏时会错误进入双栏.

## Consequences

- 未接入 src/blocks/index.ts 与 src/index.ts (集成任务 V1-Z); 文档页未注册进 nav.ts / App.tsx.
- 皮肤演示在嵌套 div 上设 data-skin, 依赖皮肤 CSS 用 [data-skin] 属性选择器 (现状如此).
