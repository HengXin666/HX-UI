/**
 * 营销区块桶文件 (V1-02 至 V1-06): 首屏, 标志墙, 行动条, 订阅, 特性, 社会证明, 定价, 对比, FAQ, 代码展示与安装.
 * 名字逐个写出, 不用 export *; 内部拆分件 parts.tsx 与 social-proof/ 不对外.
 * 根入口 src/index.ts 由集成任务 V0-Z 接入.
 */
export { BentoFeatures, type BentoFeaturesItem, type BentoFeaturesProps } from "./BentoFeatures";
export { CaseStudies, type CaseStudiesVariant, type CaseStudyItem, type CaseStudiesProps } from "./CaseStudies";
export { ChangelogList, type ChangelogVariant, type ChangelogGroupBy, type ChangelogEntry, type ChangelogListProps } from "./ChangelogList";
export { CodeShowcase, type CodeShowcaseSlot, type CodeSample, type CodeShowcaseTab, type CodeShowcaseProps } from "./CodeShowcase";
export { ComparisonMatrix, type MatrixValue, type MatrixPlan, type MatrixRow, type MatrixGroup, type ComparisonMatrixProps } from "./ComparisonMatrix";
export { CtaBanner, type CtaBannerVariant, type CtaBannerFill, type CtaBannerProps } from "./CtaBanner";
export { Faq, type FaqItem, type FaqGroup, type FaqContact, type FaqProps } from "./Faq";
export { FeatureAlternating, type FeatureAlternatingItem, type FeatureAlternatingProps } from "./FeatureAlternating";
export { FeatureGrid, type FeatureGridItem, type FeatureGridProps } from "./FeatureGrid";
export { FigureGrid, type FigureGridItem, type FigureGridProps } from "./FigureGrid";
export { Hero, type HeroLayout, type HeroPill, type HeroTrust, type HeroProps } from "./Hero";
export { InstallBlock, type InstallBlockSlot, type InstallCommand, type InstallPlatform, type InstallAlternative, type InstallBlockProps } from "./InstallBlock";
export { LogoWall, type LogoWallMode, type LogoWallProps } from "./LogoWall";
export { Newsletter, type NewsletterStatus, type NewsletterVariant, type NewsletterProps } from "./Newsletter";
export { Pricing, type PricingFeature, type PricingPlan, type PricingBilling, type PricingProps } from "./Pricing";
export { Showcase, type ShowcaseItem, type ShowcaseFeature, type ShowcaseProps } from "./Showcase";
export { StatBand, type StatBandItem, type StatBandProps } from "./StatBand";
export { Testimonials, type TestimonialsVariant, type TestimonialItem, type TestimonialsProps } from "./Testimonials";
export { TweetWall, type TweetItem, type TweetWallProps } from "./TweetWall";
