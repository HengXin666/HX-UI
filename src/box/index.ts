/**
 * 布局原语 (Stack / Grid / Container / Bento / SplitView) 的桶文件.
 * 间距, 宽度, 行高档位来自 src/constants/box.ts, 各组件不另写一套.
 */
export { Stack, HStack, VStack, Spacer, stackVariants, type StackProps, type StackTag, type HStackProps, type VStackProps, type SpacerProps } from "./Stack";
export { Grid, AutoGrid, gridVariants, type GridProps, type GridColumns, type AutoGridProps } from "./Grid";
export {
  Container,
  Section,
  Center,
  BOX_WIDTH,
  containerVariants,
  sectionVariants,
  centerVariants,
  type BoxWidth,
  type ContainerProps,
  type SectionProps,
  type CenterProps,
} from "./Container";
export { Bento, BentoItem, bentoItemVariants, type BentoProps, type BentoItemProps } from "./Bento";
export { SplitView, type SplitViewProps } from "./SplitView";
