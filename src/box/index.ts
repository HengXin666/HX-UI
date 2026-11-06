/**
 * 布局原语 (Stack / Grid / Container / Bento / SplitView) 的桶文件.
 * 间距, 宽度, 行高档位来自 src/constants/box.ts, 各组件不另写一套.
 * 12 列栅格 (Grid cols={12} + GridItem span/start/offset) 与宽屏 / 出血容器见 V0-04.
 */
export { Stack, HStack, VStack, Spacer, stackVariants, type StackProps, type StackTag, type HStackProps, type VStackProps, type SpacerProps } from "./Stack";
export { Grid, GridItem, AutoGrid, gridVariants, type GridProps, type GridItemProps, type GridColumns, type AutoGridProps } from "./Grid";
export {
  Container,
  Section,
  Center,
  BOX_WIDTH,
  containerVariants,
  sectionVariants,
  centerVariants,
  type BoxWidth,
  type BoxBleed,
  type SectionSlot,
  type ContainerProps,
  type SectionProps,
  type CenterProps,
} from "./Container";
export { Bento, BentoItem, bentoItemVariants, type BentoProps, type BentoItemProps } from "./Bento";
export { SplitView, type SplitViewProps } from "./SplitView";
