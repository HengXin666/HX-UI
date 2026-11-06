/**
 * 区块基座的桶文件. 类型只从 ./types 单一来源导出; src/blocks/index.ts 与 src/index.ts 的接入归集成任务.
 */
export { BlockShell, resolveSlots, useBlockShell, type BlockShellContextValue } from "./BlockShell";
export { SectionHeading, CtaButton, CtaGroup, renderSectionHeading, type SectionHeadingState } from "./SectionHeading";
export { BlocksProvider, useBlocks, useBlockLabels } from "./BlocksProvider";
export { PageComposer } from "./PageComposer";
export type {
  BlockTone, BlockPad, BlockWidth, BlockAlign, BlockReveal, BlockTag, BlockTitleSize, BlockDensity, BackdropVariant,
  HeadingLevel, SlotClassNames, SlotStyles, BlockShellSlot, SectionHeadingSlot, CtaGroupSlot, PageComposerSlot,
  BlockShellState, Rich, IconName, Cta, MediaRatio, Media, LinkItem, LinkGroup, MoneyPeriod, Money, Person, Logo,
  Badge, Stat, MaskSpec, BackdropSpec, BackdropLayerProps, BackdropRenderer, BlockBaseProps, BlockSlots,
  SectionHeadingData, BlockLabels, BlocksContextValue, BlockRegistry, BlockNode, ProfileHeroLayout,
  ProjectGridLayout, ProfileData, ExperienceItem, ProjectItem, PostItem, CalloutKind, TocItem, ApiRow, SearchSpec,
  DocsHomeCard, BlockShellProps, SectionHeadingProps, CtaGroupProps, CtaButtonProps, BlocksProviderProps,
  PageComposerProps,
} from "./types";
